import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import {
  clearGateState, clearLicenseState, getLastLicenseCheck, getLicenseId, getVerifiedEmail,
  hasConsent, isActivated, setLastLicenseCheck, setLicenseInvalidReason,
} from "@/lib/app-config";
import { checkLicenseStatus } from "@/lib/gating";

const REVALIDATE_MS = 24 * 3600_000;

export function LicenseGate({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [checked, setChecked] = useState(false);

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
    if (Date.now() - getLastLicenseCheck() < REVALIDATE_MS) {
      setChecked(true);
      return;
    }
    let alive = true;
    (async () => {
      const { data } = await checkLicenseStatus(licenseId!);
      if (!alive) return;
      if (data && data.valid === false) {
        setLicenseInvalidReason(data.reason ?? "expired");
        clearLicenseState();
        navigate("/licenza-scaduta", { replace: true });
        return;
      }
      setLastLicenseCheck(Date.now());
      setChecked(true);
    })();
    return () => {
      alive = false;
    };
  }, [ready, licenseId, navigate, location.pathname]);

  if (!email) return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  if (!licenseId) {
    clearLicenseState();
    return <Navigate to="/attivazione" replace state={{ from: location.pathname }} />;
  }
  if (!consent) return <Navigate to="/condizioni" replace state={{ from: location.pathname }} />;
  if (!activated) return <Navigate to="/attivazione" replace state={{ from: location.pathname }} />;

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
