## Riprogettazione layout PDF PedFlow

Rifaccio completamente `src/lib/pedPdf.ts` con un layout a griglia pulita, etichette bilingue impilate verticalmente, zebra striping e footer corretto.

### 1. Griglia dati a due colonne
- Colonna sinistra (0–50% larghezza): etichetta IT sopra, EN sotto (font più piccolo, colore muted), allineate a sinistra.
- Colonna destra (55–100%): valore effettivo in font più grande, centrato verticalmente rispetto al blocco etichette.
- Altezza riga dinamica calcolata sul contenuto più alto tra etichetta e valore.

```text
┌──────────────────────────────┬─────────────────────────────┐
│ Nome sostanza / fluido       │                             │
│ Substance / fluid name       │  Etanolo                    │
├──────────────────────────────┼─────────────────────────────┤
│ Numero CAS                   │                             │
│ CAS number                   │  64-17-5                    │
└──────────────────────────────┴─────────────────────────────┘
```

### 2. Zebra striping
- Alterno righe con sfondo `#F0F9FF` (azzurro chiaro) e `#FFFFFF`.
- Applicato dentro ogni sezione (Dati documento, Dati fluido, Condizioni operative).
- Titolo sezione: barra piena azzurro/blu leggero con testo bilingue su due righe.

### 3. Tabella Codici H
- Header con sfondo blu elettrico chiaro, testo scuro, colonne bilingue impilate.
- Righe zebra (bianco / `#F0F9FF`), bordi orizzontali sottili grigio chiaro.
- Codice determinante evidenziato con badge sfondo rosso + testo giallo (coerente con UI).

### 4. Box risultato finale
- Riga prominente a piena larghezza in fondo alla sezione risultato:
  - Gruppo 1 → sfondo rosso, testo bianco/giallo, bold
  - Gruppo 2 → sfondo verde, testo bianco
- Etichetta "Gruppo finale / Final group" impilata a sinistra, valore grande a destra.

### 5. Footer corretto (nessuna sovrapposizione)
- Riservo area footer fissa (ultimi ~20mm della pagina) con controllo esplicito su ogni pagina.
- Riga 1 (y=280): disclaimer bilingue, font 7pt, `line-height` 3mm, colore grigio.
- Linea separatrice sottile a y=288.
- Riga 2 (y=291): "Pagina X di Y" a sinistra, "Generato il ..." a destra, font 7pt.
- Il contenuto del corpo viene interrotto a y=270 (nuova pagina) per non invadere mai l'area footer.

### 6. Header
- Mantengo header blu elettrico esistente con titolo bilingue.

### Dettagli tecnici
- File toccato: solo `src/lib/pedPdf.ts`.
- Helper aggiunti:
  - `drawBilingualRow(labelIt, labelEn, value, {zebraIndex})` — gestisce colonne, altezza dinamica, sfondo alternato.
  - `drawSectionTitle(titleIt, titleEn)` — barra sezione.
  - `drawFooter(page, totalPages)` — chiamato in loop finale con posizioni fisse.
  - `ensureSpace(neededMm)` — se `y + needed > 270`, `addPage()` e reset y.
- Uso `t` e `t2` già presenti per ottenere le due lingue senza modificare i file `i18n`.
- Nessuna modifica alle chiavi di traduzione né al comportamento di calcolo.

Nessuna modifica di logica di business, DB o altri componenti.