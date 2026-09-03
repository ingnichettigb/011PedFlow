import { corsHeaders, json, fail, externalClient, internalClient, APP_CODE } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const action = body?.action === "consume" ? "consume" : body?.action === "status" ? "status" : null;
    if (!action) return fail("E-400", "Azione non valida.", 400);

    const authorization = req.headers.get("Authorization");
    const token = authorization?.replace(/^Bearer\s+/i, "").trim();
    if (!token) return fail("E-401", "Sessione non autenticata.", 401);

    // L'identità arriva dalla sessione autenticata: il client non fornisce email o PUK.
    const internal = internalClient();
    const { data: authData, error: authError } = await internal.auth.getUser(token);
    const email = authData.user?.email?.trim().toLowerCase();
    if (authError || !email) return fail("E-401", "Sessione non autenticata.", 401);

    const ext = externalClient();
    if (!ext) return fail("E-500", "Errore tecnico imprevisto. Riprova più tardi.", 500);

    const { data: puks, error: pukErr } = await ext
      .from("puk_codes")
      .select("code")
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
      if (typeof row === "number") return row;
      if (typeof row === "string") return Number(row);
      return row == null ? null : Number(row.pdf_exports_remaining ?? row.remaining ?? row.count);
    };

    const remaining = await readStatus();
    if (remaining == null || !Number.isFinite(remaining)) {
      return fail("E-303", "Impossibile leggere la quota export PDF.", 409);
    }
    if (action === "status") return json({ ok: true, remaining });
    if (remaining <= 0) return fail("E-302", "Quota di export PDF esaurita per questo PUK.", 403);

    const { error: decrementError } = await ext.rpc("decrement_puk_pdf_export", { p_puk_code: puk });
    if (decrementError) {
      console.error("decrement_puk_pdf_export failed:", decrementError.message);
      return fail("E-303", "Decremento della quota non riuscito. Riprova.", 409);
    }

    const nextRemaining = await readStatus();
    if (nextRemaining == null || !Number.isFinite(nextRemaining) || nextRemaining >= remaining) {
      return fail("E-303", "Decremento della quota non riuscito. Riprova.", 409);
    }
    return json({ ok: true, remaining: nextRemaining });
  } catch (e) {
    console.error("pdf-export-quota unexpected error:", e);
    return fail("E-500", "Errore tecnico imprevisto. Riprova più tardi.", 500);
  }
});
