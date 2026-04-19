-- Activity type enum
CREATE TYPE public.activity_type AS ENUM (
  'walk', 'run', 'gym', 'swim', 'cycle', 'yoga', 'hiit', 'sport', 'other'
);

CREATE TABLE public.activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  activity_type public.activity_type NOT NULL DEFAULT 'walk',
  label text,
  duration_min integer NOT NULL DEFAULT 0,
  calories_burned numeric NOT NULL DEFAULT 0,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_activities_user_date ON public.activities(user_id, date DESC);

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own activities"
ON public.activities
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Coach views client activities"
ON public.activities
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.profiles p
  WHERE p.id = activities.user_id AND p.coach_id = auth.uid()
));