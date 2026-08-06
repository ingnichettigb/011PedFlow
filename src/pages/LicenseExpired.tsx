import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_CODE, clearLicenseState, getLicenseInvalidReason } from "@/lib/app-config";

const MESSAGES: Record<string, string> = {
  expired: "La licenza è scaduta. Rinnovala oppure inserisci una nuova licenza per continuare.",
  deactivated: "La licenza è stata disattivata. Contatta il supporto oppure inserisci una nuova licenza.",
  not_found: "La licenza non è più presente nel sistema. Inserisci una nuova licenza per continuare.",
};

export default function LicenseExpired() {
  const navigate = useNavigate();
  const reason = getLicenseInvalidReason() ?? "expired";

  const restart = () => {
    clearLicenseState();
    navigate("/attivazione", { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Licenza non più valida — {APP_CODE}</CardTitle>
          <CardDescription className="text-base">{MESSAGES[reason] ?? MESSAGES.expired}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="h-11 w-full text-base" onClick={restart}>
            Inserisci una nuova licenza
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
