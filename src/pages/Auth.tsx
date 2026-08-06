import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { APP_CODE, setVerifiedEmail, clearGateState } from "@/lib/app-config";
import { requestOtp, verifyOtp } from "@/lib/gating";

export default function Auth() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async (silent = false) => {
    setLoading(true);
    setError(null);
    const { error: err } = await requestOtp(email);
    setLoading(false);
    if (err) {
      setError(`${err.code} — ${err.message}`);
      return;
    }
    setStep(2);
    if (!silent) toast.success("Codice inviato. Controlla la tua casella email.");
    else toast.success("Nuovo codice inviato.");
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearGateState();
    await send();
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: err } = await verifyOtp(email, code);
    setLoading(false);
    if (err) {
      setError(`${err.code} — ${err.message}`);
      return;
    }
    setVerifiedEmail(email.trim().toLowerCase());
    navigate("/attivazione", { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Verifica email — {APP_CODE}</CardTitle>
          <CardDescription className="text-base">
            Passaggio 1 di 3 — inserisci la tua email per ricevere un codice di verifica a 6 cifre.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded border-2 border-destructive bg-destructive/10 p-3 text-sm font-bold text-destructive">
              {error}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gate-email">[G01] Indirizzo email</Label>
                <Input
                  id="gate-email"
                  type="email"
                  className="h-11 text-base"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="h-11 w-full text-base" disabled={loading}>
                {loading ? "Invio in corso…" : "Invia codice"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleCodeSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gate-code">[G02] Codice di verifica (6 cifre)</Label>
                <Input
                  id="gate-code"
                  inputMode="numeric"
                  maxLength={6}
                  className="h-11 text-center text-2xl font-bold tracking-[0.4em]"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  required
                />
                <p className="text-sm text-muted-foreground">Inviato a {email}</p>
              </div>
              <Button type="submit" className="h-11 w-full text-base" disabled={loading || code.length !== 6}>
                {loading ? "Verifica in corso…" : "Verifica codice"}
              </Button>
              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  className="text-primary underline"
                  onClick={() => send(true)}
                  disabled={loading}
                >
                  Reinvia codice
                </button>
                <button
                  type="button"
                  className="text-primary underline"
                  onClick={() => {
                    setStep(1);
                    setCode("");
                    setError(null);
                  }}
                >
                  Cambia email
                </button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}