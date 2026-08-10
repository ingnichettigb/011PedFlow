-- 1) lead_emails: explicit fail-closed. Only service_role (edge functions) may access.
REVOKE ALL ON public.lead_emails FROM anon, authenticated;
GRANT ALL ON public.lead_emails TO service_role;

ALTER TABLE public.lead_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_emails FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "No client access to lead_emails" ON public.lead_emails;
CREATE POLICY "No client access to lead_emails"
ON public.lead_emails
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

COMMENT ON TABLE public.lead_emails IS 'OTP/lead verification data. Client access is denied by RLS; only edge functions using the service role may read/write.';

-- 2) logos bucket: explicit public read policy (intentional for branding assets),
-- writes remain restricted to the owner folder by existing policies.
DROP POLICY IF EXISTS "Public read access to logos" ON storage.objects;
CREATE POLICY "Public read access to logos"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'logos');