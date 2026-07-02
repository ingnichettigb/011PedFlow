import { jsPDF } from "jspdf";
import type { TFunction } from "i18next";
import i18n from "@/i18n";

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
  hDetails?: Array<{
    codice: string;
    classe_pericolo: string | null;
    descrizione: string | null;
    categoria_clp: string | null;
    avvertenza: string | null;
    voce_ped: string | null;
  }>;
}

export function generatePedPdf(data: PdfData, t: TFunction, lang: string): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210;
  const M = 18;
  let y = M;

  doc.setFont("helvetica", "normal"); // Helvetica = Arial equivalent in jsPDF

  // Secondary language: English by default, Italian if primary is English
  const primary = (lang || "it").slice(0, 2);
  const secondaryLng = primary === "en" ? "it" : "en";
  const t2 = i18n.getFixedT(secondaryLng);

  // Header — electric blue
  doc.setFillColor(0, 102, 255);
  doc.rect(0, 0, W, 32, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("PedFlow", M, 12);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`${t("pdf.title")} / ${t2("pdf.title")}`, M, 19);
  doc.setFontSize(9);
  doc.text(`${t("pdf.norm")} / ${t2("pdf.norm")}`, M, 25);
  y = 42;

  doc.setTextColor(15, 23, 42);

  const bi = (key: string) => {
    const a = t(key);
    const b = t2(key);
    return a === b ? a : `${a} / ${b}`;
  };

  const section = (key: string) => {
    if (y > 260) { doc.addPage(); y = M; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setFillColor(241, 245, 249);
    const text = bi(key);
    const lines = doc.splitTextToSize(text, W - 2 * M - 4);
    const h = lines.length * 5 + 3;
    doc.rect(M, y - 4, W - 2 * M, h, "F");
    doc.text(lines, M + 2, y + 1);
    y += h + 2;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
  };

  const row = (labelKey: string, value: string) => {
    if (y > 270) { doc.addPage(); y = M; }
    const labelW = W - 2 * M - 4;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    const labelLines = doc.splitTextToSize(bi(labelKey) + ":", labelW);
    doc.text(labelLines, M + 2, y);
    y += labelLines.length * 4.5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const valLines = doc.splitTextToSize(value || "—", labelW);
    doc.text(valLines, M + 6, y + 0.5);
    y += valLines.length * 5 + 2.5;
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

  // H code details table
  if (data.hDetails && data.hDetails.length > 0) {
    y += 2;
    if (y > 250) { doc.addPage(); y = M; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    const cols = [
      { label: t("db.col_code"), w: 18 },
      { label: t("db.col_hazard_class"), w: 32 },
      { label: t("db.col_description"), w: 60 },
      { label: t("db.col_clp_category"), w: 26 },
      { label: t("db.col_signal_word"), w: 22 },
      { label: t("db.col_ped_entry"), w: 16 },
    ];
    doc.setFillColor(241, 245, 249);
    doc.rect(M, y - 4, W - 2 * M, 6, "F");
    let x = M + 1;
    cols.forEach((c) => { doc.text(c.label, x, y); x += c.w; });
    y += 4;
    doc.setFont("helvetica", "normal");
    data.hDetails.forEach((d) => {
      const vals = [d.codice, d.classe_pericolo ?? "—", d.descrizione ?? "—", d.categoria_clp ?? "—", d.avvertenza ?? "—", d.voce_ped ?? "—"];
      const wrapped = vals.map((v, i) => doc.splitTextToSize(String(v), cols[i].w - 2));
      const rowH = Math.max(...wrapped.map((w) => w.length)) * 4 + 2;
      if (y + rowH > 280) { doc.addPage(); y = M; }
      x = M + 1;
      wrapped.forEach((w, i) => { doc.text(w, x, y); x += cols[i].w; });
      y += rowH;
    });
    doc.setFontSize(10);
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