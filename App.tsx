import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Screen, UserProfile, Language, VisionMode } from './types';
import {
  MessageCircle,
  Sparkles,
  Mic,
  AlertTriangle,
  Loader2,
  Leaf,
  Wifi,
  WifiOff,
  RefreshCw,
  Smartphone,
  Monitor,
  Search,
  PhoneCall,
  ShieldCheck,
  Battery,
  Radio
} from 'lucide-react';
import AuthScreen from './screens/AuthScreen';
import ProfileScreen from './screens/ProfileScreen';
import DashboardScreen from './screens/DashboardScreen';
import ChatScreen from './screens/ChatScreen';
import VisionScreen from './screens/VisionScreen';
import VisionResultScreen from './screens/VisionResultScreen';
import MarketScreen from './screens/MarketScreen';
import MarketDetailScreen from './screens/MarketDetailScreen';
import InsuranceScreen from './screens/InsuranceScreen';
import ForecastScreen from './screens/ForecastScreen';
import SchemeSetuScreen from './screens/SchemeSetuScreen';
import SplashScreen from './screens/SplashScreen';
import LandingScreen from './screens/LandingScreen';
import BottomNav from './components/BottomNav';
import VoiceAssistantModal from './components/VoiceAssistantModal';
import CommandPalette from './components/CommandPalette';
import { userService, weatherService, getUserLocation, getPinpointLocation, watchRealTimeLocation } from './src/services/api';
import { translations } from './translations';
import { LanguageProvider } from './src/context/LanguageContext';

// Performance Code-Splitting for heavy secondary modules
const FarmMapScreen = React.lazy(() => import('./screens/FarmMapScreen'));
const LiveAudioScreen = React.lazy(() => import('./screens/LiveAudioScreen'));
const CarbonVaultScreen = React.lazy(() => import('./screens/CarbonVaultScreen'));
const CropStressScreen = React.lazy(() => import('./screens/CropStressScreen'));
const LandMarkingScreen = React.lazy(() => import('./screens/LandMarkingScreen'));
const AcousticScannerScreen = React.lazy(() => import('./screens/AcousticScannerScreen'));
const SoilCarbonModelScreen = React.lazy(() => import('./screens/SoilCarbonModelScreen'));
const TraceabilityScreen = React.lazy(() => import('./screens/TraceabilityScreen'));
const TraceabilityVerifyScreen = React.lazy(() => import('./screens/TraceabilityVerifyScreen'));
const AgritechDashboardNew = React.lazy(() => import('./screens/AgritechDashboardNew'));
const FieldMonitorScreen = React.lazy(() => import('./screens/FieldMonitorScreen'));
const CorporateDashboardScreen = React.lazy(() => import('./screens/CorporateDashboardScreen'));
const CropCycleScreen = React.lazy(() => import('./screens/CropCycleScreen'));
const FarmerMarketplaceScreen = React.lazy(() => import('./screens/FarmerMarketplaceScreen'));
const SmartIrrigationScreen = React.lazy(() => import('./screens/SmartIrrigationScreen'));
const DigitalTwinScreen = React.lazy(() => import('./screens/DigitalTwinScreen'));
const VeoStudioScreen = React.lazy(() => import('./screens/VeoStudioScreen').then(m => ({ default: m.VeoStudioScreen })));
const MediaGalleryScreen = React.lazy(() => import('./screens/MediaGalleryScreen').then(m => ({ default: m.MediaGalleryScreen })));

// Ultra-fast Skeleton loader for lazy screens
const ScreenSkeleton: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-[65vh] p-8 space-y-4">
    <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-sm animate-pulse">
      <Leaf className="w-6 h-6 animate-spin" style={{ animationDuration: '4s' }} />
    </div>
    <div className="text-center space-y-2">
      <div className="h-4 w-32 bg-gray-200 rounded-full animate-pulse mx-auto" />
      <div className="h-3 w-20 bg-gray-100 rounded-full animate-pulse mx-auto" />
    </div>
  </div>
);

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </LanguageProvider>
  );
};

interface ErrorBoundaryState { hasError: boolean; error: Error | null; }
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };
  declare props: { children: React.ReactNode };

  constructor(props: { children: React.ReactNode }) {
    super(props);
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-red-100 p-6 flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 border border-red-100"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg shadow-red-200">
              <AlertTriangle className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 mb-2 text-center">Oops! Something Broke</h1>
            <p className="text-sm text-gray-500 text-center mb-4">Don't worry, we can fix this</p>
            <pre className="text-xs font-mono bg-gray-50 p-4 rounded-2xl border border-gray-200 whitespace-pre-wrap max-h-40 overflow-auto text-red-700">
              {this.state.error?.toString()}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 w-full px-4 py-4 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-2xl font-bold shadow-lg shadow-red-200 active:scale-95 transition-transform flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Reload App
            </button>
          </motion.div>
        </div>
      );
    }
    return this.props.children;
  }
}

