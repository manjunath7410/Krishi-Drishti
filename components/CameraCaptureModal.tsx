import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  X,
  RefreshCw,
  Zap,
  ZapOff,
  Grid,
  Sparkles,
  Check,
  AlertTriangle,
  Upload,
  ArrowLeft,
  Film,
  ScanLine,
  Image as ImageIcon,
  Tag,
  CheckCircle2,
  Maximize2,
  SwitchCamera,
  Leaf,
  SlidersHorizontal
} from 'lucide-react';
import { mediaGalleryService, MediaItem } from '../src/services/mediaGalleryService';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoSaved: (newItem: MediaItem, action?: 'view' | 'veo' | 'vision') => void;
  showToast: (message: string) => void;
}

type CameraStatus = 'initializing' | 'active' | 'permission_denied' | 'no_camera' | 'error';
type AspectRatioMode = '4:3' | '1:1' | '16:9';

// Efficient camera constraints optimized for mobile & agricultural field capture
export const DEFAULT_CAMERA_CONSTRAINTS: MediaStreamConstraints = {
  video: {
    facingMode: 'environment',
    width: { ideal: 1280 },
  },
  audio: false,
};

export interface FarmSampleScene {
  id: string;
  name: string;
  crop: string;
  tag: string;
  description: string;
  imageUrl: string;
}

