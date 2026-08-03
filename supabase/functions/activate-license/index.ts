import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, fail, json, normalizeEmail, APP_CODE } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const email = normalizeEmail(body?.email);
    const licenseKey = typeof body?.licenseKey === "string" ? body.licenseKey.trim() : "";
    const puk = typeof body?.puk === "string" ? body.puk.trim() : "";
    if (!email) return fail("E-400", "Indirizzo email non valido.", 400);
    if (!licenseKey) return fail("E-400", "Codice licenza obbligatorio.", 400);
    if (!puk) return fail("E-400", "Codice PUK obbligatorio.", 400);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    const { data: lead, error: leadErr } = await supabaseAdmin
      .from("lead_emails")
      .select("id, is_verified")
      .eq("email", email)
      .maybeSingle();
    if (leadErr) {
      console.error("select lead_emails failed:", leadErr.message);
      return fail("E-500", "Errore interno. Riprova più tardi.", 500);
    }
    if (!lead?.is_verified) {
      return fail("E-001", "Email non verificata. Completa prima il passaggio 1.", 400);
    }

    const externalUrl = Deno.env.get("EXTERNAL_SUPABASE_URL");
    const externalKey = Deno.env.get("EXTERNAL_SUPABASE_SERVICE_ROLE_KEY");
    if (!externalUrl || !externalKey) {
      console.error("missing EXTERNAL_SUPABASE_URL / EXTERNAL_SUPABASE_SERVICE_ROLE_KEY");
      return fail("E-500", "Servizio licenze non configurato.", 500);
    }
    const supabaseExternal = createClient(externalUrl, externalKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: license, error: licErr } = await supabaseExternal
      .from("licenses")
      .select("*")
      .eq("license_key", licenseKey)
      .eq("app_code", APP_CODE)
      .eq("is_active", true)
      .maybeSingle();
    if (licErr) {
      console.error("select licenses failed:", licErr.message);
      return fail("E-500", "Errore interno nel controllo licenza.", 500);
    }
    if (!license) return fail("E-101", "Codice licenza non trovato o non attivo.", 400);

    const licenseEmail = String(license.user_email ?? "").trim().toLowerCase();
    if (licenseEmail && licenseEmail !== email) {
      return fail("E-102", "Questa licenza è associata a un'altra email.", 400);
    }
    if (license.expires_at && new Date(license.expires_at).getTime() < Date.now()) {
      return fail("E-103", "Licenza scaduta. Contatta il supporto per rinnovarla.", 400);
    }

    const { data: pukRow, error: pukErr } = await supabaseExternal
      .from("puk_codes")
      .select("*")
      .eq("puk_code", puk)
      .maybeSingle();
    if (pukErr) {
      console.error("select puk_codes failed:", pukErr.message);
      return fail("E-500", "Errore interno nel controllo PUK.", 500);
    }
    if (!pukRow) return fail("E-201", "Codice PUK non trovato.", 400);

    const isReactivation = Boolean(license.activated_at);
    if (pukRow.used && !isReactivation) {
      return fail("E-202", "Codice PUK già utilizzato.", 400);
    }

    const nowIso = new Date().toISOString();

    if (!isReactivation) {
      const { error: actErr } = await supabaseExternal
        .from("licenses")
        .update({ activated_at: nowIso, user_email: email })
        .eq("id", license.id);
      if (actErr) {
        console.error("update licenses failed:", actErr.message);
        return fail("E-500", "Attivazione non riuscita. Riprova.", 500);
      }

      const { error: pukUpErr } = await supabaseExternal
        .from("puk_codes")
        .update({ used: true, used_at: nowIso })
        .eq("id", pukRow.id);
      if (pukUpErr) {
        console.error("update puk_codes failed:", pukUpErr.message);
        return fail("E-500", "Attivazione non riuscita. Riprova.", 500);
      }
    }

    return json({
      ok: true,
      email,
      appCode: APP_CODE,
      activatedAt: license.activated_at ?? nowIso,
      expiresAt: license.expires_at ?? null,
      reactivated: isReactivation,
    });
  } catch (e) {
    console.error("activate-license unexpected error:", e);
    return fail("E-500", "Errore inatteso. Riprova più tardi.", 500);
  }
});