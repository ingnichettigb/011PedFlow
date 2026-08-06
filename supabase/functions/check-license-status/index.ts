import { corsHeaders, json, externalClient, APP_CODE } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // fail-open: in caso di problemi tecnici non blocchiamo un utilizzatore legittimo
  try {
    const body = await req.json().catch(() => ({}));
    const licenseId = typeof body?.licenseId === "string" ? body.licenseId.trim() : "";
    if (!licenseId) return json({ valid: true, reason: null });

    const ext = externalClient();
    if (!ext) return json({ valid: true, reason: null });

    const { data: license, error } = await ext
      .from("licenses")
      .select("id, is_active, expires_at, app_code")
      .eq("id", licenseId)
      .eq("app_code", APP_CODE)
      .maybeSingle();
    if (error) {
      console.error("check-license-status select failed:", error.message);
      return json({ valid: true, reason: null });
    }
    if (!license) return json({ valid: false, reason: "not_found" });
    if (license.is_active !== true) return json({ valid: false, reason: "deactivated" });
    if (license.expires_at && new Date(license.expires_at).getTime() < Date.now()) {
      return json({ valid: false, reason: "expired" });
    }
    return json({ valid: true, reason: null });
  } catch (e) {
    console.error("check-license-status unexpected error:", e);
    return json({ valid: true, reason: null });
  }
});
