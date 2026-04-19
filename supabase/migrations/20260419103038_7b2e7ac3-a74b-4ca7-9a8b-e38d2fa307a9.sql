
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('user', 'coach', 'admin');
CREATE TYPE public.user_goal AS ENUM ('lose', 'gain', 'maintain');
CREATE TYPE public.user_gender AS ENUM ('male', 'female', 'other');
CREATE TYPE public.user_lang AS ENUM ('ka', 'en');
CREATE TYPE public.meal_type AS ENUM ('breakfast', 'lunch', 'dinner', 'snack');

-- ============ UPDATED_AT TRIGGER FN ============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============ USER_ROLES (separate table, security-definer pattern) ============
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  age INT CHECK (age > 0 AND age < 150),
  gender public.user_gender,
  height_cm NUMERIC(5,2) CHECK (height_cm > 0 AND height_cm < 300),
  goal public.user_goal,
  language public.user_lang NOT NULL DEFAULT 'ka',
  is_coach BOOLEAN NOT NULL DEFAULT false,
  coach_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  onboarded BOOLEAN NOT NULL DEFAULT false,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Coach views linked client profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (coach_id = auth.uid());

CREATE POLICY "Users insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ WEIGHTS ============
CREATE TABLE public.weights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  weight_kg NUMERIC(5,2) NOT NULL CHECK (weight_kg > 0 AND weight_kg < 500),
  target_weight_kg NUMERIC(5,2) CHECK (target_weight_kg > 0 AND target_weight_kg < 500),
  recorded_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.weights ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_weights_user_date ON public.weights(user_id, recorded_at DESC);

CREATE POLICY "Users manage own weights"
  ON public.weights FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Coach views client weights"
  ON public.weights FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = weights.user_id AND p.coach_id = auth.uid()
  ));

-- ============ DAILY_LOGS ============
CREATE TABLE public.daily_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  water_ml INT NOT NULL DEFAULT 0 CHECK (water_ml >= 0),
  steps INT NOT NULL DEFAULT 0 CHECK (steps >= 0),
  calories_goal INT NOT NULL DEFAULT 2000 CHECK (calories_goal > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own daily logs"
  ON public.daily_logs FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Coach views client daily logs"
  ON public.daily_logs FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = daily_logs.user_id AND p.coach_id = auth.uid()
  ));

CREATE TRIGGER daily_logs_updated_at
  BEFORE UPDATE ON public.daily_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ FOODS_GE ============
