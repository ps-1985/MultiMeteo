import React from 'react';
import type { ModelAccuracyStats } from '../types/verification';
import { WEATHER_MODELS } from '../constants/models';
import { TrendingUp, TrendingDown, CheckCircle2 } from 'lucide-react';

interface AccuracyLeaderboardProps {
  stats: ModelAccuracyStats[];
  cityName: string;
  pastDaysLabel?: string;
}

export const AccuracyLeaderboard: React.FC<AccuracyLeaderboardProps> = ({
  stats,
  cityName,
  pastDaysLabel
}) => {
  if (!stats || stats.length === 0) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 text-center text-slate-400 text-xs">
        Dati di accuratezza insufficienti per questa finestra temporale. Il demone sta accumulando le rilevazioni orarie.
      </div>
    );
  }

  const bestModel = stats[0];
  const bestModelInfo = WEATHER_MODELS[bestModel.model_id as keyof typeof WEATHER_MODELS];

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      {/* Top Banner Winner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-blue-500/10 border border-emerald-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-xl shrink-0">
            🏆
          </div>
          <div>
            <span className="text-[11px] uppercase font-bold tracking-wider text-amber-400">
              Modello Più Accurato per {cityName} {pastDaysLabel ? `(Ultime ${pastDaysLabel})` : ''}
            </span>
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <span>{bestModelInfo?.name || bestModel.model_id}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                MAE: ±{bestModel.mae_temp}°C
              </span>
            </h4>
          </div>
        </div>

        <div className="text-xs text-slate-300 flex items-center gap-2 font-mono">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Verificato su {bestModel.sample_count} ore reali ({pastDaysLabel || 'periodo'})</span>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-mono text-[11px]">
              <th className="py-2.5 px-3">Pos.</th>
              <th className="py-2.5 px-3">Modello</th>
              <th className="py-2.5 px-3">Errore Medio (MAE)</th>
              <th className="py-2.5 px-3">Tendenza (Bias)</th>
              <th className="py-2.5 px-3">Errore Max</th>
              <th className="py-2.5 px-3">Errore Vento</th>
              <th className="py-2.5 px-3 text-right">Campioni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {stats.map((row, idx) => {
              const info = WEATHER_MODELS[row.model_id as keyof typeof WEATHER_MODELS];
              const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}°`;

              let maeBadge = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
              if (row.mae_temp > 1.2 && row.mae_temp <= 2.2) {
                maeBadge = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
              } else if (row.mae_temp > 2.2) {
                maeBadge = 'text-rose-400 bg-rose-500/10 border-rose-500/20';
              }

              return (
                <tr
                  key={row.model_id}
                  className={`hover:bg-slate-800/40 transition ${
                    idx === 0 ? 'bg-emerald-950/20' : ''
                  }`}
                >
                  <td className="py-2.5 px-3 text-center text-sm">{medal}</td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2 font-sans font-medium text-white">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: info?.color || '#fff' }}
                      />
                      <span>{info?.shortName || row.model_id}</span>
                      <span className="text-[10px] text-slate-500">{info?.flag}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded border text-[11px] font-bold ${maeBadge}`}>
                      ±{row.mae_temp}°C
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`flex items-center gap-1 text-[11px] ${
                        row.bias_temp > 0
                          ? 'text-rose-400'
                          : row.bias_temp < 0
                          ? 'text-blue-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {row.bias_temp > 0 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : row.bias_temp < 0 ? (
                        <TrendingDown className="w-3 h-3" />
                      ) : null}
                      <span>
                        {row.bias_temp > 0
                          ? `+${row.bias_temp}°C (Sovrastima)`
                          : row.bias_temp < 0
                          ? `${row.bias_temp}°C (Sottostima)`
                          : 'Neutro'}
                      </span>
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-300">
                    {row.max_error_temp}°C
                  </td>
                  <td className="py-2.5 px-3 text-slate-400">
                    ±{row.mae_wind} km/h
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-400">
                    {row.sample_count}h
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="text-[11px] text-slate-400 italic">
        * <b>MAE (Mean Absolute Error)</b>: indica lo scarto medio assoluto tra la temperatura prevista 24h prima e quella registrata sul campo. Più basso è il valore, più il modello è affidabile.
      </div>
    </div>
  );
};
