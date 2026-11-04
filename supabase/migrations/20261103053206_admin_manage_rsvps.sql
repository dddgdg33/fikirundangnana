DROP POLICY IF EXISTS "Admins can read rsvps" ON public.event_rsvps;

CREATE POLICY "Admins can manage rsvps"
ON public.event_rsvps
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
