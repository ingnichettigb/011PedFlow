import {
  corsHeaders, fail, json, normalizeEmail, internalClient, externalClient, APP_CODE,
} from "../_shared/cors.ts";

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

    // 1 — email verificata sul database interno
    const internal = internalClient();
    const { data: lead, error: leadErr } = await internal
      .from("lead_emails")
      .select("id, is_verified")
      .ilike("email", email)
      .eq("is_verified", true)
      .limit(1)
      .maybeSingle();
    if (leadErr) {
      console.error("select lead_emails failed:", leadErr.message);
      return fail("E-500", "Errore tecnico imprevisto. Riprova più tardi.", 500);
    }
    if (!lead) return fail("E-001", "Email non verificata. Completa prima il passaggio 1.", 400);

    const ext = externalClient();
    if (!ext) {
      console.error("missing EXTERNAL_SUPABASE_URL / EXTERNAL_SUPABASE_SERVICE_ROLE_KEY");
      return fail("E-500", "Servizio licenze non configurato.", 500);
    }

    // 2 — licenza esistente, attiva, di questo prodotto (nessun filtro email)
    const { data: license, error: licErr } = await ext
      .from("licenses")
      .select("id, license_key, app_code, is_active, expires_at, activated_at")
      .eq("license_key", licenseKey)
      .eq("app_code", APP_CODE)
      .eq("is_active", true)
      .maybeSingle();
    if (licErr) {
      console.error("select licenses failed:", licErr.message);
      return fail("E-500", "Errore tecnico imprevisto. Riprova più tardi.", 500);
    }
    if (!license) return fail("E-101", "Codice licenza inesistente, non attivo o di un altro prodotto.", 400);

    // 3 — licenza non scaduta
    if (license.expires_at && new Date(license.expires_at).getTime() < Date.now()) {
      return fail("E-103", "Licenza scaduta. Contatta il supporto per rinnovarla.", 400);
    }

    // 4 — PUK esistente
    const { data: pukRow, error: pukErr } = await ext
      .from("puk_codes")
      .select("id, code, type_product_code, license_id, user_id, assignee_email, used")
      .eq("code", puk)
      .maybeSingle();
    if (pukErr) {
      console.error("select puk_codes failed:", pukErr.message);
      return fail("E-500", "Errore tecnico imprevisto. Riprova più tardi.", 500);
    }
    if (!pukRow) return fail("E-201", "Codice PUK inesistente.", 400);

    // 5 — PUK di questo prodotto
    if (pukRow.type_product_code && pukRow.type_product_code !== APP_CODE) {
      return fail("E-203", "Questo PUK appartiene a un altro prodotto.", 400);
    }

    // 6 — PUK collegato alla licenza (mappa o legame diretto)
    let linked = pukRow.license_id === license.id;
    if (!linked) {
      const { data: map, error: mapErr } = await ext
        .from("license_puk_map")
        .select("id")
        .eq("license_id", license.id)
        .eq("puk_id", pukRow.id)
        .maybeSingle();
      if (mapErr) {
        console.error("select license_puk_map failed:", mapErr.message);
        return fail("E-500", "Errore tecnico imprevisto. Riprova più tardi.", 500);
      }
      linked = Boolean(map);
    }
    if (!linked) return fail("E-204", "Il PUK non è associato alla licenza inserita.", 400);

    // 7 — utente nell'anagrafica condivisa
    let userId: string | null = null;
    const { data: userRow, error: userSelErr } = await ext
      .from("users")
      .select("id")
      .ilike("email", email)
      .limit(1)
      .maybeSingle();
    if (userSelErr) {
      console.error("select users failed:", userSelErr.message);
      return fail("E-500", "Errore tecnico imprevisto. Riprova più tardi.", 500);
    }
    if (userRow) {
      userId = userRow.id;
    } else {
      const { data: created, error: userInsErr } = await ext
        .from("users")
        .insert({ email })
        .select("id")
        .maybeSingle();
      if (userInsErr || !created) {
        console.error("insert users failed:", userInsErr?.message);
        return fail("E-500", "Errore tecnico imprevisto. Riprova più tardi.", 500);
      }
      userId = created.id;
    }

    // 8 — claim del posto: 1 PUK = 1 utilizzatore, per sempre
    const nowIso = new Date().toISOString();
    let reactivated = false;

    const storedAssignee =
      typeof pukRow.assignee_email === "string"
        ? normalizeEmail(pukRow.assignee_email)
        : "";

    // I dati storici possono avere assignee_email vuoto e user_id collegato a
    // una riga duplicata della stessa email. Verifichiamo quindi anche il
    // proprietario effettivo del vecchio user_id prima di restituire E-202.
    let ownerEmail = "";
    if (pukRow.user_id && pukRow.user_id !== userId) {
      const { data: owner, error: ownerErr } = await ext
        .from("users")
        .select("email")
        .eq("id", pukRow.user_id)
        .maybeSingle();
      if (ownerErr) {
        console.error("select puk owner failed:", ownerErr.message);
        return fail("E-500", "Errore tecnico imprevisto. Riprova più tardi.", 500);
      }
      ownerEmail = normalizeEmail(owner?.email);
    }

    const sameAssignee =
      storedAssignee === email ||
      pukRow.user_id === userId ||
      ownerEmail === email;

    if (sameAssignee) {
      // stesso utilizzatore (anche con user_id disallineato o duplicato in anagrafica)
      reactivated = true;
      if (pukRow.user_id !== userId) {
        const { error: syncErr } = await ext
          .from("puk_codes")
          .update({ user_id: userId, used: true, used_at: pukRow.used ? undefined : nowIso })
          .eq("id", pukRow.id);
        if (syncErr) console.error("sync puk user_id failed:", syncErr.message);
      }
    } else if (!pukRow.user_id && !storedAssignee) {
      const { data: claimed, error: claimErr } = await ext
        .from("puk_codes")
        .update({ user_id: userId, used: true, used_at: nowIso, assignee_email: email })
        .eq("id", pukRow.id)
        .is("user_id", null)
        .select("id");
      if (claimErr) {
        console.error("claim puk failed:", claimErr.message);
        return fail("E-500", "Errore tecnico imprevisto. Riprova più tardi.", 500);
      }
      if (!claimed || claimed.length === 0) {
        return fail("E-202", "Questo PUK è già assegnato a un altro utilizzatore.", 400);
      }
    } else {
      return fail("E-202", "Questo PUK è già assegnato a un altro utilizzatore.", 400);
    }

    // 9 — prima attivazione della licenza
    if (!license.activated_at) {
      const { error: actErr } = await ext
        .from("licenses")
        .update({ activated_at: nowIso })
        .eq("id", license.id)
        .is("activated_at", null);
      if (actErr) console.error("update licenses activated_at failed:", actErr.message);
    }

    return json({
      ok: true,
      email,
      licenseId: license.id,
      appCode: APP_CODE,
      expiresAt: license.expires_at ?? null,
      reactivated,
    });
  } catch (e) {
    console.error("activate-license unexpected error:", e);
    return fail("E-500", "Errore tecnico imprevisto. Riprova più tardi.", 500);
  }
});
