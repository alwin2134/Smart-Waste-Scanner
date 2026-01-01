-- Fix the add_scan_points function to handle edge cases better
CREATE OR REPLACE FUNCTION public.add_scan_points(p_user_id uuid, p_points integer, p_category text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_exists BOOLEAN;
  v_current_points INTEGER;
  v_current_scans INTEGER;
  v_new_points INTEGER;
  v_new_total_scans INTEGER;
  v_new_level INTEGER;
  v_streak INTEGER;
  v_last_scan DATE;
  v_new_badges UUID[] := ARRAY[]::UUID[];
BEGIN
  -- Check if profile exists
  SELECT EXISTS(SELECT 1 FROM profiles WHERE user_id = p_user_id) INTO v_profile_exists;
  
  IF NOT v_profile_exists THEN
    RAISE NOTICE 'Profile not found for user %', p_user_id;
    RETURN json_build_object(
      'error', 'Profile not found',
      'points', 0,
      'level', 1,
      'streak', 0,
      'total_scans', 0,
      'new_badges', ARRAY[]::UUID[]
    );
  END IF;

  -- Get current profile data
  SELECT eco_points, total_scans, streak_days, last_scan_date
  INTO v_current_points, v_current_scans, v_streak, v_last_scan
  FROM profiles WHERE user_id = p_user_id;
  
  -- Calculate new values
  v_new_points := COALESCE(v_current_points, 0) + p_points;
  v_new_total_scans := COALESCE(v_current_scans, 0) + 1;
  
  -- Update streak
  IF v_last_scan IS NULL OR v_last_scan < CURRENT_DATE - INTERVAL '1 day' THEN
    v_streak := 1;
  ELSIF v_last_scan = CURRENT_DATE - INTERVAL '1 day' THEN
    v_streak := COALESCE(v_streak, 0) + 1;
  ELSIF v_last_scan = CURRENT_DATE THEN
    -- Same day, don't change streak
    v_streak := COALESCE(v_streak, 1);
  ELSE
    v_streak := COALESCE(v_streak, 1);
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
  
  -- Check for new badges and collect them
  WITH inserted_badges AS (
    INSERT INTO user_badges (user_id, badge_id)
    SELECT p_user_id, b.id
    FROM badges b
    WHERE (b.points_required IS NOT NULL AND v_new_points >= b.points_required)
       OR (b.scans_required IS NOT NULL AND v_new_total_scans >= b.scans_required)
       OR (b.category_required IS NOT NULL AND b.category_required = p_category)
    ON CONFLICT (user_id, badge_id) DO NOTHING
    RETURNING badge_id
  )
  SELECT ARRAY_AGG(badge_id) INTO v_new_badges FROM inserted_badges;
  
  RETURN json_build_object(
    'points', v_new_points,
    'level', v_new_level,
    'streak', v_streak,
    'total_scans', v_new_total_scans,
    'new_badges', COALESCE(v_new_badges, ARRAY[]::UUID[])
  );
END;
$$;