import { corsHeaders, json, externalClient, APP_CODE } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const ext = externalClient();
  if (!ext) return json({ ok: false }, 500);
  const { data: puks } = await ext
    .from("puk_codes")
    .select("code, assignee_email, used, pdf_exports_remaining, type_product_code")
    .eq("type_product_code", APP_CODE)
    .limit(5);
  const first = puks?.[0]?.code;
  const status = first ? await ext.rpc("get_puk_pdf_export_status", { p_puk_code: first }) : null;
  return json({ puks, status: status?.error?.message ?? status?.data });
});
