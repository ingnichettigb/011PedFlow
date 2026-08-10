# 011PedFlow — Documentazione tecnica

App di **classificazione PED (Direttiva 2014/68/UE, Allegato II)** a partire da SDS + CLP.
Stack: React 18 + Vite + React Router + Tailwind/shadcn, Lovable Cloud (Postgres + Auth + Edge Functions).
Font Arial alto contrasto, label numerate univoche ([001], [010], [G01]…), multilingua IT/EN/ES/DE (`src/i18n`).

## 1. Flusso di accesso (gate licenza a 3 passaggi)

```
/auth (1 di 3)  email -> OTP 6 cifre
   v
/attivazione (2 di 3)  codice licenza + PUK
   v
/condizioni (3 di 3)  accettazione condizioni d'uso
   v
sessione applicativa creata automaticamente  ->  app sbloccata (/, /calcolatore, /registro, /databases)
```

**Non esiste più un secondo login manuale.** Dopo licenza + PUK + condizioni, `LicenseGate` chiama
`gate-session` e crea da sé la sessione Auth per l'email verificata: la pagina "Accedi a PedFlow"
non viene più mostrata (restava visibile perché `ProtectedRoute` rimandava a `/login` senza sessione).

### File coinvolti (frontend)

| File | Ruolo |
|---|---|
| `src/lib/app-config.ts` | `APP_CODE = "011PedFlow"`, `TERMS_VERSION = "v1"`, chiavi e helper `localStorage` |
| `src/lib/gating.ts` | wrapper tipizzati su tutte le edge function del gate |
| `src/pages/Auth.tsx` | passaggio 1: email ([G01]) e codice OTP ([G02]) |
| `src/pages/Activation.tsx` | passaggio 2: email readonly ([G03]), licenza ([G04]), PUK ([G05]) |
| `src/pages/Terms.tsx` | passaggio 3: testo legale (`src/lib/terms-i18n.ts`) + checkbox |
| `src/components/LicenseGate.tsx` | verifica i 4 flag, rivalida la licenza ogni 24 h (fail-open), crea la sessione, pulsante **Esci** |
| `src/pages/LicenseExpired.tsx` | uscita per licenza scaduta/disattivata (`/licenza-scaduta`) |
| `src/components/ProtectedRoute.tsx` | richiede la sessione Auth per le rotte operative |
| `src/contexts/AuthContext.tsx` | sessione, ruolo, organizzazione |
| `src/App.tsx` | rotte: `/auth`, `/attivazione`, `/condizioni`, `/licenza-scaduta` fuori dal gate; tutte le altre dentro |

### Stato locale (localStorage, prefisso `011PedFlow:`)

`verifiedEmail`, `licenseId`, `consent` (`"1"`), `activated` (`"1"`), `lastLicenseCheck` (timestamp), `licenseInvalidReason`.
`clearGateState()` azzera tutto (Esci); `clearLicenseState()` mantiene solo l'email verificata.

### Edge functions (`supabase/functions/*`, `verify_jwt = false`, input validato, CORS su ogni risposta)

| Funzione | Cosa fa | Dati usati |
|---|---|---|
| `request-otp` | genera codice 6 cifre, TTL 10 min, max 3 richieste/24 h, invio via API Resend (`RESEND_API_KEY`, `RESEND_FROM_EMAIL`) | interno `lead_emails`: `email`, `verification_code`, `code_sent_at`, `otp_attempts`, `otp_window_start`, `source` |
| `verify-otp` | confronta codice e scadenza | interno `lead_emails`: `verification_code`, `code_sent_at`, `is_verified`, `verified_at` |
| `activate-license` | licenza + PUK e "claim del posto" (1 PUK = 1 utilizzatore, per sempre) | interno `lead_emails.is_verified`; esterno `licenses`, `puk_codes`, `license_puk_map`, `users` |
| `terms-consent` | `check` / `record` del consenso versione `v1` | esterno `license_consents` (`license_id`, `puk_code`, `language`, `version`) |
| `check-license-status` | rivalidazione periodica, fail-open | esterno `licenses`: `is_active`, `expires_at` |
| `gate-session` | verifica `lead_emails.is_verified`, crea l'utente Auth se manca (`email_confirm`), restituisce `hashed_token` di magic link scambiato dal client con `supabase.auth.verifyOtp({ type: "email" })` | interno `lead_emails`, `auth.users`, trigger `handle_new_user` -> `profiles` |
| `_shared/cors.ts` | `corsHeaders`, `json`, `fail`, `normalizeEmail`, `internalClient()` (service role), `externalClient()`, `APP_CODE`, `TERMS_VERSION` |

