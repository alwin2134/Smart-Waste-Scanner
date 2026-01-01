import { Lock, Info } from 'lucide-react';
import { Badge as BadgeType } from '@/hooks/useProfile';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface BadgesGridProps {
  allBadges: BadgeType[];
  earnedBadges: BadgeType[];
}

function getBadgeRequirement(badge: BadgeType): string {
  if (badge.scans_required === 1) {
    return "Complete your first waste scan";
  }
  if (badge.scans_required) {
    return `Complete ${badge.scans_required} scans`;
  }
  if (badge.points_required) {
    return `Earn ${badge.points_required} eco points`;
  }
  if (badge.category_required) {
    const categoryNames: Record<string, string> = {
      wet_organic: 'organic waste',
      dry_recyclable: 'recyclable items',
      hazardous: 'hazardous waste',
      e_waste: 'electronic waste',
      reject_sanitary: 'sanitary waste',
    };
    return `Scan ${categoryNames[badge.category_required] || badge.category_required}`;
  }
  return badge.description;
}

export function BadgesGrid({ allBadges, earnedBadges }: BadgesGridProps) {
  const earnedIds = new Set(earnedBadges.map(b => b.id));

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Badges & Achievements</h3>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Info className="w-3 h-3" />
            <span>Tap badge for details</span>
          </div>
        </div>
        
        {/* Earned badges */}
        {earnedBadges.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Earned ({earnedBadges.length}/{allBadges.length})
            </p>
            <div className="grid grid-cols-4 gap-3">
              {earnedBadges.map((badge) => (
                <Tooltip key={badge.id}>
                  <TooltipTrigger asChild>
                    <div className="flex flex-col items-center p-3 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl border border-primary/20 cursor-pointer transition-all hover:scale-105 hover:shadow-lg">
                      <span className="text-2xl mb-1 animate-bounce-gentle">{badge.icon}</span>
                      <span className="text-xs text-center font-medium line-clamp-2">
                        {badge.name}
                      </span>
                      {badge.earned_at && (
                        <span className="text-[10px] text-primary mt-1">
                          ✓ Earned
                        </span>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[200px]">
                    <div className="text-center">
                      <p className="font-semibold">{badge.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {badge.description}
                      </p>
                      {badge.earned_at && (
                        <p className="text-xs text-primary mt-2">
                          Earned on {new Date(badge.earned_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>
        )}

        {/* Locked badges */}
        {allBadges.length > earnedBadges.length && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Locked ({allBadges.length - earnedBadges.length})
            </p>
            <div className="grid grid-cols-4 gap-3">
              {allBadges
                .filter((badge) => !earnedIds.has(badge.id))
                .map((badge) => (
                  <Tooltip key={badge.id}>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          "flex flex-col items-center p-3 bg-muted/50 rounded-xl relative cursor-pointer",
                          "opacity-60 hover:opacity-80 transition-all hover:scale-105"
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
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[200px]">
                      <div className="text-center">
                        <p className="font-semibold">{badge.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {badge.description}
                        </p>
                        <div className="mt-2 pt-2 border-t border-border">
                          <p className="text-xs font-medium text-primary">
                            How to unlock:
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {getBadgeRequirement(badge)}
                          </p>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                ))}
            </div>
          </div>
        )}

        {allBadges.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <p>No badges available yet</p>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
