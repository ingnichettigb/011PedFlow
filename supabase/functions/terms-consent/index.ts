import { corsHeaders, fail, json, externalClient, APP_CODE, TERMS_VERSION } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const action = body?.action === "record" ? "record" : "check";
    const licenseId = typeof body?.licenseId === "string" ? body.licenseId.trim() : "";
    const language = ["it", "en", "de", "es"].includes(body?.language) ? body.language : "en";
    if (!licenseId) return fail("E-302", "Licenza non trovata al momento del consenso.", 400);

    const ext = externalClient();
    if (!ext) {
      console.error("missing external credentials");
      return fail("E-301", "Registrazione del consenso non riuscita. Riprova.", 500);
    }

    const { data: existing, error: selErr } = await ext
      .from("license_consents")
      .select("id")
      .eq("license_id", licenseId)
      .eq("terms_version", TERMS_VERSION)
      .maybeSingle();
    if (selErr) {
      console.error("select license_consents failed:", selErr.message);
      if (action === "check") return json({ consented: false });
      return fail("E-301", "Registrazione del consenso non riuscita. Riprova.", 500);
    }

    if (action === "check") return json({ consented: Boolean(existing), termsVersion: TERMS_VERSION });
    if (existing) return json({ ok: true, alreadyRecorded: true });

    const { data: license, error: licErr } = await ext
      .from("licenses")
      .select("id")
      .eq("id", licenseId)
      .maybeSingle();
    if (licErr) {
      console.error("select licenses failed:", licErr.message);
      return fail("E-301", "Registrazione del consenso non riuscita. Riprova.", 500);
    }
    if (!license) return fail("E-302", "Licenza non trovata al momento del consenso.", 400);

    const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || null;
    const { error: insErr } = await ext.from("license_consents").insert({
      license_id: licenseId,
      app_code: APP_CODE,
      language,
      terms_version: TERMS_VERSION,
      user_agent: req.headers.get("user-agent"),
      ip_address: ip,
    });

    if (insErr) {
      const { data: retry } = await ext
        .from("license_consents")
        .select("id")
        .eq("license_id", licenseId)
        .eq("terms_version", TERMS_VERSION)
        .maybeSingle();
      if (retry) return json({ ok: true, alreadyRecorded: true });
      console.error("insert license_consents failed:", insErr.message);
      return fail("E-301", "Registrazione del consenso non riuscita. Riprova.", 500);
    }

    return json({ ok: true });
  } catch (e) {
    console.error("terms-consent unexpected error:", e);
    return fail("E-301", "Registrazione del consenso non riuscita. Riprova.", 500);
  }
});
