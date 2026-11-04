ALTER TABLE public.event_templates
ADD COLUMN IF NOT EXISTS demo_data jsonb NOT NULL DEFAULT '{}'::jsonb;
