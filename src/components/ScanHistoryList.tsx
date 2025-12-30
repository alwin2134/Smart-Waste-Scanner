import { Clock, Star } from 'lucide-react';
import { ScanHistoryItem } from '@/hooks/useProfile';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface ScanHistoryListProps {
  history: ScanHistoryItem[];
}

const binColorClasses: Record<string, string> = {
  green: 'bg-bin-green',
  blue: 'bg-bin-blue',
  red: 'bg-bin-red',
  black: 'bg-bin-black',
  yellow: 'bg-bin-yellow',
  gray: 'bg-bin-gray',
};

export function ScanHistoryList({ history }: ScanHistoryListProps) {
  if (history.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
          <Clock className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold mb-1">No scans yet</h3>
        <p className="text-sm text-muted-foreground">
          Start scanning waste to build your history!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Recent Scans</h3>
      
      <div className="space-y-3">
        {history.map((item) => (
          <div
            key={item.id}
            className="bg-card rounded-xl p-4 shadow-soft flex items-center gap-4"
          >
            {/* Bin color indicator */}
            <div
              className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center text-card text-xl flex-shrink-0',
                binColorClasses[item.bin_color] || 'bg-bin-gray'
              )}
            >
              {item.category === 'wet_organic' && '🌱'}
              {item.category === 'dry_recyclable' && '♻️'}
              {item.category === 'hazardous' && '⚠️'}
              {item.category === 'e_waste' && '🔌'}
              {item.category === 'reject_sanitary' && '🗑️'}
              {item.category === 'unknown' && '❓'}
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold capitalize truncate">{item.item_name}</p>
              <p className="text-sm text-muted-foreground capitalize">
                {item.bin_type}
              </p>
            </div>

            {/* Points & time */}
            <div className="text-right flex-shrink-0">
              <div className="flex items-center gap-1 text-primary font-semibold">
                <Star className="w-4 h-4" />
                <span>+{item.points_earned}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(item.scanned_at), { addSuffix: true })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
