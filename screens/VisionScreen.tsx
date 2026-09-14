import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Screen } from '../types';
import {
  ArrowLeft,
  Zap,
  ZapOff,
  Camera as CameraIcon,
  Image as ImageIcon,
  ScanLine,
  X,
  RefreshCw,
  SwitchCamera,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  SunMedium,
  Upload,
  Layers,
  Leaf
} from 'lucide-react';

interface VisionScreenProps {
  navigateTo: (screen: Screen, data?: any) => void;
  t: any;
}

interface SampleCrop {
  id: string;
  name: string;
  crop: string;
  disease: string;
  tag: string;
  imageUrl: string;
}

// High-definition sample crop leaves with pathology for instant diagnostics & testing
const SAMPLE_CROPS: SampleCrop[] = [
  {
    id: 'sample-tomato-blight',
    name: 'Tomato Early Blight',
    crop: 'Tomato',
    disease: 'Alternaria solani',
    tag: 'Fungal Infection',
    imageUrl: 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'sample-wheat-rust',
    name: 'Wheat Brown Rust',
    crop: 'Wheat',
    disease: 'Puccinia triticina',
    tag: 'Rust Fungus',
    imageUrl: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'sample-cotton-blight',
    name: 'Cotton Bacterial Spot',
    crop: 'Cotton',
    disease: 'Xanthomonas campestris',
    tag: 'Bacterial Blight',
    imageUrl: 'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'sample-rice-blast',
    name: 'Rice Blast Leaf',
    crop: 'Paddy Rice',
    disease: 'Magnaporthe oryzae',
    tag: 'Spindle Lesions',
    imageUrl: 'https://images.unsplash.com/photo-1536704689299-24749e777595?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'sample-corn-blight',
    name: 'Maize Leaf Blight',
    crop: 'Corn',
    disease: 'Helminthosporium turcicum',
    tag: 'Leaf Spot',
    imageUrl: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'sample-healthy-crop',
    name: 'Healthy Crop Foliage',
    crop: 'Field Crop',
    disease: 'None detected',
    tag: 'Vibrant & Vigorous',
    imageUrl: 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?w=800&auto=format&fit=crop&q=80',
  },
];

