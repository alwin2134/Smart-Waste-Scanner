import { Camera, History, Award, User, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TabType = 'scan' | 'history' | 'badges' | 'leaderboard' | 'profile';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const tabs = [
  { id: 'scan' as TabType, icon: Camera, label: 'Scan' },
  { id: 'history' as TabType, icon: History, label: 'History' },
  { id: 'leaderboard' as TabType, icon: Trophy, label: 'Rank' },
  { id: 'badges' as TabType, icon: Award, label: 'Badges' },
  { id: 'profile' as TabType, icon: User, label: 'Profile' },
];

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-card/95 backdrop-blur-md border-t border-border safe-area-pb">
      <div className="container">
        <div className="flex items-center justify-around py-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  'flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all',
                  isActive 
                    ? 'text-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <div className={cn(
                  'p-2 rounded-xl transition-all',
                  isActive && 'bg-primary/10'
                )}>
                  <Icon className={cn('w-5 h-5', isActive && 'text-primary')} />
                </div>
                <span className="text-xs font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
