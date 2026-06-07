import { useRef, useState } from "react";
import { Info, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { jsPDF } from "jspdf";
import { toast } from "sonner";

const APP_DESCRIPTION_TITLE = "PedFlow — Guida all'applicazione";

const APP_DESCRIPTION_SECTIONS: { heading: string; body: string[] }[] = [
  {
    heading: "1. Cos'è PedFlow",
    body: [
      "PedFlow è uno strumento professionale per la classificazione dei fluidi secondo la Direttiva PED 2014/68/UE (Pressure Equipment Directive).",
      "Permette a tecnici, progettisti e responsabili qualità di determinare in modo rapido e tracciabile il Gruppo PED (1 o 2) di una sostanza, partendo dalla Scheda di Sicurezza (SDS) o dal database CLP ufficiale ECHA.",
    ],
  },
  {
    heading: "2. Flusso operativo",
    body: [
      "• Compila la sezione \"Dati documento\" (commessa, cliente, progetto, n° disegno).",
      "• Inserisci le \"Condizioni operative\" (Tmin / Tmax).",
      "• Identifica il fluido con una delle due modalità:",
      "   – Tab SDS: inserimento manuale di nome, CAS, EC, Flash Point e codici H presi dalla scheda di sicurezza.",
      "   – Tab Nome sostanza / CAS: ricerca diretta nel database CLP interno (oltre 4.400 sostanze).",
      "• Premi \"Calcola\" per ottenere Gruppo base e Gruppo finale, con applicazione automatica dell'Art. 13 quando previsto.",
      "• Salva il risultato e scarica il PDF di classificazione, archiviato nel Registro.",
    ],
  },
  {
    heading: "3. Database CLP integrato",
    body: [
      "Il database contiene la Tabella 3 dell'Allegato VI del Regolamento CLP (Classificazione, Etichettatura e Imballaggio) con:",
      "• Index No, CAS, EC, Nome chimico",
      "• Classification Hazard Statement Codes",
      "• Labelling Pictogram & Signal Word Codes",
      "• Labelling Hazard Statement Codes",
      "Un indicatore (≠) segnala automaticamente quando i codici H di classificazione differiscono da quelli di etichettatura.",
    ],
  },
  {
    heading: "4. Logica di calcolo PED",
    body: [
      "La classificazione applica i criteri dell'Art. 13 della Direttiva 2014/68/UE: i fluidi vengono assegnati al Gruppo 1 se presentano frasi H pericolose (es. H224, H270, H300, H330, H340, H350, H360, H400, H410, ecc.) o se la temperatura massima di esercizio supera il punto di infiammabilità.",
      "La motivazione testuale viene generata automaticamente e inclusa nel PDF.",
    ],
  },
  {
    heading: "5. Sicurezza e multi-tenant",
    body: [
      "L'app è multi-utente con RLS (Row Level Security) a livello organizzazione. Ogni agente vede solo i propri calcoli; Manager e Admin vedono l'intera organizzazione.",
      "Autenticazione via email/password o Google OAuth. I ruoli sono gestiti tramite una tabella user_roles dedicata.",
    ],
  },
  {
    heading: "6. Lingue supportate",
    body: ["Italiano, Inglese, Spagnolo, Tedesco — selezionabili in qualunque momento dal menu in alto a destra."],
  },
  {
    heading: "7. Disclaimer",
    body: [
      "I risultati prodotti hanno valore di supporto tecnico. La responsabilità della classificazione finale resta del tecnico qualificato che firma la documentazione.",
    ],
  },
];

function buildPdf(): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210;
  const M = 18;
  let y = M;

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, W, 24, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("PedFlow", M, 15);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Guida all'applicazione", W - M, 15, { align: "right" });

  y = 34;
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(APP_DESCRIPTION_TITLE, M, y);
  y += 8;

  for (const s of APP_DESCRIPTION_SECTIONS) {
    if (y > 270) { doc.addPage(); y = M; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setFillColor(241, 245, 249);
    doc.rect(M, y - 4, W - 2 * M, 7, "F");
    doc.text(s.heading, M + 2, y + 1);
    y += 9;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    for (const p of s.body) {
      const lines = doc.splitTextToSize(p, W - 2 * M - 4);
      if (y + lines.length * 5 > 285) { doc.addPage(); y = M; }
      doc.text(lines, M + 2, y);
      y += lines.length * 5 + 2;
    }
    y += 3;
  }

  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`PedFlow • Guida • Pag. ${p}/${total} • ${new Date().toLocaleDateString()}`, M, 292);
  }

  return doc;
}

export function AppInfoButton() {
  const [open, setOpen] = useState(false);
  const clicksRef = useRef(0);
  const timerRef = useRef<number | null>(null);

  const downloadPdf = () => {
    const pdf = buildPdf();
    pdf.save("PedFlow_Guida.pdf");
    const blob = pdf.output("blob");
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    toast.success("Guida scaricata e aperta in PDF");
  };

  const handleClick = () => {
    clicksRef.current += 1;
    if (timerRef.current) window.clearTimeout(timerRef.current);

    if (clicksRef.current >= 7) {
      clicksRef.current = 0;
      downloadPdf();
      return;
    }

    timerRef.current = window.setTimeout(() => {
      const n = clicksRef.current;
      clicksRef.current = 0;
      if (n >= 1) setOpen(true);
    }, 450);
  };

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="h-11 w-11"
        onClick={handleClick}
        aria-label="Informazioni sull'app"
        title="Info — 1 clic apre la guida, 7 clic scaricano il PDF"
      >
        <Info className="h-5 w-5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{APP_DESCRIPTION_TITLE}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 mt-2">
            {APP_DESCRIPTION_SECTIONS.map((s) => (
              <section key={s.heading}>
                <h3 className="text-base font-bold text-foreground mb-2">{s.heading}</h3>
                <div className="space-y-1.5 text-sm text-muted-foreground">
                  {s.body.map((p, i) => (
                    <p key={i} className="whitespace-pre-line leading-relaxed">{p}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>
          <DialogFooter className="mt-4">
            <Button onClick={downloadPdf} className="gap-2">
              <Download className="h-4 w-4" /> Scarica PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}