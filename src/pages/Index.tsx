import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, Recycle, Trash2, AlertTriangle, Cpu } from 'lucide-react';
import { CameraCapture } from '@/components/CameraCapture';
import { WasteResult } from '@/components/WasteResult';
import { ProfileHeader } from '@/components/ProfileHeader';
import { BadgesGrid } from '@/components/BadgesGrid';
import { ScanHistoryList } from '@/components/ScanHistoryList';
import { BottomNav, TabType } from '@/components/BottomNav';
import { NewBadgeModal } from '@/components/NewBadgeModal';
import { Leaderboard } from '@/components/Leaderboard';
import { LinkAccountModal } from '@/components/LinkAccountModal';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile, Badge } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';

interface AnalysisResult {
  itemName: string;
  category: string;
  binColor: string;
  binType: string;
  disposalTip: string;
  confidence: number;
  pointsEarned?: number;
  newBadges?: string[];
}

export default function Index() {
  const [activeTab, setActiveTab] = useState<TabType>('scan');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [newBadge, setNewBadge] = useState<Badge | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { profile, badges, earnedBadges, scanHistory, refreshData } = useProfile();
  
  const isGuest = user?.is_anonymous;

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const handleCapture = async (imageBase64: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-waste', {
        body: { imageBase64, userId: user?.id }
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setResult(data);

      // Show points earned toast
      if (data.pointsEarned && data.pointsEarned > 0) {
        toast({
          title: `+${data.pointsEarned} Eco Points!`,
          description: 'Great job sorting that waste correctly!',
        });
      }

      // Check for new badges
      if (data.newBadges && data.newBadges.length > 0) {
        const earnedBadge = badges.find(b => data.newBadges.includes(b.id));
        if (earnedBadge) {
          setTimeout(() => setNewBadge(earnedBadge), 1500);
        }
      }

      // Refresh profile data
      await refreshData();

    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: 'Analysis Failed',
        description: error instanceof Error ? error.message : 'Could not analyze the image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'scan':
        return result ? (
          <WasteResult result={result} onReset={handleReset} />
        ) : (
          <div className="space-y-8">
            {/* Quick stats */}
            {profile && (
              <div className="flex items-center justify-center gap-6 text-center">
                <div>
                  <p className="text-2xl font-bold text-primary">{profile.eco_points}</p>
                  <p className="text-xs text-muted-foreground">Points</p>
                </div>
                <div className="h-8 w-px bg-border" />
                <div>
                  <p className="text-2xl font-bold text-primary">Lv.{profile.level}</p>
                  <p className="text-xs text-muted-foreground">Level</p>
                </div>
                <div className="h-8 w-px bg-border" />
                <div>
                  <p className="text-2xl font-bold text-primary">🔥{profile.streak_days}</p>
                  <p className="text-xs text-muted-foreground">Streak</p>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold">
                {isLoading ? 'Analyzing...' : 'What would you like to dispose?'}
              </h2>
              <p className="text-muted-foreground text-sm">
                Point your camera at any waste item to earn eco points!
              </p>
            </div>

            {/* Camera/Upload area */}
            <CameraCapture onCapture={handleCapture} isLoading={isLoading} />

            {/* Bin guide */}
            <div className="space-y-4">
              <h3 className="font-semibold text-center text-sm text-muted-foreground">
                Bin Guide
              </h3>
              <div className="grid grid-cols-5 gap-2">
                <BinGuideItem icon={<Leaf className="w-4 h-4" />} color="green" label="Organic" points={10} />
                <BinGuideItem icon={<Recycle className="w-4 h-4" />} color="blue" label="Recycle" points={15} />
                <BinGuideItem icon={<AlertTriangle className="w-4 h-4" />} color="red" label="Hazard" points={20} />
                <BinGuideItem icon={<Cpu className="w-4 h-4" />} color="black" label="E-Waste" points={25} />
                <BinGuideItem icon={<Trash2 className="w-4 h-4" />} color="yellow" label="Sanitary" points={10} />
              </div>
            </div>
          </div>
        );

      case 'history':
        return <ScanHistoryList history={scanHistory} />;

      case 'leaderboard':
        return <Leaderboard />;

      case 'badges':
        return <BadgesGrid allBadges={badges} earnedBadges={earnedBadges} />;

      case 'profile':
        return (
          <div className="space-y-6">
            <ProfileHeader 
              profile={profile} 
              isGuest={isGuest} 
              onLinkAccount={() => setShowLinkModal(true)} 
            />
            {earnedBadges.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold">Your Badges</h3>
                <div className="flex flex-wrap gap-2">
                  {earnedBadges.slice(0, 8).map((badge) => (
                    <div
                      key={badge.id}
                      className="px-3 py-1.5 bg-accent rounded-full text-sm flex items-center gap-1.5"
                    >
                      <span>{badge.icon}</span>
                      <span>{badge.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen gradient-hero pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container py-4">
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-eco flex items-center justify-center shadow-soft">
              <Recycle className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">Smart Waste Scanner</h1>
              <p className="text-xs text-muted-foreground">Scan • Sort • Earn Rewards</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container py-6">
        {renderContent()}
      </main>

      {/* Bottom navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* New badge modal */}
      <NewBadgeModal badge={newBadge} onClose={() => setNewBadge(null)} />

      {/* Link account modal for guests */}
      <LinkAccountModal 
        isOpen={showLinkModal} 
        onClose={() => setShowLinkModal(false)}
        onSuccess={refreshData}
      />
    </div>
  );
}

function BinGuideItem({ 
  icon, 
  color, 
  label,
  points 
}: { 
  icon: React.ReactNode; 
  color: string; 
  label: string;
  points: number;
}) {
  const colorMap: Record<string, string> = {
    green: 'bg-bin-green',
    blue: 'bg-bin-blue',
    red: 'bg-bin-red',
    black: 'bg-bin-black',
    yellow: 'bg-bin-yellow',
  };

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className={`w-10 h-10 rounded-xl ${colorMap[color]} flex items-center justify-center text-card shadow-sm`}>
        {icon}
      </div>
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
      <span className="text-xs text-primary font-semibold">+{points}</span>
    </div>
  );
}
