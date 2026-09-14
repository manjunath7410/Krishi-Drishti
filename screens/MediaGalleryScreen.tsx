import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Film,
  Image as ImageIcon,
  Trash2,
  Share2,
  Download,
  Heart,
  Play,
  Pause,
  Maximize2,
  Minimize2,
  Search,
  Grid,
  List,
  Sparkles,
  Plus,
  Check,
  CheckSquare,
  Square,
  X,
  Eye,
  ScanLine,
  Leaf,
  Calendar,
  Clock,
  RefreshCw,
  Info,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Upload,
  AlertTriangle,
  ShieldCheck,
  Droplets,
  Tag,
  Link as LinkIcon,
  Globe,
  Camera,
  Layers,
  FileVideo
} from 'lucide-react';
import { Screen } from '../types';
import { mediaGalleryService, MediaItem, MediaType } from '../src/services/mediaGalleryService';
import { FarmMotionCanvas } from './VeoStudioScreen';
import { CameraCaptureModal, DEFAULT_CAMERA_CONSTRAINTS } from '../components/CameraCaptureModal';

export { CameraCaptureModal, DEFAULT_CAMERA_CONSTRAINTS };

// Efficient camera constraints configuration for mobile rear/field photography:
// Uses { facingMode: 'environment', width: { ideal: 1280 } } without rigid height constraints
// to allow mobile devices to negotiate native sensor aspect ratio and avoid black screen issues.
export const EFFICIENT_CAMERA_CONSTRAINTS: MediaStreamConstraints = {
  video: {
    facingMode: 'environment',
    width: { ideal: 1280 },
  },
  audio: false,
};

// Helper for initializing camera stream with efficient constraints
export const initializeCameraStream = async (
  facingMode: 'environment' | 'user' = 'environment'
): Promise<MediaStream> => {
  return navigator.mediaDevices.getUserMedia({
    video: {
      facingMode,
      width: { ideal: 1280 },
    },
    audio: false,
  });
};

interface MediaGalleryScreenProps {
  navigateTo: (screen: Screen, data?: any) => void;
  t?: any;
}

type FilterCategory = 'all' | 'video' | 'image' | 'favorites';
type ViewMode = 'grid' | 'compact' | 'list';
type SortOption = 'newest' | 'oldest' | 'name';
type ImportTab = 'device' | 'url' | 'presets';

