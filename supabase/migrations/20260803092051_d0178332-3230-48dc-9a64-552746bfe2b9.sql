CREATE TABLE public.lead_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  verification_code text,
  is_verified boolean NOT NULL DEFAULT false,
  verified_at timestamptz,
  otp_attempts int NOT NULL DEFAULT 0,
  otp_window_start timestamptz,
  source text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX lead_emails_email_lower_idx ON public.lead_emails (lower(email));

GRANT ALL ON public.lead_emails TO service_role;

ALTER TABLE public.lead_emails ENABLE ROW LEVEL SECURITY;