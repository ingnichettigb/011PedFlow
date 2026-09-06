# Barra in alto: eliminare la sovrapposizione dei pulsanti

## Elenco completo dei comandi presenti in alto

Nella barra (da sinistra a destra):

1. Pulsante menu (tre linee) — solo su schermi piccoli
2. Logo PedFlow + nome "PedFlow"
3. Pallino azzurro con il numero di PDF disponibili (19)
4. Calcolatore
5. Registro
6. Databases
7. Pulsante informazioni (i)
8. Pulsante lingua (globo + IT)
9. Pulsante utente (icona persona, apre il menu con "Esci") — appare solo quando c'è un utente collegato
10. **Esci** — pulsante flottante, NON fa parte della barra

## Causa della sovrapposizione

Il pulsante "Esci" (10) non appartiene alla barra: è disegnato "sopra" la pagina, fissato nell'angolo in alto a destra, quindi copre gli ultimi comandi della barra (lingua e utente). Per questo, per quanto si distanzino i pulsanti della barra, la sovrapposizione resta.

## Cosa farò

- Togliere il pulsante "Esci" flottante.
- Inserire "Esci" come pulsante normale in fondo alla barra, dopo il pulsante lingua, così tutti i comandi stanno in fila senza accavallarsi.
- Evitare il doppione: il menu utente e il pulsante "Esci" faranno la stessa cosa, quindi ne resta uno solo visibile (pulsante "Esci" con icona, testo nascosto sugli schermi stretti).
- Aggiungerlo anche nel menu laterale degli schermi piccoli.
- Tradurre l'etichetta nelle 4 lingue usando la voce già esistente.

## Dettagli tecnici

- `src/components/LicenseGate.tsx`: rimuovere il blocco `fixed right-3 top-3 z-[60]` con il bottone Esci; esportare/riusare `clearGateState()` nella disconnessione già presente in `AppLayout`.
- `src/components/AppLayout.tsx`: aggiungere il bottone Esci nel gruppo destro (dopo lingua), sostituendo il dropdown utente ridondante o mantenendo l'email in tooltip; `shrink-0`, `whitespace-nowrap`, testo `hidden md:inline`.
- Nessuna modifica alla logica di licenza, quota PDF o calcolo.
