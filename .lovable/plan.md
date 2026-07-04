## Obiettivo

Evitare la ripetizione dei codici H (es. `H225 H225`) nella sezione "Codici H determinanti" senza toccare l'algoritmo di classificazione.

## Causa

Nel form di calcolo l'utente può inserire lo stesso codice H in due righe diverse. Il codice viene normalizzato ma non deduplicato:

- `src/pages/Calculator.tsx` costruisce `cleanCodes` da `form.hCodes` senza rimuovere duplicati.
- `src/lib/pedLogic.ts` in `classify()` filtra i codici pericolosi ma preserva i duplicati.
- Risultato: `determiningCodes = ["H225","H225"]`, mostrato due volte sia nella card "Risultato classificazione" sia nella tabella del PDF (evidenziazione doppia della riga determinante).

L'esito della classificazione (base/final group, art.13) è identico con o senza duplicati.

## Modifica (minimale, solo visualizzazione)

Un solo punto: `src/lib/pedLogic.ts` — deduplica `determiningCodes` prima di restituirlo dalla `classify()`, usando `Array.from(new Set(...))`. Applicato in tutti i `return` che valorizzano `determiningCodes` con più elementi (in pratica solo il ramo `h_dangerous`; gli altri rami restituiscono già `[]` o `["H226"]`).

Concretamente:

```ts
determiningCodes: Array.from(new Set(dangerous)),
```

Nessuna modifica a:
- logica di classificazione (`baseGroup`, `finalGroup`, `art13Applied`, `reasonKey`)
- salvataggio DB dei codici H originali (`h_codes` resta come inserito dall'utente)
- layout del PDF o della card

## Impatto

- UI: `Calculator.tsx` mostra ogni codice determinante una sola volta (elimina anche il warning React "duplicate key").
- PDF: la lista "Codici H determinanti" nel box risultato e i badge nella tabella H mostrano ogni codice una volta.
- Dati salvati e file già esistenti: invariati.

## File toccati

- `src/lib/pedLogic.ts` (1 riga)