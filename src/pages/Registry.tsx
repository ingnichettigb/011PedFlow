import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, FileText, Copy, Trash2, ExternalLink, FileDown } from "lucide-react";
import { generatePedPdf } from "@/lib/pedPdf";
import type { Database } from "@/integrations/supabase/types";

type Row = Database["public"]["Tables"]["ped_classifications"]["Row"];

export default function Registry() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("ped_classifications").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm(t("registry.confirm_delete"))) return;
    const { error } = await supabase.from("ped_classifications").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(t("registry.deleted"));
    setRows(rows.filter((r) => r.id !== id));
  };

  const handlePdf = (r: Row) => {
    const pdf = generatePedPdf({
      commessa: r.commessa ?? undefined, cliente: r.cliente ?? undefined, progetto: r.progetto ?? undefined,
      numeroDisegno: r.numero_disegno ?? undefined, fluidName: r.fluid_name,
      casNo: r.cas_no ?? undefined, ecNo: r.ec_no ?? undefined,
      hCodes: r.h_codes ?? [], determiningCodes: r.determining_h_codes ?? [],
      flashPoint: r.flash_point != null ? Number(r.flash_point) : null,
      tMin: r.t_min != null ? Number(r.t_min) : null,
      tMax: r.t_max != null ? Number(r.t_max) : null,
      baseGroup: r.base_group as 1 | 2, finalGroup: r.final_group as 1 | 2,
      art13Applied: r.art13_applied, rationale: r.rationale,
    }, t, i18n.language);
    pdf.save(`PED_${r.fluid_name.replace(/[^a-z0-9]+/gi, "_")}.pdf`);
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t("registry.title")}</h1>
            <p className="text-base text-muted-foreground mt-1">{t("registry.sub")}</p>
          </div>
          <Button asChild size="lg" className="gap-2 h-12 text-base">
            <Link to="/calcolatore"><Plus className="h-5 w-5" /> {t("registry.new")}</Link>
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-12 text-center text-muted-foreground">{t("common.loading")}</div>
            ) : rows.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-3">
                <FileText className="h-12 w-12 opacity-30" />
                {t("registry.empty")}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-sm font-bold">{t("registry.th_date")}</TableHead>
                      <TableHead className="text-sm font-bold">{t("registry.th_fluid")}</TableHead>
                      <TableHead className="text-sm font-bold">{t("registry.th_client")}</TableHead>
                      <TableHead className="text-sm font-bold">{t("registry.th_group")}</TableHead>
                      <TableHead className="text-sm font-bold text-right">{t("registry.th_actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="text-sm">{new Date(r.created_at).toLocaleDateString(i18n.language)}</TableCell>
                        <TableCell className="font-semibold">{r.fluid_name}</TableCell>
                        <TableCell className="text-sm">{r.cliente ?? "—"}</TableCell>
                        <TableCell>
                          <Badge className={r.final_group === 1 ? "bg-destructive text-destructive-foreground" : "bg-success text-success-foreground"}>
                            {r.final_group === 1 ? "Gr. 1" : "Gr. 2"}
                          </Badge>
                          {r.art13_applied && <Badge variant="outline" className="ml-1 border-warning">Art.13</Badge>}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="ghost" className="h-10 w-10 p-0" onClick={() => navigate(`/classificazione/${r.id}`)} title={t("registry.open")}><ExternalLink className="h-4 w-4" /></Button>
                            <Button size="sm" variant="ghost" className="h-10 w-10 p-0" onClick={() => handlePdf(r)} title={t("registry.pdf")}><FileDown className="h-4 w-4" /></Button>
                            <Button size="sm" variant="ghost" className="h-10 w-10 p-0" onClick={() => navigate(`/calcolatore?duplicate=${r.id}`)} title={t("registry.duplicate")}><Copy className="h-4 w-4" /></Button>
                            <Button size="sm" variant="ghost" className="h-10 w-10 p-0 text-destructive hover:text-destructive" onClick={() => handleDelete(r.id)} title={t("registry.delete")}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}