import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ScanLine,
  TrendingUp,
  Satellite,
  Radio,
  Sprout,
  Activity,
  BookOpen,
  Umbrella,
  Droplets,
  Grid3x3,
  Film,
  Image as ImageIcon,
  Link2,
  Building2,
  Calendar,
  MessageCircle,
  Mic,
  Sun,
  MapPin,
  X,
  Sparkles,
  PhoneCall,
  ExternalLink,
  ChevronRight,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { Screen } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (screen: Screen) => void;
  onOpenVoice: () => void;
  currentLang?: string;
}

interface CommandItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'Diagnostic & Field' | 'Market & Finance' | 'Carbon & Science' | 'Traceability & Corporate' | 'AI & Emergency';
  icon: any;
  iconBg: string;
  iconColor: string;
  badge?: string;
  action: () => void;
  keywords: string[];
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenVoice,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const items: CommandItem[] = useMemo(() => [
    {
      id: 'scan',
      title: 'AI Crop Disease Scanner',
      subtitle: 'Instant leaf diagnosis using Gemini Multimodal Vision',
      category: 'Diagnostic & Field',
      icon: ScanLine,
      iconBg: '#E8FBF3',
      iconColor: '#00BB78',
      badge: 'Gemini 2.5',
      action: () => onNavigate('vision'),
      keywords: ['disease', 'pest', 'leaf', 'camera', 'fungus', 'scanner', 'photo', 'diagnosis', 'crop health']
    },
    {
      id: 'market',
      title: 'Mandi Live Rates & AI Price Predictor',
      subtitle: 'APMC mandi spot prices, MSP comparison & hold/sell forecast',
      category: 'Market & Finance',
      icon: TrendingUp,
      iconBg: '#FFFBEB',
      iconColor: '#D97706',
      badge: 'Live APMC',
      action: () => onNavigate('market'),
      keywords: ['mandi', 'market', 'prices', 'cotton', 'soybean', 'wheat', 'msp', 'rates', 'sell', 'buy', 'trade']
    },
    {
      id: 'satellite',
      title: 'Satellite Field Monitor (NDVI)',
      subtitle: 'Vegetation index, chlorophyll absorption & plot stress mapping',
      category: 'Diagnostic & Field',
      icon: Satellite,
      iconBg: '#EEF2FF',
      iconColor: '#4F46E5',
      badge: 'Sentinel-2',
      action: () => onNavigate('field-monitor'),
      keywords: ['satellite', 'ndvi', 'field', 'stress', 'chlorophyll', 'moisture', 'map', 'sentinel']
    },
    {
      id: 'voice',
      title: 'Krishi Multilingual Voice Assistant',
      subtitle: 'Hands-free agro copilot in Hindi, Marathi, Telugu & 12 languages',
      category: 'AI & Emergency',
      icon: Mic,
      iconBg: '#FDF2F8',
      iconColor: '#DB2777',
      badge: 'Real-time',
      action: onOpenVoice,
      keywords: ['voice', 'mic', 'speak', 'hindi', 'marathi', 'talk', 'assistant', 'audio', 'bol ke puchho']
    },
    {
      id: 'acoustic',
      title: 'Bioacoustic Stem & Root Pest Scanner',
      subtitle: 'Listen to frequency vibration of stem borers & subsoil grubs',
      category: 'Diagnostic & Field',
      icon: Radio,
      iconBg: '#FEF3C7',
      iconColor: '#B45309',
      badge: 'Bioacoustics',
      action: () => onNavigate('acoustic-scanner'),
      keywords: ['acoustic', 'sound', 'audio', 'frequency', 'stem borer', 'grub', 'pest', 'listen']
    },
    {
      id: 'irrigation',
      title: 'Smart Irrigation & Evapotranspiration',
      subtitle: 'Dynamic crop water requirement & automated valve scheduling',
      category: 'Diagnostic & Field',
      icon: Droplets,
      iconBg: '#E0F2FE',
      iconColor: '#0284C7',
      action: () => onNavigate('smart-irrigation'),
      keywords: ['water', 'irrigation', 'moisture', 'evapotranspiration', 'valves', 'drip', 'sprinkler']
    },
    {
      id: 'soil-carbon',
      title: 'Soil Organic Carbon (SOC) Model',
      subtitle: 'RothC biogeochemical model & carbon sequestration forecasting',
      category: 'Carbon & Science',
      icon: Activity,
      iconBg: '#ECFDF5',
      iconColor: '#059669',
      badge: 'Verra / Gold Std',
      action: () => onNavigate('soil-carbon'),
      keywords: ['soil', 'carbon', 'soc', 'organic', 'sequestration', 'rothc', 'climate', 'credits']
    },
    {
      id: 'carbon-vault',
      title: 'Carbon Vault & Credit Monetization',
      subtitle: 'Trade verified agricultural carbon offsets at $18-$32/tCO2e',
      category: 'Carbon & Science',
      icon: Sprout,
      iconBg: '#ECFDF5',
      iconColor: '#10B981',
      badge: 'Monetize',
      action: () => onNavigate('carbon-vault'),
      keywords: ['vault', 'carbon credits', 'esg', 'earnings', 'wallet', 'co2', 'offset']
    },
    {
      id: 'schemes',
      title: 'Scheme Setu (Govt Subsidies)',
      subtitle: 'PM-KISAN, PMFBY, Soil Health Card & drip irrigation subsidies',
      category: 'Market & Finance',
      icon: BookOpen,
      iconBg: '#F3F4F6',
      iconColor: '#374151',
      badge: 'DBT Direct',
      action: () => onNavigate('scheme-setu'),
      keywords: ['scheme', 'pm kisan', 'subsidy', 'government', 'dbt', 'fertilizer', 'kalia', 'rythu bharosa']
    },
    {
      id: 'insurance',
      title: 'Crop Insurance (PMFBY Hub)',
      subtitle: 'Satellite parametric claims, loss assessment & instant filing',
      category: 'Market & Finance',
      icon: Umbrella,
      iconBg: '#F0FDF4',
      iconColor: '#16A34A',
      action: () => onNavigate('insurance'),
      keywords: ['insurance', 'pmfby', 'claim', 'loss', 'flood', 'drought', 'hailstorm', 'compensation']
    },
    {
      id: 'traceability',
      title: 'Harvest Token Blockchain Traceability',
      subtitle: 'Mint cryptographic seed-to-fork QR tokens for premium exports',
      category: 'Traceability & Corporate',
      icon: Link2,
      iconBg: '#F5F3FF',
      iconColor: '#7C3AED',
      badge: 'CBAM Ready',
      action: () => onNavigate('traceability'),
      keywords: ['blockchain', 'traceability', 'qr', 'mint', 'export', 'token', 'harvest', 'certificate', 'origin']
    },
    {
      id: 'digital-twin',
      title: 'Digital Twin 3D Farm Simulator',
      subtitle: 'Visual layout of micro-plots, sensor nodes & canopy health',
      category: 'Diagnostic & Field',
      icon: Grid3x3,
      iconBg: '#EFF6FF',
      iconColor: '#2563EB',
      action: () => onNavigate('digital-twin'),
      keywords: ['digital twin', '3d', 'farm layout', 'sensors', 'mesh', 'simulator']
    },
    {
      id: 'veo',
      title: 'Veo 3 AI Farm Video Studio',
      subtitle: 'Generate cinematic agro-tutorials & animate field inspection photos',
      category: 'Traceability & Corporate',
      icon: Film,
      iconBg: '#FDF4FF',
      iconColor: '#C026D3',
      badge: 'Veo 3',
      action: () => onNavigate('veo-studio'),
      keywords: ['veo', 'video', 'studio', 'generate', 'animate', 'animation', 'media']
    },
    {
      id: 'crop-cycle',
      title: 'Crop Cycle & Fertilizer Scheduler',
      subtitle: 'Stage-wise sowing, NPK split application & harvest countdown',
      category: 'Diagnostic & Field',
      icon: Calendar,
      iconBg: '#FEF9C3',
      iconColor: '#CA8A04',
      action: () => onNavigate('crop-cycle'),
      keywords: ['crop cycle', 'fertilizer', 'npk', 'sowing', 'harvest', 'timeline', 'schedule']
    },
    {
      id: 'corporate',
      title: 'Corporate Agritech & ESG Command',
      subtitle: 'Enterprise supply-chain footprint, regional yields & procurement',
      category: 'Traceability & Corporate',
      icon: Building2,
      iconBg: '#F8FAFC',
      iconColor: '#0F172A',
      badge: 'Enterprise',
      action: () => onNavigate('corporate-dashboard'),
      keywords: ['corporate', 'enterprise', 'esg', 'fpo', 'procurement', 'yield', 'analytics']
    },
    {
      id: 'kisan-sos',
      title: 'Kisan Emergency SOS Helpline (1800-180-1551)',
      subtitle: 'Direct toll-free connection to Government Agronomists & KVKs',
      category: 'AI & Emergency',
      icon: PhoneCall,
      iconBg: '#FEE2E2',
      iconColor: '#DC2626',
      badge: 'Toll-Free',
      action: () => {
        window.open('tel:18001801551');
      },
      keywords: ['sos', 'emergency', 'helpline', 'call', 'kisan call centre', 'phone', 'expert']
    },
    {
      id: 'monitoring',
      title: 'Reliability & Sentry Error Monitoring',
      subtitle: 'Real-time telemetry, crash reporting, promise rejection trap & web vitals',
      category: 'Traceability & Corporate',
      icon: ShieldCheck,
      iconBg: '#ECFDF5',
      iconColor: '#059669',
      badge: 'Telemetry',
      action: () => onNavigate('monitoring'),
      keywords: ['sentry', 'monitoring', 'error', 'reliability', 'crash', 'vitals', 'telemetry', 'logs', 'latency', 'health']
    }
  ], [onNavigate, onOpenVoice]);

  const filteredItems = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase().trim();
    return items.filter(
      item =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.keywords.some(k => k.includes(q))
    );
  }, [items, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle palette on Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }

      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          filteredItems[selectedIndex].action();
          onClose();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-start justify-center p-3 sm:p-6 sm:pt-20">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-md"
      />

      {/* Modal Dialog */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-10 flex flex-col max-h-[85vh]"
        style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
      >
        {/* Search Input Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50/50">
          <Search size={20} className="text-emerald-600 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search any tool, crop, disease, scheme, or mandi rate (e.g. 'Cotton', 'Blight', 'Carbon')..."
            className="flex-1 bg-transparent text-sm sm:text-base font-medium text-gray-900 placeholder-gray-400 outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-200/60"
            >
              <X size={16} />
            </button>
          )}
          <div className="hidden sm:flex items-center gap-1 bg-gray-200/70 px-2 py-1 rounded-lg text-[10px] font-mono text-gray-600">
            <span>ESC</span>
          </div>
        </div>

        {/* Quick Category Chips */}
        <div className="px-5 py-2.5 border-b border-gray-100 bg-white flex items-center gap-2 overflow-x-auto no-scrollbar text-xs">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
            Popular:
          </span>
          {[
            { label: 'Leaf Scanner', q: 'scanner' },
            { label: 'Mandi Rates', q: 'mandi' },
            { label: 'Soil Carbon', q: 'carbon' },
            { label: 'Satellite NDVI', q: 'satellite' },
            { label: 'Govt Schemes', q: 'scheme' },
            { label: 'Emergency SOS', q: 'sos' },
          ].map(chip => (
            <button
              key={chip.label}
              onClick={() => setQuery(chip.q)}
              className="px-2.5 py-1 rounded-full bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 text-gray-600 font-medium text-[11px] whitespace-nowrap transition-colors"
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-1 divide-y divide-gray-50">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 mx-auto mb-3">
                <Search size={22} />
              </div>
              <p className="text-sm font-semibold text-gray-800">No agronomy tools found for "{query}"</p>
              <p className="text-xs text-gray-400 mt-1">Try searching "disease", "irrigation", "mandi", or ask our AI Voice Copilot.</p>
              <button
                onClick={() => {
                  onClose();
                  onOpenVoice();
                }}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors"
              >
                <Mic size={14} />
                Ask Voice Copilot
              </button>
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const isSelected = index === selectedIndex;
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    item.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center gap-3.5 p-3 rounded-2xl cursor-pointer transition-all ${
                    isSelected ? 'bg-emerald-50/80 border border-emerald-200/80 shadow-sm' : 'hover:bg-gray-50/80 border border-transparent'
                  }`}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-xs"
                    style={{ background: item.iconBg, color: item.iconColor }}
                  >
                    <Icon size={20} strokeWidth={2.2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-gray-900 truncate">{item.title}</p>
                      {item.badge && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{item.subtitle}</p>
                  </div>
                  <ChevronRight
                    size={16}
                    className={`flex-shrink-0 transition-transform ${
                      isSelected ? 'text-emerald-600 translate-x-1' : 'text-gray-300'
                    }`}
                  />
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/70 flex items-center justify-between text-[11px] text-gray-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-gray-200">↑↓</span> to navigate
            </span>
            <span className="flex items-center gap-1">
              <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-gray-200">↵</span> to select
            </span>
          </div>
          <span className="font-medium text-emerald-700 flex items-center gap-1">
            <ShieldCheck size={13} />
            Krishi-Drishti v1.0 Production
          </span>
        </div>
      </motion.div>
    </div>
  );
};

export default CommandPalette;
