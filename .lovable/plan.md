## Cosa farò

### 1. Fix errore "row-level security policy" al salvataggio PDF
La tabella `ped_classifications` richiede sia `user_id` sia `org_id` all'inserimento. Oggi `handleSavePdf` invia solo `user_id`, quindi l'INSERT viene rifiutato dalla RLS.

- In `src/pages/Calculator.tsx`: prima di salvare, leggere `org_id` dal profilo dell'utente loggato (`profiles.org_id` via `get_user_org_id` lato client = `select org_id from profiles where user_id = auth.uid()`).
- Aggiungere `org_id` al payload sia per INSERT sia per UPDATE.
- Se per qualche motivo `org_id` manca, mostrare un toast d'errore chiaro invece del messaggio criptico RLS.

### 2. Scroll automatico al risultato dopo "Calcola"
- Aggiungere un `useRef` sulla Card del risultato.
- In `handleCalculate`, dopo aver impostato `result` e caricato `hDetails`, eseguire `resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })` dentro un `requestAnimationFrame` (per aspettare il render).

### 3. Campi H a comparsa progressiva (riga per riga)
Nella sezione [011] Hazard codes H:

- **Riga 1 (H01–H04)**: sempre visibile.
- **Riga 2 (H05–H08)**: visibile **solo** se tutti e 4 i campi H01–H04 sono compilati. Se uno di essi viene svuotato, la riga 2 (e di conseguenza la 3) viene di nuovo nascosta.
- **Riga 3 (H09–H12)**: visibile **solo** se anche tutti e 4 i campi H05–H08 sono compilati.

Implementazione: sostituire il singolo `grid` con tre `grid` separati (uno per riga di 4 campi), renderizzando le righe 2 e 3 condizionalmente in base a `firstFour` / `firstEight`. Rimuovere la logica `disabled` (non serve più, perché i campi nascosti non possono essere editati).

Quando una riga viene nascosta, i valori già inseriti in quei campi (es. se l'utente svuota un campo della riga precedente) vengono azzerati per evitare di salvare codici "fantasma" non visibili.

## File coinvolti
- `src/pages/Calculator.tsx` (unico file da modificare)

## Note tecniche
- Nessuna modifica al database o alle RLS: la regola esistente è corretta, va solo rispettata lato client.
- Nessuna modifica al PDF o ad altre pagine.
