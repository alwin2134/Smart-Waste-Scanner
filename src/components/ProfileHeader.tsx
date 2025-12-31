import { User, Flame, Star, LogOut, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Profile } from '@/hooks/useProfile';

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
      <div className="p-4">
        {/* Level progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-primary" />
              <span className="font-semibold">Level {profile.level}</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {pointsNeeded} pts to next level
            </span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full gradient-eco rounded-full transition-all duration-500"
              style={{ width: `${progressToNextLevel}%` }}
            />
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
          <div className="text-center p-3 bg-accent/50 rounded-xl">
            <div className="flex items-center justify-center gap-1">
              <Flame className="w-5 h-5 text-bin-red" />
              <p className="text-2xl font-bold text-primary">{profile.streak_days}</p>
            </div>
            <p className="text-xs text-muted-foreground">Day Streak</p>
          </div>
        </div>
      </div>
    </div>
  );
}
