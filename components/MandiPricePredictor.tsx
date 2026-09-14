import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Sparkles,
  Calculator,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  BarChart2,
} from 'lucide-react';

interface CommodityTrend {
  crop: string;
  mandi: string;
  currentPrice: number; // per quintal
  projectedPrice: number; // in 10-14 days
  msp: number; // govt minimum support price
  recommendation: 'HOLD' | 'SELL';
  gainPercent: number;
  confidence: number;
  reason: string;
  trend: number[]; // 7-day sparkline prices
}

const COMMODITY_TRENDS: CommodityTrend[] = [
  {
    crop: 'Cotton (Kapas)',
    mandi: 'Wardha APMC',
    currentPrice: 7150,
    projectedPrice: 7680,
    msp: 7121,
    recommendation: 'HOLD',
    gainPercent: 7.4,
    confidence: 89,
    reason: 'Spinning mill demand rebounding + delayed export arrivals from Gujarat.',
    trend: [6980, 7050, 7120, 7150, 7290, 7450, 7680]
  },
  {
    crop: 'Soybean (Yellow)',
    mandi: 'Nagpur APMC',
    currentPrice: 4720,
    projectedPrice: 5080,
    msp: 4892,
    recommendation: 'HOLD',
    gainPercent: 7.6,
    confidence: 86,
    reason: 'Import duty hikes on crude palm oil supporting domestic soymeal demand.',
    trend: [4620, 4650, 4700, 4720, 4850, 4960, 5080]
  },
  {
    crop: 'Onion (Red)',
    mandi: 'Nashik / Lasalgaon',
    currentPrice: 2450,
    projectedPrice: 2180,
    msp: 1950,
    recommendation: 'SELL',
    gainPercent: -11.0,
    confidence: 91,
    reason: 'Heavy late Kharif arrivals entering market this week. Price softening imminent.',
    trend: [2650, 2600, 2520, 2450, 2350, 2260, 2180]
  },
  {
    crop: 'Wheat (Sharbati)',
    mandi: 'Sehore APMC',
    currentPrice: 2850,
    projectedPrice: 2980,
    msp: 2275,
    recommendation: 'HOLD',
    gainPercent: 4.5,
    confidence: 82,
    reason: 'FCI buffer stocks tight; private flour mills bidding above state MSP.',
    trend: [2780, 2810, 2830, 2850, 2890, 2940, 2980]
  },
  {
    crop: 'Tomato (Hybrid)',
    mandi: 'Kolar APMC',
    currentPrice: 1650,
    projectedPrice: 1920,
    msp: 1200,
    recommendation: 'HOLD',
    gainPercent: 16.3,
    confidence: 85,
    reason: 'Heavy rainfall in Southern belts damaged standing nursery transplants.',
    trend: [1420, 1500, 1580, 1650, 1730, 1840, 1920]
  }
];

export const MandiPricePredictor: React.FC = () => {
  const [selectedCrop, setSelectedCrop] = useState<CommodityTrend>(COMMODITY_TRENDS[0]);
  const [quantityQuintals, setQuantityQuintals] = useState<number>(35);

  const profitDiff = (selectedCrop.projectedPrice - selectedCrop.currentPrice) * quantityQuintals;
  const isGain = profitDiff > 0;

  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Sparkles size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">AI Mandi Price Forecast</h3>
            <p className="text-[11px] text-gray-500">7-14 Day Predictive Market Model</p>
          </div>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          APMC Live
        </span>
      </div>

      {/* Crop Pills */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-4">
        {COMMODITY_TRENDS.map(c => (
          <button
            key={c.crop}
            onClick={() => setSelectedCrop(c)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCrop.crop === c.crop
                ? 'bg-gray-900 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200/60'
            }`}
          >
            {c.crop.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* Selected Crop Analysis Card */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100/60 rounded-2xl p-4 border border-gray-200/80 mb-4">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">
              {selectedCrop.mandi}
            </span>
            <h4 className="text-base font-extrabold text-gray-900 mt-0.5">{selectedCrop.crop}</h4>
          </div>

          {/* Recommendation Tag */}
          <div
            className={`px-3 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-xs ${
              selectedCrop.recommendation === 'HOLD'
                ? 'bg-emerald-600 text-white'
                : 'bg-amber-500 text-white'
            }`}
          >
            {selectedCrop.recommendation === 'HOLD' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {selectedCrop.recommendation} ({selectedCrop.gainPercent > 0 ? `+${selectedCrop.gainPercent}%` : `${selectedCrop.gainPercent}%`})
          </div>
        </div>

        {/* Prices Comparison */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-gray-200/60 text-center">
          <div className="bg-white rounded-xl p-2 border border-gray-100">
            <span className="text-[10px] font-bold text-gray-400 block">Today's Rate</span>
            <span className="text-sm font-extrabold text-gray-900">₹{selectedCrop.currentPrice.toLocaleString()}</span>
            <span className="text-[9px] text-gray-400 block">/qtl</span>
          </div>

          <div className="bg-white rounded-xl p-2 border border-emerald-200 shadow-xs">
            <span className="text-[10px] font-bold text-emerald-700 block">Projected</span>
            <span className="text-sm font-extrabold text-emerald-700">₹{selectedCrop.projectedPrice.toLocaleString()}</span>
            <span className="text-[9px] text-emerald-600 font-semibold block">in 12 days</span>
          </div>

          <div className="bg-white rounded-xl p-2 border border-gray-100">
            <span className="text-[10px] font-bold text-gray-400 block">Govt MSP</span>
            <span className="text-sm font-extrabold text-gray-600">₹{selectedCrop.msp.toLocaleString()}</span>
            <span className="text-[9px] text-gray-400 block">Benchmark</span>
          </div>
        </div>

        {/* AI Rationale */}
        <div className="mt-3 bg-white/90 rounded-xl p-2.5 border border-gray-100 flex items-start gap-2">
          <Sparkles size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-gray-600 leading-relaxed font-medium">
            <span className="font-bold text-gray-900">Market Insight: </span>
            {selectedCrop.reason}
          </p>
        </div>
      </div>

      {/* Interactive Farmer Profit Calculator */}
      <div className="bg-emerald-50/50 rounded-2xl p-3.5 border border-emerald-100">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Calculator size={14} className="text-emerald-700" />
            <span className="text-xs font-bold text-emerald-950">Farmer Net Profit Calculator</span>
          </div>
          <span className="text-[11px] font-bold text-emerald-800">
            {quantityQuintals} Quintals (~{(quantityQuintals * 100).toLocaleString()} kg)
          </span>
        </div>

        <input
          type="range"
          min="5"
          max="200"
          step="5"
          value={quantityQuintals}
          onChange={e => setQuantityQuintals(Number(e.target.value))}
          className="w-full h-1.5 bg-emerald-200 rounded-lg appearance-none cursor-pointer accent-emerald-600 mb-3"
        />

        <div className="flex items-center justify-between pt-2 border-t border-emerald-200/50 text-xs">
          <span className="text-gray-600 font-medium">Expected Additional Gain by Holding:</span>
          <span className={`font-black text-sm ${isGain ? 'text-emerald-700' : 'text-amber-700'}`}>
            {isGain ? `+₹${profitDiff.toLocaleString()}` : `-₹${Math.abs(profitDiff).toLocaleString()}`}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MandiPricePredictor;
