import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  Volume2,
  VolumeX,
  PhoneCall,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  CloudRain,
  Sun,
  Wind,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { Language } from '../types';

interface AgroEmergencyBannerProps {
  weather: any;
  locationName: string;
  currentLang: Language;
}

export const AgroEmergencyBanner: React.FC<AgroEmergencyBannerProps> = ({
  weather,
  locationName,
  currentLang,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Compute live agricultural risk score
  const temp = weather?.current?.temperature_2m ?? 28;
  const humidity = weather?.current?.relative_humidity_2m ?? 75;
  const precip = weather?.current?.precipitation ?? 0;
  const wind = weather?.current?.wind_speed_10m ?? 8;

  // Determine critical condition
  let severity: 'high' | 'medium' | 'normal' = 'normal';
  let title = 'Favorable Farm Conditions';
  let description = 'Atmospheric conditions are stable. Good window for routine fertigation and field scouting.';
  let actionAdvice = 'Continue normal irrigation and monitor soil moisture at 15cm depth.';
  let icon = CheckCircle2;

  if (precip > 5 || humidity > 85) {
    severity = 'high';
    title = 'High Fungal & Rust Spore Infection Risk';
    description = `Elevated relative humidity (${humidity}%) and rainfall create ideal incubation for Anthracnose, Leaf Spot & Mildew.`;
    actionAdvice = 'Withhold urea top-dressing. Prepare preventive spray of Mancozeb (2g/L) or Trichoderma viride within 48 hours.';
    icon = CloudRain;
  } else if (temp > 35) {
    severity = 'high';
    title = 'High Heat & Evapotranspiration Stress';
    description = `Peak daytime temperatures (${Math.round(temp)}°C) exceeding vegetative optimum. Fast soil moisture depletion.`;
    actionAdvice = 'Run micro-drip or sprinkler irrigation in evening hours (post 5 PM). Apply straw mulch to reduce canopy stress.';
    icon = Sun;
  } else if (wind > 20) {
    severity = 'medium';
    title = 'High Wind Warning - Spray Ineffective';
    description = `Wind speeds (${wind} km/h) will cause significant chemical drift and reduced spray adhesion.`;
    actionAdvice = 'Postpone foliar pesticide or herbicide application until wind subsides below 10 km/h.';
    icon = Wind;
  } else if (humidity > 70 && temp > 25) {
    severity = 'medium';
    title = 'Moderate Sucking Pest (Whitefly/Aphid) Alert';
    description = 'Warm ambient humidity favors rapid nymph hatching in cotton, pulses and vegetables.';
    actionAdvice = 'Install 5 yellow sticky traps per acre and inspect undersides of top leaves.';
    icon = AlertTriangle;
  }

  const handleSpeak = () => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported on this browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const textToSpeak = `${title}. ${description}. Recommended Action: ${actionAdvice}`;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);

    // Pick best voice if available
    const voices = window.speechSynthesis.getVoices();
    const regionalVoice = voices.find(v => v.lang.includes('hi') || v.lang.includes('en-IN'));
    if (regionalVoice) utterance.voice = regionalVoice;

    utterance.rate = 0.95;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (dismissed) return null;

  const bgStyle =
    severity === 'high'
      ? 'bg-gradient-to-r from-red-500/10 via-amber-500/10 to-transparent border-red-200'
      : severity === 'medium'
      ? 'bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-transparent border-amber-200'
      : 'bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent border-emerald-200';

  const badgeColor =
    severity === 'high'
      ? 'bg-red-500 text-white'
      : severity === 'medium'
      ? 'bg-amber-500 text-white'
      : 'bg-emerald-600 text-white';

  const IconComponent = icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mx-5 my-3 rounded-2xl border p-3.5 sm:p-4 shadow-xs relative overflow-hidden ${bgStyle}`}
      style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${badgeColor} shadow-sm`}>
            <IconComponent size={18} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${badgeColor}`}>
                {severity === 'high' ? 'High Risk Alert' : severity === 'medium' ? 'Agro Advisory' : 'Field Advisory'}
              </span>
              <span className="text-[11px] text-gray-400 font-medium">
                {locationName.split(',')[0]} • Live Sensor
              </span>
            </div>

            <h3 className="text-sm font-bold text-gray-900 mt-1 leading-snug">{title}</h3>
            <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{description}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={handleSpeak}
            title={isSpeaking ? 'Stop Audio' : 'Audio Announcement'}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
              isSpeaking
                ? 'bg-emerald-600 text-white animate-pulse'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {isSpeaking ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-8 h-8 rounded-xl bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 flex items-center justify-center"
          >
            {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>
      </div>

      {/* Expanded Recommendation & Emergency Connect */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 pt-3 border-t border-gray-200/60 space-y-3"
          >
            <div className="bg-white/80 rounded-xl p-3 border border-gray-100">
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-wider mb-1">
                Recommended Agronomist Action
              </p>
              <p className="text-xs font-semibold text-gray-800 leading-relaxed">
                {actionAdvice}
              </p>
            </div>

            <div className="flex items-center justify-between gap-2 flex-wrap">
              <a
                href="tel:18001801551"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm transition-colors"
              >
                <PhoneCall size={13} />
                Call Kisan Helpline (Toll-Free)
              </a>

              <button
                onClick={() => setDismissed(true)}
                className="text-[11px] text-gray-400 hover:text-gray-600 font-medium px-2 py-1"
              >
                Dismiss for today
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AgroEmergencyBanner;
