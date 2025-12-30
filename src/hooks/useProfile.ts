import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  eco_points: number;
  total_scans: number;
  streak_days: number;
  last_scan_date: string | null;
  level: number;
  created_at: string;
  updated_at: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  points_required: number | null;
  scans_required: number | null;
  category_required: string | null;
  earned_at?: string;
}

export interface ScanHistoryItem {
  id: string;
  item_name: string;
  category: string;
  bin_color: string;
  bin_type: string;
  disposal_tip: string | null;
  confidence: number;
  points_earned: number;
  scanned_at: string;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [earnedBadges, setEarnedBadges] = useState<Badge[]>([]);
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchBadges = async () => {
    if (!user) return;

    try {
      // Fetch all badges
      const { data: allBadges, error: badgesError } = await supabase
        .from('badges')
        .select('*')
        .order('points_required', { ascending: true, nullsFirst: true });

      if (badgesError) throw badgesError;
      setBadges(allBadges || []);

      // Fetch user's earned badges
      const { data: userBadges, error: userBadgesError } = await supabase
        .from('user_badges')
        .select('badge_id, earned_at, badges(*)')
        .eq('user_id', user.id);

      if (userBadgesError) throw userBadgesError;

      const earned = userBadges?.map((ub: any) => ({
        ...ub.badges,
        earned_at: ub.earned_at,
      })) || [];
      
      setEarnedBadges(earned);
    } catch (error) {
      console.error('Error fetching badges:', error);
    }
  };

  const fetchScanHistory = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('scan_history')
        .select('*')
        .eq('user_id', user.id)
        .order('scanned_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setScanHistory(data || []);
    } catch (error) {
      console.error('Error fetching scan history:', error);
    }
  };

  const refreshData = async () => {
    setLoading(true);
    await Promise.all([fetchProfile(), fetchBadges(), fetchScanHistory()]);
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      refreshData();
    } else {
      setProfile(null);
      setBadges([]);
      setEarnedBadges([]);
      setScanHistory([]);
      setLoading(false);
    }
  }, [user]);

  return {
    profile,
    badges,
    earnedBadges,
    scanHistory,
    loading,
    refreshData,
  };
}
