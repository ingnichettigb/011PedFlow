import { corsHeaders, fail, json, normalizeEmail, internalClient } from "../_shared/cors.ts";

const OTP_TTL_MS = 10 * 60_000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const email = normalizeEmail(body?.email);
    const code = typeof body?.code === "string" ? body.code.trim() : "";
    if (!email) return fail("E-400", "Indirizzo email non valido.", 400);
    if (!/^\d{6}$/.test(code)) return fail("E-400", "Il codice deve avere 6 cifre.", 400);

    const supabase = internalClient();

    const { data: row, error } = await supabase
      .from("lead_emails")
      .select("id, code_sent_at, otp_window_start, created_at")
      .ilike("email", email)
      .eq("verification_code", code)
      .eq("is_verified", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) {
      console.error("select lead_emails failed:", error.message);
      return fail("E-012", "Codice non corretto o scaduto.", 400);
    }
    if (!row) return fail("E-012", "Codice non corretto o scaduto.", 400);

    const sentAt = new Date(row.code_sent_at ?? row.otp_window_start ?? row.created_at).getTime();
    if (!Number.isFinite(sentAt) || Date.now() - sentAt > OTP_TTL_MS) {
      return fail("E-012", "Codice non corretto o scaduto.", 400);
    }

    const { error: upErr } = await supabase
      .from("lead_emails")
      .update({
        is_verified: true,
        verified_at: new Date().toISOString(),
        verification_code: null,
        otp_attempts: 0,
      })
      .eq("id", row.id);
    if (upErr) {
      console.error("update lead_emails failed:", upErr.message);
      return fail("E-013", "Verifica non confermata dal database. Riprova.", 500);
    }

    const { data: check } = await supabase
      .from("lead_emails")
      .select("is_verified")
      .eq("id", row.id)
      .maybeSingle();
    if (!check?.is_verified) {
      return fail("E-013", "Verifica non confermata dal database. Riprova.", 500);
    }

    return json({ ok: true, email });
  } catch (e) {
    console.error("verify-otp unexpected error:", e);
    return fail("E-013", "Verifica non confermata dal database. Riprova.", 500);
  }
});
