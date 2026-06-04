import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, Calculator as CalcIcon, FileDown, RotateCcw, Save } from "lucide-react";
import { classify, validateHCode, type ClassificationResult } from "@/lib/pedLogic";
import { generatePedPdf } from "@/lib/pedPdf";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ClpSubstancesTable, type ClpRow } from "@/components/ClpSubstancesTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const H_SLOTS = 12;

type FormState = {
  commessa: string; cliente: string; progetto: string; numeroDisegno: string;
  fluidName: string; casNo: string; ecNo: string;
  tMin: string; tMax: string; flashPoint: string;
  hCodes: string[];
};

const emptyForm = (): FormState => ({
  commessa: "", cliente: "", progetto: "", numeroDisegno: "",
  fluidName: "", casNo: "", ecNo: "",
  tMin: "", tMax: "", flashPoint: "",
  hCodes: Array(H_SLOTS).fill(""),
});

const numOrNull = (s: string): number | null => {
  const v = s.trim();
  if (!v) return null;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : null;
};

export default function Calculator() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const [params] = useSearchParams();
  const dupId = params.get("duplicate");
  const navigate = useNavigate();
  const { user } = useAuth();

  const [form, setForm] = useState<FormState>(emptyForm);
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const [loadId, setLoadId] = useState<string | null>(id ?? null);
  const [saving, setSaving] = useState(false);
  const [clpHint, setClpHint] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"sds" | "clp">("sds");

  // Load existing or duplicate
  useEffect(() => {
    const target = id ?? dupId;
    if (!target) return;
    (async () => {
      const { data, error } = await supabase.from("ped_classifications").select("*").eq("id", target).maybeSingle();
      if (error || !data) return;
      const snap = (data.input_snapshot as Partial<FormState>) ?? {};
      setForm({
        commessa: snap.commessa ?? data.commessa ?? "",
        cliente: snap.cliente ?? data.cliente ?? "",
        progetto: snap.progetto ?? data.progetto ?? "",
        numeroDisegno: snap.numeroDisegno ?? data.numero_disegno ?? "",
        fluidName: snap.fluidName ?? data.fluid_name ?? "",
        casNo: snap.casNo ?? data.cas_no ?? "",
        ecNo: snap.ecNo ?? data.ec_no ?? "",
        tMin: data.t_min != null ? String(data.t_min) : "",
        tMax: data.t_max != null ? String(data.t_max) : "",
        flashPoint: data.flash_point != null ? String(data.flash_point) : "",
        hCodes: [...(data.h_codes ?? []), ...Array(H_SLOTS).fill("")].slice(0, H_SLOTS),
      });
      if (dupId) setLoadId(null); else setLoadId(data.id);
    })();
  }, [id, dupId]);

  const setHCode = (i: number, v: string) => {
    const next = [...form.hCodes];
    next[i] = v;
    setForm({ ...form, hCodes: next });
  };

  const buildAndValidate = (): ClassificationResult | null => {
    if (!form.fluidName.trim()) { toast.error(t("calc.fluid_required")); return null; }
    const cleanCodes: string[] = [];
    for (const c of form.hCodes) {
      const v = c.trim().toUpperCase();
      if (!v) continue;
      if (!validateHCode(v)) { toast.error(t("calc.invalid_h", { code: v })); return null; }
      cleanCodes.push(v);
    }
    const fp = numOrNull(form.flashPoint);
    if (form.flashPoint.trim() && fp == null) { toast.error(t("calc.invalid_fp")); return null; }
    const tmin = numOrNull(form.tMin);
    const tmax = numOrNull(form.tMax);
    if (tmin != null && tmax != null && tmin > tmax) { toast.error(t("calc.invalid_temps")); return null; }
    return classify({ hCodes: cleanCodes, flashPoint: fp, tMin: tmin, tMax: tmax });
  };

  const handleCalculate = () => {
    const r = buildAndValidate();
    if (r) setResult(r);
  };

  const handleReset = () => { setForm(emptyForm()); setResult(null); setLoadId(null); navigate("/calcolatore"); };

  const handlePickClp = (row: ClpRow) => {
    const codes = (row.hazard_codes ?? "")
      .split(/[\s,;]+/)
      .map((c) => c.trim().toUpperCase())
      .filter((c) => /^H\d{3}/.test(c))
      .map((c) => c.replace(/[^A-Z0-9]/g, ""));
    const padded = [...codes, ...Array(H_SLOTS).fill("")].slice(0, H_SLOTS);
    setForm((f) => ({
      ...f,
      fluidName: row.chemical_name,
      casNo: row.cas_no ?? "",
      ecNo: row.ec_no ?? "",
      hCodes: padded,
    }));
    setClpHint(row.gruppo_ped);
    setActiveTab("sds");
    toast.success(t("clp.imported"));
  };

  const buildRationale = (r: ClassificationResult): string =>
    t(`reasons.${r.reasonKey}`, r.reasonParams);

  const handleSavePdf = async () => {
    const r = result ?? buildAndValidate();
    if (!r) return;
    if (!result) setResult(r);
    setSaving(true);
    const cleanCodes = form.hCodes.map((c) => c.trim().toUpperCase()).filter(Boolean);
    const fp = numOrNull(form.flashPoint);
    const tmin = numOrNull(form.tMin);
    const tmax = numOrNull(form.tMax);
    const rationale = buildRationale(r);

    const payload = {
      user_id: user!.id,
      commessa: form.commessa || null,
      cliente: form.cliente || null,
      progetto: form.progetto || null,
      numero_disegno: form.numeroDisegno || null,
      fluid_name: form.fluidName,
      cas_no: form.casNo || null,
      ec_no: form.ecNo || null,
      h_codes: cleanCodes,
      flash_point: fp,
      t_min: tmin,
      t_max: tmax,
      base_group: r.baseGroup,
      final_group: r.finalGroup,
      art13_applied: r.art13Applied,
      determining_h_codes: r.determiningCodes,
      rationale,
      method: "SDS",
      input_snapshot: form as unknown as Json,
    };

    let savedId = loadId;
    if (loadId) {
      const { error } = await supabase.from("ped_classifications").update(payload).eq("id", loadId);
      if (error) { toast.error(error.message); setSaving(false); return; }
    } else {
      const { data, error } = await supabase.from("ped_classifications").insert(payload).select("id").single();
      if (error) { toast.error(error.message); setSaving(false); return; }
      savedId = data.id;
      setLoadId(savedId);
    }

    const pdf = generatePedPdf({
      commessa: form.commessa, cliente: form.cliente, progetto: form.progetto, numeroDisegno: form.numeroDisegno,
      fluidName: form.fluidName, casNo: form.casNo, ecNo: form.ecNo,
      hCodes: cleanCodes, determiningCodes: r.determiningCodes,
      flashPoint: fp, tMin: tmin, tMax: tmax,
      baseGroup: r.baseGroup, finalGroup: r.finalGroup, art13Applied: r.art13Applied,
      rationale,
    }, t, i18n.language);
    pdf.save(`PED_${(form.fluidName || "fluid").replace(/[^a-z0-9]+/gi, "_")}.pdf`);

    toast.success(t("calc.saved"));
    setSaving(false);
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t("calc.title")}</h1>
          <p className="text-base text-muted-foreground mt-1">{t("calc.sub")}</p>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-lg">{t("calc.doc_section")}</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Field id="f-commessa" label={t("calc.l001_commessa")} value={form.commessa} onChange={(v) => setForm({ ...form, commessa: v })} />
            <Field id="f-cliente" label={t("calc.l002_cliente")} value={form.cliente} onChange={(v) => setForm({ ...form, cliente: v })} />
            <Field id="f-progetto" label={t("calc.l003_progetto")} value={form.progetto} onChange={(v) => setForm({ ...form, progetto: v })} />
            <Field id="f-disegno" label={t("calc.l004_disegno")} value={form.numeroDisegno} onChange={(v) => setForm({ ...form, numeroDisegno: v })} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">{t("calc.op_section")}</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Field id="f-tmin" label={t("calc.l008_tmin")} value={form.tMin} onChange={(v) => setForm({ ...form, tMin: v })} type="number" />
            <Field id="f-tmax" label={t("calc.l009_tmax")} value={form.tMax} onChange={(v) => setForm({ ...form, tMax: v })} type="number" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{t("calc.fluid_section")}</CardTitle>
            {clpHint && (
              <Badge variant="outline" className="text-base h-8 px-3 w-fit mt-2">
                {t("clp.found_group")}: {clpHint}
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "sds" | "clp")} className="w-full">
              <TabsList className="h-12">
                <TabsTrigger value="sds" className="text-base h-10 px-4">{t("calc.tab_sds")}</TabsTrigger>
                <TabsTrigger value="clp" className="text-base h-10 px-4">{t("calc.tab_clp")}</TabsTrigger>
              </TabsList>

              <TabsContent value="sds" className="mt-4 space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field id="f-name" label={t("calc.l005_fluid_name")} value={form.fluidName} onChange={(v) => setForm({ ...form, fluidName: v })} required />
                  <Field id="f-cas" label={t("calc.l006_cas")} value={form.casNo} onChange={(v) => setForm({ ...form, casNo: v })} />
                  <Field id="f-ec" label={t("calc.l007_ec")} value={form.ecNo} onChange={(v) => setForm({ ...form, ecNo: v })} />
                  <div>
                    <Field id="f-fp" label={t("calc.l010_fp")} value={form.flashPoint} onChange={(v) => setForm({ ...form, flashPoint: v })} type="number" />
                    <p className="text-xs text-muted-foreground mt-1">{t("calc.fp_optional")}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-base font-semibold mb-3">{t("calc.l011_h")}</h3>
                  <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                    {form.hCodes.map((c, i) => (
                      <div key={i}>
                        <Label htmlFor={`h-${i}`} className="text-sm font-semibold">{`H${String(i + 1).padStart(2, "0")}`}</Label>
                        <Input id={`h-${i}`} value={c} onChange={(e) => setHCode(i, e.target.value)} placeholder={t("calc.l012_h_placeholder")} className="h-11 text-base font-mono uppercase" />
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="clp" className="mt-4">
                <ClpSubstancesTable onPick={handlePickClp} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button onClick={handleCalculate} size="lg" className="gap-2 h-12 text-base">
            <CalcIcon className="h-5 w-5" /> {t("calc.l013_calc")}
          </Button>
          <Button onClick={handleReset} variant="outline" size="lg" className="gap-2 h-12 text-base">
            <RotateCcw className="h-5 w-5" /> {t("calc.l014_reset")}
          </Button>
          <Button onClick={handleSavePdf} variant="secondary" size="lg" className="gap-2 h-12 text-base" disabled={saving}>
            {saving ? <Save className="h-5 w-5 animate-pulse" /> : <FileDown className="h-5 w-5" />}
            {t("calc.l015_save_pdf")}
          </Button>
        </div>

        {result && (
          <Card className={result.finalGroup === 1 ? "border-destructive border-2" : "border-success border-2"}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                {result.finalGroup === 1 ? <AlertTriangle className="h-7 w-7 text-destructive" /> : <CheckCircle2 className="h-7 w-7 text-success" />}
                {t("calc.result_title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-3 items-center">
                <Badge variant="outline" className="text-base h-8 px-3">{t("calc.base_group")}: {result.baseGroup}</Badge>
                <Badge className={result.finalGroup === 1 ? "bg-destructive text-destructive-foreground text-base h-8 px-3" : "bg-success text-success-foreground text-base h-8 px-3"}>
                  {t("calc.final_group")}: {result.finalGroup === 1 ? t("calc.group1") : t("calc.group2")}
                </Badge>
                {result.art13Applied && <Badge variant="outline" className="text-base h-8 px-3 border-warning text-warning-foreground bg-warning/10">{t("calc.art13_label")}</Badge>}
              </div>
              {result.determiningCodes.length > 0 && (
                <div>
                  <span className="text-sm font-semibold">{t("calc.determining_codes")}: </span>
                  {result.determiningCodes.map((c) => <Badge key={c} variant="secondary" className="mr-1 font-mono">{c}</Badge>)}
                </div>
              )}
              <Alert>
                <AlertDescription className="text-base">
                  <strong>{t("calc.rationale")}: </strong>
                  {buildRationale(result)}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}
      </div>

    </AppLayout>
  );
}

function Field({ id, label, value, onChange, type = "text", required }: { id: string; label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean }) {
  return (
    <div>
      <Label htmlFor={id} className="text-sm font-semibold">{label}{required && <span className="text-destructive ml-1">*</span>}</Label>
      <Input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} className="h-11 text-base mt-1" />
    </div>
  );
}