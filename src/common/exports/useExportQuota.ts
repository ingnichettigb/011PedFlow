import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { getVerifiedEmail } from "@/lib/app-config";

export type ExportQuotaError = { code: string; message: string };

type QuotaResponse = { ok: true; puk: string; remaining: number };

async function callQuota(action: "status" | "consume"): Promise<{ data: QuotaResponse | null; error: ExportQuotaError | null }> {
  const email = getVerifiedEmail();
  const { data, error } = await supabase.functions.invoke("pdf-export-quota", {
    body: { action, email },
  });
  if (!error) return { data: data as QuotaResponse, error: null };

  if (error instanceof FunctionsHttpError) {
    try {
      const parsed = await error.context.json();
      if (parsed?.message) return { data: null, error: { code: parsed.code ?? "E-500", message: parsed.message } };
    } catch {
      /* corpo non JSON */
    }
  }
  return { data: null, error: { code: "E-500", message: error.message } };
}

export function useExportQuota() {
  const [remaining, setRemaining] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ExportQuotaError | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await callQuota("status");
    if (error) {
      setError(error);
      setRemaining(null);
    } else {
      setError(null);
      setRemaining(data?.remaining ?? 0);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  /** Consuma un export. Ritorna true solo se il decremento è riuscito. */
  const consume = useCallback(async (): Promise<{ ok: boolean; error: ExportQuotaError | null }> => {
    const { data, error } = await callQuota("consume");
    if (error) {
      setError(error);
      return { ok: false, error };
    }
    setError(null);
    setRemaining(data?.remaining ?? 0);
    return { ok: true, error: null };
  }, []);

  const exhausted = remaining != null && remaining <= 0;

  return { remaining, loading, error, refetch, consume, exhausted };
}