// High-resolution realistic farm scenes for laptops, test environments, or when physical cameras are dark
export const FARM_SAMPLE_SCENES: FarmSampleScene[] = [
  {
    id: 'sample-wheat-canopy',
    name: 'Golden Wheat Canopy',
    crop: 'Wheat',
    tag: 'Fruit & Grain',
    description: 'Golden wheat heads swaying in the wind under clear sunlight',
    imageUrl: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=1200&auto=format&fit=crop&q=85',
  },
  {
    id: 'sample-tomato-field',
    name: 'Organic Tomato Vines',
    crop: 'Tomato',
    tag: 'Field Inspection',
    description: 'Close-up of ripening tomato fruit with lush foliage',
    imageUrl: 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=1200&auto=format&fit=crop&q=85',
  },
  {
    id: 'sample-rice-paddy',
    name: 'Ripening Rice Field',
    crop: 'Paddy Rice',
    tag: 'Fruit & Grain',
    description: 'Lush green and golden paddy terraces in early morning mist',
    imageUrl: 'https://images.unsplash.com/photo-1536704689299-24749e777595?w=1200&auto=format&fit=crop&q=85',
  },
  {
    id: 'sample-bell-peppers',
    name: 'Greenhouse Bell Peppers',
    crop: 'Capsicum',
    tag: 'Crop Canopy',
    description: 'Crisp bell peppers hanging on healthy greenhouse stems',
    imageUrl: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=1200&auto=format&fit=crop&q=85',
  },
  {
    id: 'sample-cotton-field',
    name: 'Cotton Foliage & Bloom',
    crop: 'Cotton',
    tag: 'Field Inspection',
    description: 'High-definition cotton canopy with healthy leaves and bolls',
    imageUrl: 'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?w=1200&auto=format&fit=crop&q=85',
  },
  {
    id: 'sample-corn-stalks',
    name: 'Sweet Corn Stalks',
    crop: 'Corn',
    tag: 'Crop Canopy',
    description: 'Vigorous maize leaves and tassels reaching towards sunlight',
    imageUrl: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=1200&auto=format&fit=crop&q=85',
  },
];

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onPhotoSaved,
  showToast,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fallbackFileInputRef = useRef<HTMLInputElement>(null);

  // Detect mobile vs laptop/desktop
  const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

  // Camera Mode: Live Camera stream OR realistic Sample Farm Scenes
  const [cameraMode, setCameraMode] = useState<'live' | 'sample'>('live');
  const [selectedSampleIndex, setSelectedSampleIndex] = useState(0);

  // Camera State: On laptop, default to 'user' (front webcam) because 'environment' often fails or gives black frame
  const [status, setStatus] = useState<CameraStatus>('initializing');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>(isMobile ? 'environment' : 'user');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [isTorchAvailable, setIsTorchAvailable] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [screenFillLight, setScreenFillLight] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [aspectRatio, setAspectRatio] = useState<AspectRatioMode>('4:3');
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  // Capture State & Feedback
  const [isShutterActive, setIsShutterActive] = useState(false);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const [capturedItem, setCapturedItem] = useState<MediaItem | null>(null);
  const [photoTitle, setPhotoTitle] = useState('');
  const [selectedTag, setSelectedTag] = useState('Field Inspection');
  const [sessionCaptureCount, setSessionCaptureCount] = useState(0);

  // Quick Farm Tag Presets
  const farmTags = [
    'Field Inspection',
    'Leaf Pathology',
    'Pest Activity',
    'Crop Canopy',
    'Fruit & Grain',
    'Soil Condition',
  ];

  // Synthesize tactile audio shutter click
  const playShutterSound = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(900, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch {
      // AudioContext blocked or unsupported, fail silently
    }
  }, []);

  // Stop camera tracks cleanly
  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn('Error stopping camera track:', e);
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsTorchOn(false);
    setIsVideoPlaying(false);
  }, []);

  // Attach active MediaStream directly to DOM video element with playsInline attributes for mobile
  const bindStreamToVideo = useCallback((stream: MediaStream) => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    // Critical mobile attributes to prevent black screen on iOS Safari and Chrome Android:
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute('playsinline', 'true');
    video.setAttribute('webkit-playsinline', 'true');
    video.setAttribute('autoplay', 'true');
    video.setAttribute('muted', 'true');

    // Attach stream directly
    if ('srcObject' in video) {
      video.srcObject = stream;
    } else {
      (video as unknown as { src?: string }).src = window.URL.createObjectURL(stream as unknown as Blob);
    }

    const attemptPlay = () => {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsVideoPlaying(true);
          })
          .catch((e) => {
            console.warn('video.play error or interrupted:', e);
          });
      }
    };

    video.onloadedmetadata = () => {
      attemptPlay();
    };

    video.oncanplay = () => {
      attemptPlay();
    };

    video.onplay = () => {
      setIsVideoPlaying(true);
    };

    // Attempt immediate play
    attemptPlay();
  }, []);

  // Callback ref ensuring DOM video element gets stream and playsInline instantly when mounted
  const setVideoRef = useCallback(
    (node: HTMLVideoElement | null) => {
      videoRef.current = node;
      if (node) {
        node.muted = true;
        node.defaultMuted = true;
        node.playsInline = true;
        node.setAttribute('playsinline', 'true');
        node.setAttribute('webkit-playsinline', 'true');

        if (streamRef.current) {
          bindStreamToVideo(streamRef.current);
        }
      }
    },
    [bindStreamToVideo]
  );

  // Start Camera with Progressive MediaDevices API constraints (efficient mobile constraints first)
  const startCamera = useCallback(async (targetFacing = facingMode) => {
    if (!isOpen) return;

    // Check MediaDevices API support
    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setStatus('error');
      setErrorMessage('MediaDevices API is not supported in this browser environment.');
      setCameraMode('sample');
      return;
    }

    stopCameraStream();
    setStatus('initializing');
    setErrorMessage('');
    setIsVideoPlaying(false);

    try {
      // Check available cameras to decide if flip button should show
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        setHasMultipleCameras(videoInputs.length > 1);
      } catch {
        setHasMultipleCameras(true);
      }

      let stream: MediaStream | null = null;

      // Tier 1: Efficient primary constraints for mobile/field cameras ({ facingMode: 'environment', width: { ideal: 1280 } })
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: targetFacing,
            width: { ideal: 1280 },
          },
          audio: false,
        });
      } catch (err1) {
        console.warn('Tier 1 constraints failed, trying generic facingMode:', err1);
        // Tier 2: Try simple facingMode without width constraint
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: targetFacing },
            audio: false,
          });
        } catch (err2) {
          console.warn('Tier 2 failed, trying opposite facingMode:', err2);
          // Tier 3: Try opposite facingMode (e.g., fallback for laptops where environment doesn't exist)
          try {
            const oppositeFacing = targetFacing === 'environment' ? 'user' : 'environment';
            stream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: oppositeFacing, width: { ideal: 1280 } },
              audio: false,
            });
            setFacingMode(oppositeFacing);
          } catch (err3) {
            console.warn('Tier 3 failed, attempting universal bare video constraint:', err3);
            // Tier 4: Catch-all bare video: true (universal webcam support)
            stream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: false,
            });
          }
        }
      }

      if (!stream) {
        throw new Error('Unable to obtain video stream from device');
      }

      streamRef.current = stream;
      bindStreamToVideo(stream);

      // Check for hardware torch capability
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack && typeof videoTrack.getCapabilities === 'function') {
        const capabilities = videoTrack.getCapabilities() as { torch?: boolean };
        setIsTorchAvailable(Boolean(capabilities.torch));
      } else {
        setIsTorchAvailable(false);
      }

      setStatus('active');
    } catch (err: unknown) {
      console.error('Camera initialization failed:', err);
      const error = err as { name?: string; message?: string };

      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setStatus('permission_denied');
        setErrorMessage('Camera access was denied. You can enable it in browser settings or use sample farm scenes.');
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        setStatus('no_camera');
        setErrorMessage('No camera device was detected on this laptop or computer.');
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        setStatus('error');
        setErrorMessage('The camera is currently in use by another application or closed by a privacy slider.');
      } else {
        setStatus('error');
        setErrorMessage(error.message || 'Could not connect to device camera.');
      }

      // Automatically fallback to sample mode so the user is never trapped on a black screen
      setCameraMode('sample');
    }
  }, [isOpen, facingMode, stopCameraStream, bindStreamToVideo]);

  // Lifecycle when modal opens or cameraMode toggles
  useEffect(() => {
    if (isOpen) {
      if (cameraMode === 'live') {
        startCamera(facingMode);
      } else {
        stopCameraStream();
        setStatus('active');
      }
    } else {
      stopCameraStream();
      setCapturedPhotoUrl(null);
      setCapturedItem(null);
      setIsShutterActive(false);
      setSessionCaptureCount(0);
    }

    return () => {
      stopCameraStream();
    };
  }, [isOpen, cameraMode, startCamera, stopCameraStream, facingMode]);

  // Keep videoRef and streamRef in sync whenever videoRef mounts or updates
  useEffect(() => {
    if (isOpen && cameraMode === 'live' && streamRef.current && videoRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        bindStreamToVideo(streamRef.current);
      }
    }
  }, [isOpen, cameraMode, status, bindStreamToVideo]);

  // Stop camera when user switches tabs or hides page
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isOpen) {
        stopCameraStream();
      } else if (!document.hidden && isOpen && !capturedPhotoUrl && cameraMode === 'live') {
        startCamera(facingMode);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isOpen, capturedPhotoUrl, cameraMode, facingMode, startCamera, stopCameraStream]);

  // Toggle Hardware Torch / Flash
  const toggleTorch = async () => {
    if (!streamRef.current || !isTorchAvailable) {
      setScreenFillLight((prev) => !prev);
      return;
    }
    const videoTrack = streamRef.current.getVideoTracks()[0];
    if (!videoTrack) return;

    try {
      const nextState = !isTorchOn;
      await videoTrack.applyConstraints({
        advanced: [{ torch: nextState } as unknown as MediaTrackConstraintSet],
      });
      setIsTorchOn(nextState);
    } catch (err) {
      console.warn('Torch constraint toggle failed:', err);
      setScreenFillLight((prev) => !prev);
      showToast('Hardware flash not supported; screen fill light enabled');
    }
  };

  // Flip between front and rear cameras
  const handleFlipCamera = () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
    if (cameraMode === 'live') {
      startCamera(nextFacing);
    }
  };

  // Convert Sample Image URL to Base64 JPEG dataURI with aspect-ratio crop
  const sampleUrlToDataUri = async (url: string, ratioMode: AspectRatioMode): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = canvasRef.current || document.createElement('canvas');
        const nw = img.naturalWidth || 1200;
        const nh = img.naturalHeight || 800;

        let targetW = nw;
        let targetH = nh;
        let sx = 0;
        let sy = 0;

        if (ratioMode === '1:1') {
          const sq = Math.min(nw, nh);
          targetW = sq;
          targetH = sq;
          sx = (nw - sq) / 2;
          sy = (nh - sq) / 2;
        } else if (ratioMode === '4:3') {
          const r = 4 / 3;
          if (nw / nh > r) {
            targetW = Math.round(nh * r);
            targetH = nh;
            sx = Math.round((nw - targetW) / 2);
            sy = 0;
          } else {
            targetW = nw;
            targetH = Math.round(nw / r);
            sx = 0;
            sy = Math.round((nh - targetH) / 2);
          }
        } else if (ratioMode === '16:9') {
          const r = 16 / 9;
          if (nw / nh > r) {
            targetW = Math.round(nh * r);
            targetH = nh;
            sx = Math.round((nw - targetW) / 2);
            sy = 0;
          } else {
            targetW = nw;
            targetH = Math.round(nw / r);
            sx = 0;
            sy = Math.round((nh - targetH) / 2);
          }
        }

        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, sx, sy, targetW, targetH, 0, 0, targetW, targetH);
          resolve(canvas.toDataURL('image/jpeg', 0.92));
        } else {
          resolve(url);
        }
      };
      img.onerror = () => {
        resolve(url);
      };
      img.src = url;
    });
  };

  // Capture Photo from Video Stream OR Sample Farm Scene
  const handleCapturePhoto = async () => {
    // ── SAMPLE CROP MODE CAPTURE ──
    if (cameraMode === 'sample') {
      const activeSample = FARM_SAMPLE_SCENES[selectedSampleIndex];
      setIsShutterActive(true);
      playShutterSound();

      try {
        const dataUrl = await sampleUrlToDataUri(activeSample.imageUrl, aspectRatio);
        setCapturedPhotoUrl(dataUrl);

        const now = new Date();
        const defaultTitle = `${activeSample.crop} - ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        setPhotoTitle(defaultTitle);
        setSelectedTag(activeSample.tag);

        const savedItem = mediaGalleryService.addCapturedPhoto({
          title: defaultTitle,
          imageDataUrl: dataUrl,
          aspectRatio: aspectRatio === '1:1' ? '1:1' : aspectRatio === '16:9' ? '16:9' : '4:3',
          tags: ['Camera', 'Sample Capture', activeSample.tag, activeSample.crop],
          description: `${activeSample.name}: ${activeSample.description}`,
        });

        setCapturedItem(savedItem);
        setSessionCaptureCount((prev) => prev + 1);
        showToast('Photo captured & saved to gallery!');
      } catch (err) {
        console.error('Sample capture failed:', err);
      } finally {
        setTimeout(() => setIsShutterActive(false), 200);
      }
      return;
    }

    // ── LIVE STREAM CAPTURE ──
    if (!videoRef.current || !canvasRef.current) {
      showToast('Camera stream is not ready yet');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    const vw = video.videoWidth;
    const vh = video.videoHeight;

    // Guard: Prevent capturing a completely black image if video has not rendered any frames!
    if (!vw || !vh || vw === 0 || vh === 0) {
      showToast('Camera feed is still initializing. Switching to realistic sample scene.');
      setCameraMode('sample');
      return;
    }

    // Calculate crop rectangle according to selected aspect ratio
    let targetWidth = vw;
    let targetHeight = vh;
    let sx = 0;
    let sy = 0;

    if (aspectRatio === '1:1') {
      const squareSize = Math.min(vw, vh);
      targetWidth = squareSize;
      targetHeight = squareSize;
      sx = (vw - squareSize) / 2;
      sy = (vh - squareSize) / 2;
    } else if (aspectRatio === '4:3') {
      const ratio = 4 / 3;
      if (vw / vh > ratio) {
        targetWidth = Math.round(vh * ratio);
        targetHeight = vh;
        sx = Math.round((vw - targetWidth) / 2);
        sy = 0;
      } else {
        targetWidth = vw;
        targetHeight = Math.round(vw / ratio);
        sx = 0;
        sy = Math.round((vh - targetHeight) / 2);
      }
    } else if (aspectRatio === '16:9') {
      const ratio = 16 / 9;
      if (vw / vh > ratio) {
        targetWidth = Math.round(vh * ratio);
        targetHeight = vh;
        sx = Math.round((vw - targetWidth) / 2);
        sy = 0;
      } else {
        targetWidth = vw;
        targetHeight = Math.round(vw / ratio);
        sx = 0;
        sy = Math.round((vh - targetHeight) / 2);
      }
    }

    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Trigger visual & tactile feedback
    setIsShutterActive(true);
    playShutterSound();
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([35, 25, 45]);
      } catch {
        // Ignore
      }
    }

    // Mirror horizontal if using front camera
    if (facingMode === 'user') {
      ctx.translate(targetWidth, 0);
      ctx.scale(-1, 1);
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(video, sx, sy, targetWidth, targetHeight, 0, 0, targetWidth, targetHeight);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedPhotoUrl(dataUrl);

    // Auto-generate title with current time
    const now = new Date();
    const defaultTitle = `Farm Capture ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    setPhotoTitle(defaultTitle);

    // Immediately save photo into MediaGallery database
    try {
      const savedItem = mediaGalleryService.addCapturedPhoto({
        title: defaultTitle,
        imageDataUrl: dataUrl,
        aspectRatio: aspectRatio === '1:1' ? '1:1' : aspectRatio === '16:9' ? '16:9' : '4:3',
        tags: ['Camera', 'Live Capture', selectedTag],
        description: `Captured live via camera (${targetWidth}×${targetHeight}px, ${aspectRatio})`,
      });

      setCapturedItem(savedItem);
      setSessionCaptureCount((prev) => prev + 1);
      showToast('Photo captured & saved to gallery!');
    } catch (saveErr) {
      console.error('Auto-saving captured photo failed:', saveErr);
    }

    setTimeout(() => {
      setIsShutterActive(false);
    }, 200);
  };

  // Fallback upload if camera cannot be accessed
  const handleFallbackFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (!dataUrl) return;

      const savedItem = mediaGalleryService.addUploadedImage({
        title: file.name.replace(/\.[^/.]+$/, '') || 'Field Photo',
        imageDataUrl: dataUrl,
        tags: ['Device Upload', 'Photo', selectedTag],
      });

      onPhotoSaved(savedItem, 'view');
      showToast('Photo uploaded to Media Gallery');
      onClose();
    };
    reader.readAsDataURL(file);
  };

  // Retake photo: discard preview and resume
  const handleRetake = () => {
    setCapturedPhotoUrl(null);
    setCapturedItem(null);
    if (cameraMode === 'live') {
      startCamera(facingMode);
    }
  };

  // Continue shooting another photo without leaving camera
  const handleTakeAnother = () => {
    setCapturedPhotoUrl(null);
    setCapturedItem(null);
    if (cameraMode === 'live') {
      startCamera(facingMode);
    }
  };

  // Confirm and route to specified destination
  const handleFinish = (action: 'view' | 'veo' | 'vision') => {
    if (!capturedItem) return;

    // Update title/tag if user edited them
    if (photoTitle.trim() && photoTitle !== capturedItem.title) {
      capturedItem.title = photoTitle.trim();
      capturedItem.tags = ['Camera', selectedTag];
      try {
        const allItems = mediaGalleryService.getAllMedia();
        const updated = allItems.map((it) => (it.id === capturedItem.id ? { ...it, title: photoTitle.trim(), tags: ['Camera', selectedTag] } : it));
        localStorage.setItem('krishi_media_gallery_items', JSON.stringify(updated));
      } catch (err) {
        console.warn('Update item title failed', err);
      }
    }

    onPhotoSaved(capturedItem, action);
    onClose();
  };

  if (!isOpen) return null;

  const activeSample = FARM_SAMPLE_SCENES[selectedSampleIndex];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between overflow-hidden select-none"
      id="camera-capture-modal"
    >
      {/* Offscreen Canvas for High-Resolution Frame Grabbing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Hidden File Input for Device Upload */}
      <input
        type="file"
        ref={fallbackFileInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleFallbackFileSelect}
      />

      {/* Screen Illumination Border (When Fill Light is ON) */}
      {screenFillLight && (
        <div className="absolute inset-0 border-[14px] border-white pointer-events-none z-40 animate-pulse" />
      )}

      {/* Shutter White Flash Feedback */}
      {isShutterActive && (
        <div className="absolute inset-0 bg-white z-50 pointer-events-none animate-ping duration-150" />
      )}

      {/* ── TOP ACTION BAR ── */}
      <div className="relative z-30 px-4 pt-4 pb-2 flex items-center justify-between text-white bg-gradient-to-b from-black/85 via-black/50 to-transparent">
        {/* Left: Close / Back Button */}
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white active:scale-95"
          title="Close Camera"
          id="camera-close-btn"
        >
          <X size={20} />
        </button>

        {/* Center: Live / Sample Mode Switcher */}
        {!capturedPhotoUrl && (
          <div className="flex items-center bg-black/60 backdrop-blur-md p-1 rounded-full border border-white/15 shadow-lg">
            <button
              onClick={() => {
                setCameraMode('live');
                startCamera(facingMode);
              }}
              className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                cameraMode === 'live'
                  ? 'bg-emerald-500 text-slate-950 shadow-xs'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              <Camera size={13} />
              <span>Camera</span>
            </button>
            <button
              onClick={() => {
                setCameraMode('sample');
                stopCameraStream();
                setStatus('active');
              }}
              className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                cameraMode === 'sample'
                  ? 'bg-emerald-500 text-slate-950 shadow-xs'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              <Sparkles size={13} />
              <span>Farm Scenes</span>
            </button>
          </div>
        )}

        {/* Right Tools: Aspect Ratio & Flash */}
        <div className="flex items-center gap-2">
          {/* Grid Toggle */}
          {!capturedPhotoUrl && (
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                showGrid ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
              title="Toggle Framing Grid"
            >
              <Grid size={16} />
            </button>
          )}

          {/* Aspect Ratio Selector */}
          {!capturedPhotoUrl && (
            <button
              onClick={() => {
                const nextRatio: Record<AspectRatioMode, AspectRatioMode> = {
                  '4:3': '1:1',
                  '1:1': '16:9',
                  '16:9': '4:3',
                };
                setAspectRatio(nextRatio[aspectRatio]);
              }}
              className="px-2.5 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white text-[11px] font-black tracking-wider flex items-center justify-center transition-colors border border-white/10"
              title="Change Aspect Ratio"
            >
              {aspectRatio}
            </button>
          )}

          {/* Flash / Torch Toggle */}
          {!capturedPhotoUrl && (
            <button
              onClick={toggleTorch}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                isTorchOn || screenFillLight
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-400/30'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
              title={isTorchAvailable ? 'Toggle Hardware Torch' : 'Toggle Screen Fill Light'}
            >
              {isTorchOn || screenFillLight ? <Zap size={16} /> : <ZapOff size={16} />}
            </button>
          )}
        </div>
      </div>

      {/* ── CENTRAL VIEWFINDER / CAPTURE VIEWPORT ── */}
      <div className="relative flex-1 flex items-center justify-center w-full overflow-hidden p-2">
        {/* ── LIVE CAMERA OR SAMPLE SCENE CONTAINER (ALWAYS MOUNTED TO PREVENT NULL REFS) ── */}
        {!capturedPhotoUrl && (
          <div
            className={`relative overflow-hidden rounded-3xl bg-slate-950 shadow-2xl transition-all flex items-center justify-center border border-white/15 ${
              aspectRatio === '1:1'
                ? 'aspect-square max-h-[72vh] w-full max-w-[420px]'
                : aspectRatio === '16:9'
                ? 'aspect-video w-full max-w-lg'
                : 'aspect-[3/4] max-h-[72vh] w-full max-w-[420px]'
            }`}
          >
            {/* Live Video Element with playsInline for mobile support */}
            <video
              ref={setVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transition-all duration-300 ${
                cameraMode !== 'live' ? 'hidden' : ''
              } ${facingMode === 'user' ? 'scale-x-[-1]' : ''} ${
                screenFillLight ? 'brightness-125 contrast-105' : ''
              }`}
            />

            {/* Sample Farm Scene Image */}
            {cameraMode === 'sample' && (
              <div className="relative w-full h-full">
                <img
                  src={activeSample.imageUrl}
                  alt={activeSample.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-emerald-300 flex items-center gap-1.5 border border-emerald-500/30">
                  <Leaf size={12} className="text-emerald-400" />
                  <span>{activeSample.name}</span>
                </div>
              </div>
            )}

            {/* Rule of Thirds Agricultural Framing Grid */}
            {showGrid && (
              <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 z-10 opacity-60">
                <div className="border-r border-b border-white/20" />
                <div className="border-r border-b border-white/20" />
                <div className="border-b border-white/20" />
                <div className="border-r border-b border-white/20" />
                <div className="border-r border-b border-white/20" />
                <div className="border-b border-white/20" />
                <div className="border-r border-b border-white/20" />
                <div className="border-r border-b border-white/20" />
                <div />
              </div>
            )}

            {/* Center Focus Reticle Box */}
            <div className="absolute w-20 h-20 border border-emerald-400/60 rounded-2xl pointer-events-none flex items-center justify-center z-10 shadow-[0_0_15px_rgba(52,211,153,0.2)]">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
            </div>

            {/* Subtle Helper Overlay */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/70 text-white/90 backdrop-blur-xs border border-white/10">
                {cameraMode === 'live'
                  ? facingMode === 'environment'
                    ? 'Rear Field Camera'
                    : 'Laptop / Front Webcam'
                  : activeSample.crop}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/70 text-emerald-400 backdrop-blur-xs border border-emerald-500/30">
                Tap Shutter to Capture
              </span>
            </div>

            {/* Initializing Spinner Overlay while Live Video Boots */}
            {cameraMode === 'live' && status === 'initializing' && (
              <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xs flex flex-col items-center justify-center gap-3 z-20 text-white">
                <RefreshCw size={36} className="animate-spin text-emerald-400" />
                <p className="text-xs font-bold tracking-wide">Starting Camera Stream...</p>
                <p className="text-[11px] text-white/60">Connecting to webcam sensor</p>
              </div>
            )}

            {/* Permission Denied or Camera Error Overlay */}
            {cameraMode === 'live' && (status === 'permission_denied' || status === 'error' || status === 'no_camera') && (
              <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20 text-white gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <AlertTriangle size={24} />
                </div>
                <h4 className="text-sm font-black">
                  {status === 'permission_denied' ? 'Camera Permission Blocked' : 'Camera Hardware Unavailable'}
                </h4>
                <p className="text-[11px] text-white/70 max-w-xs leading-relaxed">
                  {errorMessage || 'Camera could not be started on this device. You can tap below to use realistic Farm Scenes or upload a photo.'}
                </p>
                <div className="flex items-center gap-2 pt-2 w-full max-w-xs">
                  <button
                    onClick={() => {
                      setCameraMode('sample');
                      stopCameraStream();
                      setStatus('active');
                    }}
                    className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Sparkles size={14} /> Use Farm Scenes
                  </button>
                  <button
                    onClick={() => startCamera(facingMode)}
                    className="py-2 px-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <RefreshCw size={14} /> Retry
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── STATE: CAPTURED PHOTO CONFIRMATION & INSPECTION ── */}
        {capturedPhotoUrl && (
          <div className="relative w-full max-w-md flex flex-col items-center gap-3">
            <div
              className={`relative overflow-hidden rounded-3xl bg-slate-900 border-2 border-emerald-500/80 shadow-2xl ${
                aspectRatio === '1:1'
                  ? 'aspect-square max-h-[50vh] w-full'
                  : aspectRatio === '16:9'
                  ? 'aspect-video w-full'
                  : 'aspect-[3/4] max-h-[50vh] w-full'
              }`}
            >
              <img
                src={capturedPhotoUrl}
                alt="Captured Farm Photo"
                className="w-full h-full object-cover"
              />

              {/* Instant Success Badge */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1 bg-emerald-600/95 text-white rounded-full text-xs font-black backdrop-blur-xs shadow-lg">
                <CheckCircle2 size={14} />
                <span>Saved to Gallery</span>
              </div>
            </div>

            {/* Quick Metadata Adjustment */}
            <div className="w-full bg-slate-900/90 border border-white/10 rounded-2xl p-3.5 space-y-2.5 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <input
                  type="text"
                  value={photoTitle}
                  onChange={(e) => setPhotoTitle(e.target.value)}
                  placeholder="Enter photo title..."
                  className="bg-white/10 border border-white/15 focus:border-emerald-500 rounded-xl px-3 py-1.5 text-xs font-bold text-white w-full outline-none transition-colors"
                />
              </div>

              {/* Quick Tag Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                {farmTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag)}
                    className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full whitespace-nowrap transition-all ${
                      selectedTag === tag
                        ? 'bg-emerald-500 text-slate-950 shadow-xs'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── BOTTOM CONTROL PANEL ── */}
      <div className="relative z-30 p-4 pb-6 bg-gradient-to-t from-black/95 via-black/75 to-transparent flex flex-col gap-3">
        {/* Sample Scene Horizontal Thumbnail Strip (Visible in Sample Mode) */}
        {!capturedPhotoUrl && cameraMode === 'sample' && (
          <div className="w-full flex items-center gap-2 overflow-x-auto no-scrollbar py-1 max-w-md mx-auto">
            {FARM_SAMPLE_SCENES.map((scene, idx) => (
              <button
                key={scene.id}
                onClick={() => setSelectedSampleIndex(idx)}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border shrink-0 transition-all ${
                  selectedSampleIndex === idx
                    ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-md shadow-emerald-500/20'
                    : 'bg-black/60 border-white/15 text-white/70 hover:bg-white/10'
                }`}
              >
                <img
                  src={scene.imageUrl}
                  alt={scene.name}
                  className="w-7 h-7 rounded-lg object-cover border border-white/20 shrink-0"
                />
                <div className="text-left">
                  <p className="text-[11px] font-bold leading-tight">{scene.crop}</p>
                  <p className="text-[9px] text-emerald-300/80 leading-tight">{scene.tag}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Shutter & Capture Controls */}
        {!capturedPhotoUrl && (
          <div className="flex items-center justify-around max-w-sm mx-auto w-full pt-1">
            {/* Gallery Upload Alternate */}
            <button
              onClick={() => fallbackFileInputRef.current?.click()}
              className="flex flex-col items-center gap-1 group active:scale-95 transition-transform"
              title="Pick photo from device files"
              id="camera-upload-btn"
            >
              <div className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors border border-white/15">
                <Upload size={18} />
              </div>
              <span className="text-[10px] font-bold text-white/80">Upload</span>
            </button>

            {/* Primary Shutter Trigger Button */}
            <button
              onClick={handleCapturePhoto}
              disabled={isShutterActive}
              className="w-20 h-20 rounded-full border-4 border-white/60 p-1 flex items-center justify-center transition-transform active:scale-90 shadow-[0_0_25px_rgba(52,211,153,0.35)]"
              title="Capture Photo"
              id="camera-shutter-trigger"
            >
              <div className="w-full h-full bg-white rounded-full flex items-center justify-center shadow-lg">
                <div className="w-14 h-14 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center">
                  <Camera size={22} className="text-slate-950" />
                </div>
              </div>
            </button>

            {/* Flip Camera / Mode Toggle */}
            <button
              onClick={() => {
                if (cameraMode === 'live') {
                  handleFlipCamera();
                } else {
                  setCameraMode('live');
                  startCamera(facingMode);
                }
              }}
              className="flex flex-col items-center gap-1 group active:scale-95 transition-transform"
              title={
                cameraMode === 'live'
                  ? facingMode === 'environment'
                    ? 'Switch to Front Camera'
                    : 'Switch to Rear Camera'
                  : 'Switch to Live Camera'
              }
              id="camera-flip-btn"
            >
              <div className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors border border-white/15">
                <SwitchCamera size={18} />
              </div>
              <span className="text-[10px] font-bold text-white/80">
                {cameraMode === 'live' ? (facingMode === 'environment' ? 'Front' : 'Rear') : 'Live'}
              </span>
            </button>
          </div>
        )}

        {/* Post-Capture Action Sheet */}
        {capturedPhotoUrl && (
          <div className="max-w-md mx-auto space-y-2.5 w-full">
            {/* Primary Application Actions */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleFinish('veo')}
                className="py-3 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition-transform"
                id="camera-action-veo"
              >
                <Film size={15} /> Animate in Veo Studio
              </button>

              <button
                onClick={() => handleFinish('vision')}
                className="py-3 px-3 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition-transform"
                id="camera-action-vision"
              >
                <ScanLine size={15} /> Diagnose in Crop Doctor
              </button>
            </div>

            {/* Secondary: Take Another vs View in Gallery */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleTakeAnother}
                className="py-2.5 px-3 bg-white/15 hover:bg-white/25 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors active:scale-95"
                id="camera-take-another-btn"
              >
                <Camera size={14} className="text-emerald-400" /> Shoot Another Photo
              </button>

              <button
                onClick={() => handleFinish('view')}
                className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors active:scale-95 shadow-md shadow-emerald-600/30"
                id="camera-done-view-btn"
              >
                <Check size={15} /> View in Gallery
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
