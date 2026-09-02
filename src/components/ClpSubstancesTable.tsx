import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type ClpRow = {
  id: string;
  index_no: string | null;
  chemical_name: string;
  ec_no: string | null;
  cas_no: string | null;
  hazard_codes: string | null;
  gruppo_ped: string;
  pictograms: string | null;
  labelling_h_codes: string | null;
};

const groupVariant = (g: string) => {
  if (g?.startsWith("Gruppo 1")) return "bg-destructive text-destructive-foreground";
  if (g?.startsWith("Gruppo 2")) return "bg-success text-success-foreground";
  return "bg-warning/20 text-warning-foreground border border-warning";
};

export function ClpSubstancesTable({ onPick }: { onPick?: (row: ClpRow) => void }) {
  const { t } = useTranslation();
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<ClpRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const runSearch = async () => {
    const term = q.trim();
    if (!term) {
      toast.error(t("clp.search_required"));
      return;
    }
    setLoading(true);
    setSearched(true);
    const safe = term.replace(/[%_,()]/g, " ");
    const { data, error } = await supabase
      .from("clp_substances_db")
      .select("*")
      .or(`chemical_name.ilike.%${safe}%,cas_no.ilike.%${safe}%,ec_no.ilike.%${safe}%,index_no.ilike.%${safe}%`)
      .order("chemical_name")
      .limit(200);
    if (error) toast.error(error.message);
    setRows((data as ClpRow[]) ?? []);
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader className="space-y-3">
        <CardTitle className="text-lg">{t("db.clp_title")}</CardTitle>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => { setQ(e.target.value); setSearched(false); setRows([]); }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void runSearch(); } }}
              placeholder={t("db.clp_search")}
              className="pl-10 h-11 text-base"
            />
          </div>
          <Button type="button" onClick={() => void runSearch()} className="h-11 min-w-[120px] text-base font-semibold">
            {t("clp.search_button")}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {loading ? (
          <p className="py-8 text-center text-muted-foreground">{t("common.loading")}</p>
        ) : !searched ? (
          <p className="py-8 text-center text-muted-foreground">{t("clp.search_prompt")}</p>
        ) : rows.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <p className="font-semibold text-warning-foreground">{t("clp.no_results")}</p>
            <p className="text-muted-foreground">{t("clp.no_results_sds")}</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold">{t("db.col_name")}</TableHead>
                <TableHead className="font-bold">{t("db.col_cas")}</TableHead>
                <TableHead className="font-bold">{t("db.col_ec")}</TableHead>
                <TableHead className="font-bold">{t("db.col_hazards")}</TableHead>
                <TableHead className="font-bold">{t("db.col_pictograms")}</TableHead>
                <TableHead className="font-bold">{t("db.col_label_hcodes")}</TableHead>
                <TableHead className="font-bold">{t("db.col_group")}</TableHead>
                {onPick && <TableHead></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id} className={onPick ? "cursor-pointer" : ""} onClick={() => onPick?.(r)}>
                  <TableCell className="text-base font-medium">{r.chemical_name}</TableCell>
                  <TableCell className="font-mono text-base">{r.cas_no ?? "—"}</TableCell>
                  <TableCell className="font-mono text-base">{r.ec_no ?? "—"}</TableCell>
                  <TableCell className="font-mono text-sm whitespace-pre-wrap">{r.hazard_codes ?? "—"}</TableCell>
                  <TableCell className="font-mono text-xs whitespace-pre-wrap max-w-[180px]">{r.pictograms ?? "—"}</TableCell>
                  <TableCell className="font-mono text-sm whitespace-pre-wrap max-w-[200px]">
                    {r.labelling_h_codes ?? "—"}
                    {r.labelling_h_codes && r.hazard_codes && r.labelling_h_codes.trim() !== r.hazard_codes.trim() && (
                      <Badge variant="outline" className="ml-2 text-[10px] border-warning text-warning-foreground">≠</Badge>
                    )}
                  </TableCell>
                  <TableCell><Badge className={groupVariant(r.gruppo_ped)}>{r.gruppo_ped}</Badge></TableCell>
                  {onPick && (
                    <TableCell>
                      <button
                        type="button"
                        className="text-primary underline text-sm font-semibold"
                        onClick={(e) => { e.stopPropagation(); onPick(r); }}
                      >
                        {t("clp.use_this")}
                      </button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <p className="text-xs text-muted-foreground mt-3">{t("db.count", { n: rows.length })}</p>
      </CardContent>
    </Card>
  );
}