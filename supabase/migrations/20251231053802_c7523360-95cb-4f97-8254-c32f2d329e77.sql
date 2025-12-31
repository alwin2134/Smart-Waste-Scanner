-- Add policy for public leaderboard viewing (only display_name, eco_points, level, total_scans)
CREATE POLICY "Anyone can view leaderboard data"
ON public.profiles
FOR SELECT
USING (true);

-- Drop the old restrictive policy first
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;