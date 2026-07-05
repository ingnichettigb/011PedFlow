# Fix: H301 evidenziato in rosso nel PDF anche se in DB è Gruppo 2

## Diagnosi

Nel PDF caricato (`PED_etanolo_4.pdf`) la motivazione tecnica è:
`"Gruppo 1: presenza del codice H pericoloso H225, H301, H225"`

Quindi `determiningCodes` conteneva `["H225","H301","H225"]` — H301 c'era davvero, e il PDF lo colora in rosso correttamente rispetto a quel dato. Il problema è a monte: H301 non doveva finire in `determiningCodes`, perché nel DB `h_codes_db` è marcato Gruppo 2.

Causa nel codice (`src/pages/Calculator.tsx`, `handleSavePdf`):

```ts
const r = result ?? buildAndValidate();  // ← fallback SENZA dangerSet
```

- `handleCalculate` interroga `h_codes_db`, costruisce `dangerSet` (solo codici con `gruppo_ped` che inizia con "Gruppo 1") e lo passa a `classify()`. Corretto: H301 escluso.
- `handleSavePdf`, se `result` è nullo (utente ha cliccato "Salva PDF" senza aver cliccato "Calcola" prima, o dopo un `reset`/modifica), chiama `buildAndValidate()` **senza** `dangerousCodes`. `classify` cade allora sul `DANGEROUS_SET` hard-coded in `pedLogic.ts` che include tutta la fascia H300–H310 → H301 diventa "pericoloso" → entra in `determiningCodes` → nel PDF viene colorato rosso e appare nella motivazione.

Il PDF condiviso è stato generato proprio in quel percorso (motivazione con H301, mentre lo schermo — generato da `handleCalculate` con `dangerSet` DB — mostra solo H225).

## Fix (minimo, solo `src/pages/Calculator.tsx`)

In `handleSavePdf`, prima di classificare, recuperare sempre i dettagli dal DB e ricostruire `dangerSet`, poi richiamare `classify` con quel set. Usare il risultato ricalcolato per: salvataggio DB, motivazione, `determiningCodes` passati a `generatePedPdf`.

Passi:

1. Spostare in cima ad `handleSavePdf` il fetch di `h_codes_db` per `cleanCodes` (già presente più sotto), ottenendo `details` e:
   ```ts
   const dangerSet = new Set(
     details.filter(d => (d.gruppo_ped ?? "").startsWith("Gruppo 1")).map(d => d.codice)
   );
   ```
2. Sostituire:
   ```ts
   const r = result ?? buildAndValidate();
   ```
   con:
   ```ts
   const r = buildAndValidate(dangerSet);
   ```
   così il PDF riflette sempre la verità del DB, coerente con la card a schermo, anche se l'utente non ha cliccato "Calcola" o ha cambiato i codici dopo il calcolo.
3. Aggiornare `setResult(r)` per allineare la UI al dato salvato.
4. Rimuovere il secondo fetch duplicato (`if (cleanCodes.length > 0 && details.length === 0)`), non più necessario.

## Cosa NON cambia

- `pedLogic.ts` resta invariato (il `DANGEROUS_SET` hard-coded è il fallback corretto quando il DB non è disponibile).
- Nessuna modifica al layout PDF né alla logica di colorazione rossa dei codici determinanti.
- Nessuna modifica a `handleCalculate` (già corretto).

## Effetto sul caso etanolo

`dangerSet` dal DB = `{H225}`. `classify` ritorna `determiningCodes = ["H225"]`. Nel PDF:
- riga H225 → rosso (determinante),
- riga H301 → normale (nero su zebra), coerente col Gruppo 2 in DB e con la card a schermo,
- motivazione: `"Gruppo 1: presenza del codice H pericoloso H225 ..."`.
