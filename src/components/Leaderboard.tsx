import { useEffect, useState } from 'react';
import { Trophy, Medal, Crown, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface LeaderboardEntry {
  id: string;
  user_id: string;
  display_name: string | null;
  eco_points: number;
  level: number;
  total_scans: number;
}

export function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState<number | null>(null);
  const { user } = useAuth();
  const isGuest = user?.is_anonymous;

  useEffect(() => {
    fetchLeaderboard();
  }, [user]);

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, display_name, eco_points, level, total_scans')
        .order('eco_points', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Filter out anonymous users from the leaderboard
      const filteredData = data?.filter(entry => entry.display_name !== null) || [];
      setLeaderboard(filteredData);

      // Find current user's rank
      if (user && !user.is_anonymous) {
        const rank = filteredData.findIndex(entry => entry.user_id === user.id);
        setUserRank(rank !== -1 ? rank + 1 : null);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Medal className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">{rank}</span>;
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/10 border-yellow-500/30';
      case 2:
        return 'bg-gradient-to-r from-gray-400/20 to-gray-500/10 border-gray-400/30';
      case 3:
        return 'bg-gradient-to-r from-amber-600/20 to-amber-700/10 border-amber-600/30';
      default:
        return 'bg-card border-border';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-6">
          <Trophy className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold">Leaderboard</h2>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-muted/50 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (isGuest) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-6">
          <Trophy className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold">Leaderboard</h2>
        </div>
        
        <div className="bg-card rounded-2xl shadow-elevated p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <Trophy className="w-8 h-8 text-primary" />
          </div>
          <h3 className="font-semibold mb-2">Create an Account to Compete!</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Link your guest progress to a full account to appear on the leaderboard and compete with other eco warriors.
          </p>
        </div>

        {/* Still show the leaderboard for guests to see */}
        <div className="space-y-3 mt-6 opacity-75">
          {leaderboard.slice(0, 5).map((entry, index) => (
            <div
              key={entry.id}
              className={cn(
                'flex items-center gap-3 p-3 rounded-xl border transition-all',
                getRankStyle(index + 1)
              )}
            >
              <div className="w-8 h-8 flex items-center justify-center">
                {getRankIcon(index + 1)}
              </div>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{entry.display_name || 'Anonymous'}</p>
                <p className="text-xs text-muted-foreground">Level {entry.level}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-primary">{entry.eco_points}</p>
                <p className="text-xs text-muted-foreground">points</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Trophy className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold">Leaderboard</h2>
        </div>
        {userRank && (
          <div className="px-3 py-1 bg-primary/10 rounded-full">
            <span className="text-sm font-medium text-primary">Your Rank: #{userRank}</span>
          </div>
        )}
      </div>

      {leaderboard.length === 0 ? (
        <div className="bg-card rounded-2xl shadow-elevated p-6 text-center">
          <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No entries yet. Start scanning to be the first!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leaderboard.map((entry, index) => {
            const isCurrentUser = user?.id === entry.user_id;
            const rank = index + 1;

            return (
              <div
                key={entry.id}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-xl border transition-all',
                  getRankStyle(rank),
                  isCurrentUser && 'ring-2 ring-primary ring-offset-2'
                )}
              >
                <div className="w-8 h-8 flex items-center justify-center">
                  {getRankIcon(rank)}
                </div>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {entry.display_name || 'Eco Warrior'}
                    {isCurrentUser && <span className="text-primary ml-1">(You)</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Level {entry.level} • {entry.total_scans} scans
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">{entry.eco_points}</p>
                  <p className="text-xs text-muted-foreground">points</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
