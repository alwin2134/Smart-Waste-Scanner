import { useRef, useState, useCallback, useEffect } from 'react';
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
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    try {
      // Request camera with mobile-optimized constraints
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().then(() => {
            setIsCameraReady(true);
          }).catch(console.error);
        };
      }
      setMode('camera');
    } catch (error) {
      console.error('Camera access error:', error);
      setCameraError('Camera not available. Please use file upload.');
      // Fallback to file upload on camera error
      fileInputRef.current?.click();
    }
  };

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraReady(false);
  }, []);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Use actual video dimensions for best quality
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      // Use higher quality for better analysis
      const imageData = canvas.toDataURL('image/jpeg', 0.85);
      setPreviewImage(imageData);
      stopCamera();
      setMode('preview');
    }
  };

  const compressImage = (file: File, maxWidth = 1280, quality = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;
          
          // Scale down if too large
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality));
          } else {
            reject(new Error('Could not get canvas context'));
          }
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Compress image for better mobile performance
      const compressedImage = await compressImage(file, 1280, 0.85);
      setPreviewImage(compressedImage);
      setMode('preview');
    } catch (error) {
      console.error('Error processing image:', error);
      // Fallback to direct read if compression fails
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPreviewImage(result);
        setMode('preview');
      };
      reader.readAsDataURL(file);
    }
    
    // Reset input so same file can be selected again
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
    setCameraError(null);
    setMode('idle');
  };

  const closeCamera = () => {
    stopCamera();
    setMode('idle');
  };

  if (mode === 'camera') {
    return (
      <div className="relative w-full aspect-[3/4] max-h-[70vh] bg-foreground/5 rounded-2xl overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          style={{ transform: 'scaleX(1)' }}
        />
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Scanning overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-4 sm:inset-8 border-2 border-primary/50 rounded-2xl" />
          <div className="absolute inset-4 sm:inset-8 overflow-hidden rounded-2xl">
            <div className="w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-scan" />
          </div>
        </div>

        {/* Camera controls - larger touch targets for mobile */}
        <div className="absolute bottom-0 inset-x-0 p-4 sm:p-6 bg-gradient-to-t from-foreground/30 to-transparent">
          <div className="flex items-center justify-center gap-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={closeCamera}
              className="w-14 h-14 sm:w-12 sm:h-12 rounded-full bg-card/80 backdrop-blur-sm hover:bg-card active:scale-95 transition-transform"
            >
              <X className="w-6 h-6 sm:w-5 sm:h-5" />
            </Button>
            <Button
              onClick={capturePhoto}
              disabled={!isCameraReady}
              className="w-20 h-20 sm:w-20 sm:h-20 rounded-full gradient-eco shadow-glow hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
            >
              <div className="w-14 h-14 sm:w-14 sm:h-14 rounded-full border-4 border-primary-foreground" />
            </Button>
            <div className="w-14 h-14 sm:w-12 sm:h-12" /> {/* Spacer for symmetry */}
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'preview' && previewImage) {
    return (
      <div className="relative w-full aspect-[3/4] max-h-[70vh] bg-foreground/5 rounded-2xl overflow-hidden">
        <img
          src={previewImage}
          alt="Captured waste"
          className="w-full h-full object-cover"
        />
        
        {/* Preview controls - larger touch targets */}
        <div className="absolute bottom-0 inset-x-0 p-4 sm:p-6 bg-gradient-to-t from-foreground/40 to-transparent">
          <div className="flex items-center justify-center gap-3 sm:gap-4">
            <Button
              variant="secondary"
              onClick={reset}
              disabled={isLoading}
              className="rounded-full px-5 py-3 sm:px-6 bg-card/90 backdrop-blur-sm hover:bg-card active:scale-95 transition-transform text-sm sm:text-base min-h-[48px]"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Retake
            </Button>
            <Button
              onClick={confirmAndAnalyze}
              disabled={isLoading}
              className="rounded-full px-6 py-3 sm:px-8 gradient-eco shadow-glow hover:opacity-90 active:scale-95 transition-all text-sm sm:text-base min-h-[48px]"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  <span className="hidden sm:inline">Analyzing...</span>
                  <span className="sm:hidden">...</span>
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
    <div className="flex flex-col items-center gap-5 sm:gap-6 py-6 sm:py-8">
      {/* Hidden file input with mobile-optimized attributes */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />
      
      {cameraError && (
        <p className="text-destructive text-sm text-center px-4">{cameraError}</p>
      )}
      
      <div className="relative">
        <div className="absolute inset-0 gradient-eco rounded-full blur-2xl opacity-30 animate-pulse-soft" />
        <Button
          onClick={startCamera}
          className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full gradient-eco shadow-elevated hover:shadow-glow active:scale-95 transition-all duration-300"
        >
          <Camera className="w-10 h-10 sm:w-12 sm:h-12" />
        </Button>
      </div>
      
      <p className="text-muted-foreground text-sm font-medium">
        Tap to scan waste
      </p>
      
      <div className="flex items-center gap-3 text-muted-foreground text-sm">
        <div className="h-px w-8 sm:w-12 bg-border" />
        <span>or</span>
        <div className="h-px w-8 sm:w-12 bg-border" />
      </div>
      
      <Button
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        className="rounded-full px-5 py-3 sm:px-6 border-2 hover:bg-secondary active:scale-95 transition-all min-h-[48px]"
      >
        <Upload className="w-4 h-4 mr-2" />
        Upload Image
      </Button>
    </div>
  );
}
