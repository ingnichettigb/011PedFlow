import { jsPDF } from "jspdf";
import type { TFunction } from "i18next";

export interface PdfData {
  commessa?: string;
  cliente?: string;
  progetto?: string;
  numeroDisegno?: string;
  fluidName: string;
  casNo?: string;
  ecNo?: string;
  hCodes: string[];
  determiningCodes: string[];
  flashPoint: number | null;
  tMin: number | null;
  tMax: number | null;
  baseGroup: 1 | 2;
  finalGroup: 1 | 2;
  art13Applied: boolean;
  rationale: string;
}

export function generatePedPdf(data: PdfData, t: TFunction, lang: string): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210;
  const M = 18;
  let y = M;

  doc.setFont("helvetica", "normal"); // Helvetica = Arial equivalent in jsPDF

  // Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, W, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("PedFlow", M, 12);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(t("pdf.title"), M, 19);
  doc.setFontSize(9);
  doc.text(t("pdf.norm"), M, 24.5);

  y = 38;
  doc.setTextColor(15, 23, 42);

  const section = (title: string) => {
    if (y > 265) { doc.addPage(); y = M; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setFillColor(241, 245, 249);
    doc.rect(M, y - 4, W - 2 * M, 7, "F");
    doc.text(title, M + 2, y + 1);
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
  };

  const row = (label: string, value: string) => {
    if (y > 275) { doc.addPage(); y = M; }
    doc.setFont("helvetica", "bold");
    doc.text(label + ":", M + 2, y);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(value || "—", W - 2 * M - 60);
    doc.text(lines, M + 62, y);
    y += Math.max(6, lines.length * 5);
  };

  // Section: Document
  section(t("pdf.doc_data"));
  row(t("calc.l001_commessa"), data.commessa || "—");
  row(t("calc.l002_cliente"), data.cliente || "—");
  row(t("calc.l003_progetto"), data.progetto || "—");
  row(t("calc.l004_disegno"), data.numeroDisegno || "—");

  // Section: Fluid
  y += 2;
  section(t("pdf.fluid_data"));
  row(t("calc.l005_fluid_name"), data.fluidName);
  row(t("calc.l006_cas"), data.casNo || "—");
  row(t("calc.l007_ec"), data.ecNo || "—");

  // Section: Operating conditions
  y += 2;
  section(t("pdf.op_conditions"));
  row(t("calc.l008_tmin"), data.tMin != null ? `${data.tMin} °C` : "—");
  row(t("calc.l009_tmax"), data.tMax != null ? `${data.tMax} °C` : "—");
  row(t("calc.l010_fp"), data.flashPoint != null ? `${data.flashPoint} °C` : "—");

  // Section: H codes
  y += 2;
  section(t("pdf.h_codes"));
  doc.text(data.hCodes.length ? data.hCodes.join(", ") : "—", M + 2, y);
  y += 7;
  if (data.determiningCodes.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.text(t("pdf.determining") + ":", M + 2, y);
    doc.setFont("helvetica", "normal");
    doc.text(data.determiningCodes.join(", "), M + 62, y);
    y += 7;
  }

  // Section: Result
  y += 2;
  section(t("pdf.result"));
  row(t("pdf.base_group"), `${t("pdf.base_group")} ${data.baseGroup}`);
  // Final group highlighted
  if (y > 260) { doc.addPage(); y = M; }
  const isG1 = data.finalGroup === 1;
  doc.setFillColor(isG1 ? 220 : 220, isG1 ? 38 : 252, isG1 ? 38 : 231);
  if (isG1) doc.setFillColor(220, 38, 38); else doc.setFillColor(34, 197, 94);
  doc.rect(M, y, W - 2 * M, 14, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(`${t("pdf.final_group")}: ${isG1 ? t("calc.group1") : t("calc.group2")}`, M + 4, y + 9);
  y += 18;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  // Rationale
  if (y > 250) { doc.addPage(); y = M; }
  doc.setFont("helvetica", "bold");
  doc.text(t("pdf.rationale") + ":", M + 2, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  const rl = doc.splitTextToSize(data.rationale, W - 2 * M - 4);
  doc.text(rl, M + 2, y);
  y += rl.length * 5 + 4;

  if (data.art13Applied) {
    if (y > 270) { doc.addPage(); y = M; }
    doc.setFillColor(254, 243, 199);
    doc.rect(M, y, W - 2 * M, 10, "F");
    doc.setFont("helvetica", "bold");
    doc.setTextColor(120, 53, 15);
    doc.text("⚠ " + t("pdf.art13") + " — Art. 13 Dir. 2014/68/EU", M + 3, y + 6.5);
    y += 14;
    doc.setTextColor(15, 23, 42);
  }

  // Footer / disclaimer
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    const dis = doc.splitTextToSize(t("pdf.disclaimer"), W - 2 * M);
    doc.text(dis, M, 285);
    doc.text(
      `${t("pdf.page")} ${p} ${t("pdf.of")} ${totalPages} • ${t("pdf.generated_on")} ${new Date().toLocaleString(lang)}`,
      M,
      292
    );
  }

  return doc;
}