import { createClient } from "npm:@supabase/supabase-js@2";
Deno.serve(async () => {
  const c = createClient(Deno.env.get("EXTERNAL_SUPABASE_URL")!, Deno.env.get("EXTERNAL_SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const out: Record<string, unknown> = {};
  for (const t of ["licenses", "puk_codes", "license_puk_map", "users", "license_consents"]) {
    const { data, error } = await c.from(t).select("*").limit(1);
    out[t] = error ? { error: error.message } : { columns: data?.[0] ? Object.keys(data[0]) : [], empty: !data?.[0] };
  }
  const { data: apps } = await c.from("licenses").select("app_code").limit(50);
  out["app_codes"] = [...new Set((apps ?? []).map((a: any) => a.app_code))];
  return new Response(JSON.stringify(out, null, 2), { headers: { "Content-Type": "application/json" } });
});
