import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  APP_CODE, clearLicenseState, getLicenseId, getVerifiedEmail, hasConsent, isActivated, setActivated, setConsent,
} from "@/lib/app-config";
import { checkTermsConsent, recordTermsConsent } from "@/lib/gating";
import { TERMS, TermsLang, detectTermsLang } from "@/lib/terms-i18n";

const LANGS: { code: TermsLang; label: string }[] = [
  { code: "it", label: "Italiano" },
  { code: "en", label: "English" },
  { code: "de", label: "Deutsch" },
  { code: "es", label: "Español" },
];

export default function Terms() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const licenseId = getLicenseId();
  const email = getVerifiedEmail();
  const [lang, setLang] = useState<TermsLang>(() => detectTermsLang(i18n.language));
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const content = useMemo(() => TERMS[lang], [lang]);

  useEffect(() => {
    if (hasConsent() && isActivated()) {
      navigate("/calcolatore", { replace: true });
      return;
    }
    if (!email) {
      navigate("/auth", { replace: true });
      return;
    }
    if (!licenseId) {
      clearLicenseState();
      navigate("/attivazione", { replace: true });
      return;
    }
    let alive = true;
    (async () => {
      const { data } = await checkTermsConsent(licenseId);
      if (!alive) return;
      if (data?.consented) {
        setConsent();
        setActivated();
        navigate("/calcolatore", { replace: true });
        return;
      }
      setChecking(false);
    })();
    return () => {
      alive = false;
    };
  }, [email, licenseId, navigate]);

  const handleAccept = async () => {
    if (!licenseId) return;
    setLoading(true);
    setError(null);
    const { error: err } = await recordTermsConsent(licenseId, lang);
    setLoading(false);
    if (err) {
      setError(`${err.code} — ${err.message}`);
      return;
    }
    setConsent();
    setActivated();
    toast.success("Condizioni accettate.");
    navigate("/calcolatore", { replace: true });
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-2xl">{content.title}</CardTitle>
              <CardDescription className="text-base">{content.step}</CardDescription>
            </div>
            <Select value={lang} onValueChange={(v) => setLang(v as TermsLang)}>
              <SelectTrigger className="h-11 w-40 text-base" aria-label="[G06] Lingua">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGS.map((l) => (
                  <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-sm font-bold text-muted-foreground">
            {APP_CODE} · {content.version}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded border-2 border-destructive bg-destructive/10 p-3 text-sm font-bold text-destructive">
              {error}
            </div>
          )}
          <ScrollArea className="h-80 rounded border-2 border-border p-4">
            <p className="mb-4 text-base">{content.intro}</p>
            <div className="space-y-4">
              {content.sections.map((s) => (
                <div key={s.heading}>
                  <h3 className="text-base font-bold">{s.heading}</h3>
                  <p className="text-base leading-relaxed">{s.body}</p>
                </div>
              ))}
            </div>
          </ScrollArea>

          <label className="flex items-start gap-3 text-base font-bold">
            <Checkbox
              id="terms-accept"
              checked={checked}
              onCheckedChange={(v) => setChecked(v === true)}
              className="mt-1 h-5 w-5"
            />
            <span>[G07] {content.checkbox}</span>
          </label>

          <Button
            className="h-11 w-full text-base"
            disabled={!checked || loading}
            onClick={handleAccept}
          >
            {loading ? "…" : content.confirm}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
