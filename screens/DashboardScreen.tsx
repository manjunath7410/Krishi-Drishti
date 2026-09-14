import React, { useState, useEffect } from 'react';
import { Screen, UserProfile, Language } from '../types';
import { languages } from '../translations';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Bell,
  Thermometer,
  Droplets,
  Wind,
  CloudRain,
  Leaf,
  MoreHorizontal,
  Home,
  Sprout,
  Zap,
  Landmark,
  Radio,
  ScrollText,
  Activity,
  Calendar,
  Bot,
  Umbrella,
  TrendingUp,
  ScanLine,
  BookOpen,
  Coins,
  ArrowRight,
  MessageCircle,
  Sun,
  Plus,
  Link2,
  Building2,
  ChevronRight,
  BarChart2,
  Search,
  Grid3x3,
  Film,
  Image as ImageIcon,
  Crosshair,
  Navigation,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { weatherService, getPinpointLocation } from '../src/services/api';
import WeatherModal from '../components/WeatherModal';
import CarbonWalletCard from '../components/CarbonWalletCard';
import { plotService } from '../src/services/api';
import AgroEmergencyBanner from '../components/AgroEmergencyBanner';
import MandiPricePredictor from '../components/MandiPricePredictor';

interface DashboardScreenProps {
  navigateTo: (screen: Screen) => void;
  user: UserProfile | null;
  t: any;
  onLangChange: (lang: Language) => void;
  currentLang: Language;
  weather: any;
  locationName: string;
  userCoords?: { lat: number; lng: number } | null;
  gpsAccuracy?: number | null;
  isLiveTracking?: boolean;
  onToggleLiveTracking?: () => void;
  onUpdateLocation?: (coords: { lat: number; lng: number; accuracy?: number; name?: string }, persist?: boolean) => void;
  onOpenSearch?: () => void;
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({
  navigateTo,
  user,
  t,
  onLangChange,
  currentLang,
  weather,
  locationName,
  userCoords,
  gpsAccuracy,
  isLiveTracking,
  onToggleLiveTracking,
  onUpdateLocation,
  onOpenSearch
}) => {
  const [showWeatherModal, setShowWeatherModal] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [userPlots, setUserPlots] = useState<any[]>([]);
  const [isLoadingPlots, setIsLoadingPlots] = useState(true);
  const [plotLocationNames, setPlotLocationNames] = useState<{ [key: number]: string }>({});
  const hasFetched = React.useRef(false);

  // ── Location picker state ──
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [locationTab, setLocationTab] = useState<'gps' | 'search' | 'manual'>('gps');
  const [isAcquiringGps, setIsAcquiringGps] = useState(false);
  const [gpsMessage, setGpsMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');
  const [cityQuery, setCityQuery] = useState('');
  const [cityResults, setCityResults] = useState<any[]>([]);
  const [citySearching, setCitySearching] = useState(false);
  const citySearchTimer = React.useRef<any>(null);

  useEffect(() => {
    // Guard: only fetch once per component lifetime to avoid double-fire
    // from AnimatePresence remounts or locationName prop changes.
    if (hasFetched.current) return;
    hasFetched.current = true;

    const locationFallback = locationName; // snapshot at mount time

    const fetchPlots = async () => {
      try {
        const data = await plotService.getPlots();
        setUserPlots(data);

        // Instant location assignment from plot metadata, avoiding UI-blocking sequential network requests
        const locationMap: { [key: number]: string } = {};
        for (const plot of data) {
          const nameMatch = plot.name?.match(/\(([^)]+)\)/);
          if (nameMatch && nameMatch[1]) {
            locationMap[plot.id] = nameMatch[1];
          } else {
            locationMap[plot.id] = locationFallback.split(',')[0] || 'Farm Plot';
          }
        }
        setPlotLocationNames(locationMap);

      } catch (error) {
        console.error('Failed to fetch user plots:', error);
      } finally {
        setIsLoadingPlots(false);
      }
    };
    fetchPlots();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Real-time GPS pinpoint acquisition ──
  const handleAcquireRealGps = async () => {
    setIsAcquiringGps(true);
    setGpsMessage({ text: 'Connecting to GPS satellites & sensors for high precision...', type: 'info' });
    try {
      const pinpoint = await getPinpointLocation({ enableHighAccuracy: true, timeout: 12000 });
      if (onUpdateLocation) {
        onUpdateLocation({
          lat: pinpoint.lat,
          lng: pinpoint.lng,
          accuracy: pinpoint.accuracy
        }, true);
      } else {
        localStorage.setItem('kd_saved_location', JSON.stringify(pinpoint));
        sessionStorage.removeItem('kd_last_location');
      }
      setGpsMessage({
        text: `Real-time pinpoint GPS locked: ±${pinpoint.accuracy || 5}m accuracy!`,
        type: 'success'
      });
      setTimeout(() => {
        setShowLocationPicker(false);
        setGpsMessage(null);
      }, 1400);
    } catch (err: any) {
      setGpsMessage({
        text: err?.message || 'Could not access device GPS. Please ensure Location is allowed in browser settings.',
        type: 'error'
      });
    } finally {
      setIsAcquiringGps(false);
    }
  };

  // ── City search debounce ──
  const handleCitySearch = (q: string) => {
    setCityQuery(q);
    clearTimeout(citySearchTimer.current);
    if (!q.trim()) { setCityResults([]); return; }
    citySearchTimer.current = setTimeout(async () => {
      setCitySearching(true);
      try {
        const results = await weatherService.searchCity(q);
        setCityResults(results || []);
      } catch { setCityResults([]); }
      finally { setCitySearching(false); }
    }, 400);
  };

  const handlePickCity = (city: any) => {
    const loc = { lat: city.latitude, lng: city.longitude, name: `${city.name}, ${city.country}` };
    localStorage.setItem('kd_saved_location', JSON.stringify(loc));
    sessionStorage.removeItem('kd_last_location');
    if (onUpdateLocation) {
      onUpdateLocation(loc, true);
    }
    setShowLocationPicker(false);
    setCityQuery('');
    setCityResults([]);
  };

  const handleManualCoordsSubmit = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setGpsMessage({ text: 'Please enter valid coordinates (-90 to 90 lat, -180 to 180 lng)', type: 'error' });
      return;
    }
    const loc = { lat, lng, name: `Farm Coordinates (${lat.toFixed(4)}°, ${lng.toFixed(4)}°)` };
    localStorage.setItem('kd_saved_location', JSON.stringify(loc));
    sessionStorage.removeItem('kd_last_location');
    if (onUpdateLocation) {
      onUpdateLocation(loc, true);
    }
    setShowLocationPicker(false);
    setManualLat('');
    setManualLng('');
  };

  const currentTemp = weather?.current?.temperature_2m ? Math.round(weather.current.temperature_2m) : '--';

  const crops = (user?.crops && Array.isArray(user.crops) && user.crops.length > 0) ? user.crops : [];

  const getCropImage = (crop: string) => {
    const map: any = {
      'Wheat': 'https://images.unsplash.com/photo-1501430654243-c934cec2e1c0?w=1000&q=80',
      'Corn': 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=1000&q=80',
      'Grapes': 'https://images.unsplash.com/photo-1537640538965-1756fb179c26?w=1000&q=80',
      'Potato': 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=1000&q=80',
      'Olive': 'https://images.unsplash.com/photo-1471180625745-944903837c22?w=1000&q=80',
      'Rice': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=1000&q=80',
    };
    return map[crop] || map['Wheat'];
  };

  const fieldImages = [
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800',
    'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800',
    'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800',
    'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=800',
    'https://images.unsplash.com/photo-1444858291040-58f756a3bdd6?w=800',
    'https://images.unsplash.com/photo-1589710321151-2495dbfc1fa2?w=800'
  ];

  const getFieldImage = (id: number) => {
    return fieldImages[id % fieldImages.length];
  };

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-full pb-0 font-sans text-gray-800 relative bg-white"
    >

      {/* Dynamic Animated Background Mesh */}
      <div className="absolute top-0 left-0 w-full h-[600px] z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-float"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-amber-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse-glow" style={{ animationDelay: '2s' }}></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-teal-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-float" style={{ animationDelay: '4s' }}></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-white/10 via-white/50 to-transparent"></div>
      </div>

      {/* 1. Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="px-6 pt-12 pb-6 flex justify-between items-start relative z-20"
      >
        <div>
          <h1 className="text-4xl font-light text-gray-800 tracking-tight">Hello, <span className="font-bold text-gray-900">{user?.name?.split(' ')[0] || 'Farmer'}</span></h1>
          <button
            onClick={() => setShowLocationPicker(true)}
            className="flex flex-col mt-1 self-start px-2 py-1.5 rounded-xl hover:bg-emerald-50 active:scale-95 transition-all border border-transparent hover:border-emerald-200 group text-left"
            title="Tap to view or update real-time pinpoint location"
          >
            <div className="flex items-center gap-1.5">
              <MapPin size={16} className="text-emerald-600 flex-shrink-0" fill="currentColor" />
              <span className="text-sm font-bold text-gray-900 tracking-wide">{locationName}</span>
              <span className="text-[10px] text-gray-400 font-bold">▼</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5 ml-5">
              {isLiveTracking ? (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-red-100 text-red-600 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  Live GPS Tracking
                </span>
              ) : gpsAccuracy ? (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                  <Crosshair size={10} className="text-emerald-600" />
                  Pinpoint GPS ±{gpsAccuracy}m
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-semibold group-hover:underline">
                  <Navigation size={10} />
                  Real-time Pinpoint Location
                </span>
              )}
              {userCoords && (
                <span className="text-[10px] font-mono text-gray-400 hidden sm:inline">
                  {userCoords.lat.toFixed(3)}°, {userCoords.lng.toFixed(3)}°
                </span>
              )}
            </div>
          </button>
        </div>


        <div className="flex items-center gap-3 relative">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            className="p-3 bg-white rounded-full shadow-lg shadow-orange-100/50 relative hover:bg-orange-50 transition-colors"
            onClick={() => setShowLangMenu(!showLangMenu)}
          >
            <span className="sr-only">Change Language</span>
            <div className={`w-5 h-5 flex items-center justify-center font-bold text-xs border-2 rounded-full transition-colors ${showLangMenu ? 'bg-gray-900 text-white border-gray-900' : 'text-gray-900 border-gray-900'}`}>
              {currentLang.toUpperCase()}
            </div>
          </motion.button>

          <AnimatePresence>
            {showLangMenu && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[60]"
                  onClick={() => setShowLangMenu(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="absolute top-full mt-2 right-12 bg-white rounded-2xl shadow-2xl border border-gray-200 p-2 z-[70] w-48 max-h-80 overflow-y-auto"
                  style={{ minWidth: '200px' }}
                >
                  <div className="px-3 py-2 border-b border-gray-100 mb-1">
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Select Language ({languages.length})</span>
                  </div>
                  {languages.map((lang: any) => (
                    <motion.button
                      key={lang.code}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.95 }}
                      className={`w-full text-left px-3 py-3 rounded-xl text-sm font-bold flex justify-between items-center transition-all mb-1 ${currentLang === lang.code
                        ? 'bg-green-50 text-green-700 shadow-sm'
                        : 'text-gray-700 hover:bg-gray-50'}`}
                      onClick={() => {
                        onLangChange(lang.code as Language);
                        setShowLangMenu(false);
                      }}
                    >
                      <div className="flex flex-col">
                        <span>{lang.label}</span>
                        <span className="text-[10px] font-medium text-gray-400">{lang.native}</span>
                      </div>
                      {currentLang === lang.code && <div className="w-2 h-2 rounded-full bg-green-500 shadow-green-200 shadow-lg" />}
                    </motion.button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            className="p-3 bg-white rounded-full shadow-lg shadow-orange-100/50 relative hover:bg-orange-50 transition-colors"
            onClick={() => navigateTo('corporate-dashboard')}
          >
            <Building2 size={20} className="text-gray-900" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            className="p-3 bg-white rounded-full shadow-lg shadow-orange-100/50 relative hover:bg-orange-50 transition-colors"
          >
            <div className="w-2 h-2 bg-black rounded-full absolute top-3 right-3 border border-white pointer-events-none" />
            <Bell size={20} className="text-gray-900" fill="black" />
          </motion.button>
        </div>
      </motion.div>

      {/* Global Quick Search Launcher */}
      <div className="px-5 mb-4">
        <button
          onClick={() => onOpenSearch && onOpenSearch()}
          className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-emerald-50/40 active:scale-[0.99] border border-gray-200/90 rounded-2xl shadow-xs transition-all text-left group"
        >
          <div className="flex items-center gap-3">
            <Search size={18} className="text-emerald-600 group-hover:scale-110 transition-transform" />
            <span className="text-xs sm:text-sm font-medium text-gray-400 group-hover:text-gray-600">
              Search 20+ tools, crops, diseases, schemes...
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-gray-100 text-[10px] font-mono text-gray-500 font-bold border border-gray-200">
              ⌘K
            </span>
            <span className="text-xs font-bold text-emerald-600">Find →</span>
          </div>
        </button>
      </div>

      {/* Live Agro-Emergency & Weather Risk Advisory Banner */}
      <AgroEmergencyBanner
        weather={weather}
        locationName={locationName}
        currentLang={currentLang}
      />

      {/* 2. Weather Section */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="px-6 mb-8 relative"
      >
        <motion.div variants={itemVariants} className="flex justify-between items-start relative z-10 mb-6">
          <div>
            <div className="flex items-start gap-2">
              <span className="text-7xl font-medium text-gray-900 tracking-tighter">{currentTemp}°</span>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <Sun size={32} className="text-yellow-400 fill-yellow-400 mt-2" />
              </motion.div>
            </div>
            <p className="text-md font-medium text-gray-500 mt-1">
              {locationName.split(',').slice(-1)[0]?.trim() || locationName}
            </p>
          </div>
          <div className="absolute -top-60 -right-8 w-64 h-[34rem] z-0 pointer-events-none mix-blend-multiply opacity-90">
            <img src="/assets/crops/Wheat.jpg" className="w-full h-full object-contain" alt="Wheat" />
          </div>
        </motion.div>

        {/* 2x2 Grid Pills */}
        <div className="grid grid-cols-2 gap-4 relative z-10">
          <motion.div variants={itemVariants} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }} className="glass rounded-[2rem] p-4 flex items-center gap-3 cursor-default">
            <div className="w-10 h-10 rounded-full bg-emerald-50/80 flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
              <Thermometer size={18} />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Soil temp</p>
              <p className="text-lg font-bold text-gray-900">
                {weather?.current?.soil_temperature_0cm !== undefined ? `+${Math.round(weather.current.soil_temperature_0cm)} C` : '-- C'}
              </p>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }} className="glass rounded-[2rem] p-4 flex items-center gap-3 cursor-default">
            <div className="w-10 h-10 rounded-full bg-blue-50/80 flex items-center justify-center text-blue-600 shadow-sm border border-blue-100">
              <Droplets size={18} fill="currentColor" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Humidity</p>
              <p className="text-lg font-bold text-gray-900">
                {weather?.current?.relative_humidity_2m ?? '--'}%
              </p>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }} className="glass rounded-[2rem] p-4 flex items-center gap-3 cursor-default">
            <div className="w-10 h-10 rounded-full bg-amber-50/80 flex items-center justify-center text-amber-600 shadow-sm border border-amber-100">
              <Wind size={18} />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Wind</p>
              <p className="text-lg font-bold text-gray-900">
                {weather?.current?.wind_speed_10m ?? '--'} m/s
              </p>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }} className="glass rounded-[2rem] p-4 flex items-center gap-3 cursor-default">
            <div className="w-10 h-10 rounded-full bg-indigo-50/80 flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
              <CloudRain size={18} fill="currentColor" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Precipitation</p>
              <p className="text-lg font-bold text-gray-900">
                {weather?.current?.precipitation ?? '--'} mm
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Carbon Wallet Integration */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 20 }}
        className="mx-6 mb-6"
      >
        <CarbonWalletCard />
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigateTo('landmark')}
          className="w-full mt-4 bg-white border-2 border-dashed rounded-2xl p-4 flex items-center justify-center gap-2 shadow-sm"
          style={{ borderColor: '#00BB78' }}
        >
          <MapPin size={20} style={{ color: '#00BB78' }} />
          <span className="font-bold" style={{ color: '#001A11' }}>Locate My Farm Boundary</span>
        </motion.button>
      </motion.div>

      {/* Supply Chain Traceability Discovery Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, type: 'spring', stiffness: 200, damping: 20 }}
        className="mx-6 mb-6"
      >
        <div
          onClick={() => navigateTo('traceability')}
          className="cursor-pointer overflow-hidden"
          style={{ background: '#0D0D0D', border: '1px solid #292524' }}
        >
          {/* Header strip */}
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #1c1917' }}>
            <div className="flex items-center gap-2">
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: '#F59E0B', letterSpacing: '0.2em' }}>SUPPLY CHAIN TRACEABILITY</span>
            </div>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: '#57534e', letterSpacing: '0.15em' }}>OPEN LEDGER →</span>
          </div>

          {/* 4-step cycle */}
          <div className="grid grid-cols-4" style={{ borderBottom: '1px solid #1c1917' }}>
            {[
              { step: '01', label: 'HARVEST', icon: '🌾' },
              { step: '02', label: 'MINT', icon: '◆' },
              { step: '03', label: 'QR CODE', icon: '▣' },
              { step: '04', label: 'VERIFY', icon: '✓' },
            ].map((item, i) => (
              <div key={item.step}
                className="py-3 flex flex-col items-center gap-1"
                style={{ borderRight: i < 3 ? '1px solid #1c1917' : 'none' }}
              >
                <span className="text-base">{item.icon}</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '8px', color: '#F59E0B', fontWeight: 700 }}>{item.step}</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '7px', color: '#57534e', letterSpacing: '0.1em' }}>{item.label}</span>
              </div>
            ))}
          </div>

          {/* Tagline */}
          <div className="px-4 py-2.5">
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: '#78716c', lineHeight: 1.6 }}>
              Mint a harvest token after every crop cycle. Buyers scan a QR to verify your crop's carbon footprint, chemical inputs &amp; origin — CBAM compliant.
            </p>
          </div>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════
          SERVICES
      ═══════════════════════════════════════════════ */}
      <div className="px-5 mt-4 mb-6" style={{ fontFamily: 'Inter, sans-serif' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold" style={{ color: '#001A11' }}>Services</h2>
          <span className="text-[11px] font-semibold" style={{ color: '#00BB78' }}>10 tools</span>
        </div>

        {/* ── ROW 1: Two featured large cards ── */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => navigateTo('market' as Screen)}
            className="flex flex-col justify-between p-4 rounded-3xl text-left"
            style={{ background: '#001A11', minHeight: 130 }}
          >
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(0,187,120,0.15)' }}>
              <TrendingUp size={20} style={{ color: '#00BB78' }} />
            </div>
            <div className="mt-6">
              <p className="text-[13px] font-bold text-white leading-tight">Market Prices</p>
              <p className="text-[10px] mt-0.5" style={{ color: '#A5FFA7' }}>Live mandi rates</p>
            </div>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => navigateTo('vision' as Screen)}
            className="flex flex-col justify-between p-4 rounded-3xl text-left"
            style={{ background: '#00BB78', minHeight: 130 }}
          >
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.2)' }}>
              <ScanLine size={20} className="text-white" />
            </div>
            <div className="mt-6">
              <p className="text-[13px] font-bold text-white leading-tight">Crop Scanner</p>
              <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.75)' }}>AI disease detection</p>
            </div>
          </motion.button>
        </div>

        {/* ── ROW 2: 2×2 grid ── */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          {[
            { icon: <BookOpen size={16} strokeWidth={2} />, label: 'Govt Schemes', desc: 'Subsidies & loans', screen: 'scheme-setu', iconColor: '#001A11', bg: '#F5FAF7' },
            { icon: <Umbrella size={16} strokeWidth={2} />, label: 'Crop Insurance', desc: 'Protect your yield', screen: 'insurance', iconColor: '#001A11', bg: '#F5FAF7' },
            { icon: <Activity size={16} strokeWidth={2} />, label: 'Soil Carbon', desc: 'SOC modeling', screen: 'soil-carbon', iconColor: '#00BB78', bg: '#E8FBF3' },
            { icon: <Sprout size={16} strokeWidth={2} />, label: 'Carbon Vault', desc: 'Credit management', screen: 'carbon-vault', iconColor: '#00BB78', bg: '#E8FBF3' },
          ].map((s, i) => (
            <motion.button
              key={i}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigateTo(s.screen as Screen)}
              className="flex flex-col gap-3 p-3.5 rounded-2xl text-left"
              style={{ background: s.bg, border: '1px solid #EFEFEF' }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white" style={{ color: s.iconColor }}>
                {s.icon}
              </div>
              <div>
                <p className="text-[12px] font-bold leading-tight" style={{ color: '#001A11' }}>{s.label}</p>
                <p className="text-[10px] mt-0.5" style={{ color: '#616B68' }}>{s.desc}</p>
              </div>
            </motion.button>
          ))}
        </div>

        {/* ── ROW 3: Compact list ── */}
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #F0F0F0' }}>
          {[
            { icon: <Film size={15} strokeWidth={2} />, label: 'Veo Video Studio', desc: 'Animate photos & text-to-video (Free)', screen: 'veo-studio', highlight: true },
            { icon: <ImageIcon size={15} strokeWidth={2} />, label: 'Media Gallery', desc: 'View, play & manage generated videos & scans', screen: 'media-gallery', highlight: false, badge: 'New' },
            { icon: <Zap size={15} strokeWidth={2} />, label: 'Weather Forecast', desc: '7-day prediction', screen: 'forecast' },
            { icon: <Droplets size={15} strokeWidth={2} />, label: 'Smart Irrigation', desc: 'Water optimization', screen: 'smart-irrigation' },
            { icon: <Grid3x3 size={15} strokeWidth={2} />, label: 'Digital Twin', desc: '2D farm layout', screen: 'digital-twin' },
            { icon: <Radio size={15} strokeWidth={2} />, label: 'Acoustic Scan', desc: 'Bioacoustic monitor', screen: 'acoustic-scanner' },
            { icon: <Link2 size={15} strokeWidth={2} />, label: 'Traceability', desc: 'Supply chain QR', screen: 'traceability' },
          ].map((s, i, arr) => (
            <motion.button
              key={i}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigateTo(s.screen as Screen)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors ${
                s.highlight ? 'bg-emerald-50/60 hover:bg-emerald-50' : 'bg-white hover:bg-gray-50/80'
              }`}
              style={{ borderBottom: i < arr.length - 1 ? '1px solid #F0F0F0' : 'none' }}
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: s.highlight ? '#00BB78' : s.badge ? '#E8FBF3' : '#F5F5F5',
                  color: s.highlight ? '#FFFFFF' : s.badge ? '#00BB78' : '#616B68',
                }}
              >
                {s.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-[13px] font-semibold" style={{ color: '#001A11' }}>{s.label}</p>
                  {s.highlight && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
                      Veo 3
                    </span>
                  )}
                  {s.badge && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 bg-emerald-600 text-white rounded-full">
                      {s.badge}
                    </span>
                  )}
                </div>
                <p className="text-[11px]" style={{ color: '#616B68' }}>{s.desc}</p>
              </div>
              <ChevronRight size={14} style={{ color: '#A5FFA7', flexShrink: 0 }} />
            </motion.button>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          AI MANDI PRICE INTELLIGENCE & FORECAST
      ═══════════════════════════════════════════════ */}
      <div className="px-5 mb-6">
        <MandiPricePredictor />
      </div>

      {/* ═══════════════════════════════════════════════
          COMMODITIES & FOOD
      ═══════════════════════════════════════════════ */}
      {crops.length > 0 && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          className="px-6 mt-4 relative z-10 w-full overflow-hidden"
        >
          <h2 className="text-base font-bold text-gray-900 mb-4">Commodities &amp; Food</h2>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 pr-6 snap-x">
            {crops.map((crop, idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.95 }}
                className="snap-start flex flex-col gap-2 flex-shrink-0 cursor-pointer group"
              >
                <div className="w-[68px] h-[68px] rounded-full overflow-hidden shadow-md border-2 border-white relative">
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-all z-10"></div>
                  <img
                    src={getCropImage(crop)}
                    alt={crop}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
                <span className="text-xs font-semibold text-gray-700 text-center">{crop}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════
          MY FIELDS
      ═══════════════════════════════════════════════ */}
      <div className="mt-6 px-5 pb-10" style={{ fontFamily: 'Inter, sans-serif' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold" style={{ color: '#001A11' }}>My Fields</h2>
          <button
            onClick={() => navigateTo('landmark')}
            className="flex items-center gap-1 text-xs font-semibold"
            style={{ color: '#00BB78' }}
          >
            <Plus size={13} strokeWidth={2.5} /> Add
          </button>
        </div>

        {isLoadingPlots && (
          <div className="flex items-center gap-3 p-5 bg-gray-50 border border-gray-100 rounded-2xl">
            <div className="w-5 h-5 border-2 border-gray-200 border-t-[#00BB78] rounded-full animate-spin flex-shrink-0" />
            <span className="text-sm font-medium" style={{ color: '#616B68' }}>Loading your plots…</span>
          </div>
        )}

        {!isLoadingPlots && userPlots.length === 0 && (
          <button
            onClick={() => navigateTo('map')}
            className="w-full flex items-center gap-4 p-4 rounded-2xl active:scale-95 transition-transform"
            style={{ background: '#F7FFFE', border: '1.5px dashed #00BB78' }}
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: '#E8FBF3' }}>
              <MapPin size={20} style={{ color: '#00BB78' }} />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold" style={{ color: '#001A11' }}>No fields added yet</p>
              <p className="text-xs mt-0.5" style={{ color: '#616B68' }}>Tap to locate your farm on the map</p>
            </div>
            <ChevronRight size={16} style={{ color: '#A5FFA7', marginLeft: 'auto', flexShrink: 0 }} />
          </button>
        )}

        {!isLoadingPlots && userPlots.length > 0 && (
          <div className="space-y-3">
            {userPlots.map((plot) => (
              <div key={plot.id} className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #F0F0F0', boxShadow: '0 2px 8px rgba(0,187,120,0.06)' }}>
                {/* Field image */}
                <div className="relative h-36 w-full">
                  <img
                    src={getFieldImage(plot.id)}
                    alt={plot.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end">
                    <div>
                      <h3 className="text-sm font-bold text-white">{plot.name}</h3>
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin size={10} style={{ color: '#A5FFA7' }} />
                        <span className="text-[10px] text-gray-300">{plotLocationNames[plot.id] || 'Locating…'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-full" style={{ background: 'rgba(0,187,120,0.25)', backdropFilter: 'blur(8px)' }}>
                      <Leaf size={11} style={{ color: '#A5FFA7' }} />
                      <span className="text-xs font-bold text-white">{plot.area} ha</span>
                    </div>
                  </div>
                </div>

                {/* Action row */}
                <div className="grid grid-cols-3" style={{ borderTop: '1px solid #F0F0F0' }}>
                  {[
                    { icon: <MapPin size={15} style={{ color: '#00BB78' }} />, label: 'Map', action: () => navigateTo('map') },
                    { icon: <BarChart2 size={15} style={{ color: '#00BB78' }} />, label: 'Satellite', action: () => navigateTo('field-monitor', { plotId: plot.id }) },
                    { icon: <TrendingUp size={15} style={{ color: '#00BB78' }} />, label: 'Yield', action: () => navigateTo('forecast') },
                  ].map((btn, i) => (
                    <button
                      key={i}
                      onClick={btn.action}
                      className="flex flex-col items-center gap-1.5 py-3 transition-colors"
                      style={{ borderRight: i < 2 ? '1px solid #F0F0F0' : 'none' }}
                    >
                      {btn.icon}
                      <span className="text-[10px] font-semibold" style={{ color: '#616B68' }}>{btn.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Location Picker Modal ── */}
      <AnimatePresence>
        {showLocationPicker && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200]"
              onClick={() => { setShowLocationPicker(false); setCityQuery(''); setCityResults([]); }}
            />
            <motion.div
              initial={{ opacity: 0, y: 60, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 60, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-3xl z-[201] p-5 shadow-2xl"
              style={{ maxHeight: '80vh' }}
            >
              {/* Handle */}
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 bg-emerald-50">
                    <Crosshair size={20} className="text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900">Pinpoint Real-Time Location</h2>
                    <p className="text-xs text-gray-500">Real-time GPS satellite coordinates & live tracking</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowLocationPicker(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Location Tabs */}
              <div className="flex items-center p-1 bg-gray-100 rounded-2xl mb-4 gap-1">
                <button
                  onClick={() => setLocationTab('gps')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    locationTab === 'gps'
                      ? 'bg-white text-emerald-800 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Navigation size={13} className={locationTab === 'gps' ? 'text-emerald-600' : ''} />
                  Real GPS
                </button>
                <button
                  onClick={() => setLocationTab('search')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    locationTab === 'search'
                      ? 'bg-white text-emerald-800 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Search size={13} className={locationTab === 'search' ? 'text-emerald-600' : ''} />
                  Search Area
                </button>
                <button
                  onClick={() => setLocationTab('manual')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    locationTab === 'manual'
                      ? 'bg-white text-emerald-800 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <MapPin size={13} className={locationTab === 'manual' ? 'text-emerald-600' : ''} />
                  Coordinates
                </button>
              </div>

              {/* Status or Error Banner */}
              {gpsMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-3 rounded-2xl mb-3 text-xs flex items-center gap-2 ${
                    gpsMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : gpsMessage.type === 'error'
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}
                >
                  {gpsMessage.type === 'success' ? (
                    <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
                  ) : gpsMessage.type === 'error' ? (
                    <AlertCircle size={16} className="text-red-600 flex-shrink-0" />
                  ) : (
                    <RefreshCw size={16} className="text-blue-600 animate-spin flex-shrink-0" />
                  )}
                  <span className="font-medium">{gpsMessage.text}</span>
                </motion.div>
              )}

              {/* Tab 1: Pinpoint Real-Time GPS */}
              {locationTab === 'gps' && (
                <div className="space-y-3">
                  {/* Current Active Location Card */}
                  <div className="p-3.5 bg-gradient-to-br from-emerald-50/70 to-teal-50/70 border border-emerald-100 rounded-2xl">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                          Active Pinpoint Location
                        </span>
                        <h3 className="text-base font-bold text-gray-900 mt-0.5">{locationName}</h3>
                      </div>
                      {isLiveTracking ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-600 animate-pulse flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          Live Tracking
                        </span>
                      ) : gpsAccuracy ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                          <Crosshair size={10} />
                          ±{gpsAccuracy}m precision
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600">
                          Cached / Pinned
                        </span>
                      )}
                    </div>

                    {userCoords && (
                      <div className="mt-2 pt-2 border-t border-emerald-100/80 flex items-center justify-between text-xs text-gray-600 font-mono">
                        <span>Lat: {userCoords.lat.toFixed(6)}°</span>
                        <span>Lng: {userCoords.lng.toFixed(6)}°</span>
                      </div>
                    )}
                  </div>

                  {/* Acquire GPS Button */}
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    disabled={isAcquiringGps}
                    onClick={handleAcquireRealGps}
                    className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-60 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all"
                  >
                    {isAcquiringGps ? (
                      <>
                        <RefreshCw size={18} className="animate-spin" />
                        <span>Acquiring High-Precision GPS...</span>
                      </>
                    ) : (
                      <>
                        <Navigation size={18} fill="currentColor" />
                        <span>Detect Pinpoint Real-Time GPS</span>
                      </>
                    )}
                  </motion.button>

                  {/* Live Tracking Switch */}
                  {onToggleLiveTracking && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isLiveTracking ? 'bg-red-100 text-red-600' : 'bg-gray-200 text-gray-500'}`}>
                          <Radio size={16} className={isLiveTracking ? 'animate-pulse' : ''} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-800">Continuous Live Tracking</p>
                          <p className="text-[10px] text-gray-500">Auto-updates as you walk in your farm</p>
                        </div>
                      </div>
                      <button
                        onClick={onToggleLiveTracking}
                        className={`relative w-12 h-6 rounded-full transition-colors ${isLiveTracking ? 'bg-red-500' : 'bg-gray-300'}`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${isLiveTracking ? 'translate-x-6' : ''}`}
                        />
                      </button>
                    </div>
                  )}

                  {/* Reset Override */}
                  {localStorage.getItem('kd_saved_location') && (
                    <div className="text-center pt-1">
                      <button
                        onClick={() => {
                          localStorage.removeItem('kd_saved_location');
                          sessionStorage.removeItem('kd_last_location');
                          handleAcquireRealGps();
                        }}
                        className="text-xs text-gray-500 hover:text-red-500 font-semibold underline"
                      >
                        Clear saved override & re-detect GPS
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Search Village / City */}
              {locationTab === 'search' && (
                <div>
                  <div className="relative mb-3">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      autoFocus
                      type="text"
                      value={cityQuery}
                      onChange={e => handleCitySearch(e.target.value)}
                      placeholder="e.g. Athani, Belagavi, Baramati, Pune..."
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-2xl text-sm font-medium focus:outline-none border border-gray-200 focus:border-emerald-500"
                    />
                    {citySearching && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 rounded-full animate-spin border-2 border-emerald-400 border-t-emerald-600" />
                      </div>
                    )}
                  </div>

                  {/* Quick agricultural hub chips */}
                  {!cityQuery && (
                    <div className="mb-3">
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                        Common Agricultural Regions
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { name: 'Belagavi', lat: 15.8497, lng: 74.4977, country: 'Karnataka, India' },
                          { name: 'Kolhapur', lat: 16.7050, lng: 74.2433, country: 'Maharashtra, India' },
                          { name: 'Pune', lat: 18.5204, lng: 73.8567, country: 'Maharashtra, India' },
                          { name: 'Hubli', lat: 15.3647, lng: 75.1240, country: 'Karnataka, India' },
                          { name: 'Vijayapura', lat: 16.8302, lng: 75.7100, country: 'Karnataka, India' },
                          { name: 'Nashik', lat: 19.9975, lng: 73.7898, country: 'Maharashtra, India' },
                          { name: 'Nagpur', lat: 21.1458, lng: 79.0882, country: 'Maharashtra, India' }
                        ].map((hub, i) => (
                          <button
                            key={i}
                            onClick={() => handlePickCity({ name: hub.name, country: hub.country, latitude: hub.lat, longitude: hub.lng })}
                            className="px-2.5 py-1 bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-transparent rounded-lg text-xs font-medium text-gray-700 transition-colors"
                          >
                            {hub.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Search Results */}
                  <div className="overflow-y-auto" style={{ maxHeight: '35vh' }}>
                    {cityResults.length > 0 ? (
                      <div className="space-y-1">
                        {cityResults.map((city, i) => (
                          <button
                            key={i}
                            onClick={() => handlePickCity(city)}
                            className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-emerald-50 transition-colors text-left group"
                          >
                            <div className="w-8 h-8 rounded-xl bg-gray-100 group-hover:bg-emerald-100 flex items-center justify-center flex-shrink-0">
                              <MapPin size={14} className="text-gray-500 group-hover:text-emerald-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">{city.name}</p>
                              <p className="text-xs text-gray-500">{city.country} · {city.latitude?.toFixed(2)}°N, {city.longitude?.toFixed(2)}°E</p>
                            </div>
                            <ChevronRight size={14} className="text-gray-300 group-hover:text-emerald-600 flex-shrink-0" />
                          </button>
                        ))}
                      </div>
                    ) : cityQuery && !citySearching ? (
                      <div className="text-center py-6 text-gray-400 text-xs">
                        No locations found for "{cityQuery}"
                      </div>
                    ) : null}
                  </div>
                </div>
              )}

              {/* Tab 3: Exact Farm Coordinates */}
              {locationTab === 'manual' && (
                <div className="space-y-3">
                  <p className="text-xs text-gray-600">
                    Enter the exact survey GPS coordinates of your agricultural land:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-gray-500 uppercase">Latitude</label>
                      <input
                        type="number"
                        step="any"
                        value={manualLat}
                        onChange={e => setManualLat(e.target.value)}
                        placeholder="e.g. 15.849700"
                        className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-gray-500 uppercase">Longitude</label>
                      <input
                        type="number"
                        step="any"
                        value={manualLng}
                        onChange={e => setManualLng(e.target.value)}
                        placeholder="e.g. 74.497700"
                        className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleManualCoordsSubmit}
                    disabled={!manualLat || !manualLng}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-2xl text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 size={16} />
                    Apply Pinpoint Coordinates
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default DashboardScreen;
