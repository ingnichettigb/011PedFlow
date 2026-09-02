# Ricerca CLP: solo corrispondenza esatta

## Cosa ho capito
Nella scheda "Nome sostanza / CAS" (Identificazione fluido → Database sostanze CLP – Annex VI):

1. All'inizio si vede **solo il campo di ricerca** con il pulsante Cerca (nessuna tabella, nessun elenco).
2. Cercando, si mostra **solo la riga che coincide in modo identico** con il testo inserito (CAS esatto, EC esatto, Index esatto oppure nome sostanza identico). Niente risultati "simili"/parziali.
3. Se non c'è corrispondenza esatta: messaggio esplicito del tipo "Il tuo numero CAS non è presente nel database. Devi procedere con l'impiego della scheda di sicurezza (SDS)".
4. In quel caso il pulsante/tab **"SDS – Scheda di sicurezza" viene evidenziato in verde** (bordo/sfondo verde + eventuale pulsante verde "Vai alla scheda SDS" che apre direttamente la tab SDS).

## Dettagli tecnici
- `src/components/ClpSubstancesTable.tsx`: query con match esatto (`or(cas_no.eq.X,ec_no.eq.X,index_no.eq.X,chemical_name.ilike.X)` senza `%`), confronto normalizzato (trim, case-insensitive). Nessun risultato mostrato prima della ricerca.
- Stato "nessun risultato": messaggio + callback opzionale `onNoResult`/`onGoToSds` per passare alla tab SDS.
- `src/pages/Calculator.tsx`: stato che evidenzia in verde il `TabsTrigger` "SDS" quando la ricerca CLP non trova nulla, e passa alla tab SDS al click.
- Testi nuovi aggiunti in tutte e 4 le lingue (it/en/es/de).
- Nessuna modifica alla logica di calcolo PED.

## Domanda aperta
Per il nome sostanza intendi corrispondenza **identica** (uguale parola per parola) e non "contiene"? Nel piano ho assunto identica.
