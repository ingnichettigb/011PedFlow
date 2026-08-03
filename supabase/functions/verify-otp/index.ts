import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, fail, json, normalizeEmail } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const email = normalizeEmail(body?.email);
    const code = typeof body?.code === "string" ? body.code.trim() : "";
    if (!email) return fail("E-400", "Indirizzo email non valido.", 400);
    if (!/^\d{6}$/.test(code)) return fail("E-400", "Il codice deve avere 6 cifre.", 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    const { data: row, error } = await supabase
      .from("lead_emails")
      .select("id, verification_code, is_verified")
      .eq("email", email)
      .maybeSingle();
    if (error) {
      console.error("select lead_emails failed:", error.message);
      return fail("E-500", "Errore interno. Riprova più tardi.", 500);
    }
    if (!row) return fail("E-401", "Nessun codice richiesto per questa email.", 400);

    const [storedCode, expiresAt] = String(row.verification_code ?? "").split(":");
    if (!storedCode || !expiresAt) {
      return fail("E-401", "Nessun codice valido. Richiedine uno nuovo.", 400);
    }
    if (new Date(expiresAt).getTime() < Date.now()) {
      return fail("E-410", "Codice scaduto. Richiedine uno nuovo.", 400);
    }
    if (storedCode !== code) {
      return fail("E-401", "Codice non corretto.", 400);
    }

    const { error: upErr } = await supabase
      .from("lead_emails")
      .update({ is_verified: true, verified_at: new Date().toISOString(), verification_code: null })
      .eq("id", row.id);
    if (upErr) {
      console.error("update lead_emails failed:", upErr.message);
      return fail("E-500", "Errore interno. Riprova più tardi.", 500);
    }

    return json({ ok: true, email });
  } catch (e) {
    console.error("verify-otp unexpected error:", e);
    return fail("E-500", "Errore inatteso. Riprova più tardi.", 500);
  }
});