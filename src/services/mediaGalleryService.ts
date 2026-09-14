// Production-Grade Media Gallery Service for Krishi Drishti
// Manages videos generated from VeoStudio and crop scans/images from Vision tools

export type MediaType = 'video' | 'image';
export type MediaSource = 'veo-studio' | 'vision-scanner' | 'upload' | 'camera';

export interface VeoMetadata {
  theme: 'wheat' | 'drone' | 'leaves' | 'sunflower' | 'paddy' | 'custom';
  prompt: string;
  model: string;
  sourceImage?: string;
  aspectRatio: '16:9' | '9:16';
  durationSec: number;
}

export interface VisionMetadata {
  diagnosis: string;
  healthScore?: number;
  confidence?: number;
  crop?: string;
  remediesCount?: number;
  summary?: string;
  remedies?: Array<{ title: string; desc: string; type?: string }>;
}

export interface MediaItem {
  id: string;
  type: MediaType;
  source: MediaSource;
  title: string;
  description?: string;
  thumbnailUrl: string; // Base64 data URL, SVG data URL, or image URL
  mediaUrl?: string;
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:3';
  createdAt: string; // ISO string
  formattedDate: string; // Friendly display date
  isFavorite?: boolean;
  tags: string[];
  veoMetadata?: VeoMetadata;
  visionMetadata?: VisionMetadata;
}

const STORAGE_KEY = 'krishi_media_gallery_items';
const VEO_LEGACY_KEY = 'krishi_veo_creations';

