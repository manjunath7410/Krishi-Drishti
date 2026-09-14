import React from 'react';
import { Home, Store, User, Map, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { Screen } from '../types';

interface BottomNavProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
  isExpandedView?: boolean;
}

const PRIMARY = '#00BB78';
const DARK = '#001A11';
const GRAY = '#64748B';

const BottomNav: React.FC<BottomNavProps> = ({ currentScreen, onNavigate, isExpandedView = false }) => {
  const tabs = [
    { screen: 'home' as Screen, icon: Home, label: 'Home' },
    { screen: 'market' as Screen, icon: Store, label: 'Mandi' },
    { screen: 'map' as Screen, icon: Map, label: 'Field' },
    { screen: 'profile' as Screen, icon: User, label: 'Profile' },
  ];

  return (
    <div
      className={`sticky bottom-0 w-full z-40 transition-all ${
        isExpandedView ? 'max-w-6xl mx-auto' : 'max-w-md mx-auto'
      }`}
      style={{
        fontFamily: 'Plus Jakarta Sans, sans-serif',
      }}
    >
      <div
        className="w-full flex items-center justify-around px-3 py-2 bg-white/95 backdrop-blur-xl border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]"
        style={{
          paddingBottom: 'max(0.6rem, env(safe-area-inset-bottom))',
        }}
      >
        {tabs.map(({ screen, icon: Icon, label }) => {
          const active = currentScreen === screen;
          return (
            <motion.button
              key={screen}
              whileTap={{ scale: 0.92 }}
              onClick={() => onNavigate(screen)}
              className="relative flex flex-col items-center justify-center py-1 px-4 rounded-2xl transition-all"
            >
              {active && (
                <motion.div
                  layoutId="activeTabPill"
                  className="absolute inset-0 bg-emerald-50 rounded-2xl -z-10"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <div className="relative">
                <Icon
                  size={20}
                  strokeWidth={active ? 2.5 : 1.8}
                  style={{ color: active ? PRIMARY : GRAY }}
                />
                {active && (
                  <span
                    className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full"
                    style={{ background: PRIMARY }}
                  />
                )}
              </div>
              <span
                className={`text-[10px] font-bold mt-1 tracking-tight transition-colors ${
                  active ? 'text-emerald-700' : 'text-slate-500'
                }`}
              >
                {label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
