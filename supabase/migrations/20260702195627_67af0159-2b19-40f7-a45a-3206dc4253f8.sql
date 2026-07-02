GRANT EXECUTE ON FUNCTION public.get_user_org_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_org_id(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;

REVOKE EXECUTE ON FUNCTION public.get_user_org_id(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;