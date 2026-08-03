import { Navigate, useLocation } from "react-router-dom";
import { getVerifiedEmail, isActivated } from "@/lib/app-config";

export function LicenseGate({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const email = getVerifiedEmail();

  if (!email) return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  if (!isActivated()) return <Navigate to="/attivazione" replace state={{ from: location.pathname }} />;

  return <>{children}</>;
}