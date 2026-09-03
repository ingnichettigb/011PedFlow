import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { FileDown, Loader2 } from "lucide-react";

type Props = {
  remaining: number | null;
  loading?: boolean;
  className?: string;
};

export function ExportCountBadge({ remaining, loading, className }: Props) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <Badge variant="outline" className={`gap-2 h-9 px-3 text-sm ${className ?? ""}`}>
        <Loader2 className="h-4 w-4 animate-spin" /> {t("quota.loading")}
      </Badge>
    );
  }

  const exhausted = remaining != null && remaining <= 0;

  return (
    <Badge
      variant={exhausted ? "destructive" : "secondary"}
      className={`gap-2 h-9 px-3 text-sm font-bold ${className ?? ""}`}
    >
      <FileDown className="h-4 w-4" />
      {t("quota.badge", { n: remaining ?? 0 })}
    </Badge>
  );
}

export default ExportCountBadge;
