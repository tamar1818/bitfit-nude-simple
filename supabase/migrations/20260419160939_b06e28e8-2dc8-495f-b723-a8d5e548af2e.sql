DO $$ BEGIN
  CREATE TYPE public.activity_level AS ENUM ('sedentary','light','moderate','active','extra');
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS activity_level public.activity_level;