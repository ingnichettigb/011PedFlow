import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, fail, json, normalizeEmail, APP_CODE } from "../_shared/cors.ts";

const OTP_TTL_MIN = 10;
const MAX_REQUESTS = 3;
const WINDOW_HOURS = 24;
const FROM = `${APP_CODE} <team@corporateboostservice.eu>`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const email = normalizeEmail(body?.email);
    if (!email) return fail("E-400", "Indirizzo email non valido.", 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    const { data: existing, error: selErr } = await supabase
      .from("lead_emails")
      .select("id, otp_attempts, otp_window_start")
      .eq("email", email)
      .maybeSingle();
    if (selErr) {
      console.error("select lead_emails failed:", selErr.message);
      return fail("E-500", "Errore interno. Riprova più tardi.", 500);
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
          return fail(
            "E-429",
            "Hai richiesto troppi codici. Riprova tra 24 ore.",
            429,
          );
        }
        attempts = (existing.otp_attempts ?? 0) + 1;
        windowStart = started!;
      }
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(now.getTime() + OTP_TTL_MIN * 60_000).toISOString();

    const payload = {
      email,
      verification_code: `${code}:${expiresAt}`,
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
      return fail("E-500", "Errore interno. Riprova più tardi.", 500);
    }

    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!lovableKey || !resendKey) {
      console.error("missing LOVABLE_API_KEY or RESEND_API_KEY");
      return fail("E-500", "Servizio email non configurato.", 500);
    }

    const mail = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": resendKey,
      },
      body: JSON.stringify({
        from: FROM,
        to: [email],
        subject: `${APP_CODE} — Codice di verifica: ${code}`,
        html: `<div style="font-family:Arial,Helvetica,sans-serif;font-size:16px;color:#111">
          <h2 style="margin:0 0 16px">${APP_CODE}</h2>
          <p>Il tuo codice di verifica è:</p>
          <p style="font-size:32px;font-weight:bold;letter-spacing:6px;margin:16px 0">${code}</p>
          <p>Il codice scade fra ${OTP_TTL_MIN} minuti. Se non hai richiesto questo codice, ignora questa email.</p>
        </div>`,
      }),
    });

    if (!mail.ok) {
      const details = await mail.text();
      console.error(`resend gateway failed [${mail.status}]: ${details}`);
      return json(
        { code: "E-500", message: "Invio email non riuscito.", status: mail.status, details },
        mail.status,
      );
    }

    return json({ ok: true, ttlMinutes: OTP_TTL_MIN });
  } catch (e) {
    console.error("request-otp unexpected error:", e);
    return fail("E-500", "Errore inatteso. Riprova più tardi.", 500);
  }
});