CREATE TABLE public.foods_ge (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_ka TEXT NOT NULL,
  name_en TEXT NOT NULL,
  brand TEXT,
  category TEXT,
  calories_per_100g NUMERIC(6,2) NOT NULL,
  protein_g NUMERIC(6,2) NOT NULL DEFAULT 0,
  carbs_g NUMERIC(6,2) NOT NULL DEFAULT 0,
  fats_g NUMERIC(6,2) NOT NULL DEFAULT 0,
  serving_size_g NUMERIC(6,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.foods_ge ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_foods_name_ka ON public.foods_ge(name_ka);
CREATE INDEX idx_foods_name_en ON public.foods_ge(name_en);

CREATE POLICY "Anyone authenticated can read foods"
  ON public.foods_ge FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins manage foods"
  ON public.foods_ge FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ MEALS ============
CREATE TABLE public.meals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  food_id UUID REFERENCES public.foods_ge(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  food_name TEXT NOT NULL,
  meal_type public.meal_type NOT NULL DEFAULT 'snack',
  servings NUMERIC(6,2) NOT NULL DEFAULT 1 CHECK (servings > 0),
  calories NUMERIC(7,2) NOT NULL CHECK (calories >= 0),
  protein_g NUMERIC(6,2) NOT NULL DEFAULT 0,
  carbs_g NUMERIC(6,2) NOT NULL DEFAULT 0,
  fats_g NUMERIC(6,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_meals_user_date ON public.meals(user_id, date DESC);

CREATE POLICY "Users manage own meals"
  ON public.meals FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Coach views client meals"
  ON public.meals FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = meals.user_id AND p.coach_id = auth.uid()
  ));

-- ============ COACH_INVITES ============
CREATE TABLE public.coach_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  used_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.coach_invites ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_invites_code ON public.coach_invites(code);

CREATE POLICY "Coaches view own invites"
  ON public.coach_invites FOR SELECT
  TO authenticated
  USING (auth.uid() = coach_id);

CREATE POLICY "Coaches create invites"
  ON public.coach_invites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = coach_id AND public.has_role(auth.uid(), 'coach'));

-- Function for redeeming invite (security definer to allow checking another user's invite)
CREATE OR REPLACE FUNCTION public.redeem_coach_invite(_code TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _invite public.coach_invites%ROWTYPE;
BEGIN
  SELECT * INTO _invite FROM public.coach_invites
  WHERE code = _code AND used_by_user_id IS NULL AND expires_at > now()
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired invite code';
  END IF;

  UPDATE public.coach_invites
  SET used_by_user_id = auth.uid(), used_at = now()
  WHERE id = _invite.id;

  UPDATE public.profiles
  SET coach_id = _invite.coach_id
  WHERE id = auth.uid();

  RETURN _invite.coach_id;
END;
$$;

-- ============ NEW USER TRIGGER ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, language)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    'ka'
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ SEED GEORGIAN FOODS ============
INSERT INTO public.foods_ge (name_ka, name_en, brand, category, calories_per_100g, protein_g, carbs_g, fats_g, serving_size_g) VALUES
('ხინკალი', 'Khinkali', NULL, 'Traditional', 235, 9.5, 25, 10, 50),
('ხაჭაპური აჭარული', 'Adjarian Khachapuri', NULL, 'Traditional', 350, 13, 30, 20, 200),
('ხაჭაპური იმერული', 'Imeretian Khachapuri', NULL, 'Traditional', 310, 12, 32, 15, 150),
('მწვადი', 'Mtsvadi', NULL, 'Traditional', 250, 26, 0, 17, 150),
('ლობიო', 'Lobio', NULL, 'Traditional', 130, 8, 20, 1.5, 200),
('ფხალი', 'Pkhali', NULL, 'Traditional', 180, 6, 10, 14, 100),
('ჩახოხბილი', 'Chakhokhbili', NULL, 'Traditional', 165, 18, 5, 8, 250),
('ჩაქაფული', 'Chakapuli', NULL, 'Traditional', 145, 20, 3, 6, 250),
('საცივი', 'Satsivi', NULL, 'Traditional', 220, 18, 4, 15, 200),
('ბადრიჯანი ნიგვზით', 'Eggplant with walnuts', NULL, 'Traditional', 195, 5, 8, 17, 120),
('ჭვიშტარი', 'Chvishtari', NULL, 'Traditional', 320, 9, 35, 16, 80),
('მჭადი', 'Mchadi', NULL, 'Traditional', 280, 6, 55, 4, 100),
('სულუგუნი', 'Sulguni cheese', NULL, 'Dairy', 290, 18, 2, 24, 50),
('ნადუღი', 'Nadughi', NULL, 'Dairy', 180, 12, 4, 13, 100),
('მაწონი', 'Matsoni', NULL, 'Dairy', 60, 3, 4, 3.5, 150),
('ქართული პური', 'Georgian bread (shoti)', 'Local bakery', 'Bakery', 265, 9, 50, 3, 100),
('ჩურჩხელა', 'Churchkhela', NULL, 'Snack', 410, 5, 70, 13, 40),
('ტყემალი', 'Tkemali sauce', NULL, 'Sauce', 70, 1, 17, 0.2, 30),
('აჯიკა', 'Ajika', NULL, 'Sauce', 75, 2, 12, 2, 20),
('ხორცი', 'Beef (lean)', 'Nikora', 'Meat', 170, 26, 0, 7, 150),
('ქათამი', 'Chicken breast', 'Nikora', 'Meat', 165, 31, 0, 3.6, 150),
('ღორის ხორცი', 'Pork', 'Nikora', 'Meat', 242, 27, 0, 14, 150),
('სოსისი', 'Sausage', 'Nikora', 'Meat', 290, 12, 3, 26, 100),
('კარტოფილი', 'Potato', NULL, 'Vegetable', 77, 2, 17, 0.1, 150),
('ბრინჯი', 'Rice (cooked)', NULL, 'Grain', 130, 2.7, 28, 0.3, 150),
('მაკარონი', 'Pasta (cooked)', NULL, 'Grain', 158, 5.8, 31, 0.9, 150),
('კიტრი', 'Cucumber', NULL, 'Vegetable', 16, 0.7, 3.6, 0.1, 100),
('პომიდორი', 'Tomato', NULL, 'Vegetable', 18, 0.9, 3.9, 0.2, 100),
('ვაშლი', 'Apple', NULL, 'Fruit', 52, 0.3, 14, 0.2, 150),
('ბანანი', 'Banana', NULL, 'Fruit', 89, 1.1, 23, 0.3, 120),
('ფორთოხალი', 'Orange', NULL, 'Fruit', 47, 0.9, 12, 0.1, 130),
('კაკალი', 'Walnuts', NULL, 'Nut', 654, 15, 14, 65, 30),
('თაფლი', 'Honey', 'Sante', 'Sweet', 304, 0.3, 82, 0, 20),
('ყავა', 'Coffee (black)', NULL, 'Drink', 2, 0.3, 0, 0, 200),
('ჩაი', 'Tea (black)', NULL, 'Drink', 1, 0, 0.3, 0, 200),
('ნატახტარი წყალი', 'Natakhtari water', 'Natakhtari', 'Drink', 0, 0, 0, 0, 500),
('ბორჯომი', 'Borjomi mineral water', 'Borjomi', 'Drink', 0, 0, 0, 0, 500),
('კვერცხი', 'Egg', 'Sante', 'Dairy', 155, 13, 1.1, 11, 60),
('რძე', 'Milk', 'Sante', 'Dairy', 61, 3.2, 4.8, 3.3, 200),
('იოგურტი', 'Yogurt', 'Sante', 'Dairy', 59, 10, 3.6, 0.4, 150);