### Database interno (Lovable Cloud)

- `public.lead_emails` — RLS attiva, **nessuna** policy per `anon`/`authenticated`, solo `service_role`:
  `id`, `email`, `verification_code`, `code_sent_at`, `is_verified`, `verified_at`, `otp_attempts`, `otp_window_start`, `source`, `created_at`.
- `public.profiles` (`user_id`, `org_id`, `full_name`), `public.user_roles` (`admin`/`manager`/`agent`), `public.organizations`.
- `public.ped_classifications` — registro delle classificazioni: `user_id`, `org_id`, `commessa`, `cliente`, `progetto`, `numero_disegno`, `fluid_name`, `cas_no`, `ec_no`, `h_codes[]`, `flash_point`, `t_min`, `t_max`, `base_group`, `final_group`, `art13_applied`, `determining_h_codes[]`, `rationale`, `method`, `input_snapshot`.
- `public.h_codes_db` — 79 codici H: `codice`, `gruppo_ped`, `classe_pericolo`, `descrizione`, `categoria_clp`, `avvertenza`, `voce_ped`.
- `public.clp_substances_db` — 4.441 sostanze Allegato VI: `index_no`, `chemical_name`, `ec_no`, `cas_no`, `hazard_codes`, `pictograms`, `labelling_h_codes`, `gruppo_ped`.
- Funzioni RLS in schema `private`: `has_role`, `get_user_org_id`.

### Database esterno (progetto master licenze, via service role)

`licenses` (`license_key`, `app_code = "011PedFlow"`, `is_active`, `expires_at`, `activated_at`, `user_email`),
`puk_codes` (`code`, `type_product_code`, `license_id`, `user_id`, `assignee_email`, `used`, `used_at`),
`license_puk_map` (`license_id`, `puk_id`), `users` (`email`), `license_consents`.

### Codici di errore

`E-400` input non valido · `E-001` email non verificata · `E-101` licenza inesistente/non attiva/altro prodotto ·
`E-102` email non corrispondente · `E-103` licenza scaduta · `E-201` PUK inesistente · `E-202` PUK già assegnato ·
`E-203` PUK di altro prodotto · `E-204` PUK non associato alla licenza · `E-500` errore tecnico.

## 2. Moduli applicativi

- `src/pages/Calculator.tsx` — dati documento, condizioni operative ([008] Tmin, [009] Tmax, [010] Flash Point con
  evidenza giallo/rosso se compreso tra Tmin e Tmax), schede **SDS** e **Nome sostanza / CAS** (ricerca CLP),
  [011] codici H a rivelazione progressiva con deduplica e avviso duplicati, risultato con badge colorati
  (rosso/giallo = Gruppo 1, arancione = Gruppo 1*, verde = Gruppo 2) e motivazione tecnica tabellare.
- `src/lib/pedLogic.ts` — gruppo base dai codici H letti da `h_codes_db` (nessuna lista hard-coded), Art. 13,
  regola Flash Point, codici determinanti deduplicati.
- `src/lib/pedPdf.ts` — report A4 bilingue (lingua UI + inglese, o italiano se la UI è in inglese), intestazione
  blu elettrico, griglia a due colonne con zebra `#F0F9FF`/bianco, box risultato colorato, footer con disclaimer.
- `src/pages/Registry.tsx` — registro classificazioni salvate, ristampa PDF.
- `src/pages/Databases.tsx` — schede **Codici H** e **Sostanze CLP**, scroll orizzontale sempre disponibile.
- `src/components/AppInfoButton.tsx` — 1 clic apre la guida, 7 clic la scarica in PDF.
