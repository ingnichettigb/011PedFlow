import { corsHeaders, json, externalClient, APP_CODE } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const ext = externalClient();
  if (!ext) return json({ ok: false, reason: "no external client" }, 500);

  const out: Record<string, unknown> = { app_code: APP_CODE };

  const col = await ext.from("puk_codes").select("id, code, pdf_exports_remaining").limit(1);
  out.column = col.error ? col.error.message : "OK";

  const body = await req.json().catch(() => ({}));
  const puk = typeof body?.puk === "string" ? body.puk : null;

  for (const args of [
    { p_puk_code: puk ?? "TEST" },
    { p_code: puk ?? "TEST" },
    { puk_code: puk ?? "TEST" },
    {},
  ]) {
    const r = await ext.rpc("get_puk_pdf_export_status", args as Record<string, unknown>);
    out[`status_${Object.keys(args)[0] ?? "noargs"}`] = r.error ? r.error.message : r.data;
  }
  const d = await ext.rpc("decrement_puk_pdf_export", { p_puk_code: "__probe__" });
  out.decrement = d.error ? d.error.message : d.data;

  return json(out);
});
