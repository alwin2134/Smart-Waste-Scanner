import { Leaf, Recycle, AlertTriangle, Cpu, Trash2, HelpCircle, Lightbulb, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface WasteResultProps {
  result: {
    itemName: string;
    category: string;
    binColor: string;
    binType: string;
    disposalTip: string;
    confidence: number;
  };
  onReset: () => void;
}

const categoryIcons: Record<string, React.ReactNode> = {
  wet_organic: <Leaf className="w-8 h-8" />,
  dry_recyclable: <Recycle className="w-8 h-8" />,
  hazardous: <AlertTriangle className="w-8 h-8" />,
  e_waste: <Cpu className="w-8 h-8" />,
  reject_sanitary: <Trash2 className="w-8 h-8" />,
  unknown: <HelpCircle className="w-8 h-8" />,
};

const categoryLabels: Record<string, string> = {
  wet_organic: 'Wet / Organic',
  dry_recyclable: 'Dry / Recyclable',
  hazardous: 'Hazardous',
  e_waste: 'E-Waste',
  reject_sanitary: 'Reject / Sanitary',
  unknown: 'Unknown',
};

const binColorClasses: Record<string, { bg: string; text: string; border: string }> = {
  green: { bg: 'bg-bin-green', text: 'text-bin-green', border: 'border-bin-green' },
  blue: { bg: 'bg-bin-blue', text: 'text-bin-blue', border: 'border-bin-blue' },
  red: { bg: 'bg-bin-red', text: 'text-bin-red', border: 'border-bin-red' },
  black: { bg: 'bg-bin-black', text: 'text-bin-black', border: 'border-bin-black' },
  yellow: { bg: 'bg-bin-yellow', text: 'text-bin-yellow', border: 'border-bin-yellow' },
  gray: { bg: 'bg-bin-gray', text: 'text-bin-gray', border: 'border-bin-gray' },
};

const ecoTips: Record<string, string> = {
  wet_organic: '🌱 Composting organic waste reduces methane emissions and creates nutrient-rich soil!',
  dry_recyclable: '♻️ Recycling one aluminum can saves enough energy to run a TV for 3 hours!',
  hazardous: '⚠️ Proper disposal of hazardous waste prevents soil and water contamination.',
  e_waste: '🔌 E-waste contains valuable materials like gold, silver, and copper that can be recovered.',
  reject_sanitary: '🏥 Sanitary waste must be incinerated to prevent disease transmission.',
  unknown: '💡 When in doubt, check your local waste management guidelines!',
};

export function WasteResult({ result, onReset }: WasteResultProps) {
  const colorClass = binColorClasses[result.binColor] || binColorClasses.gray;
  const confidencePercent = Math.round(result.confidence * 100);
  
  return (
    <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Main result card */}
      <div className="bg-card rounded-2xl shadow-elevated overflow-hidden">
        {/* Header with bin color indicator */}
        <div className={cn('p-6 text-center', colorClass.bg)}>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-card/20 backdrop-blur-sm mb-3">
            <div className="text-card">
              {categoryIcons[result.category] || categoryIcons.unknown}
            </div>
          </div>
          <h2 className="text-xl font-bold text-card capitalize">
            {result.itemName}
          </h2>
        </div>

        {/* Details */}
        <div className="p-6 space-y-4">
          {/* Category */}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Category</span>
            <span className={cn('font-semibold', colorClass.text)}>
              {categoryLabels[result.category] || 'Unknown'}
            </span>
          </div>

          {/* Bin color */}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Bin Color</span>
            <div className="flex items-center gap-2">
              <div className={cn('w-5 h-5 rounded-full', colorClass.bg)} />
              <span className="font-semibold capitalize">{result.binColor}</span>
            </div>
          </div>

          {/* Bin type */}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Bin Type</span>
            <span className="font-semibold">{result.binType}</span>
          </div>

          {/* Confidence */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground text-sm">Confidence</span>
              <span className="text-sm font-medium">{confidencePercent}%</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div 
                className={cn('h-full rounded-full transition-all duration-500', colorClass.bg)}
                style={{ width: `${confidencePercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Disposal tip */}
      <div className="bg-card rounded-2xl p-5 shadow-soft">
        <div className="flex gap-4">
          <div className={cn('flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center', colorClass.bg, colorClass.bg.replace('bg-', 'text-').replace(colorClass.bg, '') + ' text-card')}>
            <Trash2 className="w-5 h-5 text-card" />
          </div>
          <div>
            <h3 className="font-semibold text-sm mb-1">Disposal Instructions</h3>
            <p className="text-muted-foreground text-sm">{result.disposalTip}</p>
          </div>
        </div>
      </div>

      {/* Eco tip */}
      <div className="bg-accent/50 rounded-2xl p-5">
        <div className="flex gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Lightbulb className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm mb-1 text-accent-foreground">Did you know?</h3>
            <p className="text-sm text-accent-foreground/80">
              {ecoTips[result.category] || ecoTips.unknown}
            </p>
          </div>
        </div>
      </div>

      {/* Scan again button */}
      <Button
        onClick={onReset}
        variant="outline"
        className="w-full rounded-full py-6 text-base border-2 hover:bg-secondary transition-all"
      >
        <RotateCcw className="w-5 h-5 mr-2" />
        Scan Another Item
      </Button>
    </div>
  );
}
