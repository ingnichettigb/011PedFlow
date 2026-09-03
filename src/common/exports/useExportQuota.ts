import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FunctionsHttpError } from "@supabase/supabase-js";

export type ExportQuotaError = { code: string; message: string };
type QuotaResponse = { ok: true; remaining: number };

async function callQuota(action: "status" | "consume"): Promise<{ data: QuotaResponse | null; error: ExportQuotaError | null }> {
  const { data, error } = await supabase.functions.invoke("pdf-export-quota", { body: { action } });
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
    const response = await callQuota("status");
    setError(response.error);
    setRemaining(response.data?.remaining ?? null);
    setLoading(false);
  }, []);

  useEffect(() => { void refetch(); }, [refetch]);

  const consume = useCallback(async () => {
    const response = await callQuota("consume");
    setError(response.error);
    if (response.data) setRemaining(response.data.remaining);
    return response;
  }, []);

  return {
    remaining,
    loading,
    error,
    refetch,
    consume,
    exhausted: remaining != null && remaining <= 0,
  };
}