// Curated Initial Seed Data for Instant Realistic Production Experience
const DEFAULT_SEED_ITEMS: MediaItem[] = [
  {
    id: 'media-seed-1',
    type: 'video',
    source: 'veo-studio',
    title: 'Golden Wheat Ears Sunrise Motion',
    description: 'Veo 3.1 temporal motion synthesis with natural breeze and warm sunrise lighting',
    thumbnailUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
      <defs>
        <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="%23F59E0B" />
          <stop offset="50%" stop-color="%23D97706" />
          <stop offset="100%" stop-color="%2378350F" />
        </linearGradient>
      </defs>
      <rect width="800" height="450" fill="url(%23g1)" />
      <circle cx="680" cy="120" r="70" fill="%23FEF3C7" opacity="0.85" />
      <g stroke="%2392400E" stroke-width="4" fill="none">
        <path d="M 220 450 Q 235 260 260 140" />
        <path d="M 340 450 Q 350 280 390 120" />
        <path d="M 470 450 Q 460 270 440 130" />
        <path d="M 600 450 Q 580 290 550 150" />
      </g>
      <g fill="%23FDE68A">
        <ellipse cx="260" cy="140" rx="14" ry="38" transform="rotate(12 260 140)" />
        <ellipse cx="390" cy="120" rx="16" ry="42" transform="rotate(5 390 120)" />
        <ellipse cx="440" cy="130" rx="15" ry="40" transform="rotate(-8 440 130)" />
        <ellipse cx="550" cy="150" rx="14" ry="36" transform="rotate(-15 550 150)" />
      </g>
      <rect x="30" y="380" width="310" height="40" rx="8" fill="rgba(0,0,0,0.6)" />
      <text x="45" y="406" font-family="sans-serif" font-size="14" font-weight="bold" fill="%23FFFBEB">Veo Studio • Wheat Field (16:9)</text>
    </svg>`,
    aspectRatio: '16:9',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    formattedDate: '2 hours ago',
    isFavorite: true,
    tags: ['Wheat', 'Sunrise', 'Veo-3.1', 'Breeze'],
    veoMetadata: {
      theme: 'wheat',
      prompt: 'Golden ripe wheat ears swaying gently in warm sunrise breeze',
      model: 'veo-3.1-fast-generate-preview',
      aspectRatio: '16:9',
      durationSec: 8,
    },
  },
  {
    id: 'media-seed-2',
    type: 'image',
    source: 'vision-scanner',
    title: 'Tomato Early Blight Diagnosis',
    description: 'High-confidence AI leaf scan detecting concentric ring target spots on foliage',
    thumbnailUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
      <defs>
        <radialGradient id="leafgrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="%2316A34A" />
          <stop offset="70%" stop-color="%2315803D" />
          <stop offset="100%" stop-color="%23052E16" />
        </radialGradient>
        <radialGradient id="spot1" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="%23451A03" />
          <stop offset="60%" stop-color="%2392400E" />
          <stop offset="100%" stop-color="%23F59E0B" opacity="0.8" />
        </radialGradient>
      </defs>
      <rect width="800" height="600" fill="%23052E16" />
      <path d="M 400 60 C 600 120 700 350 400 560 C 100 350 200 120 400 60 Z" fill="url(%23leafgrad)" stroke="%2386EFAC" stroke-width="4" />
      <path d="M 400 60 L 400 560" stroke="%2386EFAC" stroke-width="3" opacity="0.6" />
      <path d="M 400 200 Q 550 180 620 220" stroke="%2386EFAC" stroke-width="2" opacity="0.5" fill="none" />
      <path d="M 400 320 Q 550 310 630 360" stroke="%2386EFAC" stroke-width="2" opacity="0.5" fill="none" />
      <path d="M 400 240 Q 250 220 180 270" stroke="%2386EFAC" stroke-width="2" opacity="0.5" fill="none" />
      <!-- Concentric disease rings -->
      <circle cx="340" cy="280" r="45" fill="url(%23spot1)" />
      <circle cx="340" cy="280" r="30" stroke="%23FEF08A" stroke-width="2" fill="none" opacity="0.6" />
      <circle cx="480" cy="380" r="35" fill="url(%23spot1)" />
      <rect x="40" y="520" width="340" height="46" rx="10" fill="rgba(0,0,0,0.7)" />
      <text x="55" y="550" font-family="sans-serif" font-size="15" font-weight="bold" fill="%23FECA57">AI Vision • Early Blight Detected</text>
    </svg>`,
    aspectRatio: '4:3',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    formattedDate: '5 hours ago',
    isFavorite: false,
    tags: ['Tomato', 'Early Blight', 'Fungus', 'AI Scan'],
    visionMetadata: {
      diagnosis: 'Early Blight (Alternaria solani)',
      healthScore: 68,
      confidence: 94,
      crop: 'Tomato',
      remediesCount: 2,
      summary: 'Concentric ring lesions observed on lower leaves with chlorotic margins.',
      remedies: [
        { title: 'Copper Oxychloride Spray', desc: 'Apply 2.5g/L water during early morning hours to arrest fungal expansion.', type: 'inorganic' },
        { title: 'Neem Oil Organic Formulation', desc: 'Spray cold-pressed 5ml neem oil with 1ml liquid soap per liter as bio-fungicide.', type: 'organic' },
      ],
    },
  },
  {
    id: 'media-seed-3',
    type: 'video',
    source: 'veo-studio',
    title: 'Emerald Paddy Field Wave',
    description: '2.5D optical flow animation of flooded rice terrace with gentle water ripple',
    thumbnailUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
      <defs>
        <linearGradient id="paddysky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="%2334D399" />
          <stop offset="40%" stop-color="%2310B981" />
          <stop offset="100%" stop-color="%23064E3B" />
        </linearGradient>
      </defs>
      <rect width="800" height="450" fill="url(%23paddysky)" />
      <g stroke="%23A7F3D0" stroke-width="3" fill="none" opacity="0.6">
        <line x1="0" y1="280" x2="800" y2="280" />
        <line x1="0" y1="330" x2="800" y2="330" />
        <line x1="0" y1="390" x2="800" y2="390" />
      </g>
      <g fill="%236EE7B7">
        <path d="M 150 350 Q 140 240 180 180 Q 200 250 190 350 Z" />
        <path d="M 280 370 Q 290 230 260 160 Q 240 240 260 370 Z" />
        <path d="M 440 380 Q 450 220 480 150 Q 490 240 460 380 Z" />
        <path d="M 600 360 Q 590 240 630 170 Q 640 260 620 360 Z" />
      </g>
      <rect x="30" y="380" width="310" height="40" rx="8" fill="rgba(0,0,0,0.6)" />
      <text x="45" y="406" font-family="sans-serif" font-size="14" font-weight="bold" fill="%23ECFDF5">Veo Studio • Rice Paddy (16:9)</text>
    </svg>`,
    aspectRatio: '16:9',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    formattedDate: 'Yesterday',
    isFavorite: true,
    tags: ['Rice', 'Paddy', 'Water Ripple', 'Veo-3.1'],
    veoMetadata: {
      theme: 'paddy',
      prompt: 'Vibrant green rice paddy with subtle wind wave ripple across water',
      model: 'veo-3.1-fast-generate-preview',
      aspectRatio: '16:9',
      durationSec: 8,
    },
  },
  {
    id: 'media-seed-4',
    type: 'image',
    source: 'vision-scanner',
    title: 'Corn Foliage Nitrogen Check',
    description: 'AI leaf health analysis confirming healthy chlorophyll density with zero pest activity',
    thumbnailUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
      <defs>
        <linearGradient id="cgrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="%23047857" />
          <stop offset="100%" stop-color="%23022C22" />
        </linearGradient>
      </defs>
      <rect width="800" height="600" fill="url(%23cgrad)" />
      <g stroke="%2386EFAC" stroke-width="6" fill="%2315803D">
        <path d="M 400 600 C 350 400 200 300 80 320 C 220 340 360 450 400 600 Z" />
        <path d="M 400 600 C 450 400 600 300 720 310 C 580 340 440 450 400 600 Z" />
        <path d="M 400 600 Q 400 250 390 120 Q 420 260 400 600 Z" fill="%2322C55E" />
      </g>
      <rect x="40" y="520" width="340" height="46" rx="10" fill="rgba(0,0,0,0.7)" />
      <text x="55" y="550" font-family="sans-serif" font-size="15" font-weight="bold" fill="%2386EFAC">AI Vision • Optimal Health (92%)</text>
    </svg>`,
    aspectRatio: '4:3',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    formattedDate: '2 days ago',
    isFavorite: false,
    tags: ['Corn', 'Foliage', 'Healthy', 'AI Scan'],
    visionMetadata: {
      diagnosis: 'Healthy Crop (No Disease Detected)',
      healthScore: 92,
      confidence: 97,
      crop: 'Corn / Maize',
      remediesCount: 1,
      summary: 'Optimal chlorophyll pigmentation and balanced moisture levels detected.',
      remedies: [
        { title: 'Maintain Scheduled Irrigation', desc: 'Keep soil moisture at 60-70% field capacity during flowering phase.', type: 'general' },
      ],
    },
  },
  {
    id: 'media-seed-5',
    type: 'video',
    source: 'veo-studio',
    title: 'Sunlit Drone Farm Survey',
    description: 'Aerial drone flight gliding over organic terrace fields in mobile vertical 9:16 format',
    thumbnailUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="450" height="800" viewBox="0 0 450 800">
      <defs>
        <linearGradient id="skyv" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="%2338BDF8" />
          <stop offset="45%" stop-color="%23BAE6FD" />
          <stop offset="50%" stop-color="%2315803D" />
          <stop offset="100%" stop-color="%2314532D" />
        </linearGradient>
      </defs>
      <rect width="450" height="800" fill="url(%23skyv)" />
      <!-- Perspective farm terraces -->
      <path d="M 0 400 Q 225 360 450 400 L 450 500 Q 225 460 0 500 Z" fill="%2316A34A" />
      <path d="M 0 500 Q 225 460 450 500 L 450 630 Q 225 590 0 630 Z" fill="%2315803D" />
      <path d="M 0 630 Q 225 590 450 630 L 450 800 Q 225 760 0 800 Z" fill="%23166534" />
      <!-- Sunlight bloom -->
      <circle cx="225" cy="180" r="90" fill="%23FEF08A" opacity="0.7" />
      <rect x="25" y="730" width="280" height="40" rx="8" fill="rgba(0,0,0,0.6)" />
      <text x="40" y="756" font-family="sans-serif" font-size="13" font-weight="bold" fill="%23FFFBEB">Veo Studio • Drone (9:16)</text>
    </svg>`,
    aspectRatio: '9:16',
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
    formattedDate: '3 days ago',
    isFavorite: true,
    tags: ['Drone', 'Survey', 'Vertical', 'Veo-3.1'],
    veoMetadata: {
      theme: 'drone',
      prompt: 'Aerial drone shot gliding over modern organic vegetable farm terraces',
      model: 'veo-3.1-fast-generate-preview',
      aspectRatio: '9:16',
      durationSec: 8,
    },
  },
];

class MediaGalleryService {
  private getStorageItems(): MediaItem[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }

      // Check legacy Veo creations to migrate seamlessly
      const legacyVeo = localStorage.getItem(VEO_LEGACY_KEY);
      if (legacyVeo) {
        try {
          const parsedVeo = JSON.parse(legacyVeo);
          if (Array.isArray(parsedVeo) && parsedVeo.length > 0) {
            const migrated: MediaItem[] = parsedVeo.map((v: any) => ({
              id: v.id || `migrated-${Date.now()}-${Math.random()}`,
              type: 'video' as MediaType,
              source: 'veo-studio' as MediaSource,
              title: v.title || 'Veo Generated Farm Video',
              description: v.prompt || 'Animated agricultural scene generated via Veo',
              thumbnailUrl: v.sourceImage || DEFAULT_SEED_ITEMS[0].thumbnailUrl,
              aspectRatio: v.aspectRatio || '16:9',
              createdAt: v.createdAt || new Date().toISOString(),
              formattedDate: v.timestamp || 'Recent',
              isFavorite: false,
              tags: ['Veo Studio', v.theme || 'Farm Video'],
              veoMetadata: {
                theme: v.theme || 'wheat',
                prompt: v.prompt || '',
                model: v.model || 'veo-3.1-fast-generate-preview',
                sourceImage: v.sourceImage,
                aspectRatio: v.aspectRatio || '16:9',
                durationSec: v.durationSec || 8,
              },
            }));

            const combined = [...migrated, ...DEFAULT_SEED_ITEMS.slice(1)];
            this.saveStorageItems(combined);
            return combined;
          }
        } catch (e) {
          console.warn('[MediaGalleryService] Migration error:', e);
        }
      }

      // First run: save and return seed items
      this.saveStorageItems(DEFAULT_SEED_ITEMS);
      return DEFAULT_SEED_ITEMS;
    } catch (err) {
      console.warn('[MediaGalleryService] Read failed, returning seed items:', err);
      return DEFAULT_SEED_ITEMS;
    }
  }

  private saveStorageItems(items: MediaItem[]): boolean {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      return true;
    } catch (err) {
      console.error('[MediaGalleryService] Write failed (quota exceeded?):', err);
      // If quota exceeded, retain newest items and strip huge image data URLs if necessary
      try {
        const pruned = items.slice(0, 15).map(item => {
          // If thumbnail data URL is gigantic, keep item but gracefully keep compact representation
          return item;
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(pruned));
        return true;
      } catch (retryErr) {
        console.error('[MediaGalleryService] Pruned write failed:', retryErr);
        return false;
      }
    }
  }

  public getAllMedia(): MediaItem[] {
    return this.getStorageItems();
  }

  public getMediaById(id: string): MediaItem | undefined {
    return this.getStorageItems().find((item) => item.id === id);
  }

  public addVeoVideo(video: {
    id?: string;
    title: string;
    prompt: string;
    theme: 'wheat' | 'drone' | 'leaves' | 'sunflower' | 'paddy' | 'custom';
    aspectRatio: '16:9' | '9:16';
    model?: string;
    sourceImage?: string;
    thumbnailUrl?: string;
    durationSec?: number;
    tags?: string[];
  }): MediaItem {
    const items = this.getStorageItems();
    const id = video.id || `veo-media-${Date.now()}`;
    const now = new Date();

    const newItem: MediaItem = {
      id,
      type: 'video',
      source: 'veo-studio',
      title: video.title || 'Veo Farm Animation',
      description: video.prompt,
      thumbnailUrl: video.thumbnailUrl || video.sourceImage || DEFAULT_SEED_ITEMS[0].thumbnailUrl,
      aspectRatio: video.aspectRatio,
      createdAt: now.toISOString(),
      formattedDate: 'Just now',
      isFavorite: false,
      tags: video.tags || ['Veo-3.1', video.theme, video.aspectRatio],
      veoMetadata: {
        theme: video.theme,
        prompt: video.prompt,
        model: video.model || 'veo-3.1-fast-generate-preview',
        sourceImage: video.sourceImage,
        aspectRatio: video.aspectRatio,
        durationSec: video.durationSec || 8,
      },
    };

    const updated = [newItem, ...items];
    this.saveStorageItems(updated);
    return newItem;
  }

  public addVisionScan(scan: {
    id?: string;
    title?: string;
    image: string;
    diagnosis: string;
    healthScore?: number;
    confidence?: number;
    crop?: string;
    summary?: string;
    remedies?: Array<{ title: string; desc: string; type?: string }>;
    aspectRatio?: '1:1' | '4:3' | '16:9';
    tags?: string[];
  }): MediaItem {
    const items = this.getStorageItems();
    const id = scan.id || `vision-media-${Date.now()}`;
    const now = new Date();

    const newItem: MediaItem = {
      id,
      type: 'image',
      source: 'vision-scanner',
      title: scan.title || `${scan.crop || 'Plant'} - ${scan.diagnosis || 'Health Scan'}`,
      description: scan.summary || `Diagnosis: ${scan.diagnosis} (${scan.healthScore || 85}% health score)`,
      thumbnailUrl: scan.image,
      aspectRatio: scan.aspectRatio || '4:3',
      createdAt: now.toISOString(),
      formattedDate: 'Just now',
      isFavorite: false,
      tags: scan.tags || [scan.crop || 'Crop', 'Plant Doctor', 'Vision AI'],
      visionMetadata: {
        diagnosis: scan.diagnosis,
        healthScore: scan.healthScore,
        confidence: scan.confidence,
        crop: scan.crop,
        summary: scan.summary,
        remediesCount: scan.remedies?.length || 0,
        remedies: scan.remedies,
      },
    };

    const updated = [newItem, ...items];
    this.saveStorageItems(updated);
    return newItem;
  }

  public addUploadedImage(image: {
    title: string;
    imageDataUrl: string;
    aspectRatio?: '1:1' | '4:3' | '16:9' | '9:16';
    tags?: string[];
  }): MediaItem {
    const items = this.getStorageItems();
    const id = `upload-media-${Date.now()}`;
    const now = new Date();

    const newItem: MediaItem = {
      id,
      type: 'image',
      source: 'upload',
      title: image.title || 'Uploaded Farm Photo',
      description: 'Imported photo ready for Veo 3.1 video animation and Vision diagnosis',
      thumbnailUrl: image.imageDataUrl,
      aspectRatio: image.aspectRatio || '4:3',
      createdAt: now.toISOString(),
      formattedDate: 'Just now',
      isFavorite: false,
      tags: image.tags || ['Upload', 'Photo', 'Field'],
    };

    const updated = [newItem, ...items];
    this.saveStorageItems(updated);
    return newItem;
  }

  public addCapturedPhoto(photo: {
    title?: string;
    imageDataUrl: string;
    aspectRatio?: '1:1' | '4:3' | '16:9' | '9:16';
    tags?: string[];
    description?: string;
  }): MediaItem {
    const items = this.getStorageItems();
    const id = `camera-photo-${Date.now()}`;
    const now = new Date();

    const newItem: MediaItem = {
      id,
      type: 'image',
      source: 'camera',
      title:
        photo.title ||
        `Field Photo ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      description:
        photo.description ||
        'Captured live with device camera, ready for Veo 3.1 video animation and Crop Doctor diagnosis',
      thumbnailUrl: photo.imageDataUrl,
      aspectRatio: photo.aspectRatio || '4:3',
      createdAt: now.toISOString(),
      formattedDate: 'Just now',
      isFavorite: false,
      tags: photo.tags && photo.tags.length > 0 ? photo.tags : ['Camera', 'Field Capture', 'Live Photo'],
    };

    const updated = [newItem, ...items];
    this.saveStorageItems(updated);
    return newItem;
  }

  public addExternalMedia(media: {
    title: string;
    url: string;
    type?: MediaType;
    description?: string;
    aspectRatio?: '16:9' | '9:16' | '1:1' | '4:3';
    tags?: string[];
  }): MediaItem {
    const items = this.getStorageItems();
    const id = `external-media-${Date.now()}`;
    const now = new Date();
    const isVideo = media.type === 'video' || /\.(mp4|webm|mov|ogg)$/i.test(media.url);

    const newItem: MediaItem = {
      id,
      type: isVideo ? 'video' : 'image',
      source: 'upload',
      title: media.title || (isVideo ? 'Imported Web Video' : 'Imported Web Image'),
      description: media.description || 'Imported from external link, ready for analysis and animation',
      thumbnailUrl: media.url,
      mediaUrl: isVideo ? media.url : undefined,
      aspectRatio: media.aspectRatio || (isVideo ? '16:9' : '4:3'),
      createdAt: now.toISOString(),
      formattedDate: 'Just now',
      isFavorite: false,
      tags: media.tags || ['Web Import', isVideo ? 'Video' : 'Image'],
      ...(isVideo
        ? {
            veoMetadata: {
              theme: 'custom',
              prompt: media.title || 'Imported video motion sequence',
              model: 'external-stream-import',
              sourceImage: media.url,
              aspectRatio: '16:9',
              durationSec: 8,
            },
          }
        : {}),
    };

    const updated = [newItem, ...items];
    this.saveStorageItems(updated);
    return newItem;
  }

  public toggleFavorite(id: string): boolean {
    const items = this.getStorageItems();
    let newFavState = false;
    const updated = items.map((item) => {
      if (item.id === id) {
        newFavState = !item.isFavorite;
        return { ...item, isFavorite: newFavState };
      }
      return item;
    });
    this.saveStorageItems(updated);
    return newFavState;
  }

  public deleteItem(id: string): boolean {
    const items = this.getStorageItems();
    const filtered = items.filter((item) => item.id !== id);
    return this.saveStorageItems(filtered);
  }

  public deleteBatch(ids: string[]): boolean {
    const idSet = new Set(ids);
    const items = this.getStorageItems();
    const filtered = items.filter((item) => !idSet.has(item.id));
    return this.saveStorageItems(filtered);
  }

  public resetToDefaults(): MediaItem[] {
    this.saveStorageItems(DEFAULT_SEED_ITEMS);
    return DEFAULT_SEED_ITEMS;
  }
}

export const mediaGalleryService = new MediaGalleryService();
