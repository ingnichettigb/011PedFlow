import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  remaining: number | null;
  loading?: boolean;
  className?: string;
};

export function ExportCountBadge({ remaining, loading, className }: Props) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-full bg-info text-info-foreground shadow",
          className
        )}
        title={t("quota.loading")}
        aria-label={t("quota.loading")}
      >
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  const display = remaining == null ? "—" : String(remaining);
  const exhausted = remaining != null && remaining <= 0;

  return (
    <div
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-full font-bold text-sm shadow",
        exhausted ? "bg-destructive text-destructive-foreground" : "bg-info text-info-foreground",
        className
      )}
      title={t("quota.badge", { n: remaining == null ? "—" : remaining })}
      aria-label={t("quota.badge", { n: remaining == null ? "—" : remaining })}
    >
      {display}
    </div>
  );
}

export default ExportCountBadge;
