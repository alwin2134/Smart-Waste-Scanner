import { useRef, useState, useCallback } from 'react';
import { Camera, Upload, X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CameraCaptureProps {
  onCapture: (imageBase64: string) => void;
  isLoading: boolean;
}

export function CameraCapture({ onCapture, isLoading }: CameraCaptureProps) {
  const [mode, setMode] = useState<'idle' | 'camera' | 'preview'>('idle');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          setIsCameraReady(true);
        };
      }
      setMode('camera');
    } catch (error) {
      console.error('Camera access denied:', error);
      // Fallback to file upload
      fileInputRef.current?.click();
    }
  };

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraReady(false);
  }, []);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      setPreviewImage(imageData);
      stopCamera();
      setMode('preview');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreviewImage(result);
      setMode('preview');
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const confirmAndAnalyze = () => {
    if (previewImage) {
      const base64Data = previewImage.split(',')[1];
      onCapture(base64Data);
    }
  };

  const reset = () => {
    stopCamera();
    setPreviewImage(null);
    setMode('idle');
  };

  const closeCamera = () => {
    stopCamera();
    setMode('idle');
  };

  if (mode === 'camera') {
    return (
      <div className="relative w-full aspect-[3/4] max-h-[60vh] bg-foreground/5 rounded-2xl overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Scanning overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-8 border-2 border-primary/50 rounded-2xl" />
          <div className="absolute inset-8 overflow-hidden rounded-2xl">
            <div className="w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-scan" />
          </div>
        </div>

        {/* Camera controls */}
        <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-foreground/20 to-transparent">
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={closeCamera}
              className="w-12 h-12 rounded-full bg-card/80 backdrop-blur-sm hover:bg-card"
            >
              <X className="w-5 h-5" />
            </Button>
            <Button
              onClick={capturePhoto}
              disabled={!isCameraReady}
              className="w-20 h-20 rounded-full gradient-eco shadow-glow hover:opacity-90 transition-all"
            >
              <div className="w-14 h-14 rounded-full border-4 border-primary-foreground" />
            </Button>
            <div className="w-12 h-12" /> {/* Spacer for symmetry */}
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'preview' && previewImage) {
    return (
      <div className="relative w-full aspect-[3/4] max-h-[60vh] bg-foreground/5 rounded-2xl overflow-hidden">
        <img
          src={previewImage}
          alt="Captured waste"
          className="w-full h-full object-cover"
        />
        
        {/* Preview controls */}
        <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-foreground/30 to-transparent">
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="secondary"
              onClick={reset}
              disabled={isLoading}
              className="rounded-full px-6 bg-card/90 backdrop-blur-sm hover:bg-card"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Retake
            </Button>
            <Button
              onClick={confirmAndAnalyze}
              disabled={isLoading}
              className="rounded-full px-8 gradient-eco shadow-glow hover:opacity-90"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Analyzing...
                </div>
              ) : (
                'Analyze Waste'
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Idle state - show capture buttons
  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileUpload}
        className="hidden"
      />
      
      <div className="relative">
        <div className="absolute inset-0 gradient-eco rounded-full blur-2xl opacity-30 animate-pulse-soft" />
        <Button
          onClick={startCamera}
          className="relative w-32 h-32 rounded-full gradient-eco shadow-elevated hover:shadow-glow transition-all duration-300 hover:scale-105"
        >
          <Camera className="w-12 h-12" />
        </Button>
      </div>
      
      <p className="text-muted-foreground text-sm font-medium">
        Tap to scan waste
      </p>
      
      <div className="flex items-center gap-3 text-muted-foreground text-sm">
        <div className="h-px w-12 bg-border" />
        <span>or</span>
        <div className="h-px w-12 bg-border" />
      </div>
      
      <Button
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        className="rounded-full px-6 border-2 hover:bg-secondary transition-colors"
      >
        <Upload className="w-4 h-4 mr-2" />
        Upload Image
      </Button>
    </div>
  );
}
