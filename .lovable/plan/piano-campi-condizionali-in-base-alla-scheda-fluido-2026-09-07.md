# Piano: campi condizionali in base alla scheda fluido

## Obiettivo
Nella pagina Calcolatore, rendere visibili solo i campi del fluido pertinenti alla scheda attiva:
- **SDS – Scheda di sicurezza**: `[005] Nome sostanza / fluido`, `[010] Flash Point`, `[011] Codici di pericolo H`.
- **Nome sostanza / CAS**: `[005] Nome sostanza / fluido`, `[006] Numero CAS`, `[007] Numero EC`, `[010] Flash Point`, `[011] Codici di pericolo H`.

## File coinvolto
- `src/pages/Calculator.tsx`

## Modifiche previste
1. Spostare i campi `[006] Numero CAS` e `[007] Numero EC` dalla scheda SDS alla scheda CLP.
2. Nella scheda SDS lasciare solo `[005]`, `[010]` e `[011]`.
3. Nella scheda CLP mostrare `[005]`, `[006]`, `[007]`, `[010]` e `[011]` (gli H-codes restano necessari per il calcolo).
4. Quando l'utente seleziona un fluido dalla tabella CLP (`handlePickClp`), non passare automaticamente alla scheda SDS, così CAS/EC popolati restano visibili nella scheda corretta.
5. Mantenere invariata logica di calcolo, salvataggio, quota PDF, validazione e stili.

## Verifica
- `bun run build` senza errori.
- Navigazione manuale nel preview per controllare che i campi appaiano/scompaiano correttamente passando da una scheda all'altra.