export const MediaGalleryScreen: React.FC<MediaGalleryScreenProps> = ({ navigateTo, t }) => {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<FilterCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Multi-select state
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Active viewing/playing modal
  const [activeMedia, setActiveMedia] = useState<MediaItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [playProgress, setPlayProgress] = useState(0);
  const [isTheater, setIsTheater] = useState(false);

  // Delete confirmation modals
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<MediaItem | null>(null);
  const [batchDeleteModalOpen, setBatchDeleteModalOpen] = useState(false);

  // Direct Upload / Import Center State
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [importTab, setImportTab] = useState<ImportTab>('device');
  const [importUrl, setImportUrl] = useState('');
  const [importTitle, setImportTitle] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Live Camera (MediaDevices API) State
  const [cameraModalOpen, setCameraModalOpen] = useState(false);

  // Callback when a photo is captured & saved via CameraCaptureModal
  const handlePhotoSavedFromCamera = (newItem: MediaItem, action?: 'view' | 'veo' | 'vision') => {
    refreshMedia();
    if (action === 'veo') {
      navigateTo('veo-studio');
    } else if (action === 'vision') {
      navigateTo('vision-result', { image: newItem.thumbnailUrl, mode: 'diagnosis' });
    } else {
      setActiveMedia(newItem);
    }
  };

  // Toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Canvas ref callback for active video export
  const activeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Load items from service
  const refreshMedia = () => {
    const data = mediaGalleryService.getAllMedia();
    setItems(data);
  };

  useEffect(() => {
    refreshMedia();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Toggle favorite
  const handleToggleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newStatus = mediaGalleryService.toggleFavorite(id);
    refreshMedia();
    if (activeMedia && activeMedia.id === id) {
      setActiveMedia((prev) => (prev ? { ...prev, isFavorite: newStatus } : null));
    }
    showToast(newStatus ? 'Added to favorites' : 'Removed from favorites');
  };

  // Handle single delete
  const handleDeleteConfirm = () => {
    if (!deleteConfirmTarget) return;
    const targetId = deleteConfirmTarget.id;
    mediaGalleryService.deleteItem(targetId);
    setDeleteConfirmTarget(null);
    if (activeMedia?.id === targetId) {
      setActiveMedia(null);
    }
    refreshMedia();
    showToast('Media item deleted');
  };

  // Handle batch delete
  const handleBatchDeleteConfirm = () => {
    const ids: string[] = Array.from(selectedIds);
    if (ids.length === 0) return;
    mediaGalleryService.deleteBatch(ids);
    setSelectedIds(new Set());
    setIsSelectMode(false);
    setBatchDeleteModalOpen(false);
    refreshMedia();
    showToast(`Deleted ${ids.length} items`);
  };

  // Toggle selection for an item
  const toggleSelectItem = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Select all or deselect all
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map((item) => item.id)));
    }
  };

  // Direct file upload handler (Photos or Videos from device local storage)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert the selected file to a local object URL for immediate display
    const objectUrl = URL.createObjectURL(file);
    const isVideo = file.type.startsWith('video/');
    const fileName = file.name.replace(/\.[^/.]+$/, '') || (isVideo ? 'Local Video' : 'Local Photo');
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);

    let newItem: MediaItem;
    if (isVideo) {
      newItem = mediaGalleryService.addExternalMedia({
        title: fileName,
        url: objectUrl,
        type: 'video',
        description: `Imported video from device local storage (${fileSizeMB} MB)`,
        tags: ['Device Upload', 'Video', 'Local Storage'],
      });
    } else {
      newItem = mediaGalleryService.addUploadedImage({
        title: fileName,
        imageDataUrl: objectUrl,
        tags: ['Device Upload', 'Photo', 'Local Storage'],
      });
    }

    refreshMedia();
    setUploadModalOpen(false);
    setActiveMedia(newItem);
    showToast(isVideo ? 'Video imported from local storage!' : 'Photo uploaded from local storage!');

    // Reset file input value so user can select the same file again if desired
    if (e.target) {
      e.target.value = '';
    }
  };

  // Web URL / External link import handler
  const handleUrlImport = () => {
    if (!importUrl.trim()) {
      setImportError('Please enter a valid image or video URL');
      return;
    }

    try {
      new URL(importUrl.trim());
    } catch {
      setImportError('Please enter a valid HTTP/HTTPS web URL');
      return;
    }

    setIsImporting(true);
    setImportError(null);

    const isVideo = /\.(mp4|webm|mov|ogg)($|\?)/i.test(importUrl);
    const cleanTitle = importTitle.trim() || (isVideo ? 'Imported Web Video' : 'Imported Farm Image');

    try {
      const newItem = mediaGalleryService.addExternalMedia({
        title: cleanTitle,
        url: importUrl.trim(),
        type: isVideo ? 'video' : 'image',
        description: `Imported from external URL, ready for Veo Studio & Crop Doctor`,
        tags: ['Web URL', isVideo ? 'Video' : 'Image'],
      });

      refreshMedia();
      setImportUrl('');
      setImportTitle('');
      setIsImporting(false);
      setUploadModalOpen(false);
      setActiveMedia(newItem);
      showToast('Media imported from web successfully!');
    } catch (err) {
      console.error('URL import error:', err);
      setImportError('Could not import media from this URL. Please check the link.');
      setIsImporting(false);
    }
  };

  // Curated Preset Import Handler
  const handlePresetImport = (preset: {
    title: string;
    url: string;
    type: MediaType;
    tags: string[];
    description: string;
  }) => {
    const newItem = mediaGalleryService.addExternalMedia({
      title: preset.title,
      url: preset.url,
      type: preset.type,
      description: preset.description,
      tags: ['Preset', ...preset.tags],
    });

    refreshMedia();
    setUploadModalOpen(false);
    setActiveMedia(newItem);
    showToast(`Loaded "${preset.title}" into gallery!`);
  };

  // Share handler
  const handleShare = async (item: MediaItem) => {
    const shareText = `Check out this ${item.type === 'video' ? 'AI Farm Video' : 'Crop Diagnostic Scan'} from Krishi Drishti: ${item.title}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: item.title,
          text: shareText,
          url: window.location.href,
        });
        showToast('Shared successfully!');
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          copyToClipboard(shareText);
        }
      }
    } else {
      copyToClipboard(shareText);
    }
  };

  const copyToClipboard = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
      showToast('Link copied to clipboard!');
    } else {
      showToast('Sharing ready');
    }
  };

  // Download media (Video as WebM/MP4 or Image as PNG)
  const handleDownloadMedia = async (item: MediaItem) => {
    if (item.type === 'video') {
      const canvas = activeCanvasRef.current;
      if (!canvas) {
        // Fallback to static frame download if canvas is not actively mounted
        const a = document.createElement('a');
        a.href = item.thumbnailUrl;
        a.download = `${item.title.replace(/\s+/g, '_')}_poster.png`;
        a.click();
        showToast('Saved video poster frame');
        return;
      }

      setIsExporting(true);
      try {
        const stream = canvas.captureStream(30);
        let mimeType = 'video/webm;codecs=vp9';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/webm';
        }

        const recorder = new MediaRecorder(stream, { mimeType });
        const chunks: Blob[] = [];

        recorder.ondataavailable = (ev) => {
          if (ev.data && ev.data.size > 0) chunks.push(ev.data);
        };

        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: mimeType });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${item.title.replace(/\s+/g, '_')}_Veo.webm`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(url), 2000);
          setIsExporting(false);
          showToast('Video downloaded successfully!');
        };

        recorder.start();
        setTimeout(() => {
          if (recorder.state === 'recording') {
            recorder.stop();
          }
        }, 3500);
      } catch (e) {
        console.error('Video download error:', e);
        // Fallback: download thumbnail
        const a = document.createElement('a');
        a.href = item.thumbnailUrl;
        a.download = `${item.title.replace(/\s+/g, '_')}_frame.png`;
        a.click();
        setIsExporting(false);
        showToast('Saved HD frame snapshot');
      }
    } else {
      // Download image
      const a = document.createElement('a');
      a.href = item.thumbnailUrl;
      a.download = `${item.title.replace(/\s+/g, '_')}_scan.png`;
      a.click();
      showToast('Image downloaded!');
    }
  };

  // Filter and sort items
  const filteredItems = items
    .filter((item) => {
      // Category filter
      if (selectedFilter === 'video' && item.type !== 'video') return false;
      if (selectedFilter === 'image' && item.type !== 'image') return false;
      if (selectedFilter === 'favorites' && !item.isFavorite) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const inTitle = item.title.toLowerCase().includes(query);
        const inDesc = item.description?.toLowerCase().includes(query);
        const inTags = item.tags.some((t) => t.toLowerCase().includes(query));
        const inPrompt = item.veoMetadata?.prompt.toLowerCase().includes(query);
        const inDiagnosis = item.visionMetadata?.diagnosis.toLowerCase().includes(query);
        const inCrop = item.visionMetadata?.crop?.toLowerCase().includes(query);
        return inTitle || inDesc || inTags || inPrompt || inDiagnosis || inCrop;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === 'name') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

  // Next / Previous item in modal
  const currentIndex = activeMedia ? filteredItems.findIndex((i) => i.id === activeMedia.id) : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < filteredItems.length - 1;

  const navigateModal = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && hasPrev) {
      setActiveMedia(filteredItems[currentIndex - 1]);
    } else if (direction === 'next' && hasNext) {
      setActiveMedia(filteredItems[currentIndex + 1]);
    }
  };

  // Counts for filter pills
  const totalCount = items.length;
  const videoCount = items.filter((i) => i.type === 'video').length;
  const imageCount = items.filter((i) => i.type === 'image').length;
  const favCount = items.filter((i) => i.isFavorite).length;

  return (
    <div className="min-h-full bg-slate-50 font-sans pb-24 relative flex flex-col text-slate-900 select-none">
      {/* Hidden file input element for selecting and uploading photos or videos from local storage */}
      <input
        id="gallery-file-input"
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 py-3.5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => navigateTo('home')}
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors active:scale-95"
              aria-label="Back to home"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-slate-900 tracking-tight">Media Gallery</h1>
                <span className="text-[11px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  {items.length}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium">Veo Studio videos & Vision scans</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Direct Device Upload Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs active:scale-95 border border-emerald-200"
              title="Upload Photos or Videos from Device Storage"
              id="gallery-upload-btn"
            >
              <Upload size={15} className="text-emerald-600" />
              <span className="hidden sm:inline">Upload</span>
            </button>

            {/* Live Camera Capture Button (MediaDevices API) */}
            <button
              onClick={() => setCameraModalOpen(true)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 border border-slate-800"
              title="Capture Photo with Device Camera"
              id="gallery-camera-btn"
            >
              <Camera size={15} className="text-emerald-400" />
              <span className="hidden sm:inline">Camera</span>
            </button>

            {/* Multi-select toggle */}
            <button
              onClick={() => {
                setIsSelectMode(!isSelectMode);
                setSelectedIds(new Set());
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                isSelectMode
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {isSelectMode ? (
                <>
                  <X size={14} /> Done
                </>
              ) : (
                <>
                  <CheckSquare size={14} /> Select
                </>
              )}
            </button>

            {/* Quick Add Button */}
            <button
              onClick={() => setUploadModalOpen(true)}
              className="w-9 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 active:scale-95 transition-transform"
              title="Add New Creation"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-3 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by prompt, diagnosis, or crop..."
            className="w-full pl-9 pr-8 py-2 bg-slate-100 hover:bg-slate-100/80 focus:bg-white text-xs font-medium rounded-xl border border-transparent focus:border-emerald-500 focus:outline-none transition-all placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter Pills & View Toggle */}
        <div className="flex items-center justify-between gap-2 mt-3 pt-1 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5">
            {[
              { id: 'all', label: 'All', count: totalCount },
              { id: 'video', label: 'Videos', icon: Film, count: videoCount },
              { id: 'image', label: 'Images', icon: ImageIcon, count: imageCount },
              { id: 'favorites', label: 'Favorites', icon: Heart, count: favCount },
            ].map((f) => {
              const active = selectedFilter === f.id;
              const IconComp = f.icon;
              return (
                <button
                  key={f.id}
                  onClick={() => setSelectedFilter(f.id as FilterCategory)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    active
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
                  }`}
                >
                  {IconComp && <IconComp size={12} className={active ? 'text-emerald-400' : ''} />}
                  <span>{f.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                      active ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {f.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg flex-shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'grid' ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-500'
              }`}
              title="2-Column Grid"
            >
              <Grid size={14} />
            </button>
            <button
              onClick={() => setViewMode('compact')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'compact' ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-500'
              }`}
              title="3-Column Compact"
            >
              <span className="text-[10px] font-black px-0.5">3×3</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'list' ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-500'
              }`}
              title="Detail List"
            >
              <List size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* ── MULTI-SELECT STICKY ACTION BAR ── */}
      <AnimatePresence>
        {isSelectMode && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="sticky top-[138px] z-30 bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center justify-between shadow-xs overflow-hidden"
          >
            <div className="flex items-center gap-2">
              <button
                onClick={toggleSelectAll}
                className="text-xs font-bold text-amber-900 hover:text-amber-950 flex items-center gap-1"
              >
                {selectedIds.size === filteredItems.length && filteredItems.length > 0 ? (
                  <CheckSquare size={16} className="text-amber-700" />
                ) : (
                  <Square size={16} className="text-amber-700" />
                )}
                {selectedIds.size === filteredItems.length ? 'Deselect All' : 'Select All'}
              </button>
              <span className="text-xs font-semibold text-amber-800">
                ({selectedIds.size} of {filteredItems.length} selected)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={selectedIds.size === 0}
                onClick={() => setBatchDeleteModalOpen(true)}
                className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                  selectedIds.size > 0
                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-xs'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Trash2 size={13} /> Delete ({selectedIds.size})
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MAIN MEDIA CONTENT AREA ── */}
      <main className="p-4 flex-1">
        {filteredItems.length === 0 ? (
          /* Empty State */
          <div className="min-h-[360px] flex flex-col items-center justify-center text-center p-8 bg-white rounded-3xl border border-dashed border-slate-300 my-6">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
              <ImageIcon size={30} />
            </div>
            <h3 className="text-base font-black text-slate-800 mb-1">No Media Found</h3>
            <p className="text-xs text-slate-500 max-w-xs mb-6">
              {searchQuery
                ? `No media matches "${searchQuery}". Try different keywords.`
                : selectedFilter === 'favorites'
                ? 'You have not favorited any videos or images yet.'
                : 'Create videos in Veo Studio or scan crops with Vision Doctor to populate your gallery.'}
            </p>

            <div className="flex flex-col gap-2.5 w-full max-w-xs">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-colors active:scale-95"
                id="empty-upload-btn"
              >
                <Upload size={16} />
                <span>Upload Photos or Videos from Device</span>
              </button>
              <button
                onClick={() => setCameraModalOpen(true)}
                className="w-full py-2.5 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-colors active:scale-95"
                id="empty-camera-btn"
              >
                <Camera size={16} className="text-emerald-400" />
                <span>Take Photo with Camera</span>
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => navigateTo('veo-studio')}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Film size={14} /> Veo Studio
                </button>
                <button
                  onClick={() => navigateTo('vision')}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <ScanLine size={14} /> AI Doctor
                </button>
              </div>
              <button
                onClick={() => {
                  mediaGalleryService.resetToDefaults();
                  refreshMedia();
                  showToast('Reset to demo sample creations');
                }}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
              >
                Restore Demo Samples
              </button>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          /* ── 2-COLUMN GRID VIEW ── */
          <div className="grid grid-cols-2 gap-3.5">
            {filteredItems.map((item) => {
              const isSelected = selectedIds.has(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (isSelectMode) {
                      toggleSelectItem(item.id);
                    } else {
                      setActiveMedia(item);
                    }
                  }}
                  className={`group relative bg-white rounded-2xl overflow-hidden border transition-all cursor-pointer shadow-xs hover:shadow-md ${
                    isSelected
                      ? 'border-amber-500 ring-2 ring-amber-400'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Thumbnail Image / Container */}
                  <div
                    className={`relative w-full overflow-hidden bg-slate-900 ${
                      item.aspectRatio === '9:16'
                        ? 'aspect-[9/16]'
                        : item.aspectRatio === '1:1'
                        ? 'aspect-square'
                        : 'aspect-[16/9]'
                    }`}
                  >
                    <img
                      src={item.thumbnailUrl}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />

                    {/* Dark gradient shadow */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/25 pointer-events-none" />

                    {/* Multi-Select Checkbox in Corner */}
                    {isSelectMode && (
                      <div
                        onClick={(e) => toggleSelectItem(item.id, e)}
                        className="absolute top-2 left-2 z-20 w-6 h-6 rounded-lg bg-black/60 backdrop-blur-md flex items-center justify-center cursor-pointer text-white"
                      >
                        {isSelected ? (
                          <div className="w-5 h-5 bg-amber-500 rounded-md flex items-center justify-center">
                            <Check size={14} className="text-white stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-md border-2 border-white/80" />
                        )}
                      </div>
                    )}

                    {/* Top Badges */}
                    <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
                      {/* Favorite Button */}
                      <button
                        onClick={(e) => handleToggleFavorite(e, item.id)}
                        className={`w-7 h-7 rounded-full backdrop-blur-md flex items-center justify-center transition-all ${
                          item.isFavorite
                            ? 'bg-rose-500 text-white'
                            : 'bg-black/40 text-white/90 hover:bg-black/60'
                        }`}
                        title={item.isFavorite ? 'Remove Favorite' : 'Add to Favorites'}
                      >
                        <Heart size={13} fill={item.isFavorite ? 'currentColor' : 'none'} />
                      </button>
                    </div>

                    {/* Type Badge & Duration */}
                    <div className="absolute top-2 left-2 flex items-center gap-1 z-10 pointer-events-none">
                      {!isSelectMode && (
                        <span
                          className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md backdrop-blur-md text-white flex items-center gap-1 ${
                            item.type === 'video'
                              ? 'bg-emerald-600/80 shadow-xs'
                              : 'bg-blue-600/80'
                          }`}
                        >
                          {item.type === 'video' ? <Film size={10} /> : <Leaf size={10} />}
                          {item.type === 'video' ? 'Veo 3.1' : 'Vision'}
                        </span>
                      )}
                    </div>

                    {/* Play Overlay for Videos */}
                    {item.type === 'video' && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-10 h-10 rounded-full bg-emerald-600/90 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                          <Play size={18} className="fill-white translate-x-0.5" />
                        </div>
                      </div>
                    )}

                    {/* Bottom Metadata inside thumbnail */}
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white text-[10px] font-semibold">
                      <span className="truncate max-w-[70%] opacity-90">{item.formattedDate}</span>
                      {item.type === 'video' && (
                        <span className="bg-black/60 px-1.5 py-0.5 rounded text-[9px] font-mono">
                          0:08
                        </span>
                      )}
                      {item.visionMetadata?.healthScore !== undefined && (
                        <span className="bg-emerald-600/90 px-1.5 py-0.5 rounded text-[9px] font-extrabold flex items-center gap-0.5">
                          <ShieldCheck size={9} /> {item.visionMetadata.healthScore}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Bottom Body */}
                  <div className="p-3">
                    <h4 className="text-xs font-black text-slate-800 line-clamp-1 mb-1">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-tight mb-2.5 font-normal">
                      {item.description || item.veoMetadata?.prompt || item.visionMetadata?.diagnosis}
                    </p>

                    {/* Quick Card Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-slate-400">
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          {item.aspectRatio}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShare(item);
                          }}
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors"
                          title="Share"
                        >
                          <Share2 size={13} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmTarget(item);
                          }}
                          className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : viewMode === 'compact' ? (
          /* ── 3-COLUMN COMPACT VIEW ── */
          <div className="grid grid-cols-3 gap-2">
            {filteredItems.map((item) => {
              const isSelected = selectedIds.has(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (isSelectMode) {
                      toggleSelectItem(item.id);
                    } else {
                      setActiveMedia(item);
                    }
                  }}
                  className={`relative aspect-square rounded-xl overflow-hidden bg-slate-900 cursor-pointer group shadow-xs ${
                    isSelected ? 'ring-3 ring-amber-500' : ''
                  }`}
                >
                  <img
                    src={item.thumbnailUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  {/* Play icon badge */}
                  {item.type === 'video' && (
                    <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-emerald-600/90 text-white flex items-center justify-center">
                      <Play size={10} className="fill-white translate-x-0.2" />
                    </div>
                  )}

                  {item.isFavorite && (
                    <div className="absolute top-1.5 right-1.5 text-rose-500">
                      <Heart size={12} fill="currentColor" />
                    </div>
                  )}

                  {isSelectMode && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div
                        className={`w-6 h-6 rounded-md flex items-center justify-center ${
                          isSelected ? 'bg-amber-500 text-white' : 'border-2 border-white'
                        }`}
                      >
                        {isSelected && <Check size={14} className="stroke-[3]" />}
                      </div>
                    </div>
                  )}

                  <div className="absolute bottom-1 left-1.5 right-1.5">
                    <p className="text-[10px] font-bold text-white line-clamp-1 leading-tight">
                      {item.title}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ── DETAIL LIST VIEW ── */
          <div className="space-y-2.5">
            {filteredItems.map((item) => {
              const isSelected = selectedIds.has(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (isSelectMode) {
                      toggleSelectItem(item.id);
                    } else {
                      setActiveMedia(item);
                    }
                  }}
                  className={`flex items-center gap-3 p-2.5 bg-white rounded-2xl border transition-all cursor-pointer hover:border-slate-300 shadow-xs ${
                    isSelected
                      ? 'border-amber-500 ring-2 ring-amber-400'
                      : 'border-slate-200'
                  }`}
                >
                  {/* Select Checkbox */}
                  {isSelectMode && (
                    <div
                      onClick={(e) => toggleSelectItem(item.id, e)}
                      className="flex-shrink-0 cursor-pointer"
                    >
                      {isSelected ? (
                        <CheckSquare size={20} className="text-amber-600" />
                      ) : (
                        <Square size={20} className="text-slate-400" />
                      )}
                    </div>
                  )}

                  {/* Thumbnail */}
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-900 flex-shrink-0">
                    <img
                      src={item.thumbnailUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    {item.type === 'video' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow">
                          <Play size={12} className="fill-white translate-x-0.2" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span
                        className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${
                          item.type === 'video'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {item.type === 'video' ? 'Veo Video' : 'AI Scan'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {item.formattedDate}
                      </span>
                    </div>

                    <h4 className="text-xs font-black text-slate-900 truncate mb-1">
                      {item.title}
                    </h4>

                    <p className="text-[11px] text-slate-500 line-clamp-1 leading-snug">
                      {item.description || item.veoMetadata?.prompt || item.visionMetadata?.diagnosis}
                    </p>

                    {item.tags.length > 0 && (
                      <div className="flex items-center gap-1 mt-1.5 overflow-hidden">
                        {item.tags.slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            className="text-[9px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded truncate"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right Actions */}
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <button
                      onClick={(e) => handleToggleFavorite(e, item.id)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        item.isFavorite
                          ? 'text-rose-500 bg-rose-50'
                          : 'text-slate-400 hover:text-slate-700 bg-slate-50'
                      }`}
                    >
                      <Heart size={14} fill={item.isFavorite ? 'currentColor' : 'none'} />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmTarget(item);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ── FULLSCREEN MEDIA INSPECT & PLAYER MODAL ── */}
      <AnimatePresence>
        {activeMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between overflow-hidden"
          >
            {/* Modal Top Bar */}
            <div className="px-4 py-3 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between text-white z-30">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => {
                    setActiveMedia(null);
                    setIsTheater(false);
                  }}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="min-w-0">
                  <h3 className="text-sm font-black truncate">{activeMedia.title}</h3>
                  <div className="flex items-center gap-2 text-[10px] text-white/70">
                    <span>{activeMedia.formattedDate}</span>
                    <span>•</span>
                    <span className="uppercase">{activeMedia.aspectRatio}</span>
                    <span>•</span>
                    <span className="capitalize">{activeMedia.source.replace('-', ' ')}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => handleToggleFavorite(e, activeMedia.id)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                    activeMedia.isFavorite
                      ? 'bg-rose-600 text-white'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                  title="Favorite"
                >
                  <Heart size={16} fill={activeMedia.isFavorite ? 'currentColor' : 'none'} />
                </button>

                <button
                  onClick={() => handleShare(activeMedia)}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                  title="Share"
                >
                  <Share2 size={16} />
                </button>

                <button
                  onClick={() => setDeleteConfirmTarget(activeMedia)}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-red-600 flex items-center justify-center text-white transition-colors"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Modal Media Stage (Video or Image) */}
            <div className="relative flex-1 flex items-center justify-center p-4 overflow-hidden">
              {/* Prev / Next Buttons */}
              {hasPrev && (
                <button
                  onClick={() => navigateModal('prev')}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-all"
                >
                  <ChevronLeft size={24} />
                </button>
              )}
              {hasNext && (
                <button
                  onClick={() => navigateModal('next')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-all"
                >
                  <ChevronRight size={24} />
                </button>
              )}

              {activeMedia.type === 'video' ? (
                /* ── VIDEO PLAYER STAGE ── */
                <div
                  className={`relative overflow-hidden rounded-2xl bg-black shadow-2xl border border-white/10 flex items-center justify-center ${
                    activeMedia.aspectRatio === '9:16'
                      ? 'w-[320px] max-w-[90vw] aspect-[9/16]'
                      : 'w-[680px] max-w-[92vw] aspect-[16/9]'
                  }`}
                >
                  <FarmMotionCanvas
                    theme={(activeMedia.veoMetadata?.theme as any) || 'wheat'}
                    aspectRatio={activeMedia.aspectRatio === '9:16' ? '9:16' : '16:9'}
                    isPlaying={isPlaying}
                    sourceImage={activeMedia.veoMetadata?.sourceImage || activeMedia.thumbnailUrl}
                    onProgress={(prog) => setPlayProgress(prog)}
                    canvasRefCallback={(el) => {
                      activeCanvasRef.current = el;
                    }}
                  />

                  {/* Video Overlay Watermark */}
                  <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-white flex items-center gap-1.5 border border-white/10 pointer-events-none">
                    <Film size={12} className="text-emerald-400" />
                    <span>Veo 3.1 Fast Preview</span>
                  </div>

                  {/* Center Play/Pause button on tap */}
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="absolute inset-0 w-full h-full flex items-center justify-center group bg-black/0 hover:bg-black/20 transition-colors"
                  >
                    {!isPlaying && (
                      <div className="w-16 h-16 rounded-full bg-emerald-600/90 text-white flex items-center justify-center shadow-2xl scale-110 transition-transform">
                        <Play size={28} className="fill-white translate-x-1" />
                      </div>
                    )}
                  </button>

                  {/* Scrubber Progress Bar at bottom of video */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent flex flex-col gap-1.5 pointer-events-auto">
                    <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full transition-all duration-100"
                        style={{ width: `${playProgress * 100}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-white text-[11px] font-mono">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setIsPlaying(!isPlaying)}
                          className="hover:text-emerald-400 transition-colors p-1"
                        >
                          {isPlaying ? <Pause size={14} /> : <Play size={14} className="fill-white" />}
                        </button>
                        <span>
                          {`00:0${Math.floor(playProgress * 8)} / 00:08`}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setIsPlaying(true)}
                          className="hover:text-emerald-400 transition-colors p-1"
                          title="Replay"
                        >
                          <RefreshCw size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* ── IMAGE / CROP SCAN STAGE ── */
                <div className="relative max-w-full max-h-full flex items-center justify-center">
                  <img
                    src={activeMedia.thumbnailUrl}
                    alt={activeMedia.title}
                    className="max-h-[68vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl border border-white/10"
                  />
                </div>
              )}
            </div>

            {/* Modal Bottom Drawer (Details & Quick Actions) */}
            <div className="px-5 py-4 bg-slate-900 border-t border-white/10 text-white z-30">
              <div className="max-w-xl mx-auto flex flex-col gap-3">
                {/* Description / Prompt / Diagnosis */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    {activeMedia.veoMetadata?.prompt && (
                      <div className="mb-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1 mb-0.5">
                          <Sparkles size={11} /> Veo Scene Prompt:
                        </span>
                        <p className="text-xs text-white/90 leading-relaxed font-medium">
                          "{activeMedia.veoMetadata.prompt}"
                        </p>
                      </div>
                    )}

                    {activeMedia.visionMetadata && (
                      <div className="mb-2 bg-white/5 p-3 rounded-xl border border-white/10">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <Leaf size={14} className="text-emerald-400" />
                            <span className="text-xs font-black text-white">
                              {activeMedia.visionMetadata.diagnosis}
                            </span>
                          </div>
                          {activeMedia.visionMetadata.healthScore !== undefined && (
                            <span className="text-xs font-bold bg-emerald-900/80 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                              Health Score: {activeMedia.visionMetadata.healthScore}%
                            </span>
                          )}
                        </div>
                        {activeMedia.visionMetadata.summary && (
                          <p className="text-[11px] text-white/70 leading-relaxed">
                            {activeMedia.visionMetadata.summary}
                          </p>
                        )}
                      </div>
                    )}

                    {activeMedia.tags && activeMedia.tags.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {activeMedia.tags.map((tag, i) => (
                          <span
                            key={i}
                            className="text-[10px] font-semibold text-white/60 bg-white/10 px-2 py-0.5 rounded-md"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  {/* Download Button */}
                  <button
                    disabled={isExporting}
                    onClick={() => handleDownloadMedia(activeMedia)}
                    className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    {isExporting ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" /> Recording MP4...
                      </>
                    ) : (
                      <>
                        <Download size={14} />
                        {activeMedia.type === 'video' ? 'Download Video (MP4/WebM)' : 'Download Image'}
                      </>
                    )}
                  </button>

                  {/* If image, provide "Animate with Veo" and "Crop Doctor" buttons */}
                  {activeMedia.type === 'image' && (
                    <>
                      <button
                        onClick={() => {
                          navigateTo('veo-studio');
                        }}
                        className="py-3 px-3 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-xl shadow-lg flex items-center justify-center gap-1.5 transition-all active:scale-95 flex-shrink-0"
                      >
                        <Film size={14} /> Animate in Veo
                      </button>
                      <button
                        onClick={() => {
                          navigateTo('vision');
                        }}
                        className="py-3 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl shadow-lg flex items-center justify-center gap-1.5 transition-all active:scale-95 flex-shrink-0"
                      >
                        <ScanLine size={14} /> Crop Doctor
                      </button>
                    </>
                  )}

                  {/* Share button */}
                  <button
                    onClick={() => handleShare(activeMedia)}
                    className="py-3 px-4 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Share2 size={14} /> Share
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SINGLE DELETE CONFIRMATION MODAL ── */}
      <AnimatePresence>
        {deleteConfirmTarget && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={28} />
              </div>
              <h3 className="text-base font-black text-slate-900 mb-1">Delete Creation?</h3>
              <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                Are you sure you want to delete <strong className="text-slate-700">"{deleteConfirmTarget.title}"</strong>? This item will be permanently removed from your gallery.
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDeleteConfirmTarget(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-500/20 transition-colors"
                >
                  Yes, Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── BATCH DELETE CONFIRMATION MODAL ── */}
      <AnimatePresence>
        {batchDeleteModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
                <Trash2 size={28} />
              </div>
              <h3 className="text-base font-black text-slate-900 mb-1">Delete {selectedIds.size} Items?</h3>
              <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                All {selectedIds.size} selected creations will be permanently removed from your Media Gallery.
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setBatchDeleteModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBatchDeleteConfirm}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-500/20 transition-colors"
                >
                  Delete Selected
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MULTI-SOURCE IMPORT & UPLOAD MODAL ── */}
      <AnimatePresence>
        {uploadModalOpen && (
          <div
            onClick={() => setUploadModalOpen(false)}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 sm:p-4"
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-5 max-w-md w-full shadow-2xl max-h-[90vh] flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3.5 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Upload size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Import & Add Media</h3>
                    <p className="text-[10px] text-slate-500 font-medium">Add photos & videos to use in Veo Studio & Crop Doctor</p>
                  </div>
                </div>
                <button
                  onClick={() => setUploadModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Source Tabs */}
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl mb-4">
                <button
                  onClick={() => setImportTab('device')}
                  className={`py-2 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    importTab === 'device'
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Camera size={14} className={importTab === 'device' ? 'text-emerald-600' : ''} />
                  <span>Device & Camera</span>
                </button>
                <button
                  onClick={() => setImportTab('url')}
                  className={`py-2 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    importTab === 'url'
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Globe size={14} className={importTab === 'url' ? 'text-emerald-600' : ''} />
                  <span>Web URL</span>
                </button>
                <button
                  onClick={() => setImportTab('presets')}
                  className={`py-2 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    importTab === 'presets'
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Layers size={14} className={importTab === 'presets' ? 'text-emerald-600' : ''} />
                  <span>Presets</span>
                </button>
              </div>

              {/* Tab Contents */}
              <div className="overflow-y-auto flex-1 pr-0.5 space-y-3">
                {/* ── TAB 1: DEVICE / LOCAL GALLERY / CAMERA ── */}
                {importTab === 'device' && (
                  <div className="space-y-3">
                    {/* Live Camera Launcher Card (MediaDevices API) */}
                    <button
                      onClick={() => {
                        setUploadModalOpen(false);
                        setCameraModalOpen(true);
                      }}
                      className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 text-white flex items-center justify-between shadow-lg shadow-slate-950/20 active:scale-[0.99] transition-all border border-slate-700/60"
                      id="import-modal-camera-btn"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center flex-shrink-0 shadow-md">
                          <Camera size={22} />
                        </div>
                        <div className="text-left">
                          <div className="text-xs font-black flex items-center gap-1.5">
                            <span>Open Device Camera</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.2 bg-emerald-500/30 text-emerald-300 rounded border border-emerald-400/40">
                              Live
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 mt-0.5">
                            Capture field photo with MediaDevices API & add to gallery
                          </p>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-slate-400" />
                    </button>

                    {/* Primary Drop / File Select Button */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/60 hover:bg-emerald-50 rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group active:scale-[0.99]"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 group-hover:scale-105 transition-transform">
                        <Upload size={24} />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900">Choose Photos or Videos</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Tap to browse from phone gallery, camera, or PC folder
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 bg-white px-2.5 py-1 rounded-full border border-emerald-200 text-[10px] font-bold text-emerald-700">
                        <span>JPG, PNG, WEBP, MP4, WebM</span>
                      </div>
                    </div>

                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1 pt-1">
                      Or Launch Application Tools
                    </div>

                    {/* App Tool Shortcuts */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          setUploadModalOpen(false);
                          navigateTo('veo-studio');
                        }}
                        className="p-3 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-left transition-colors flex flex-col gap-1.5"
                      >
                        <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center">
                          <Film size={16} />
                        </div>
                        <div>
                          <div className="text-xs font-black text-amber-950">Veo Video Studio</div>
                          <div className="text-[10px] text-amber-700">Animate farm photos</div>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setUploadModalOpen(false);
                          navigateTo('vision');
                        }}
                        className="p-3 rounded-2xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-left transition-colors flex flex-col gap-1.5"
                      >
                        <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                          <ScanLine size={16} />
                        </div>
                        <div>
                          <div className="text-xs font-black text-blue-950">AI Crop Doctor</div>
                          <div className="text-[10px] text-blue-700">Scan leaves for pests</div>
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {/* ── TAB 2: WEB URL IMPORT ── */}
                {importTab === 'url' && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Image or Video URL
                      </label>
                      <div className="relative">
                        <input
                          type="url"
                          placeholder="https://images.unsplash.com/... or https://...video.mp4"
                          value={importUrl}
                          onChange={(e) => {
                            setImportUrl(e.target.value);
                            setImportError(null);
                          }}
                          className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <LinkIcon size={14} className="absolute left-3 top-3 text-slate-400" />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Paste any public image link from Unsplash, Google Drive, Wikimedia, or farm websites.
                      </p>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Title / Description (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., North Field Sunflower Canopy"
                        value={importTitle}
                        onChange={(e) => setImportTitle(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    {/* Live URL Preview */}
                    {importUrl.trim().length > 10 && (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                          Live Link Preview
                        </div>
                        {/\.(mp4|webm|mov|ogg)($|\?)/i.test(importUrl) ? (
                          <div className="aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center text-white">
                            <video src={importUrl} controls className="w-full h-full object-contain" />
                          </div>
                        ) : (
                          <div className="aspect-video bg-slate-200 rounded-lg overflow-hidden relative">
                            <img
                              src={importUrl}
                              alt="Preview"
                              className="w-full h-full object-cover"
                              onError={() => setImportError('Unable to load image from this URL. Please verify the link.')}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {importError && (
                      <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-[11px] font-bold text-red-700">
                        <AlertTriangle size={14} className="text-red-500 flex-shrink-0" />
                        <span>{importError}</span>
                      </div>
                    )}

                    <button
                      disabled={isImporting || !importUrl.trim()}
                      onClick={handleUrlImport}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                      {isImporting ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          <span>Importing Media...</span>
                        </>
                      ) : (
                        <>
                          <Check size={14} />
                          <span>Save to Media Gallery</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* ── TAB 3: CURATED FARM PRESETS ── */}
                {importTab === 'presets' && (
                  <div className="space-y-2.5">
                    <p className="text-[11px] text-slate-500">
                      Tap any high-definition agricultural sample to instantly import it into your gallery:
                    </p>

                    {[
                      {
                        title: 'Golden Wheat Sunset Drone Sweep',
                        url: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1200&auto=format&fit=crop&q=80',
                        type: 'image' as MediaType,
                        category: 'Wheat Crop',
                        tags: ['Wheat', 'Sunset', 'Field'],
                        description: 'High-resolution ripe wheat crop ready for Veo 3.1 cinematic motion synthesis',
                      },
                      {
                        title: 'Paddy Rice Terraced Nursery',
                        url: 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?w=1200&auto=format&fit=crop&q=80',
                        type: 'image' as MediaType,
                        category: 'Paddy',
                        tags: ['Rice', 'Paddy', 'Water'],
                        description: 'Terraced green paddy crop ready for AI growth analysis & moisture monitoring',
                      },
                      {
                        title: 'Commercial Fruit Orchard Aerial',
                        url: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?w=1200&auto=format&fit=crop&q=80',
                        type: 'image' as MediaType,
                        category: 'Orchard',
                        tags: ['Drone', 'Orchard', 'Canopy'],
                        description: 'Autonomous drone grid inspection imagery for canopy and tree count verification',
                      },
                      {
                        title: 'Tomato Foliage Early Blight Leaf',
                        url: 'https://images.unsplash.com/photo-1592417817098-8f3d6ef2c6e6?w=1200&auto=format&fit=crop&q=80',
                        type: 'image' as MediaType,
                        category: 'Pathology Scan',
                        tags: ['Tomato', 'Leaf', 'Pathology'],
                        description: 'Close-up leaf imagery showing fungal concentric rings ready for Crop Doctor AI',
                      },
                      {
                        title: 'Summer Sunflowers in Full Bloom',
                        url: 'https://images.unsplash.com/photo-1470246973918-29a93221c455?w=1200&auto=format&fit=crop&q=80',
                        type: 'image' as MediaType,
                        category: 'Flower / Oilseed',
                        tags: ['Sunflower', 'Bloom', 'Pollination'],
                        description: 'Vibrant heliotropic sunflower heads ideal for 360° inspection rendering',
                      },
                    ].map((preset, idx) => (
                      <div
                        key={idx}
                        onClick={() => handlePresetImport(preset)}
                        className="p-2.5 rounded-2xl bg-slate-50 hover:bg-emerald-50/70 border border-slate-200 hover:border-emerald-300 cursor-pointer transition-all flex items-center gap-3 group"
                      >
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-200 flex-shrink-0 relative">
                          <img
                            src={preset.url}
                            alt={preset.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-extrabold px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded">
                              {preset.category}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-900 truncate mt-0.5">
                            {preset.title}
                          </h4>
                          <p className="text-[10px] text-slate-500 truncate mt-0.5">
                            {preset.description}
                          </p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-white group-hover:bg-emerald-600 text-slate-400 group-hover:text-white flex items-center justify-center shadow-xs transition-colors flex-shrink-0">
                          <Plus size={16} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── FLOATING CAMERA CAPTURE BUTTON ── */}
      {!activeMedia && !uploadModalOpen && !cameraModalOpen && !batchDeleteModalOpen && !deleteConfirmTarget && (
        <button
          onClick={() => setCameraModalOpen(true)}
          className="fixed bottom-6 right-6 z-30 flex items-center gap-2.5 px-4 py-3.5 bg-slate-900 hover:bg-black text-white font-black text-xs rounded-2xl shadow-2xl shadow-slate-950/40 active:scale-95 transition-all border border-slate-700/80 group"
          title="Open Live Camera"
          id="gallery-floating-camera-btn"
        >
          <div className="w-6 h-6 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
            <Camera size={15} />
          </div>
          <span className="tracking-wide">Capture Photo</span>
        </button>
      )}

      {/* ── LIVE CAMERA CAPTURE MODAL (MediaDevices API) ── */}
      <CameraCaptureModal
        isOpen={cameraModalOpen}
        onClose={() => setCameraModalOpen(false)}
        onPhotoSaved={handlePhotoSavedFromCamera}
        showToast={showToast}
      />

      {/* ── TOAST NOTIFICATION ── */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-xl border border-slate-700 text-xs font-bold flex items-center gap-2 pointer-events-none"
          >
            <Check size={14} className="text-emerald-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default MediaGalleryScreen;