const AppContent: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<Screen>('landing');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [visionMode, setVisionMode] = useState<VisionMode>('diagnosis');
  const [selectedListing, setSelectedListing] = useState<any>(null);
  const [language, setLanguage] = useState<Language>('en');
  const [loading, setLoading] = useState(true);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const [weather, setWeather] = useState<any>(null);
  const [locationName, setLocationName] = useState<string>("Locating...");
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [isLiveTracking, setIsLiveTracking] = useState<boolean>(false);
  const locationFetched = useRef(false);

  // ── Update app location with coordinate persistence and reverse geocoding ──
  const updateAppLocation = React.useCallback(async (
    coords: { lat: number; lng: number; accuracy?: number; name?: string },
    persist = true
  ) => {
    setUserCoords({ lat: coords.lat, lng: coords.lng });
    if (coords.accuracy !== undefined) setGpsAccuracy(coords.accuracy);

    const hasExplicitName = !!coords.name && !coords.name.startsWith('Pinpoint (');

    if (coords.name) {
      setLocationName(coords.name);
    }

    if (persist) {
      try {
        localStorage.setItem('kd_saved_location', JSON.stringify({
          lat: coords.lat,
          lng: coords.lng,
          name: coords.name,
          accuracy: coords.accuracy
        }));
      } catch {}
    }

    try {
      const rev = await weatherService.reverseGeocode(coords.lat, coords.lng);
      // If user explicitly picked a name like "Bidadi Chatra", keep their custom title while enriching with district/state
      let formattedName = rev.formatted || rev.city || `${coords.lat.toFixed(3)}°, ${coords.lng.toFixed(3)}°`;
      if (hasExplicitName && coords.name) {
        if (!coords.name.includes(',') && rev.district) {
          formattedName = `${coords.name}, ${rev.district}`;
        } else {
          formattedName = coords.name;
        }
      }

      setLocationName(formattedName);
      if (persist) {
        try {
          localStorage.setItem('kd_saved_location', JSON.stringify({
            lat: coords.lat,
            lng: coords.lng,
            name: formattedName,
            accuracy: coords.accuracy
          }));
        } catch {}
      }

      // Sync user profile with real detected district
      setUser((prevUser) => {
        if (!prevUser) return prevUser;
        return {
          ...prevUser,
          location: { lat: coords.lat, lng: coords.lng },
          district: rev.district || prevUser.district,
        };
      });
    } catch {
      if (!coords.name) {
        setLocationName(`Pinpoint (${coords.lat.toFixed(3)}°, ${coords.lng.toFixed(3)}°)`);
      }
    }
  }, []);

  // ── Continuous real-time GPS tracking listener ──
  useEffect(() => {
    if (!isLiveTracking) return;
    console.log('[App] Starting continuous real-time GPS watch...');
    const unwatch = watchRealTimeLocation(
      (pos) => {
        console.log('[App] Real-time position update:', pos.lat, pos.lng, pos.accuracy);
        setUserCoords({ lat: pos.lat, lng: pos.lng });
        if (pos.accuracy) setGpsAccuracy(pos.accuracy);
        weatherService.reverseGeocode(pos.lat, pos.lng)
          .then(rev => {
            if (rev.formatted || rev.city) {
              setLocationName(rev.formatted || rev.city);
            }
          })
          .catch(() => {});
      },
      (err) => {
        console.warn('[App] Real-time tracking error:', err);
      }
    );
    return () => {
      console.log('[App] Stopping continuous real-time GPS watch');
      unwatch();
    };
  }, [isLiveTracking]);
  const [fabMenuOpen, setFabMenuOpen] = useState(false);
  const [traceVerifyId, setTraceVerifyId] = useState<string | undefined>(undefined);
  const [screenData, setScreenData] = useState<any>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'mobile' | 'studio'>('mobile');
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [currentTime, setCurrentTime] = useState<string>('09:41');

  useEffect(() => {
    const updateClock = () => {
      const d = new Date();
      const h = String(d.getHours()).padStart(2, '0');
      const m = String(d.getMinutes()).padStart(2, '0');
      setCurrentTime(`${h}:${m}`);
    };
    updateClock();
    const iv = setInterval(updateClock, 30000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Admin fast-path handled above at state init time

  // ── Weather re-fetch whenever accurate GPS coords arrive ──────────────────
  useEffect(() => {
    if (!userCoords) return;
    console.log('[App] Re-fetching weather for coords:', userCoords.lat, userCoords.lng);
    weatherService.getWeather(userCoords.lat, userCoords.lng)
      .then(wd => setWeather(wd))
      .catch(e => console.error('[App] Weather refresh failed:', e?.message || String(e)));
    // Also auto-refresh every 5 minutes
    const iv = setInterval(() => {
      weatherService.getWeather(userCoords.lat, userCoords.lng)
        .then(wd => setWeather(wd)).catch(() => {});
    }, 5 * 60 * 1000);
    return () => clearInterval(iv);
  }, [userCoords]);

  // ── QR deep-link: ?verify=KD-HTK-YYYY-NNNNN ──
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const verifyId = params.get('verify');
    if (verifyId) {
      setTraceVerifyId(verifyId);
      setCurrentScreen('trace-verify');
    }
  }, []);

  const log = (msg: string) => {
    console.log(msg);
    const list = document.getElementById('debug-log-list');
    if (list) {
      const li = document.createElement('li');
      li.innerText = `${new Date().toLocaleTimeString()} - ${msg}`;
      list.appendChild(li);
    }
  };

  useEffect(() => {
    // If we came via the admin redirect, skip all auth/init logic
    if (currentScreen === 'admin') return;

    const init = async () => {
      console.log("[App] init called immediately on mount");
      log("[App] Init started");

      const savedLang = localStorage.getItem('ks_lang') as Language;
      if (savedLang) setLanguage(savedLang);

      let token = localStorage.getItem('ks_token');
      // Auto-provision demo farmer session for instant, seamless preview
      if (!token) {
        token = 'kd_demo_token_ramesh';
        localStorage.setItem('ks_token', token);
      }
      log(`[App] Token active: ${!!token}`);

      // 1. Initial coordinates from saved storage or auto-detection
      let initialLocation = { lat: 21.1458, lng: 79.0882 };
      let initialName = "Locating real-time GPS...";
      try {
        const saved = localStorage.getItem('kd_saved_location');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed?.lat && parsed?.lng) {
            initialLocation = { lat: Number(parsed.lat), lng: Number(parsed.lng) };
            if (parsed.name) initialName = parsed.name;
            if (parsed.accuracy) setGpsAccuracy(parsed.accuracy);
          }
        }
      } catch {}

      setUserCoords(initialLocation);
      setLocationName(initialName);

      // 2. Query pinpoint real-time GPS asynchronously
      getPinpointLocation({ enableHighAccuracy: true, timeout: 8000 })
        .then((pinpoint) => {
          log(`[App] Pinpoint real-time GPS locked: ${pinpoint.lat}, ${pinpoint.lng} (±${pinpoint.accuracy}m)`);
          updateAppLocation({
            lat: pinpoint.lat,
            lng: pinpoint.lng,
            accuracy: pinpoint.accuracy
          }, true);
        })
        .catch((err) => {
          log(`[App] Real-time GPS notice: ${err?.message || err}`);
          if (!localStorage.getItem('kd_saved_location')) {
            weatherService.reverseGeocode(initialLocation.lat, initialLocation.lng)
              .then(rev => setLocationName(rev.formatted || rev.city))
              .catch(() => setLocationName("Pinpoint Location"));
          }
        });

      try {
        log("[App] Fetching profile...");
        const defaultProfile: UserProfile = {
          name: "Ramesh Patil",
          phone: "9876543210",
          state: "Maharashtra",
          district: "Nagpur",
          land_size: 2.5,
          crops: ["Wheat", "Cotton", "Orange"],
          soil_type: "Black Cotton Soil",
          language: savedLang || "en"
        };

        let profile: UserProfile = defaultProfile;
        try {
          profile = await Promise.race([
            userService.getProfile().catch(() => defaultProfile),
            new Promise<UserProfile>((resolve) => setTimeout(() => resolve(defaultProfile), 1800))
          ]) as UserProfile;
        } catch {
          profile = defaultProfile;
        }

        log(`[App] Profile loaded: ${profile?.name}`);

        if (profile.crops && typeof profile.crops === 'string') {
          (profile as any).crops = (profile.crops as string).split(',').filter(Boolean);
        }

        if (initialLocation) profile.location = initialLocation;
        localStorage.setItem('ks_profile_cache', JSON.stringify(profile));

        setUser(profile);
        setCurrentScreen(profile.name ? 'home' : 'profile');
        if (profile.language) setLanguage(profile.language);

        const lat = initialLocation.lat;
        const lng = initialLocation.lng;

        // Weather load in background for initial coordinates
        weatherService.getWeather(lat, lng)
          .then((wd) => { setWeather(wd); log("[App] Initial weather loaded"); })
          .catch((e) => console.warn("[App] Weather fetch notice:", e?.message || String(e)));

      } catch (e: any) {
        log(`[App] Outer init fallback: ${e?.message || e}`);
        const fallbackUser: UserProfile = {
          name: "Ramesh Patil",
          phone: "9876543210",
          state: "Maharashtra",
          district: "Nagpur",
          land_size: 2.5,
          crops: ["Wheat", "Cotton", "Orange"],
          soil_type: "Black Cotton Soil",
          language: savedLang || "en"
        };
        setUser(fallbackUser);
        setCurrentScreen('home');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.warn("[App Global Error Handled]:", event.error || event.message);
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      event.preventDefault(); // Mark rejection as handled to prevent runtime uncaught exception
      console.warn("[App Rejection Handled]:", event.reason);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  const changeLanguage = async (lang: Language) => {
    console.log("[App] Changing language to:", lang);
    setLanguage(lang);
    localStorage.setItem('ks_lang', lang);
    if (user || localStorage.getItem('ks_token')) {
      try {
        await userService.updateProfile({ language: lang });
        console.log("[App] Synced language to backend profile.");
      } catch (e) {
        console.error("[App] Failed to sync language to backend.", e);
      }
    }
  };

  const navigateTo = (screen: Screen, data?: any) => {
    const protectedScreens: Screen[] = ['map', 'carbon-vault', 'crop-stress', 'landmark', 'soil-carbon', 'traceability', 'field-monitor'];
    
    // Check BOTH localStorage token AND in-memory user state.
    // On Android/Capacitor WebView, localStorage can sometimes appear empty
    // on app resume even when the user is authenticated. Checking user state
    // as a fallback prevents false "please log in" blocks.
    const hasToken = !!localStorage.getItem('ks_token') || !!user;

    if (protectedScreens.includes(screen) && !hasToken) {
      setIsGuestMode(false);
      alert('Please log in to use farm tools and save your land.');
      setCurrentScreen('auth');
      return;
    }

    if (screen === 'vision-result' && data?.image) {
      setCapturedImage(data.image);
      if (data.mode) setVisionMode(data.mode);
    }
    if (screen === 'market-detail' && data?.listing) {
      setSelectedListing(data.listing);
    }
    if (screen === 'trace-verify' && data?.tokenId) {
      setTraceVerifyId(data.tokenId);
    }
    if (screen === 'field-monitor' && data?.plotId) {
      setScreenData({ plotId: data.plotId });
    }
    setCurrentScreen(screen);
    setFabMenuOpen(false);
  };

  const handleLogin = async () => {
    try {
      setLoading(true);
      const profile = await userService.getProfile();
      setUser(profile);
      setCurrentScreen(profile.name ? 'home' : 'profile');
    } catch (e) {
      setCurrentScreen('profile');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileComplete = (profile: UserProfile) => {
    const completeProfile = { ...profile, language };
    // Normalize crops so the cache always stores an array
    if (completeProfile.crops && typeof completeProfile.crops === 'string') {
      (completeProfile as any).crops = (completeProfile.crops as string).split(',').filter(Boolean);
    }
    // Write to local cache so next reload skips re-fetch
    localStorage.setItem('ks_profile_cache', JSON.stringify(completeProfile));
    setUser(completeProfile);
    navigateTo('home');
  };

  const handleLogout = () => {
    localStorage.removeItem('ks_token');
    localStorage.removeItem('ks_lang');
    localStorage.removeItem('ks_profile_cache');
    setUser(null);
    setIsGuestMode(false);
    setCurrentScreen('auth');
  };

  const t = translations[language];

  // ============ SPLASH SCREEN ============
  if (showSplash) {
    return (
      <div className="h-full w-full max-w-md mx-auto bg-white shadow-2xl overflow-hidden relative font-sans">
        <SplashScreen onFinish={() => setShowSplash(false)} />
      </div>
    );
  }

  // ============ ENHANCED LOADING SCREEN ============
  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 p-10 relative overflow-hidden">
        {/* Animated background blobs */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-10 left-10 w-72 h-72 bg-green-300/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [90, 0, 90],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-10 right-10 w-80 h-80 bg-emerald-400/30 rounded-full blur-3xl"
        />

        {/* Main loader content */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="relative z-10 flex flex-col items-center"
        >
          {/* Rotating outer ring with leaf */}
          <div className="relative w-32 h-32 mb-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full border-4 border-transparent border-t-green-600 border-r-emerald-500"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute inset-2 rounded-full border-4 border-transparent border-b-teal-500 border-l-green-400"
            />
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-xl shadow-green-300">
                <Leaf className="w-8 h-8 text-white" />
              </div>
            </motion.div>
          </div>

          <motion.h2
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-black bg-gradient-to-r from-green-700 to-emerald-600 bg-clip-text text-transparent mb-2"
          >
            Krishi Drishti
          </motion.h2>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center gap-2 text-green-700"
          >
            <Sparkles className="w-4 h-4" />
            <p className="text-sm font-semibold">Initializing Smart Farm AI...</p>
          </motion.div>

          {/* Animated dots */}
          <div className="flex gap-2 mt-6">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{
                  y: [0, -10, 0],
                  backgroundColor: ['#10b981', '#059669', '#10b981'],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
                className="w-2 h-2 bg-green-500 rounded-full"
              />
            ))}
          </div>

          <button
            onClick={() => {
              setLoading(false);
              setCurrentScreen('home');
            }}
            className="mt-6 text-xs text-green-800/70 hover:text-green-900 bg-white/80 hover:bg-white px-4 py-2 rounded-full font-medium shadow-sm transition-all"
          >
            Enter Dashboard →
          </button>
        </motion.div>
      </div>
    );
  }

  // ============ ENHANCED CONNECTION ERROR ============
  if (connectionError) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-amber-50 p-6 text-center relative overflow-hidden">
        {/* Background effects */}
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute top-20 left-10 w-64 h-64 bg-red-200 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1.3, 1, 1.3], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 5, repeat: Infinity }}
          className="absolute bottom-20 right-10 w-64 h-64 bg-orange-200 rounded-full blur-3xl"
        />

        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 150 }}
          className="relative z-10"
        >
          <motion.div
            animate={{
              rotate: [0, -10, 10, -10, 0],
            }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="w-24 h-24 bg-gradient-to-br from-red-500 to-orange-500 rounded-3xl flex items-center justify-center mb-6 mx-auto shadow-2xl shadow-red-200 relative"
          >
            <WifiOff className="w-12 h-12 text-white" />
            <motion.div
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 rounded-3xl border-4 border-red-400"
            />
          </motion.div>

          <motion.h2
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-black bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent mb-2"
          >
            Connection Timeout
          </motion.h2>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-sm text-gray-600 mb-8 font-medium max-w-xs"
          >
            Server is taking too long to respond. Please check your internet connection and try again.
          </motion.p>

          <div className="flex flex-col gap-3 max-w-xs mx-auto">
            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
              onClick={() => {
                setConnectionError(false);
                setLoading(true);
                setTimeout(() => {
                  setLoading(false);
                  setCurrentScreen('home');
                }, 300);
              }}
              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-3.5 rounded-2xl font-bold uppercase tracking-wider shadow-xl shadow-green-300 flex items-center justify-center gap-3 w-full"
            >
              <RefreshCw className="w-5 h-5" />
              Retry Connection
            </motion.button>
            <button
              onClick={() => {
                setConnectionError(false);
                setLoading(false);
                setIsGuestMode(true);
                setCurrentScreen('home');
              }}
              className="text-xs text-gray-600 hover:text-green-700 font-semibold py-2 underline transition-colors"
            >
              Continue with Demo Farm (Ramesh Patil)
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'landing':
        return (
          <LandingScreen
            onLogin={() => {
              if (user) {
                setCurrentScreen(user.name ? 'home' : 'profile');
              } else {
                setCurrentScreen('auth');
              }
            }}
            onBrowse={() => {
              setIsGuestMode(true);
              setCurrentScreen('home');
            }}
            onAdminLogin={() => setCurrentScreen('admin')}
            currentLang={language}
            onLangChange={changeLanguage}
          />
        );
      case 'auth':
        return (
          <AuthScreen
            onLogin={handleLogin}
            onSkip={() => {
              setIsGuestMode(true);
              setCurrentScreen('home');
            }}
            currentLang={language}
            onLangChange={changeLanguage}
          />
        );
      case 'profile':
        return <ProfileScreen onComplete={handleProfileComplete} t={t} navigateTo={navigateTo} onLogout={handleLogout} />;
      case 'home':
        return <DashboardScreen
          navigateTo={navigateTo}
          user={user}
          t={t}
          onLangChange={changeLanguage}
          currentLang={language}
          weather={weather}
          locationName={locationName}
          userCoords={userCoords}
          gpsAccuracy={gpsAccuracy}
          isLiveTracking={isLiveTracking}
          onToggleLiveTracking={() => setIsLiveTracking(prev => !prev)}
          onUpdateLocation={updateAppLocation}
          onOpenSearch={() => setIsCommandPaletteOpen(true)}
        />;
      case 'admin':
        return <AgritechDashboardNew t={t} />;
      case 'chat':
        return <ChatScreen navigateTo={navigateTo} language={language} t={t} onOpenVoiceAssistant={() => setIsVoiceActive(true)} />;
      case 'vision':
        return <VisionScreen navigateTo={navigateTo} t={t} />;
      case 'vision-result':
        return <VisionResultScreen navigateTo={navigateTo} image={capturedImage} mode={visionMode} language={language} t={t} />;
      case 'map':
        return <FarmMapScreen navigateTo={navigateTo} />;
      case 'market':
        return <MarketScreen navigateTo={navigateTo} t={t} />;
      case 'market-detail':
        return <MarketDetailScreen navigateTo={navigateTo} listing={selectedListing} t={t} />;
      case 'insurance':
        return <InsuranceScreen navigateTo={navigateTo} t={t} />;
      case 'forecast':
        return <ForecastScreen navigateTo={navigateTo} t={t} weather={weather} user={user} locationName={locationName} />;
      case 'live-audio':
        return <LiveAudioScreen navigateTo={navigateTo} language={language} t={t} />;
      case 'carbon-vault':
        return <CarbonVaultScreen navigateTo={navigateTo} t={t} />;
      case 'scheme-setu':
        return <SchemeSetuScreen navigateTo={navigateTo} user={user} t={t} />;
      case 'crop-stress':
        return <CropStressScreen navigateTo={navigateTo} />;
      case 'landmark':
        return <LandMarkingScreen navigation={{ goBack: () => navigateTo('home'), goToAuth: () => navigateTo('auth') }} />;
      case 'acoustic-scanner':
        return <AcousticScannerScreen navigation={{ goBack: () => navigateTo('home') }} />;
      case 'soil-carbon':
        return <SoilCarbonModelScreen navigateTo={navigateTo} />;
      case 'traceability':
        return <TraceabilityScreen navigateTo={navigateTo} />;
      case 'trace-verify':
        return <TraceabilityVerifyScreen navigateTo={navigateTo} tokenId={traceVerifyId} />;
      case 'field-monitor':
        return <FieldMonitorScreen navigateTo={navigateTo} screenData={screenData} t={t} />;
      case 'corporate-dashboard':
        return <CorporateDashboardScreen navigateTo={navigateTo} t={t} />;
      case 'crop-cycle':
        return <CropCycleScreen navigateTo={navigateTo} screenData={screenData} t={t} />;
      case 'marketplace':
        return <FarmerMarketplaceScreen navigateTo={navigateTo} t={t} />;
      case 'smart-irrigation':
        return <SmartIrrigationScreen navigateTo={navigateTo} />;
      case 'digital-twin':
        return <DigitalTwinScreen navigateTo={navigateTo} />;
      case 'veo-studio':
        return <VeoStudioScreen navigateTo={navigateTo} capturedImage={capturedImage} t={t} />;
      case 'media-gallery':
        return <MediaGalleryScreen navigateTo={navigateTo} t={t} />;
      default:
        return (
          <AuthScreen
            onLogin={handleLogin}
            onSkip={() => {
              setIsGuestMode(true);
              setCurrentScreen('home');
            }}
            currentLang={language}
            onLangChange={changeLanguage}
          />
        );
    }
  };

  const showNav = !['landing', 'auth', 'profile', 'market-detail', 'live-audio', 'carbon-vault', 'scheme-setu', 'landmark', 'chat', 'vision', 'vision-result', 'acoustic-scanner', 'traceability', 'trace-verify', 'field-monitor', 'corporate-dashboard', 'crop-cycle', 'smart-irrigation', 'digital-twin', 'veo-studio', 'media-gallery'].includes(currentScreen);

  return (
    <div className="min-h-screen bg-slate-950 text-gray-900 flex flex-col selection:bg-emerald-500 selection:text-white" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      {/* ── DESKTOP/TABLET PRO APP BAR (Visible on md+ screens) ── */}
      <header className="hidden md:flex items-center justify-between px-6 py-3 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Leaf size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm tracking-tight text-white">Krishi-Drishti</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                PRO SUITE
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Enterprise Agritech &amp; Farm Intelligence</p>
          </div>
        </div>

        {/* Center: Viewport Mode Switcher & Global Search */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-800/80 p-1 rounded-xl flex items-center border border-slate-700/60">
            <button
              onClick={() => setViewMode('mobile')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'mobile'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone size={14} />
              Mobile Frame
            </button>
            <button
              onClick={() => setViewMode('studio')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'studio'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Monitor size={14} />
              Expanded Studio
            </button>
          </div>

          <button
            onClick={() => setIsCommandPaletteOpen(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 rounded-xl text-xs font-medium text-slate-300 transition-colors"
          >
            <Search size={14} className="text-emerald-400" />
            <span>Search 20+ Tools...</span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] font-mono text-slate-400 font-bold">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right: Live Telemetry & Emergency Hotline */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-mono text-slate-300">Gemini 2.5 Flash</span>
          </div>

          <div className="hidden lg:flex items-center gap-2 text-slate-300 text-[11px] bg-slate-800/60 px-2.5 py-1 rounded-lg border border-slate-700/50">
            <Radio size={12} className={isLiveTracking ? "text-red-400 animate-pulse" : "text-emerald-400"} />
            <span>
              GPS: {userCoords ? `${userCoords.lat.toFixed(4)}°, ${userCoords.lng.toFixed(4)}° (${locationName.split(',')[0]})` : 'Locating GPS...'}
            </span>
            {gpsAccuracy && (
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono">
                ±{gpsAccuracy}m
              </span>
            )}
            {isLiveTracking && (
              <span className="text-[9px] uppercase font-bold bg-red-500/20 text-red-300 px-1 rounded animate-pulse">
                Live
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
            {isOnline ? (
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <Wifi size={13} /> Online
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-400 font-medium">
                <WifiOff size={13} /> Offline Sync
              </span>
            )}
          </div>

          <a
            href="tel:18001801551"
            className="flex items-center gap-1.5 px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 rounded-lg text-xs font-bold transition-colors"
          >
            <PhoneCall size={12} />
            SOS 1800-180-1551
          </a>
        </div>
      </header>

      {/* ── APP CONTAINER WRAPPER ── */}
      <div className="flex-1 flex items-center justify-center p-0 md:p-4 overflow-hidden">
        <div
          className={`flex flex-col h-screen md:h-[92vh] w-full mx-auto relative overflow-hidden bg-white text-gray-900 transition-all duration-300 ${
            viewMode === 'studio'
              ? 'max-w-6xl md:rounded-3xl md:shadow-2xl md:border md:border-slate-800'
              : 'max-w-md md:rounded-[44px] md:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] md:border-[10px] md:border-slate-900'
          }`}
          style={{ transform: 'translate(0)' }}
        >
          {/* Mobile Status Bar (Visible in phone view on desktop) */}
          {viewMode === 'mobile' && (
            <div className="hidden md:flex items-center justify-between px-6 pt-3 pb-1 bg-transparent select-none z-30">
              <span className="text-xs font-bold text-gray-800">{currentTime}</span>
              {/* Dynamic Island Notch */}
              <div className="w-24 h-4 bg-black rounded-full flex items-center justify-center gap-1">
                <div className="w-2 h-2 rounded-full bg-slate-900" />
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 animate-pulse" />
              </div>
              <div className="flex items-center gap-1.5 text-gray-800">
                <span className="text-[10px] font-extrabold font-mono">5G</span>
                <Wifi size={13} strokeWidth={2.5} />
                <Battery size={14} strokeWidth={2.5} className="fill-gray-800" />
              </div>
            </div>
          )}

          {/* Offline Toast Banner */}
          {!isOnline && (
            <div className="bg-amber-500 text-slate-950 px-4 py-1.5 text-xs font-bold flex items-center justify-between z-50">
              <div className="flex items-center gap-2">
                <WifiOff size={14} />
                <span>Offline Field Mode Active · Scans and plots are saved locally</span>
              </div>
              <span className="text-[10px] bg-slate-950 text-amber-400 px-2 py-0.5 rounded font-mono">
                Auto-Sync on 4G
              </span>
            </div>
          )}

          {/* Main Scrollable Canvas */}
          <main className={`flex-1 overflow-y-auto mobile-container relative ${showNav ? 'pb-20' : 'pb-0'}`}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentScreen}
                initial={{ opacity: 0, x: 20, scale: 0.99 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -20, scale: 0.99 }}
                transition={{
                  duration: 0.25,
                  ease: [0.25, 0.1, 0.25, 1],
                }}
                className="h-full"
              >
                <React.Suspense fallback={<ScreenSkeleton />}>
                  {renderScreen()}
                </React.Suspense>
              </motion.div>
            </AnimatePresence>
          </main>

          {/* ============ ANCHORED FLOATING ACTION BUTTON WITH EXPANDABLE MENU ============ */}
          {showNav && (
            <>
              {/* Backdrop when FAB menu is open */}
              <AnimatePresence>
                {fabMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setFabMenuOpen(false)}
                    className="absolute inset-0 bg-black/40 backdrop-blur-sm z-[90]"
                  />
                )}
              </AnimatePresence>

              {/* Voice Assistant Sub-button */}
              <AnimatePresence>
                {fabMenuOpen && (
                  <motion.button
                    initial={{ scale: 0, y: 0, opacity: 0 }}
                    animate={{ scale: 1, y: -72, opacity: 1 }}
                    exit={{ scale: 0, y: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    onClick={() => {
                      setIsVoiceActive(true);
                      setFabMenuOpen(false);
                    }}
                    className="absolute bottom-20 right-4 w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-full shadow-2xl shadow-purple-500/50 flex items-center justify-center z-[100] border-2 border-white/30"
                  >
                    <Mic size={20} />
                    <motion.span
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                      className="absolute right-14 bg-gray-900 text-white text-xs font-bold px-2.5 py-1 rounded-lg whitespace-nowrap shadow-lg"
                    >
                      Voice Assistant
                    </motion.span>
                  </motion.button>
                )}
              </AnimatePresence>

              {/* Chat Sub-button */}
              <AnimatePresence>
                {fabMenuOpen && (
                  <motion.button
                    initial={{ scale: 0, y: 0, opacity: 0 }}
                    animate={{ scale: 1, y: -136, opacity: 1 }}
                    exit={{ scale: 0, y: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.05 }}
                    onClick={() => {
                      setCurrentScreen('chat');
                      setFabMenuOpen(false);
                    }}
                    className="absolute bottom-20 right-4 w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-full shadow-2xl shadow-blue-500/50 flex items-center justify-center z-[100] border-2 border-white/30"
                  >
                    <MessageCircle size={20} />
                    <motion.span
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 }}
                      className="absolute right-14 bg-gray-900 text-white text-xs font-bold px-2.5 py-1 rounded-lg whitespace-nowrap shadow-lg"
                    >
                      AI Chat
                    </motion.span>
                  </motion.button>
                )}
              </AnimatePresence>

              {/* Main FAB Button with pulse effect */}
              <motion.button
                onClick={() => setFabMenuOpen(!fabMenuOpen)}
                whileTap={{ scale: 0.9 }}
                className="absolute bottom-20 right-4 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center z-[101] overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)',
                  boxShadow: '0 8px 30px rgba(16, 185, 129, 0.45)',
                }}
              >
                {/* Pulse rings */}
                {!fabMenuOpen && (
                  <>
                    <motion.div
                      animate={{
                        scale: [1, 1.8],
                        opacity: [0.5, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeOut",
                      }}
                      className="absolute inset-0 rounded-full bg-green-400"
                    />
                    <motion.div
                      animate={{
                        scale: [1, 1.8],
                        opacity: [0.5, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeOut",
                        delay: 1,
                      }}
                      className="absolute inset-0 rounded-full bg-emerald-400"
                    />
                  </>
                )}

                {/* Icon with rotation animation */}
                <motion.div
                  animate={{ rotate: fabMenuOpen ? 135 : 0 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="relative z-10"
                >
                  <Sparkles size={24} className="text-white drop-shadow-lg" />
                </motion.div>
              </motion.button>
            </>
          )}

          {/* Global Voice Assistant Modal */}
          <VoiceAssistantModal
            isOpen={isVoiceActive}
            onClose={() => setIsVoiceActive(false)}
            language={language}
            onSwitchToText={() => {
              setIsVoiceActive(false);
              setCurrentScreen('chat');
            }}
          />

          {/* Anchored Bottom Navigation */}
          {showNav && (
            <BottomNav
              currentScreen={currentScreen}
              onNavigate={navigateTo}
              isExpandedView={viewMode === 'studio'}
            />
          )}
        </div>
      </div>

      {/* Global Command Palette (⌘K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={navigateTo}
        onOpenVoice={() => setIsVoiceActive(true)}
        currentLang={language}
      />
    </div>
  );
};

export default App;