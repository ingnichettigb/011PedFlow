## Aggiunta colonne CLP mancanti

Allineo `clp_substances_db` con le due colonne non ancora importate dall'Annex VI.

### Database
- Migrazione: aggiungo a `clp_substances_db` le colonne
  - `pictograms` (TEXT) — "Labelling – Pictogram, Signal Word Code(s)" (es. `GHS02 GHS05 Dgr`)
  - `labelling_h_codes` (TEXT) — "Labelling – Hazard Statement Code(s)" (es. `H225 H319`)
- Re-import dei 4.441 record dal file CLP Annex VI per popolare le due nuove colonne (i record esistenti vengono aggiornati per `index_no`, non duplicati).
- `hazard_codes` (Classification) e `gruppo_ped` restano invariati — logica PED non cambia.

### UI
- `src/components/ClpSubstancesTable.tsx`: due nuove colonne nella tabella ("Pittogrammi", "H-codes etichetta"), mostrate dopo "H-codes" (Classification). Se Labelling ≠ Classification, evidenzio la differenza con badge.
- `src/pages/Calculator.tsx`: nel dialog di ricerca CLP mostro anche pittogrammi e H-codes di etichetta come informazione aggiuntiva. La selezione continua a popolare il calcolatore con gli H-codes di Classification (logica PED invariata).
- `src/integrations/supabase/types.ts`: rigenerato automaticamente dopo la migrazione.

### Traduzioni
- `it / en / es / de`: aggiungo `db.col_pictograms`, `db.col_label_hcodes`, `clp.label_diff_hint`.

### Cosa NON cambia
- Logica di calcolo del Gruppo PED.
- Tabella H-codes, registry, PDF, autenticazione.
