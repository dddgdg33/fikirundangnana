DROP POLICY IF EXISTS "Admins can manage templates" ON public.event_templates;
CREATE POLICY "Admins can manage templates"
ON public.event_templates
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.admin_profiles
    WHERE user_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.admin_profiles
    WHERE user_id = (SELECT auth.uid())
  )
);
