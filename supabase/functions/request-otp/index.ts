import { corsHeaders, fail, json, normalizeEmail, internalClient, APP_CODE, APP_NAME } from "../_shared/cors.ts";

const OTP_TTL_MIN = 10;
const MAX_REQUESTS = 3;
const WINDOW_HOURS = 24;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const email = normalizeEmail(body?.email);
    if (!email) return fail("E-400", "Indirizzo email non valido.", 400);

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      console.error("missing RESEND_API_KEY");
      return fail("E-010", "Invio del codice non riuscito. Riprova più tardi.", 500);
    }
    const from = Deno.env.get("RESEND_FROM_EMAIL") ?? "team@corporateboostservice.eu";

    const supabase = internalClient();

    const { data: existing, error: selErr } = await supabase
      .from("lead_emails")
      .select("id, otp_attempts, otp_window_start, is_verified")
      .ilike("email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (selErr) {
      console.error("select lead_emails failed:", selErr.message);
      return fail("E-010", "Invio del codice non riuscito. Riprova più tardi.", 500);
    }

    const now = new Date();
    let attempts = 1;
    let windowStart = now;

    if (existing) {
      const started = existing.otp_window_start ? new Date(existing.otp_window_start) : null;
      const withinWindow =
        started !== null && now.getTime() - started.getTime() < WINDOW_HOURS * 3600_000;
      if (withinWindow) {
        if ((existing.otp_attempts ?? 0) >= MAX_REQUESTS) {
          return fail("E-011", "Hai già richiesto 3 codici nelle ultime 24 ore. Riprova più tardi.", 429);
        }
        attempts = (existing.otp_attempts ?? 0) + 1;
        windowStart = started!;
      }
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));

    const payload = {
      email,
      verification_code: code,
      code_sent_at: now.toISOString(),
      is_verified: false,
      verified_at: null,
      otp_attempts: attempts,
      otp_window_start: windowStart.toISOString(),
      source: APP_CODE,
    };

    const { error: upErr } = existing
      ? await supabase.from("lead_emails").update(payload).eq("id", existing.id)
      : await supabase.from("lead_emails").insert(payload);
    if (upErr) {
      console.error("upsert lead_emails failed:", upErr.message);
      return fail("E-010", "Invio del codice non riuscito. Riprova più tardi.", 500);
    }

    const mail = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: `${APP_CODE} <${from}>`,
        to: [email],
        subject: `${APP_NAME} — Codice di verifica: ${code}`,
        html: `<div style="font-family:Arial,Helvetica,sans-serif;font-size:16px;color:#111">
          <h2 style="margin:0 0 16px">${APP_NAME} (${APP_CODE})</h2>
          <p>Il tuo codice di verifica è:</p>
          <p style="font-size:32px;font-weight:bold;letter-spacing:6px;margin:16px 0">${code}</p>
          <p>Il codice scade fra ${OTP_TTL_MIN} minuti. Se non hai richiesto questo codice, ignora questa email.</p>
        </div>`,
      }),
    });

    if (!mail.ok) {
      const details = await mail.text();
      console.error(`resend failed [${mail.status}]: ${details}`);
      return json({ code: "E-010", message: "Invio del codice non riuscito. Riprova più tardi." }, 502);
    }

    return json({ ok: true, ttlMinutes: OTP_TTL_MIN });
  } catch (e) {
    console.error("request-otp unexpected error:", e);
    return fail("E-010", "Invio del codice non riuscito. Riprova più tardi.", 500);
  }
});
