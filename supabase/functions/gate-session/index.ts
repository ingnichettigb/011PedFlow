import { corsHeaders, fail, json, normalizeEmail, internalClient } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const email = normalizeEmail(body?.email);
    if (!email) return fail("E-400", "Indirizzo email non valido.", 400);

    const internal = internalClient();

    // 1 — l'email deve essere verificata via OTP
    const { data: lead, error: leadErr } = await internal
      .from("lead_emails")
      .select("id")
      .ilike("email", email)
      .eq("is_verified", true)
      .limit(1)
      .maybeSingle();
    if (leadErr) {
      console.error("select lead_emails failed:", leadErr.message);
      return fail("E-500", "Errore tecnico imprevisto. Riprova più tardi.", 500);
    }
    if (!lead) return fail("E-001", "Email non verificata. Completa prima il passaggio 1.", 400);

    // 2 — crea l'utente applicativo se non esiste (già confermato)
    const password = crypto.randomUUID() + crypto.randomUUID();
    const { error: createErr } = await internal.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (createErr && !/already/i.test(createErr.message)) {
      console.error("createUser failed:", createErr.message);
      return fail("E-500", "Errore tecnico imprevisto. Riprova più tardi.", 500);
    }

    // 3 — token monouso da scambiare lato client per una sessione
    const { data: link, error: linkErr } = await internal.auth.admin.generateLink({
      type: "magiclink",
      email,
    });
    if (linkErr || !link?.properties?.hashed_token) {
      console.error("generateLink failed:", linkErr?.message);
      return fail("E-500", "Errore tecnico imprevisto. Riprova più tardi.", 500);
    }

    return json({ ok: true, email, tokenHash: link.properties.hashed_token });
  } catch (e) {
    console.error("gate-session unexpected error:", e);
    return fail("E-500", "Errore tecnico imprevisto. Riprova più tardi.", 500);
  }
});
