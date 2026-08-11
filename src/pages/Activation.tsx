import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { APP_CODE, clearGateState, getLicenseId, getVerifiedEmail, hasConsent, isActivated, setLicenseId } from "@/lib/app-config";
import { activateLicense } from "@/lib/gating";

export default function Activation() {
  const navigate = useNavigate();
  const email = getVerifiedEmail();
  const [licenseKey, setLicenseKey] = useState("");
  const [puk, setPuk] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!email) navigate("/auth", { replace: true });
    else if (getLicenseId() && hasConsent() && isActivated()) navigate("/calcolatore", { replace: true });
  }, [email, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError(null);
    const { data, error: err } = await activateLicense(email, licenseKey, puk);
    setLoading(false);
    if (err) {
      setError(`${err.code} — ${err.message}`);
      return;
    }
    if (!data?.licenseId) {
      setError("E-500 — Errore tecnico imprevisto. Riprova più tardi.");
      return;
    }
    setLicenseId(data.licenseId);
    toast.success(data.reactivated ? "Licenza riattivata su questo dispositivo." : "Licenza attivata.");
    navigate("/condizioni", { replace: true });
  };

  const changeEmail = () => {
    clearGateState();
    navigate("/auth", { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Attivazione licenza — {APP_CODE}</CardTitle>
          <CardDescription className="text-base">
            Passaggio 2 di 3 — inserisci il codice licenza e il codice PUK ricevuti per attivare l'applicazione.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded border-2 border-destructive bg-destructive/10 p-3 text-sm font-bold text-destructive">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="act-email">[G03] Email verificata</Label>
              <Input id="act-email" value={email ?? ""} readOnly className="h-11 bg-muted text-base" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="act-license">[G04] Codice licenza</Label>
              <Input
                id="act-license"
                className="h-11 text-base"
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="act-puk">[G05] Codice PUK</Label>
              <Input
                id="act-puk"
                className="h-11 text-base"
                value={puk}
                onChange={(e) => setPuk(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="h-11 w-full text-base" disabled={loading}>
              {loading ? "Attivazione in corso…" : "Attiva licenza"}
            </Button>
          </form>
          <button type="button" className="text-sm text-primary underline" onClick={changeEmail}>
            Cambia email
          </button>
        </CardContent>
      </Card>
    </div>
  );
}