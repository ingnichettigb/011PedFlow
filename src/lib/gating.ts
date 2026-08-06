import { supabase } from "@/integrations/supabase/client";
import { FunctionsHttpError } from "@supabase/supabase-js";

export type GatingError = { code: string; message: string };

const FALLBACK: GatingError = {
  code: "E-500",
  message: "Errore tecnico imprevisto. Riprova più tardi.",
};

async function call<T>(fn: string, body: unknown): Promise<{ data: T | null; error: GatingError | null }> {
  const { data, error } = await supabase.functions.invoke(fn, { body });
  if (!error) return { data: data as T, error: null };

  if (error instanceof FunctionsHttpError) {
    try {
      const parsed = await error.context.json();
      if (parsed?.message) {
        return { data: null, error: { code: parsed.code ?? "E-500", message: parsed.message } };
      }
    } catch {
      /* corpo non JSON */
    }
  }
  console.error(`${fn} failed:`, error.message);
  return { data: null, error: FALLBACK };
}

export const requestOtp = (email: string) =>
  call<{ ok: true; ttlMinutes: number }>("request-otp", { email });

export const verifyOtp = (email: string, code: string) =>
  call<{ ok: true; email: string }>("verify-otp", { email, code });

export const activateLicense = (email: string, licenseKey: string, puk: string) =>
  call<{ ok: true; email: string; licenseId: string; expiresAt: string | null; reactivated: boolean }>(
    "activate-license",
    { email, licenseKey, puk },
  );

export const checkLicenseStatus = (licenseId: string) =>
  call<{ valid: boolean; reason: "expired" | "deactivated" | "not_found" | null }>(
    "check-license-status",
    { licenseId },
  );

export const checkTermsConsent = (licenseId: string) =>
  call<{ consented: boolean }>("terms-consent", { action: "check", licenseId });

export const recordTermsConsent = (licenseId: string, language: string) =>
  call<{ ok: true }>("terms-consent", { action: "record", licenseId, language });
