import { useEffect, useState } from 'react';
import { Trophy, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/hooks/useProfile';

interface NewBadgeModalProps {
  badge: Badge | null;
  onClose: () => void;
}

export function NewBadgeModal({ badge, onClose }: NewBadgeModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (badge) {
      setIsVisible(true);
    }
  }, [badge]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  if (!badge) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-6 transition-all duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-foreground/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className={`relative bg-card rounded-3xl p-8 max-w-xs w-full text-center shadow-elevated transform transition-all duration-300 ${
        isVisible ? 'scale-100' : 'scale-90'
      }`}>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="absolute top-4 right-4"
        >
          <X className="w-5 h-5" />
        </Button>

        {/* Celebration icon */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 rounded-full gradient-eco opacity-20 animate-pulse-soft" />
          </div>
          <div className="relative w-24 h-24 mx-auto rounded-full gradient-eco flex items-center justify-center shadow-glow animate-float">
            <span className="text-5xl">{badge.icon}</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mb-2 text-primary">
          <Trophy className="w-5 h-5" />
          <span className="text-sm font-semibold uppercase tracking-wide">New Badge!</span>
        </div>

        <h2 className="text-2xl font-bold mb-2">{badge.name}</h2>
        <p className="text-muted-foreground mb-6">{badge.description}</p>

        <Button
          onClick={handleClose}
          className="w-full rounded-full gradient-eco shadow-soft hover:shadow-glow"
        >
          Awesome!
        </Button>
      </div>
    </div>
  );
}
