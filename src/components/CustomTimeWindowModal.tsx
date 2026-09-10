import React, { useState, useEffect } from 'react';
import { X, Clock, Calendar, Check, SlidersHorizontal, Sparkles } from 'lucide-react';

export interface CustomTimeWindowResult {
  mode: 'duration' | 'range';
  hours: number;
  startDate?: string;
  endDate?: string;
  label: string;
}

interface CustomTimeWindowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (result: CustomTimeWindowResult) => void;
  title?: string;
  subtitle?: string;
  currentHours?: number;
  currentStartDate?: string;
  currentEndDate?: string;
  maxHours?: number; // e.g. 384 (16 days) for forecasts
  minHours?: number;
  allowRange?: boolean;
}

const DEFAULT_PRESETS = [
  { label: '12 ore', hours: 12, short: '12h' },
  { label: '36 ore', hours: 36, short: '36h' },
  { label: '4 giorni', hours: 96, short: '96h' },
  { label: '5 giorni', hours: 120, short: '120h' },
  { label: '10 giorni', hours: 240, short: '10d' },
  { label: '14 giorni', hours: 336, short: '14d' }
];

export const CustomTimeWindowModal: React.FC<CustomTimeWindowModalProps> = ({
  isOpen,
  onClose,
  onApply,
  title = 'Finestra Temporale Personalizzata',
  subtitle = 'Configura con precisione l’estensione oraria o l’intervallo di date',
  currentHours = 96,
  currentStartDate = '',
  currentEndDate = '',
  maxHours = 384,
  minHours = 1,
  allowRange = true
}) => {
  const [activeTab, setActiveTab] = useState<'duration' | 'range'>(
    currentStartDate && currentEndDate ? 'range' : 'duration'
  );

  // Duration mode state
  const [unit, setUnit] = useState<'hours' | 'days'>('hours');
  const [inputValue, setInputValue] = useState<number>(currentHours);

  // Range mode state (ISO YYYY-MM-DDTHH:mm)
  const now = new Date();
  const defaultStart = now.toISOString().slice(0, 16);
  const defaultEnd = new Date(now.getTime() + currentHours * 3600000).toISOString().slice(0, 16);

  const [startDate, setStartDate] = useState<string>(currentStartDate || defaultStart);
  const [endDate, setEndDate] = useState<string>(currentEndDate || defaultEnd);

  // Sync state when opened
  useEffect(() => {
    if (isOpen) {
      if (currentStartDate && currentEndDate && allowRange) {
        setActiveTab('range');
        setStartDate(currentStartDate);
        setEndDate(currentEndDate);
      } else {
        setActiveTab('duration');
        if (currentHours % 24 === 0 && currentHours >= 24) {
          setUnit('days');
          setInputValue(currentHours / 24);
        } else {
          setUnit('hours');
          setInputValue(currentHours);
        }
      }
    }
  }, [isOpen, currentHours, currentStartDate, currentEndDate, allowRange]);

  if (!isOpen) return null;

  // Calculate calculated hours
  const calculatedHours =
    activeTab === 'duration'
      ? unit === 'days'
        ? Math.max(minHours, Math.min(maxHours, (inputValue || 1) * 24))
        : Math.max(minHours, Math.min(maxHours, inputValue || 1))
      : (() => {
          const s = new Date(startDate).getTime();
          const e = new Date(endDate).getTime();
          if (isNaN(s) || isNaN(e) || e <= s) return 24;
          return Math.max(minHours, Math.min(maxHours, Math.round((e - s) / 3600000)));
        })();

  const formatLabel = () => {
    if (activeTab === 'range') {
      const s = new Date(startDate);
      const e = new Date(endDate);
      const sStr = s.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
      const eStr = e.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
      return `${sStr} - ${eStr} (${calculatedHours}h)`;
    }
    if (calculatedHours % 24 === 0) {
      return `${calculatedHours / 24}d (${calculatedHours}h)`;
    }
    return `${calculatedHours}h`;
  };

  const handleApply = () => {
    if (activeTab === 'duration') {
      onApply({
        mode: 'duration',
        hours: calculatedHours,
        label: formatLabel()
      });
    } else {
      onApply({
        mode: 'range',
        hours: calculatedHours,
        startDate,
        endDate,
        label: formatLabel()
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl space-y-4 sm:space-y-5 relative text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher (Duration vs Range) */}
        {allowRange && (
          <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('duration')}
              className={`flex-1 py-1.5 rounded-lg font-medium flex items-center justify-center gap-1.5 transition ${
                activeTab === 'duration'
                  ? 'bg-blue-600 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Per Durata (Ore / Giorni)</span>
            </button>
            <button
              onClick={() => setActiveTab('range')}
              className={`flex-1 py-1.5 rounded-lg font-medium flex items-center justify-center gap-1.5 transition ${
                activeTab === 'range'
                  ? 'bg-indigo-600 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Per Intervallo Date</span>
            </button>
          </div>
        )}

        {/* Tab 1: Duration Mode */}
        {activeTab === 'duration' && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Valore personalizzato:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={minHours}
                  max={unit === 'days' ? Math.floor(maxHours / 24) : maxHours}
                  value={inputValue}
                  onChange={(e) => setInputValue(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      if (unit === 'days') {
                        setUnit('hours');
                        setInputValue(inputValue * 24);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg font-medium transition ${
                      unit === 'hours'
                        ? 'bg-blue-600 text-white font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Ore
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (unit === 'hours') {
                        setUnit('days');
                        setInputValue(Math.max(1, Math.round(inputValue / 24)));
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg font-medium transition ${
                      unit === 'days'
                        ? 'bg-blue-600 text-white font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Giorni
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Minimo {minHours}h • Massimo {maxHours}h (fino a {Math.floor(maxHours / 24)} giorni)
              </p>
            </div>

            {/* Quick Presets Chips */}
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1.5">
                Scelte rapide frequenti:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {DEFAULT_PRESETS.filter((p) => p.hours <= maxHours).map((preset) => (
                  <button
                    key={preset.hours}
                    type="button"
                    onClick={() => {
                      if (preset.hours % 24 === 0) {
                        setUnit('days');
                        setInputValue(preset.hours / 24);
                      } else {
                        setUnit('hours');
                        setInputValue(preset.hours);
                      }
                    }}
                    className={`px-2.5 py-1.5 rounded-xl border text-xs font-mono text-center transition ${
                      calculatedHours === preset.hours
                        ? 'bg-blue-600/30 border-blue-500 text-blue-200 font-bold ring-1 ring-blue-400/40'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Range Mode */}
        {activeTab === 'range' && (
          <div className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Data & Ora di Inizio:
              </label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-400" />
                Data & Ora di Fine:
              </label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        )}

        {/* Live Summary Ribbon */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-slate-300 font-medium">Finestra risultante:</span>
          </div>
          <div className="flex items-center gap-2 font-mono">
            <span className="text-white font-bold bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
              {calculatedHours} ore
            </span>
            <span className="text-slate-400">
              (~{(calculatedHours / 24).toFixed(1)} giorni)
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition font-medium"
          >
            Annulla
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-900/30 transition flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Applica Finestra</span>
          </button>
        </div>
      </div>
    </div>
  );
};
