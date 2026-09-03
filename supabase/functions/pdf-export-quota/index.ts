import { corsHeaders, json, fail, externalClient, normalizeEmail, APP_CODE } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const action = body?.action === "consume" ? "consume" : "status";
    const email = normalizeEmail(body?.email);
    if (!email) return fail("E-301", "PUK non trovato per l'email indicata.", 400);

    const ext = externalClient();
    if (!ext) return fail("E-500", "Errore tecnico imprevisto. Riprova più tardi.", 500);

    // Risoluzione PUK server-side dall'email verificata
    const { data: puks, error: pukErr } = await ext
      .from("puk_codes")
      .select("code, assignee_email, type_product_code, pdf_exports_remaining")
      .eq("type_product_code", APP_CODE)
      .ilike("assignee_email", email)
      .limit(1);

    if (pukErr) {
      console.error("pdf-export-quota puk lookup failed:", pukErr.message);
      return fail("E-500", "Errore tecnico imprevisto. Riprova più tardi.", 500);
    }
    const puk = puks?.[0]?.code as string | undefined;
    if (!puk) return fail("E-301", "PUK non trovato per l'email indicata.", 404);

    const readStatus = async (): Promise<number | null> => {
      const { data, error } = await ext.rpc("get_puk_pdf_export_status", { p_puk_code: puk });
      if (error) {
        console.error("get_puk_pdf_export_status failed:", error.message);
        return null;
      }
      const row = Array.isArray(data) ? data[0] : data;
      if (row == null) return null;
      if (typeof row === "number") return row;
      return (row.pdf_exports_remaining ?? row.remaining ?? null) as number | null;
    };

    const remaining = await readStatus();

    if (action === "status") {
      return json({ ok: true, puk, remaining: remaining ?? 0 });
    }

    // consume
    if (remaining != null && remaining <= 0) {
      return fail("E-302", "Quota di export PDF esaurita per questo PUK.", 403);
    }

    const { error: decErr } = await ext.rpc("decrement_puk_pdf_export", { p_puk_code: puk });
    if (decErr) {
      console.error("decrement_puk_pdf_export failed:", decErr.message);
      return fail("E-303", "Decremento della quota non riuscito. Riprova.", 409);
    }

    const after = await readStatus();
    if (after != null && remaining != null && after >= remaining) {
      return fail("E-303", "Decremento della quota non riuscito. Riprova.", 409);
    }

    return json({ ok: true, puk, remaining: after ?? Math.max((remaining ?? 1) - 1, 0) });
  } catch (e) {
    console.error("pdf-export-quota unexpected error:", e);
    return fail("E-500", "Errore tecnico imprevisto. Riprova più tardi.", 500);
  }
});
