import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import {
  clearGateState, clearLicenseState, getLastLicenseCheck, getLicenseId, getVerifiedEmail,
  hasConsent, isActivated, setLastLicenseCheck, setLicenseInvalidReason,
} from "@/lib/app-config";
import { checkLicenseStatus, requestGateSession } from "@/lib/gating";
import { supabase } from "@/integrations/supabase/client";

const REVALIDATE_MS = 24 * 3600_000;

/** Lock module-level per evitare richieste gate-session parallele sulla stessa email. */
const gateSessionLocks = new Map<string, Promise<string | null>>();

/** Garantisce una sessione applicativa per l'email verificata (nessun login manuale). */
async function ensureAppSession(email: string): Promise<string | null> {
  const key = email.toLowerCase();
  const existing = gateSessionLocks.get(key);
  if (existing) return existing;

  const promise = (async (): Promise<string | null> => {
    try {
      const { data: existingSession } = await supabase.auth.getSession();
      if (existingSession.session?.user?.email?.toLowerCase() === key) return null;
      if (existingSession.session) await supabase.auth.signOut();

      const { data, error } = await requestGateSession(email);
      if (error) {
        console.error("gate-session failed:", error.message);
        return `${error.code} — ${error.message}`;
      }
      if (!data?.tokenHash) {
        return "E-014 — Impossibile creare la sessione di accesso.";
      }

      // IMPORTANTE: con token_hash NON va passata l'email, altrimenti GoTrue
      // risponde 400 "Only the token_hash and type should be provided".
      const { error: vErr } = await supabase.auth.verifyOtp({
        token_hash: data.tokenHash,
        type: "magiclink",
      });
      if (vErr) {
        console.error("verifyOtp (gate session) failed:", vErr.message);
        return `E-015 — Impossibile completare la sessione di accesso. (${vErr.message})`;
      }

      const { data: confirmed } = await supabase.auth.getSession();
      if (confirmed.session?.user?.email?.toLowerCase() !== key) {
        return "E-016 — La sessione non è stata confermata. Riprova.";
      }
      return null;
    } finally {
      gateSessionLocks.delete(key);
    }
  })();

  gateSessionLocks.set(key, promise);
  return promise;
}

export function LicenseGate({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [checked, setChecked] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const email = getVerifiedEmail();
  const licenseId = getLicenseId();
  const consent = hasConsent();
  const activated = isActivated();
  const ready = Boolean(email && licenseId && consent && activated);

  useEffect(() => {
    if (!ready) {
      setChecked(true);
      return;
    }
    let alive = true;
    (async () => {
      if (!email || !licenseId) return;
      setChecked(false);
      setSessionError(null);
      const accessError = await ensureAppSession(email);
      if (!alive) return;
      if (accessError) {
        setSessionError(accessError);
        return;
      }
      if (Date.now() - getLastLicenseCheck() >= REVALIDATE_MS) {
        const { data } = await checkLicenseStatus(licenseId);
        if (!alive) return;
        if (data && data.valid === false) {
          setLicenseInvalidReason(data.reason ?? "expired");
          clearLicenseState();
          navigate("/licenza-scaduta", { replace: true });
          return;
        }
        setLastLicenseCheck(Date.now());
      }
      if (!alive) return;
      setChecked(true);
    })();
    return () => {
      alive = false;
    };
  }, [ready, licenseId, email, navigate, attempt]);

  if (!email) return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  if (!licenseId) {
    clearLicenseState();
    return <Navigate to="/attivazione" replace state={{ from: location.pathname }} />;
  }
  if (!consent) return <Navigate to="/condizioni" replace state={{ from: location.pathname }} />;
  if (!activated) return <Navigate to="/attivazione" replace state={{ from: location.pathname }} />;

  if (sessionError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md space-y-4 rounded border-2 border-destructive bg-card p-5 text-center">
          <p className="text-base font-bold text-destructive">{sessionError}</p>
          <p className="text-sm text-muted-foreground">
            Email, licenza, PUK e consenso restano memorizzati: non devi inserirli di nuovo.
          </p>
          <Button className="h-11 w-full" onClick={() => setAttempt((value) => value + 1)}>
            Riprova accesso
          </Button>
        </div>
      </div>
    );
  }

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const exit = () => {
    clearGateState();
    navigate("/auth", { replace: true });
  };

  return (
    <>
      <div className="fixed right-3 top-3 z-[60]">
        <Button variant="outline" size="sm" className="h-9 gap-2 text-sm font-bold" onClick={exit}>
          <LogOut className="h-4 w-4" /> Esci
        </Button>
      </div>
      {children}
    </>
  );
}
