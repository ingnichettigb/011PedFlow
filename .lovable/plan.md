# Gating licenza a 2 step per 012PedFlow

Implementa il flusso email-OTP + attivazione licenza/PUK, adattato allo stack reale di questo progetto (React + Vite + React Router + Supabase Edge Functions — qui non esistono TanStack Start, `createServerFn`, `src/routes/__root.tsx` o `src/start.ts`).

I secret `EXTERNAL_SUPABASE_URL`, `EXTERNAL_SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `LOVABLE_API_KEY` risultano già presenti: non verranno richiesti di nuovo.

## Cosa vedrà l'utente

```text
apri l'app  ->  /auth        (1 di 2) email  ->  codice 6 cifre  ->  verifica
            ->  /attivazione (2 di 2) email readonly + Codice licenza + Codice PUK
            ->  /            app sbloccata
```

- `/auth`: step 1 email, step 2 codice OTP a 6 cifre, con "Reinvia codice" e "Cambia email".
- `/attivazione`: titolo `Attivazione licenza — 012PedFlow`, descrizione che inizia con `Passaggio 2 di 2 — …`, link "Cambia email" che pulisce l'email verificata e torna a `/auth`.
- Messaggi d'errore in italiano user-friendly mappati sui codici (licenza non trovata, email non corrispondente, licenza scaduta, PUK inesistente, PUK già usato, ecc.).
- Tutte le rotte esistenti (`/`, `/calcolatore`, `/classificazione/:id`, `/registro`, `/databases`) restano dietro il gate; `/auth` e `/attivazione` sono escluse.

## Database (Cloud interno)

Migration che crea `public.lead_emails`: `id uuid pk default gen_random_uuid()`, `email text not null`, `verification_code text`, `is_verified boolean not null default false`, `verified_at timestamptz`, `otp_attempts int not null default 0`, `otp_window_start timestamptz`, `source text`, `created_at timestamptz not null default now()`.
RLS abilitata, nessuna policy per `anon`/`authenticated`, `GRANT ALL ... TO service_role`: accesso solo dalle funzioni server. Indice su `lower(email)`.

`licenses` e `puk_codes` non vengono create qui: vivono nel progetto esterno.

## Dettagli tecnici

**Config**
- `src/lib/app-config.ts`: `export const APP_CODE = "012PedFlow";` più `VERIFIED_EMAIL_KEY = "verified_email:012PedFlow"` e `ACTIVATED_KEY = "activated:012PedFlow"` (equivalente di `__root.tsx` in questo stack).

**Logica server → Supabase Edge Functions**
Le service-role key non possono stare in `src/`, quindi il client Supabase esterno vive dentro le funzioni, non in un `client.external.ts` lato browser.
- `supabase/functions/request-otp` — OTP 6 cifre, TTL 10 min, rate-limit 3 richieste/24h per email su `lead_emails` (service role, Cloud interno); invio email via connector Resend attraverso il gateway Lovable con `from: "012PedFlow <team@corporateboostservice.eu>"`.
- `supabase/functions/verify-otp` — valida codice e scadenza, imposta `is_verified=true`, `verified_at=now()`.
- `supabase/functions/activate-license` — verifica su `lead_emails` che l'email sia `is_verified`, poi via client service-role verso `EXTERNAL_SUPABASE_URL` (progetto `ruopxyprezzxoirfrjrm`, bypass RLS):
  - `licenses` per `license_key` + `app_code = APP_CODE` + `is_active` → non trovata `E-101`
  - `user_email` diverso → `E-102`; `expires_at` passata → `E-103`
  - `puk_codes` non trovato → `E-201`, già usato → `E-202` (tranne riattivazione della stessa licenza già `activated_at`)
  - successo: set `activated_at` sulla licenza, `used=true` e `used_at=now()` sul PUK
  - email non verificata → `E-001`, errore inatteso → `E-500`
- Funzioni pubbliche (`verify_jwt=false` di default) protette dalla logica; input validato con Zod, CORS su ogni risposta, errori restituiti come `{ code, message }`.

**Frontend**
- `src/lib/gating.ts`: helper tipizzati che chiamano le tre funzioni con `supabase.functions.invoke` leggendo il corpo d'errore reale.
- `src/pages/Auth.tsx` e `src/pages/Activation.tsx`: form shadcn coerenti con lo stile Arial alto contrasto e le label numerate del progetto.
- `src/components/LicenseGate.tsx`: legge `localStorage`, redirige a `/auth` se manca l'email verificata e a `/attivazione` se manca l'attivazione; avvolge le rotte esistenti in `src/App.tsx`.

**Verifica finale**
Query di lettura sul progetto esterno per confermare che esista almeno una licenza con `app_code = "012PedFlow"` leggibile in bypass RLS. Se non ce n'è nessuna, te lo segnalo così la crei dal progetto master.