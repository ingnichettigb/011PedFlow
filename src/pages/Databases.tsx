import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Search, Database as DatabaseIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { validateHCode } from "@/lib/pedLogic";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClpSubstancesTable } from "@/components/ClpSubstancesTable";

type HCodeRow = {
  id: string;
  codice: string;
  categoria: string;
  descrizione: string;
  gruppo_ped: string;
  created_at: string;
};

const groupVariant = (g: string) => {
  if (g.startsWith("Gruppo 1")) return "bg-destructive text-destructive-foreground";
  if (g.startsWith("Gruppo 2")) return "bg-success text-success-foreground";
  return "bg-warning/20 text-warning-foreground border border-warning";
};

export default function Databases() {
  const { t } = useTranslation();
  const [rows, setRows] = useState<HCodeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ codice: "", categoria: "", descrizione: "", gruppo_ped: "Gruppo 1" });

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("h_codes_db")
      .select("*")
      .order("codice", { ascending: true });
    if (error) toast.error(error.message);
    setRows((data as HCodeRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = rows.filter((r) => {
    if (!q.trim()) return true;
    const s = q.toLowerCase();
    return r.codice.toLowerCase().includes(s)
      || r.categoria.toLowerCase().includes(s)
      || r.descrizione.toLowerCase().includes(s)
      || r.gruppo_ped.toLowerCase().includes(s);
  });

  const handleAdd = async () => {
    const codice = form.codice.trim().toUpperCase();
    if (!validateHCode(codice)) { toast.error(t("calc.invalid_h", { code: codice || "?" })); return; }
    if (!form.categoria.trim() || !form.descrizione.trim() || !form.gruppo_ped.trim()) {
      toast.error(t("db.fill_all")); return;
    }
    setSaving(true);
    const { error } = await supabase.from("h_codes_db").insert({
      codice, categoria: form.categoria.trim(), descrizione: form.descrizione.trim(), gruppo_ped: form.gruppo_ped.trim(),
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(t("db.added"));
    setForm({ codice: "", categoria: "", descrizione: "", gruppo_ped: "Gruppo 1" });
    setOpen(false);
    load();
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <DatabaseIcon className="h-7 w-7 text-primary" />
              {t("db.title")}
            </h1>
            <p className="text-base text-muted-foreground mt-1">{t("db.sub")}</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2 h-12 text-base"><Plus className="h-5 w-5" />{t("db.add_row")}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{t("db.add_row")}</DialogTitle></DialogHeader>
              <div className="grid gap-4">
                <div>
                  <Label className="text-sm font-semibold">{t("db.col_code")}</Label>
                  <Input value={form.codice} onChange={(e) => setForm({ ...form, codice: e.target.value })} placeholder="H226" className="h-11 text-base font-mono uppercase mt-1" />
                </div>
                <div>
                  <Label className="text-sm font-semibold">{t("db.col_category")}</Label>
                  <Input value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} className="h-11 text-base mt-1" />
                </div>
                <div>
                  <Label className="text-sm font-semibold">{t("db.col_description")}</Label>
                  <Input value={form.descrizione} onChange={(e) => setForm({ ...form, descrizione: e.target.value })} className="h-11 text-base mt-1" />
                </div>
                <div>
                  <Label className="text-sm font-semibold">{t("db.col_group")}</Label>
                  <Input value={form.gruppo_ped} onChange={(e) => setForm({ ...form, gruppo_ped: e.target.value })} className="h-11 text-base mt-1" placeholder="Gruppo 1 / Gruppo 2 / DA APPROFONDIRE" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button>
                <Button onClick={handleAdd} disabled={saving}>{t("db.save")}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="hcodes" className="w-full">
          <TabsList className="h-12">
            <TabsTrigger value="hcodes" className="text-base h-10 px-4">{t("db.tab_hcodes")}</TabsTrigger>
            <TabsTrigger value="clp" className="text-base h-10 px-4">{t("db.tab_clp")}</TabsTrigger>
          </TabsList>
          <TabsContent value="hcodes" className="mt-4">
        <Card>
          <CardHeader className="space-y-3">
            <CardTitle className="text-lg">{t("db.codes_db_title")}</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("db.search")} className="pl-10 h-11 text-base" />
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {loading ? (
              <p className="py-8 text-center text-muted-foreground">{t("common.loading")}</p>
            ) : filtered.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">{t("db.empty")}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold">{t("db.col_code")}</TableHead>
                    <TableHead className="font-bold">{t("db.col_category")}</TableHead>
                    <TableHead className="font-bold">{t("db.col_description")}</TableHead>
                    <TableHead className="font-bold">{t("db.col_group")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono font-bold text-base">{r.codice}</TableCell>
                      <TableCell className="text-base">{r.categoria}</TableCell>
                      <TableCell className="text-base">{r.descrizione}</TableCell>
                      <TableCell><Badge className={groupVariant(r.gruppo_ped)}>{r.gruppo_ped}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            <p className="text-xs text-muted-foreground mt-3">{t("db.count", { n: filtered.length })}</p>
          </CardContent>
        </Card>
          </TabsContent>
          <TabsContent value="clp" className="mt-4">
            <ClpSubstancesTable />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}