const VisionScreen: React.FC<VisionScreenProps> = ({ navigateTo, t }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Modes & Camera Hardware States
  const [cameraMode, setCameraMode] = useState<'live' | 'sample'>('live');
  const [status, setStatus] = useState<'initializing' | 'active' | 'denied' | 'error'>('initializing');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [selectedSampleIndex, setSelectedSampleIndex] = useState(0);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [isTorchSupported, setIsTorchSupported] = useState(false);
  const [brightnessBoost, setBrightnessBoost] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(true);

  // Stop camera tracks cleanly
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn('Error stopping track:', e);
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsTorchOn(false);
  }, []);

  // Progressive Camera Stream Acquisition
  const startCamera = useCallback(async (desiredFacing: 'environment' | 'user') => {
    stopStream();
    setStatus('initializing');
    setErrorMessage('');

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setStatus('error');
      setErrorMessage('Camera API is not supported in this browser environment.');
      setCameraMode('sample');
      return;
    }

    try {
      // Check available camera devices to show/hide flip button
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        setHasMultipleCameras(videoInputs.length > 1);
      } catch {
        setHasMultipleCameras(true);
      }

      let stream: MediaStream | null = null;

      // Attempt 1: Efficient primary constraints for mobile & web
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: desiredFacing,
            width: { ideal: 1280 },
          },
          audio: false,
        });
      } catch (err1) {
        console.warn('Attempt 1 failed, trying simple facingMode:', err1);
        // Attempt 2: Simple facingMode
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: desiredFacing },
            audio: false,
          });
        } catch (err2) {
          console.warn('Attempt 2 failed, attempting bare video constraint:', err2);
          // Attempt 3: Any available video stream (guarantees desktop webcam works)
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }
      }

      if (!stream) {
        throw new Error('Could not initialize video stream');
      }

      streamRef.current = stream;

      // Hardware torch capability check
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack && typeof videoTrack.getCapabilities === 'function') {
        const caps = videoTrack.getCapabilities() as { torch?: boolean };
        setIsTorchSupported(Boolean(caps.torch));
      } else {
        setIsTorchSupported(false);
      }

      // Attach stream to DOM Video element
      if (videoRef.current) {
        const video = videoRef.current;
        // CRITICAL: Explicitly set DOM properties and attributes for autoplay on mobile iOS/Chrome
        video.muted = true;
        video.defaultMuted = true;
        video.playsInline = true;
        video.setAttribute('playsinline', 'true');
        video.setAttribute('webkit-playsinline', 'true');
        video.srcObject = stream;

        // Start playback as soon as metadata arrives
        video.onloadedmetadata = () => {
          video.play().catch((playErr) => console.warn('video.play onloadedmetadata:', playErr));
        };

        try {
          await video.play();
        } catch (playErr) {
          console.warn('video.play direct await:', playErr);
        }
      }

      setStatus('active');
    } catch (err: any) {
      console.error('Camera initialization failure:', err);
      const isDenied = err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError';
      if (isDenied) {
        setStatus('denied');
        setErrorMessage('Camera access was denied. You can enable it in browser settings or use sample crop leaves.');
      } else {
        setStatus('error');
        setErrorMessage('Camera hardware is currently unavailable or in use by another app.');
      }
      // Gracefully switch to sample mode so the user is never stranded on a black screen
      setCameraMode('sample');
    }
  }, [stopStream]);

  // Initial Camera Start
  useEffect(() => {
    if (cameraMode === 'live') {
      startCamera(facingMode);
    } else {
      stopStream();
    }

    return () => {
      stopStream();
    };
  }, [cameraMode, facingMode, startCamera, stopStream]);

  // Flip Camera Front <-> Rear
  const handleFlipCamera = () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
    if (cameraMode === 'live') {
      startCamera(nextFacing);
    }
  };

  // Toggle Torch / Flash
  const toggleTorch = async () => {
    if (!streamRef.current || !isTorchSupported) {
      // Toggle screen brightness boost as virtual fill light
      setBrightnessBoost((prev) => !prev);
      return;
    }
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;
    try {
      const nextState = !isTorchOn;
      await track.applyConstraints({
        advanced: [{ torch: nextState } as unknown as MediaTrackConstraintSet],
      });
      setIsTorchOn(nextState);
    } catch (err) {
      console.warn('Torch constraint toggle failed:', err);
      setBrightnessBoost((prev) => !prev);
    }
  };

  // Convert Sample Image URL to Base64 JPEG dataURI
  const sampleUrlToDataUri = async (url: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = canvasRef.current || document.createElement('canvas');
        const size = Math.min(img.naturalWidth || 800, img.naturalHeight || 800);
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const sx = ((img.naturalWidth || size) - size) / 2;
          const sy = ((img.naturalHeight || size) - size) / 2;
          ctx.drawImage(img, sx, sy, size, size, 0, 0, size, size);
          resolve(canvas.toDataURL('image/jpeg', 0.88));
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

  // Capture Image Handler (from Live Video or Sample Crop)
  const handleCapture = async () => {
    setIsCapturing(true);

    try {
      if (cameraMode === 'sample') {
        const sample = SAMPLE_CROPS[selectedSampleIndex];
        const dataUrl = await sampleUrlToDataUri(sample.imageUrl);
        navigateTo('vision-result', {
          image: dataUrl,
          mode: 'diagnosis',
          sampleInfo: sample,
        });
        return;
      }

      // Live Video Stream Capture
      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        const vw = video.videoWidth || 1280;
        const vh = video.videoHeight || 720;
        const size = Math.min(vw, vh);

        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          // Mirror horizontal if using front-facing camera
          if (facingMode === 'user') {
            ctx.translate(size, 0);
            ctx.scale(-1, 1);
          }

          const sx = (vw - size) / 2;
          const sy = (vh - size) / 2;
          ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);

          const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
          navigateTo('vision-result', {
            image: dataUrl,
            mode: 'diagnosis',
          });
        }
      } else {
        // Fallback to active sample if live video is not ready
        const sample = SAMPLE_CROPS[selectedSampleIndex];
        const dataUrl = await sampleUrlToDataUri(sample.imageUrl);
        navigateTo('vision-result', { image: dataUrl, mode: 'diagnosis' });
      }
    } catch (captureErr) {
      console.error('Capture failed:', captureErr);
      const sample = SAMPLE_CROPS[selectedSampleIndex];
      navigateTo('vision-result', { image: sample.imageUrl, mode: 'diagnosis' });
    } finally {
      setIsCapturing(false);
    }
  };

  // Upload Photo from File Picker
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          navigateTo('vision-result', {
            image: ev.target.result as string,
            mode: 'diagnosis',
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const activeSample = SAMPLE_CROPS[selectedSampleIndex];

  return (
    <div
      className="relative h-full w-full bg-slate-950 flex flex-col justify-between text-white overflow-hidden font-sans select-none"
      id="crop-scanner-viewport"
    >
      {/* Offscreen Canvas for High-Resolution Capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Hidden File Input for Device Upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* ── BACKGROUND VIEWPORT (Live Video Feed OR High-Res Sample Crop) ── */}
      <div className="absolute inset-0 z-0 bg-slate-950 flex items-center justify-center overflow-hidden">
        {cameraMode === 'live' ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transition-all duration-300 ${
                facingMode === 'user' ? 'scale-x-[-1]' : ''
              } ${brightnessBoost ? 'brightness-125 contrast-105' : ''}`}
            />

            {/* Spinner Overlay while Camera Hardware Boots */}
            {status === 'initializing' && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center gap-3 z-10">
                <RefreshCw size={36} className="text-emerald-400 animate-spin" />
                <p className="text-xs font-bold text-white tracking-wide">Starting Camera Stream...</p>
                <p className="text-[11px] text-white/60">Detecting sensor & autofocus</p>
              </div>
            )}
          </>
        ) : (
          /* Sample Crop Image Mode */
          <div className="relative w-full h-full flex items-center justify-center bg-slate-950">
            <img
              src={activeSample.imageUrl}
              alt={activeSample.name}
              className={`w-full h-full object-cover transition-all duration-300 ${
                brightnessBoost ? 'brightness-125 contrast-105' : ''
              }`}
            />
            {/* Sample Mode Label Badge */}
            <div className="absolute top-20 left-4 z-20 flex items-center gap-1.5 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full border border-emerald-500/40 text-[11px] font-bold text-emerald-300">
              <Leaf size={13} className="text-emerald-400" />
              <span>Sample Crop: {activeSample.crop}</span>
            </div>
          </div>
        )}
      </div>

      {/* ── TARGETING VIEWFINDER RETICLE (CSS Box-Shadow Cutout: NEVER GOES BLACK) ── */}
      <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center pb-12">
        <div
          className="relative w-[78%] max-w-[320px] aspect-[4/5] rounded-[32px] border-2 border-emerald-400/90 flex items-center justify-center transition-all"
          style={{
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.48)',
          }}
        >
          {/* Corner Focus Brackets */}
          <div className="absolute top-2 left-2 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl" />
          <div className="absolute top-2 right-2 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl" />
          <div className="absolute bottom-2 left-2 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl" />
          <div className="absolute bottom-2 right-2 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-xl" />

          {/* Active Scanning Laser Line */}
          <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] animate-scan-beam" />

          {/* Rule of Thirds Agricultural Framing Grid */}
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-20 pointer-events-none">
            <div className="border-r border-b border-white" />
            <div className="border-r border-b border-white" />
            <div className="border-b border-white" />
            <div className="border-r border-b border-white" />
            <div className="border-r border-b border-white" />
            <div className="border-b border-white" />
            <div className="border-r border-b border-white" />
            <div className="border-r border-b border-white" />
            <div />
          </div>

          {/* Center Target Focus Dot */}
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399] animate-pulse" />

          {/* Viewfinder Bottom Helper Badge */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/70 backdrop-blur-md px-3 py-1 rounded-full border border-white/15 text-[10px] font-bold text-white/90">
            {cameraMode === 'live' ? 'Align crop leaf inside frame' : activeSample.disease}
          </div>
        </div>
      </div>

      {/* Screen Illumination Border (When Brightness Boost is ON) */}
      {brightnessBoost && (
        <div className="absolute inset-0 border-[12px] border-white/80 pointer-events-none z-30 animate-pulse" />
      )}

      {/* ── TOP NAVIGATION & TOOLBAR ── */}
      <div className="relative z-20 w-full p-4 pt-10 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        {/* Back Button */}
        <button
          onClick={() => navigateTo('home')}
          className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center hover:bg-white/25 active:scale-95 transition-all text-white"
          title="Return to Home"
          id="scanner-back-btn"
        >
          <ArrowLeft size={20} />
        </button>

        {/* Center Mode Switcher Pill */}
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
            <CameraIcon size={13} />
            <span>Camera</span>
          </button>
          <button
            onClick={() => setCameraMode('sample')}
            className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all flex items-center gap-1.5 ${
              cameraMode === 'sample'
                ? 'bg-emerald-500 text-slate-950 shadow-xs'
                : 'text-white/70 hover:text-white'
            }`}
          >
            <Sparkles size={13} />
            <span>Sample Crops</span>
          </button>
        </div>

        {/* Right Tools: Flip Camera & Flash/Brightness */}
        <div className="flex items-center gap-1.5">
          {/* Flip Camera Button (Only in Live mode) */}
          {cameraMode === 'live' && hasMultipleCameras && (
            <button
              onClick={handleFlipCamera}
              className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center hover:bg-white/25 active:scale-95 transition-all text-white"
              title={facingMode === 'environment' ? 'Switch to Front Camera' : 'Switch to Rear Camera'}
              id="flip-camera-btn"
            >
              <SwitchCamera size={18} />
            </button>
          )}

          {/* Flash / Brightness Boost Toggle */}
          <button
            onClick={toggleTorch}
            className={`w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center active:scale-95 transition-all ${
              isTorchOn || brightnessBoost
                ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/30'
                : 'bg-white/15 hover:bg-white/25 text-white'
            }`}
            title={isTorchSupported ? 'Toggle Hardware Torch' : 'Toggle Brightness Fill'}
          >
            {isTorchOn || brightnessBoost ? <Zap size={18} /> : <ZapOff size={18} />}
          </button>
        </div>
      </div>

      {/* ── BANNER WHEN CAMERA ACCESS IS DENIED OR UNAVAILABLE ── */}
      {(status === 'denied' || status === 'error') && cameraMode === 'live' && (
        <div className="relative z-20 mx-4 bg-slate-900/95 border border-emerald-500/40 rounded-2xl p-3.5 shadow-2xl backdrop-blur-md flex flex-col gap-2.5">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <AlertCircle size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-white leading-snug">
                {status === 'denied' ? 'Camera Permission Blocked' : 'Camera Hardware Unavailable'}
              </h4>
              <p className="text-[11px] text-white/70 leading-relaxed mt-0.5">
                {errorMessage || 'Your browser blocked camera access. Tap below to use realistic plant samples or pick a photo.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => setCameraMode('sample')}
              className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Sparkles size={13} /> Use Sample Crops
            </button>
            <button
              onClick={() => startCamera(facingMode)}
              className="py-1.5 px-3 bg-white/15 hover:bg-white/25 text-white rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <RefreshCw size={13} /> Retry
            </button>
          </div>
        </div>
      )}

      {/* ── BOTTOM CONTROL TRAY & SHUTTER ── */}
      <div className="relative z-20 w-full p-4 pb-6 bg-gradient-to-t from-black/95 via-black/75 to-transparent flex flex-col gap-3">
        {/* Horizontal Sample Crop Picker (Visible in Sample mode, or when requested) */}
        {cameraMode === 'sample' && (
          <div className="w-full flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {SAMPLE_CROPS.map((crop, idx) => (
              <button
                key={crop.id}
                onClick={() => setSelectedSampleIndex(idx)}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border shrink-0 transition-all ${
                  selectedSampleIndex === idx
                    ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-md shadow-emerald-500/20'
                    : 'bg-black/50 border-white/15 text-white/70 hover:bg-white/10'
                }`}
              >
                <img
                  src={crop.imageUrl}
                  alt={crop.name}
                  className="w-7 h-7 rounded-lg object-cover border border-white/20 shrink-0"
                />
                <div className="text-left">
                  <p className="text-[11px] font-bold leading-tight">{crop.crop}</p>
                  <p className="text-[9px] text-emerald-300/80 leading-tight">{crop.tag}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Action Controls (Upload, Shutter, Sample Toggle) */}
        <div className="flex items-center justify-around max-w-xs mx-auto w-full pt-1">
          {/* Gallery / File Upload */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center gap-1.5 group active:scale-95 transition-transform"
            title="Upload photo from device"
            id="scanner-upload-btn"
          >
            <div className="w-12 h-12 rounded-full border border-white/30 bg-white/10 backdrop-blur-md flex items-center justify-center group-hover:bg-white/20 transition-colors">
              <Upload size={20} className="text-white" />
            </div>
            <span className="text-[10px] font-bold text-white/80">Upload</span>
          </button>

          {/* Primary Shutter Button */}
          <button
            onClick={handleCapture}
            disabled={isCapturing}
            className="w-20 h-20 rounded-full border-4 border-white/40 p-1 flex items-center justify-center active:scale-90 transition-transform shadow-[0_0_30px_rgba(52,211,153,0.35)]"
            title="Diagnose Leaf with AI"
            id="crop-shutter-trigger"
          >
            <div className="w-full h-full bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-98 transition-transform">
              <div className="w-14 h-14 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center">
                {isCapturing ? (
                  <RefreshCw size={20} className="text-white animate-spin" />
                ) : (
                  <ScanLine size={22} className="text-white drop-shadow-sm" />
                )}
              </div>
            </div>
          </button>

          {/* Mode Switcher Button */}
          <button
            onClick={() => {
              if (cameraMode === 'live') {
                setCameraMode('sample');
              } else {
                setCameraMode('live');
                startCamera(facingMode);
              }
            }}
            className="flex flex-col items-center gap-1.5 group active:scale-95 transition-transform"
            title="Toggle between Live Camera and Sample Crops"
          >
            <div className="w-12 h-12 rounded-full border border-white/30 bg-white/10 backdrop-blur-md flex items-center justify-center group-hover:bg-white/20 transition-colors">
              {cameraMode === 'live' ? (
                <Sparkles size={20} className="text-emerald-400" />
              ) : (
                <CameraIcon size={20} className="text-emerald-400" />
              )}
            </div>
            <span className="text-[10px] font-bold text-white/80">
              {cameraMode === 'live' ? 'Samples' : 'Live'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default VisionScreen;
