
-- Revoke EXECUTE from anon/authenticated on SECURITY DEFINER functions.
-- Trigger functions never need direct callability; helper functions used in
-- RLS policies are invoked internally with definer rights and don't require
-- external EXECUTE grants.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_role_changes() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_org_id(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;

-- Drop broad SELECT policy on storage.objects for the 'logos' bucket.
-- The bucket remains public, so files are still reachable via their public
-- URL; only bulk listing of all files is removed.
DROP POLICY IF EXISTS "Logo images are publicly accessible" ON storage.objects;
