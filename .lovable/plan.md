## Riorganizzazione layout Calculator

### Nuovo ordine sezioni
1. **Dati documento** (invariato)
2. **Condizioni operative** (spostato qui, subito sotto Dati documento)
3. **Identificazione fluido** in tabbed view con due schede sovrapposte:
   - **Tab "SDS – Scheda di sicurezza"** (default): campi nome fluido, CAS, EC, Flash Point e i 12 codici H da inserire a mano (dati presi dalla SDS)
   - **Tab "Nome sostanza / CAS"**: ricerca diretta nel database CLP (sostituisce il dialog attuale). Campo di ricerca + tabella inline; cliccando una riga si popolano nome, CAS, EC, H-codes e si chiude verso lo stato compilato. Mostra anche il badge "CLP gruppo" se rilevato.
4. Pulsanti Calcola / Reset / Salva PDF (invariati)
5. Risultato (invariato)

### Dettagli implementativi
- `src/pages/Calculator.tsx`: rimuovo card separate "Fluid identification", "Op conditions" e "SDS H-codes" e le ricompongo nell'ordine sopra. Aggiungo `Tabs` shadcn con due `TabsContent`. Rimuovo il pulsante "[018] Cerca fluido nel database CLP" e il Dialog (la ricerca diventa il secondo tab). Sposto Flash Point dentro la card SDS (è un dato della SDS sezione 9), lasciando Tmin/Tmax in Condizioni operative.
- Riuso `ClpSubstancesTable` inline (senza Dialog).
- Aggiungo chiavi i18n `calc.tab_sds`, `calc.tab_clp` in `it/en/es/de`.

### Cosa NON cambia
- Logica di calcolo PED, salvataggio, PDF, registry, database.
