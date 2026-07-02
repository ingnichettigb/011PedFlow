CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.get_user_org_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT org_id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

REVOKE ALL ON SCHEMA private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION private.get_user_org_id(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.get_user_org_id(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;

DROP POLICY IF EXISTS "Org members can view their organization" ON public.organizations;
DROP POLICY IF EXISTS "Admins can update their organization" ON public.organizations;
DROP POLICY IF EXISTS "Users can insert own classifications" ON public.ped_classifications;
DROP POLICY IF EXISTS "Admins can view all org classifications" ON public.ped_classifications;
DROP POLICY IF EXISTS "Managers can view org classifications" ON public.ped_classifications;
DROP POLICY IF EXISTS "Admins can view org profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all org roles" ON public.user_roles;

CREATE POLICY "Org members can view their organization"
ON public.organizations
FOR SELECT
TO authenticated
USING (id = private.get_user_org_id(auth.uid()));

CREATE POLICY "Admins can update their organization"
ON public.organizations
FOR UPDATE
TO authenticated
USING ((id = private.get_user_org_id(auth.uid())) AND private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Users can insert own classifications"
ON public.ped_classifications
FOR INSERT
TO authenticated
WITH CHECK ((user_id = auth.uid()) AND (org_id = private.get_user_org_id(auth.uid())));

CREATE POLICY "Admins can view all org classifications"
ON public.ped_classifications
FOR SELECT
TO authenticated
USING ((org_id = private.get_user_org_id(auth.uid())) AND private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Managers can view org classifications"
ON public.ped_classifications
FOR SELECT
TO authenticated
USING ((org_id = private.get_user_org_id(auth.uid())) AND private.has_role(auth.uid(), 'manager'::public.app_role));

CREATE POLICY "Admins can view org profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING ((org_id = private.get_user_org_id(auth.uid())) AND private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK ((user_id = auth.uid()) AND (org_id = private.get_user_org_id(auth.uid())));

CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can view all org roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  private.has_role(auth.uid(), 'admin'::public.app_role)
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = user_roles.user_id
      AND p.org_id = private.get_user_org_id(auth.uid())
  )
);

REVOKE EXECUTE ON FUNCTION public.get_user_org_id(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;