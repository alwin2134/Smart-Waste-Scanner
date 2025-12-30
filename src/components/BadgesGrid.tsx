import { Lock } from 'lucide-react';
import { Badge as BadgeType } from '@/hooks/useProfile';
import { cn } from '@/lib/utils';

interface BadgesGridProps {
  allBadges: BadgeType[];
  earnedBadges: BadgeType[];
}

export function BadgesGrid({ allBadges, earnedBadges }: BadgesGridProps) {
  const earnedIds = new Set(earnedBadges.map(b => b.id));

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Badges & Achievements</h3>
      
      {/* Earned badges */}
      {earnedBadges.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Earned ({earnedBadges.length})</p>
          <div className="grid grid-cols-4 gap-3">
            {earnedBadges.map((badge) => (
              <div
                key={badge.id}
                className="flex flex-col items-center p-3 bg-accent rounded-xl"
              >
                <span className="text-2xl mb-1">{badge.icon}</span>
                <span className="text-xs text-center font-medium line-clamp-2">
                  {badge.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Locked badges */}
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Locked ({allBadges.length - earnedBadges.length})
        </p>
        <div className="grid grid-cols-4 gap-3">
          {allBadges
            .filter((badge) => !earnedIds.has(badge.id))
            .map((badge) => (
              <div
                key={badge.id}
                className={cn(
                  "flex flex-col items-center p-3 bg-muted/50 rounded-xl relative",
                  "opacity-60"
                )}
              >
                <div className="absolute top-1 right-1">
                  <Lock className="w-3 h-3 text-muted-foreground" />
                </div>
                <span className="text-2xl mb-1 grayscale">{badge.icon}</span>
                <span className="text-xs text-center text-muted-foreground line-clamp-2">
                  {badge.name}
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
