# Piano: fix race condition e codici errore in LicenseGate

## Bug
Dopo il passaggio 3 del gating (condizioni accettate), alcuni utenti vedono l'errore "Impossibile completare la sessione di accesso." nelle route protette.

## Causa
Ogni route protetta in `App.tsx` e' avvolta in una propria istanza di `<LicenseGate>`. Quando due istanze montano quasi contemporaneamente (es. redirect a catena tra route), ciascuna chiama `ensureAppSession(email)`, che invoca la edge function `gate-session` per generare un magic-link token. Il secondo magic link generato da Supabase invalida il primo; la seconda chiamata `supabase.auth.verifyOtp` riceve quindi un token non piu' valido.

## Modifiche
Solo in `src/components/LicenseGate.tsx`:

1. **Lock anti-race module-level**
   - Aggiungere `const gateSessionLocks = new Map<string, Promise<string | null>>();` al top del file.
   - In `ensureAppSession(email)`:
     - Normalizzare l'email in lowercase e usare come chiave.
     - Se esiste gia' una Promise in corso per quella chiave, restituirla (`return existing`).
     - Altrimenti creare la Promise, memorizzarla nella mappa, e al `finally` rimuoverla.
   - In questo modo tutte le istanze concorrenti di `<LicenseGate>` per la stessa email condividono la stessa richiesta `gate-session` e lo stesso `verifyOtp`.

2. **Codici errore standardizzati in `ensureAppSession`**
   - Se `requestGateSession(email)` restituisce un `error` esplicito: preservare `error.code` e `error.message` cosi' come arrivano dalla edge function (es. E-001, E-500).
   - Se `error` e' assente ma manca `data.tokenHash`: restituire `"E-014 — Impossibile creare la sessione di accesso."`.
   - Se `supabase.auth.verifyOtp` fallisce (`vErr` non nullo): restituire `"E-015 — Impossibile completare la sessione di accesso."`.
   - Se la sessione confermata non corrisponde all'email attesa: restituire `"E-016 — La sessione non e' stata confermata. Riprova."`.
   - Formato: `"${CODICE} — ${messaggio}"`.

## Non verranno toccati
- Edge functions in `supabase/functions/*`
- `src/lib/gating.ts`
- `src/lib/app-config.ts`
- Altre pagine o componenti
- Schema DB o policy RLS
- Logica esistente di `LicenseGate` (redirect, revalidazione licenza 24h, bottone "Esci")
