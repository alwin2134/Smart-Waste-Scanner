import { useState } from 'react';
import { Leaf, Recycle, Trash2, AlertTriangle, Cpu } from 'lucide-react';
import { CameraCapture } from '@/components/CameraCapture';
import { WasteResult } from '@/components/WasteResult';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AnalysisResult {
  itemName: string;
  category: string;
  binColor: string;
  binType: string;
  disposalTip: string;
  confidence: number;
}

export default function Index() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const { toast } = useToast();

  const handleCapture = async (imageBase64: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-waste', {
        body: { imageBase64 }
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setResult(data);
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

  return (
    <div className="min-h-screen gradient-hero">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container py-4">
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-eco flex items-center justify-center shadow-soft">
              <Recycle className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">Smart Waste Scanner</h1>
              <p className="text-xs text-muted-foreground">Scan • Sort • Save the Planet</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container py-6 pb-24">
        {result ? (
          <WasteResult result={result} onReset={handleReset} />
        ) : (
          <div className="space-y-8">
            {/* Instructions */}
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold">
                {isLoading ? 'Analyzing...' : 'What would you like to dispose?'}
              </h2>
              <p className="text-muted-foreground text-sm">
                Point your camera at any waste item to identify the correct bin
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
                <BinGuideItem icon={<Leaf className="w-4 h-4" />} color="green" label="Organic" />
                <BinGuideItem icon={<Recycle className="w-4 h-4" />} color="blue" label="Recycle" />
                <BinGuideItem icon={<AlertTriangle className="w-4 h-4" />} color="red" label="Hazard" />
                <BinGuideItem icon={<Cpu className="w-4 h-4" />} color="black" label="E-Waste" />
                <BinGuideItem icon={<Trash2 className="w-4 h-4" />} color="yellow" label="Sanitary" />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 inset-x-0 bg-background/80 backdrop-blur-md border-t border-border py-3">
        <p className="text-center text-xs text-muted-foreground">
          🌍 Every scan helps protect our planet
        </p>
      </footer>
    </div>
  );
}

function BinGuideItem({ 
  icon, 
  color, 
  label 
}: { 
  icon: React.ReactNode; 
  color: string; 
  label: string;
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
    </div>
  );
}
