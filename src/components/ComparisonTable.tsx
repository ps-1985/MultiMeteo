import React, { useState, useMemo } from 'react';
import type { MultiModelForecast, WeatherVariable } from '../types/weather';
import { WEATHER_MODELS } from '../constants/models';
import { Table, Filter } from 'lucide-react';

interface ComparisonTableProps {
  forecast: MultiModelForecast;
  activeVariable: WeatherVariable;
  selectedHourIndex: number;
  onSelectHourIndex: (idx: number) => void;
}

type StepInterval = 1 | 3 | 6;

export const ComparisonTable: React.FC<ComparisonTableProps> = ({
  forecast,
  activeVariable,
  selectedHourIndex,
  onSelectHourIndex
}) => {
  const [step, setStep] = useState<StepInterval>(3);
  const [maxHours, setMaxHours] = useState<number>(48);

  const rawHourlyData = forecast.hourly[activeVariable] || [];
  const unit = forecast.units[activeVariable] || '';

  // Filtered rows based on step interval and max hours
  const rows = useMemo(() => {
    const list = rawHourlyData.slice(0, maxHours);
    return list
      .map((item, originalIdx) => ({ item, originalIdx }))
      .filter((_, i) => i % step === 0);
  }, [rawHourlyData, step, maxHours]);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl">
      {/* Table Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Table className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-white uppercase tracking-wide">
            Tabella di Sintesi Comparativa Multi-Modello
          </h3>
        </div>

        {/* Step & Range Filters */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-400 flex items-center gap-1">
              <Filter className="w-3 h-3 text-slate-400" /> Passo:
            </span>
            {([1, 3, 6] as StepInterval[]).map((s) => (
              <button
                key={s}
                onClick={() => setStep(s)}
                className={`px-2 py-0.5 rounded text-xs font-mono transition ${
                  step === s
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                {s}h
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-400">Range:</span>
            {[
              { h: 24, label: '24h' },
              { h: 48, label: '48h' },
              { h: 72, label: '72h' },
              { h: 168, label: '7d' }
            ].map((opt) => (
              <button
                key={opt.h}
                onClick={() => setMaxHours(opt.h)}
                className={`px-2 py-0.5 rounded text-xs font-mono transition ${
                  maxHours === opt.h
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table Container (Internal horizontal scroll on mobile) */}
      <div className="w-full max-w-full overflow-x-auto touch-pan-x rounded-xl border border-slate-800/80">
        <table className="w-full min-w-[650px] text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-mono text-[11px]">
              <th className="py-2.5 px-3 sticky left-0 bg-slate-950/95 z-10">Data / Ora</th>
              <th className="py-2.5 px-3 text-white font-bold bg-slate-900/60">Consenso</th>
              <th className="py-2.5 px-3 text-slate-300">Spread (Δ)</th>
              <th className="py-2.5 px-3">Accordo</th>

              {forecast.activeModels.map((modelId) => {
                const info = WEATHER_MODELS[modelId];
                return (
                  <th key={modelId} className="py-2.5 px-3 font-semibold whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: info?.color || '#fff' }}
                      />
                      <span>{info?.shortName || modelId}</span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {rows.map(({ item, originalIdx }) => {
              const isSelected = selectedHourIndex === originalIdx;
              const date = new Date(item.time);
              const dayStr = date.toLocaleDateString('it-IT', {
                weekday: 'short',
                day: 'numeric'
              });
              const hourStr = date.getHours().toString().padStart(2, '0') + ':00';

              const spread = item.spread ?? 0;
              let discrepancyBadge = (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Accordo
                </span>
              );

              if (spread >= 1.5 && spread < 3.5) {
                discrepancyBadge = (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    Medio
                  </span>
                );
              } else if (spread >= 3.5) {
                discrepancyBadge = (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold">
                    Divergente
                  </span>
                );
              }

              return (
                <tr
                  key={item.time}
                  onClick={() => onSelectHourIndex(originalIdx)}
                  className={`cursor-pointer transition hover:bg-slate-800/50 font-mono ${
                    isSelected ? 'bg-blue-950/40 text-white font-medium' : 'text-slate-300'
                  }`}
                >
                  {/* Time */}
                  <td className="py-2 px-3 whitespace-nowrap sticky left-0 bg-slate-900/95 z-10 border-r border-slate-800">
                    <span className="text-slate-400 capitalize">{dayStr}</span>{' '}
                    <span className="text-white font-bold">{hourStr}</span>
                  </td>

                  {/* Consensus */}
                  <td className="py-2 px-3 text-white font-bold bg-slate-900/40 whitespace-nowrap">
                    {item.consensus !== null ? `${item.consensus} ${unit}` : '--'}
                  </td>

                  {/* Spread */}
                  <td className="py-2 px-3 whitespace-nowrap font-medium text-amber-400">
                    Δ {item.spread !== null ? `${item.spread}` : '--'}
                  </td>

                  {/* Discrepancy badge */}
                  <td className="py-2 px-3 whitespace-nowrap">{discrepancyBadge}</td>

                  {/* Each Model Value */}
                  {forecast.activeModels.map((modelId) => {
                    const val = item.modelValues[modelId];
                    if (val === null || val === undefined) {
                      return (
                        <td key={modelId} className="py-2 px-3 text-slate-600 whitespace-nowrap">
                          -
                        </td>
                      );
                    }

                    // Delta from consensus
                    const delta = item.consensus !== null ? Math.round((val - item.consensus) * 10) / 10 : 0;
                    const isSignificant = Math.abs(delta) >= 1.5;

                    return (
                      <td key={modelId} className="py-2 px-3 whitespace-nowrap">
                        <span
                          className={`${
                            isSignificant
                              ? delta > 0
                                ? 'text-rose-300 font-bold'
                                : 'text-blue-300 font-bold'
                              : 'text-slate-300'
                          }`}
                        >
                          {val}
                        </span>
                        {item.consensus !== null && delta !== 0 && (
                          <span
                            className={`text-[9px] ml-1 opacity-70 ${
                              delta > 0 ? 'text-rose-400' : 'text-blue-400'
                            }`}
                          >
                            {delta > 0 ? `+${delta}` : delta}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-slate-400 mt-2 italic">
        * Cliccando su una riga oraria viene aggiornata la telemetria di dettaglio e il punto di focuses sul grafico.
      </p>
    </div>
  );
};
