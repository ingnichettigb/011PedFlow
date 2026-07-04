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
  const H = 297;
  const M = 18;
  const CONTENT_BOTTOM = 268;
  const LABEL_W = (W - 2 * M) * 0.48;
  const VALUE_X = M + (W - 2 * M) * 0.52;
  const VALUE_W = (W - 2 * M) * 0.46;
  let y = M;
  let zebra = 0;

  const primary = (lang || "it").slice(0, 2);
  const secondaryLng = primary === "en" ? "it" : "en";
  const t2 = i18n.getFixedT(secondaryLng);

  const drawHeader = () => {
    doc.setFillColor(0, 102, 255);
    doc.rect(0, 0, W, 32, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("PedFlow", M, 13);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.text(t("pdf.title"), M, 20);
    if (t("pdf.title") !== t2("pdf.title")) {
      doc.setFontSize(9);
      doc.setTextColor(214, 231, 255);
      doc.text(t2("pdf.title"), M, 24.5);
    }
    doc.setFontSize(8);
    doc.setTextColor(214, 231, 255);
    doc.text(`${t("pdf.norm")} · ${t2("pdf.norm")}`, M, 29);
    doc.setTextColor(15, 23, 42);
  };

  drawHeader();
  y = 40;

  const ensureSpace = (need: number) => {
    if (y + need > CONTENT_BOTTOM) {
      doc.addPage();
      y = M;
      zebra = 0;
    }
  };

  const drawSectionTitle = (key: string) => {
    ensureSpace(12);
    const it = t(key);
    const en = t2(key);
    const bilingual = it !== en;
    const h = bilingual ? 10 : 7;
    doc.setFillColor(0, 102, 255);
    doc.rect(M, y, W - 2 * M, h, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(it, M + 3, y + 5);
    if (bilingual) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(214, 231, 255);
      doc.text(en, M + 3, y + 9);
    }
    doc.setTextColor(15, 23, 42);
    y += h + 1;
    zebra = 0;
  };

  const drawRow = (labelKey: string, value: string, valueOptions?: { color?: [number, number, number]; bold?: boolean }) => {
    const it = t(labelKey);
    const en = t2(labelKey);
    const bilingual = it !== en;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    const itLines = doc.splitTextToSize(it, LABEL_W - 4);
    const enLines = bilingual ? doc.splitTextToSize(en, LABEL_W - 4) : [];
    doc.setFontSize(10.5);
    const valLines = doc.splitTextToSize(value && value.length ? value : "—", VALUE_W - 2);

    const labelH = itLines.length * 4 + enLines.length * 3.5;
    const valueH = valLines.length * 5;
    const rowH = Math.max(labelH, valueH) + 5;

    ensureSpace(rowH);

    if (zebra % 2 === 0) doc.setFillColor(240, 249, 255);
    else doc.setFillColor(255, 255, 255);
    doc.rect(M, y, W - 2 * M, rowH, "F");
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.1);
    doc.line(M, y + rowH, W - M, y + rowH);

    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(itLines, M + 3, y + 4.5);
    if (bilingual) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(enLines, M + 3, y + 4.5 + itLines.length * 4);
    }

    if (valueOptions?.color) doc.setTextColor(...valueOptions.color);
    else doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", valueOptions?.bold ? "bold" : "normal");
    doc.setFontSize(10.5);
    const valStartY = y + (rowH - valueH) / 2 + 3.8;
    doc.text(valLines, VALUE_X, valStartY);

    y += rowH;
    zebra++;
  };

  drawSectionTitle("pdf.doc_data");
  drawRow("calc.l001_commessa", data.commessa || "");
  drawRow("calc.l002_cliente", data.cliente || "");
  drawRow("calc.l003_progetto", data.progetto || "");
  drawRow("calc.l004_disegno", data.numeroDisegno || "");

  y += 3;
  drawSectionTitle("pdf.fluid_data");
  drawRow("calc.l005_fluid_name", data.fluidName);
  drawRow("calc.l006_cas", data.casNo || "");
  drawRow("calc.l007_ec", data.ecNo || "");

  y += 3;
  drawSectionTitle("pdf.op_conditions");
  drawRow("calc.l008_tmin", data.tMin != null ? `${data.tMin} °C` : "");
  drawRow("calc.l009_tmax", data.tMax != null ? `${data.tMax} °C` : "");
  drawRow("calc.l010_fp", data.flashPoint != null ? `${data.flashPoint} °C` : "");

  // H codes
  y += 3;
  drawSectionTitle("pdf.h_codes");
  if (data.hDetails && data.hDetails.length > 0) {
    const tableW = W - 2 * M;
    const cols = [
      { itKey: "db.col_code", w: 16 },
      { itKey: "db.col_hazard_class", w: 32 },
      { itKey: "db.col_description", w: 56 },
      { itKey: "db.col_clp_category", w: 26 },
      { itKey: "db.col_signal_word", w: 22 },
      { itKey: "db.col_ped_entry", w: 22 },
    ];
    const totalW = cols.reduce((s, c) => s + c.w, 0);
    cols.forEach((c) => (c.w = (c.w / totalW) * tableW));

    ensureSpace(14);
    doc.setFillColor(219, 234, 254);
    doc.rect(M, y, tableW, 11, "F");
    let x = M;
    cols.forEach((c) => {
      const it = t(c.itKey);
      const en = t2(c.itKey);
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text(it, x + 2, y + 4.2);
      if (it !== en) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(71, 85, 105);
        doc.text(en, x + 2, y + 8);
      }
      x += c.w;
    });
    y += 11;

    data.hDetails.forEach((d, idx) => {
      const vals = [
        d.codice,
        d.classe_pericolo ?? "—",
        d.descrizione ?? "—",
        d.categoria_clp ?? "—",
        d.avvertenza ?? "—",
        d.voce_ped ?? "—",
      ];
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      const wrapped = vals.map((v, i) => doc.splitTextToSize(String(v), cols[i].w - 4));
      const rowH = Math.max(...wrapped.map((w) => w.length)) * 3.8 + 3.5;
      ensureSpace(rowH);
      if (idx % 2 === 0) doc.setFillColor(240, 249, 255);
      else doc.setFillColor(255, 255, 255);
      doc.rect(M, y, tableW, rowH, "F");
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.1);
      doc.line(M, y + rowH, W - M, y + rowH);

      const isDetermining = data.determiningCodes.includes(d.codice);
      x = M;
      wrapped.forEach((w, i) => {
        if (i === 0 && isDetermining) {
          doc.setFillColor(220, 38, 38);
          doc.roundedRect(x + 1.5, y + 1.5, cols[i].w - 3, rowH - 3, 1.2, 1.2, "F");
          doc.setTextColor(250, 204, 21);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
          doc.text(String(d.codice), x + cols[i].w / 2, y + rowH / 2 + 1.4, { align: "center" });
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8.5);
          doc.setTextColor(15, 23, 42);
        } else {
          doc.setTextColor(15, 23, 42);
          doc.text(w, x + 2, y + 4);
        }
        x += cols[i].w;
      });
      y += rowH;
    });
  } else if (data.hCodes.length > 0) {
    ensureSpace(10);
    doc.setFillColor(240, 249, 255);
    doc.rect(M, y, W - 2 * M, 8, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(data.hCodes.join(", "), M + 3, y + 5.3);
    y += 9;
  }

  // Result
  y += 4;
  drawSectionTitle("pdf.result");
  drawRow("pdf.base_group", String(data.baseGroup));

  y += 2;
  const isG1 = data.finalGroup === 1;
  const boxH = 18;
  ensureSpace(boxH + 4);
  if (isG1) doc.setFillColor(220, 38, 38);
  else doc.setFillColor(34, 197, 94);
  doc.rect(M, y, W - 2 * M, boxH, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(t("pdf.final_group"), M + 4, y + 7);
  if (t("pdf.final_group") !== t2("pdf.final_group")) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(t2("pdf.final_group"), M + 4, y + 12);
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  const grpIt = isG1 ? t("calc.group1") : t("calc.group2");
  const grpEn = isG1 ? t2("calc.group1") : t2("calc.group2");
  doc.text(grpIt, W - M - 4, y + 8, { align: "right" });
  if (grpIt !== grpEn) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text(grpEn, W - M - 4, y + 13.5, { align: "right" });
  }
  doc.setTextColor(15, 23, 42);
  y += boxH + 4;

  // Rationale
  const ratIt = t("pdf.rationale");
  const ratEn = t2("pdf.rationale");
  ensureSpace(20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(ratIt, M, y);
  if (ratIt !== ratEn) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(ratEn, M, y + 4);
    y += 8;
  } else {
    y += 5;
  }
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const rl = doc.splitTextToSize(data.rationale, W - 2 * M);
  rl.forEach((line: string) => {
    ensureSpace(5.5);
    doc.text(line, M, y);
    y += 5;
  });
  y += 3;

  if (data.art13Applied) {
    ensureSpace(14);
    doc.setFillColor(254, 243, 199);
    doc.rect(M, y, W - 2 * M, 12, "F");
    doc.setFont("helvetica", "bold");
    doc.setTextColor(120, 53, 15);
    doc.setFontSize(9.5);
    const art =
      t("pdf.art13") !== t2("pdf.art13")
        ? `${t("pdf.art13")} / ${t2("pdf.art13")} — Art. 13 Dir. 2014/68/EU`
        : `${t("pdf.art13")} — Art. 13 Dir. 2014/68/EU`;
    const artL = doc.splitTextToSize(art, W - 2 * M - 6);
    doc.text(artL, M + 3, y + 5);
    y += Math.max(12, artL.length * 5) + 3;
    doc.setTextColor(15, 23, 42);
  }

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.2);
    doc.line(M, H - 18, W - M, H - 18);

    doc.setFont("helvetica", "italic");
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    const disIt = doc.splitTextToSize(t("pdf.disclaimer"), W - 2 * M);
    doc.text(disIt, M, H - 15);
    if (t("pdf.disclaimer") !== t2("pdf.disclaimer")) {
      const disEn = doc.splitTextToSize(t2("pdf.disclaimer"), W - 2 * M);
      doc.text(disEn, M, H - 15 + disIt.length * 2.6 + 0.4);
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    const pageLabel =
      t("pdf.page") !== t2("pdf.page") ? `${t("pdf.page")} / ${t2("pdf.page")}` : t("pdf.page");
    const ofLabel = t("pdf.of") !== t2("pdf.of") ? `${t("pdf.of")} / ${t2("pdf.of")}` : t("pdf.of");
    doc.text(`${pageLabel} ${p} ${ofLabel} ${totalPages}`, M, H - 6);
    const genLabel =
      t("pdf.generated_on") !== t2("pdf.generated_on")
        ? `${t("pdf.generated_on")} / ${t2("pdf.generated_on")}`
        : t("pdf.generated_on");
    doc.text(`${genLabel}: ${new Date().toLocaleString(lang)}`, W - M, H - 6, { align: "right" });
  }

  return doc;
}