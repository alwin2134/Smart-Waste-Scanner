import { User, Flame, Star, LogOut, Link2, TrendingUp, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Profile } from '@/hooks/useProfile';
import { Progress } from '@/components/ui/progress';

interface ProfileHeaderProps {
  profile: Profile | null;
  isGuest?: boolean;
  onLinkAccount?: () => void;
}

export function ProfileHeader({ profile, isGuest, onLinkAccount }: ProfileHeaderProps) {
  const { user, signOut } = useAuth();

  if (!profile) return null;

  const progressToNextLevel = (profile.eco_points % 100);
  const pointsNeeded = 100 - progressToNextLevel;
  const currentLevelPoints = (profile.level - 1) * 100;
  const nextLevelPoints = profile.level * 100;

  // Calculate streak status
  const getStreakStatus = () => {
    if (profile.streak_days === 0) {
      return { text: 'Start scanning!', color: 'text-muted-foreground' };
    } else if (profile.streak_days >= 7) {
      return { text: 'On fire! 🔥', color: 'text-bin-red' };
    } else if (profile.streak_days >= 3) {
      return { text: 'Great streak!', color: 'text-primary' };
    }
    return { text: 'Keep going!', color: 'text-muted-foreground' };
  };

  const streakStatus = getStreakStatus();

  return (
    <div className="bg-card rounded-2xl shadow-elevated overflow-hidden">
      {/* Level header */}
      <div className="gradient-eco p-4 text-primary-foreground">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary-foreground/20 flex items-center justify-center">
              <User className="w-6 h-6" />
            </div>
            <div>
              <p className="font-semibold">
                {isGuest ? 'Guest User' : (profile.display_name || 'Eco Warrior')}
              </p>
              <p className="text-sm opacity-90">
                {isGuest ? 'Playing as guest' : user?.email}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={signOut}
            className="text-primary-foreground hover:bg-primary-foreground/20"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Guest banner */}
      {isGuest && onLinkAccount && (
        <div className="p-3 bg-accent/50 border-b border-border">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Save your progress!</p>
              <p className="text-xs text-muted-foreground truncate">
                Create an account to keep your points & badges
              </p>
            </div>
            <Button
              size="sm"
              onClick={onLinkAccount}
              className="shrink-0 rounded-full gradient-eco"
            >
              <Link2 className="w-4 h-4 mr-1" />
              Link
            </Button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="p-4 space-y-4">
        {/* Level progress card */}
        <div className="bg-gradient-to-br from-accent/80 to-accent/40 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Star className="w-5 h-5 text-primary fill-primary" />
              </div>
              <div>
                <p className="font-bold text-lg">Level {profile.level}</p>
                <p className="text-xs text-muted-foreground">Eco Warrior</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-primary">
                <TrendingUp className="w-4 h-4" />
                <span className="font-semibold">{profile.eco_points}</span>
              </div>
              <p className="text-xs text-muted-foreground">total points</p>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Level {profile.level}</span>
              <span className="font-medium text-primary">
                {progressToNextLevel}/100 pts
              </span>
              <span className="text-muted-foreground">Level {profile.level + 1}</span>
            </div>
            <div className="relative">
              <Progress 
                value={progressToNextLevel} 
                className="h-3 bg-background/50"
              />
              <div 
                className="absolute top-0 left-0 h-3 rounded-full gradient-eco transition-all duration-500"
                style={{ width: `${progressToNextLevel}%` }}
              />
            </div>
            <p className="text-center text-xs text-muted-foreground">
              <Target className="w-3 h-3 inline mr-1" />
              {pointsNeeded} more points to reach Level {profile.level + 1}
            </p>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-accent/50 rounded-xl">
            <p className="text-2xl font-bold text-primary">{profile.eco_points}</p>
            <p className="text-xs text-muted-foreground">Eco Points</p>
          </div>
          <div className="text-center p-3 bg-accent/50 rounded-xl">
            <p className="text-2xl font-bold text-primary">{profile.total_scans}</p>
            <p className="text-xs text-muted-foreground">Total Scans</p>
          </div>
          <div className="text-center p-3 bg-accent/50 rounded-xl relative overflow-hidden">
            {profile.streak_days > 0 && (
              <div className="absolute inset-0 bg-gradient-to-t from-bin-red/10 to-transparent" />
            )}
            <div className="relative">
              <div className="flex items-center justify-center gap-1">
                <Flame className={`w-5 h-5 ${profile.streak_days > 0 ? 'text-bin-red animate-pulse' : 'text-muted-foreground'}`} />
                <p className="text-2xl font-bold text-primary">{profile.streak_days}</p>
              </div>
              <p className="text-xs text-muted-foreground">Day Streak</p>
              <p className={`text-[10px] ${streakStatus.color} mt-1`}>
                {streakStatus.text}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
