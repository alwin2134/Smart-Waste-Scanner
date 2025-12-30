-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('user', 'admin');

-- Create profiles table for user data and eco points
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  eco_points INTEGER DEFAULT 0 NOT NULL,
  total_scans INTEGER DEFAULT 0 NOT NULL,
  streak_days INTEGER DEFAULT 0 NOT NULL,
  last_scan_date DATE,
  level INTEGER DEFAULT 1 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create user_roles table for role management
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);

-- Create scan_history table
CREATE TABLE public.scan_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  item_name TEXT NOT NULL,
  category TEXT NOT NULL,
  bin_color TEXT NOT NULL,
  bin_type TEXT NOT NULL,
  disposal_tip TEXT,
  confidence DECIMAL(3,2) NOT NULL,
  points_earned INTEGER DEFAULT 0 NOT NULL,
  image_url TEXT,
  scanned_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create badges table
CREATE TABLE public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  points_required INTEGER,
  scans_required INTEGER,
  category_required TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create user_badges junction table
CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  badge_id UUID REFERENCES public.badges(id) ON DELETE CASCADE NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, badge_id)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
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

-- Profiles policies
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- User roles policies
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

-- Scan history policies
CREATE POLICY "Users can view their own scan history"
ON public.scan_history FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scans"
ON public.scan_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Badges policies (public read)
CREATE POLICY "Anyone can view badges"
ON public.badges FOR SELECT
USING (true);

-- User badges policies
CREATE POLICY "Users can view their own badges"
ON public.user_badges FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can earn badges"
ON public.user_badges FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'display_name');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update eco points and check for new badges
CREATE OR REPLACE FUNCTION public.add_scan_points(
  p_user_id UUID,
  p_points INTEGER,
  p_category TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_new_points INTEGER;
  v_new_total_scans INTEGER;
  v_new_level INTEGER;
  v_streak INTEGER;
  v_last_scan DATE;
  v_new_badges UUID[];
BEGIN
  -- Get current profile data
  SELECT eco_points, total_scans, streak_days, last_scan_date
  INTO v_new_points, v_new_total_scans, v_streak, v_last_scan
  FROM profiles WHERE user_id = p_user_id;
  
  -- Calculate new values
  v_new_points := v_new_points + p_points;
  v_new_total_scans := v_new_total_scans + 1;
  
  -- Update streak
  IF v_last_scan IS NULL OR v_last_scan < CURRENT_DATE - INTERVAL '1 day' THEN
    v_streak := 1;
  ELSIF v_last_scan = CURRENT_DATE - INTERVAL '1 day' THEN
    v_streak := v_streak + 1;
  END IF;
  
  -- Calculate level (every 100 points = 1 level)
  v_new_level := GREATEST(1, (v_new_points / 100) + 1);
  
  -- Update profile
  UPDATE profiles SET
    eco_points = v_new_points,
    total_scans = v_new_total_scans,
    streak_days = v_streak,
    last_scan_date = CURRENT_DATE,
    level = v_new_level,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Check for new badges
  INSERT INTO user_badges (user_id, badge_id)
  SELECT p_user_id, b.id
  FROM badges b
  WHERE (b.points_required IS NOT NULL AND v_new_points >= b.points_required)
     OR (b.scans_required IS NOT NULL AND v_new_total_scans >= b.scans_required)
     OR (b.category_required IS NOT NULL AND b.category_required = p_category)
  ON CONFLICT (user_id, badge_id) DO NOTHING
  RETURNING badge_id INTO v_new_badges;
  
  RETURN json_build_object(
    'points', v_new_points,
    'level', v_new_level,
    'streak', v_streak,
    'total_scans', v_new_total_scans,
    'new_badges', COALESCE(v_new_badges, ARRAY[]::UUID[])
  );
END;
$$;

-- Insert default badges
INSERT INTO public.badges (name, description, icon, points_required, scans_required, category_required) VALUES
  ('First Scan', 'Complete your first waste scan', '🌱', NULL, 1, NULL),
  ('Eco Starter', 'Earn 50 eco points', '🌿', 50, NULL, NULL),
  ('Green Guardian', 'Earn 200 eco points', '🌳', 200, NULL, NULL),
  ('Planet Protector', 'Earn 500 eco points', '🌍', 500, NULL, NULL),
  ('Scan Master', 'Complete 25 scans', '📸', NULL, 25, NULL),
  ('Scan Champion', 'Complete 100 scans', '🏆', NULL, 100, NULL),
  ('Organic Hero', 'Scan organic waste', '🥬', NULL, NULL, 'wet_organic'),
  ('Recycle Pro', 'Scan recyclable waste', '♻️', NULL, NULL, 'dry_recyclable'),
  ('E-Waste Expert', 'Scan electronic waste', '🔌', NULL, NULL, 'e_waste'),
  ('Hazard Handler', 'Safely dispose hazardous waste', '☢️', NULL, NULL, 'hazardous'),
  ('Week Warrior', 'Maintain a 7-day streak', '🔥', NULL, NULL, NULL);

-- Create index for faster queries
CREATE INDEX idx_scan_history_user_id ON public.scan_history(user_id);
CREATE INDEX idx_scan_history_scanned_at ON public.scan_history(scanned_at DESC);
CREATE INDEX idx_user_badges_user_id ON public.user_badges(user_id);