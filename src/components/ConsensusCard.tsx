import React from 'react';
import type { MultiModelForecast, WeatherVariable } from '../types/weather';
import { WEATHER_MODELS } from '../constants/models';
import {
  Thermometer,
  CloudRain,
  Wind,
  Zap,
  Gauge,
  ShieldCheck,
  AlertTriangle,
  Flame,
  Snowflake
} from 'lucide-react';

interface ConsensusCardProps {
  forecast: MultiModelForecast;
  currentHourIndex?: number;
}

interface ModelExtreme {
  name: string;
  val: number;
  color: string;
}

export const ConsensusCard: React.FC<ConsensusCardProps> = ({
  forecast,
  currentHourIndex = 0
}) => {
  // Find current hour data or index 0
  const getVarData = (v: WeatherVariable) => {
    const list = forecast.hourly[v] || [];
    return list[currentHourIndex] || list[0] || null;
  };

  const tempData = getVarData('temperature_2m');
  const rainData = getVarData('precipitation');
  const windData = getVarData('wind_speed_10m');
  const gustsData = getVarData('wind_gusts_10m');
  const pressData = getVarData('surface_pressure');

  // Compute confidence level based on temperature spread
  const tempSpread = tempData?.spread ?? 0;
  let badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  let badgeText = 'Accordo Elevato tra Modelli';
  let badgeIcon = <ShieldCheck className="w-4 h-4 text-emerald-400" />;
  let agreementExplanation = 'Tutti i modelli meteorologici convergono entro 1.5°C. Previsione affidabile.';

  if (tempSpread >= 1.5 && tempSpread < 3.5) {
    badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    badgeText = 'Incertezza Moderata';
    badgeIcon = <AlertTriangle className="w-4 h-4 text-amber-400" />;
    agreementExplanation = `Discrepanza di ${tempSpread}°C tra i modelli. Possibile variazione oraria o locale.`;
  } else if (tempSpread >= 3.5) {
    badgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    badgeText = 'Divergenza Marcata (Alta Incertezza)';
    badgeIcon = <Flame className="w-4 h-4 text-rose-400" />;
    agreementExplanation = `Forte spread (${tempSpread}°C): i centri meteo discordano sulla dinamica atmosferica.`;
  }

  // Find highest and lowest predicting models for temperature
  let highestModel: ModelExtreme | null = null;
  let lowestModel: ModelExtreme | null = null;

  if (tempData && tempData.modelValues) {
    for (const [modelId, val] of Object.entries(tempData.modelValues)) {
      if (val !== null && typeof val === 'number') {
        const mInfo = WEATHER_MODELS[modelId as keyof typeof WEATHER_MODELS];
        if (!highestModel || val > highestModel.val) {
          highestModel = { name: mInfo?.shortName || modelId, val, color: mInfo?.color || '#fff' };
        }
        if (!lowestModel || val < lowestModel.val) {
          lowestModel = { name: mInfo?.shortName || modelId, val, color: mInfo?.color || '#fff' };
        }
      }
    }
  }

  const low: ModelExtreme | null = lowestModel;
  const high: ModelExtreme | null = highestModel;

  // Format current timestamp
  const currentTimeStr = tempData?.time
    ? new Date(tempData.time).toLocaleDateString('it-IT', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'Adesso';

  return (
    <div className="bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-slate-950 border border-slate-800 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

      {/* Top Bar: Location & Agreement Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-white tracking-tight">
              {forecast.location.name}
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              {forecast.location.country || forecast.location.admin1}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Rilevamento orario di riferimento: <span className="text-slate-200 capitalize font-medium">{currentTimeStr}</span>
          </p>
        </div>

        {/* Agreement badge */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium ${badgeColor}`}>
          {badgeIcon}
          <span>{badgeText}</span>
          <span className="font-mono text-[11px] opacity-80">(Spread: ±{tempSpread / 2}°C)</span>
        </div>
      </div>

      {/* Main Telemetry Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Consensus Temperature Hero */}
        <div className="md:col-span-1 bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="flex items-center gap-1 font-medium">
              <Thermometer className="w-3.5 h-3.5 text-blue-400" />
              Consenso Termico
            </span>
            <span className="text-[10px] text-slate-400">Media 8 Modelli</span>
          </div>

          <div className="my-2">
            <div className="text-4xl font-extrabold text-white tracking-tight flex items-baseline gap-1">
              <span>{tempData?.consensus !== null ? tempData?.consensus : '--'}</span>
              <span className="text-xl text-blue-400 font-normal">°C</span>
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-2 font-mono">
              <span>Min: <b className="text-emerald-400">{tempData?.min ?? '--'}°</b></span>
              <span>•</span>
              <span>Max: <b className="text-rose-400">{tempData?.max ?? '--'}°</b></span>
              <span>•</span>
              <span className="text-amber-400 font-bold">Δ {tempSpread}°</span>
            </div>
          </div>

          {/* Extreme Model callout */}
          {high && low && (
            <div className="pt-2 border-t border-slate-800/60 text-[11px] text-slate-400 flex flex-col gap-0.5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-slate-400">
                  <Snowflake className="w-3 h-3 text-cyan-400" /> Più freddo:
                </span>
                <span className="font-medium text-white">
                  {low.name} ({low.val}°C)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-slate-400">
                  <Flame className="w-3 h-3 text-orange-400" /> Più caldo:
                </span>
                <span className="font-medium text-white">
                  {high.name} ({high.val}°C)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Precipitation Card */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="flex items-center gap-1 font-medium">
              <CloudRain className="w-3.5 h-3.5 text-indigo-400" />
              Precipitazioni
            </span>
            <span className="text-[10px] text-slate-400">All'ora</span>
          </div>
          <div className="my-2">
            <div className="text-3xl font-bold text-white tracking-tight flex items-baseline gap-1">
              <span>{rainData?.consensus !== null ? rainData?.consensus : '0'}</span>
              <span className="text-base text-indigo-400 font-normal">mm/h</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {rainData && rainData.max && rainData.max > 0.1
                ? `Rischio pioggia: fino a ${rainData.max} mm per ${forecast.activeModels.length} modelli`
                : 'Condizioni asciutte secondo il consenso'}
            </p>
          </div>
          <div className="text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800/60 flex justify-between">
            <span>Spread Pioggia:</span>
            <span className="text-white font-medium">{rainData?.spread ?? 0} mm</span>
          </div>
        </div>

        {/* Wind & Gusts Card */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="flex items-center gap-1 font-medium">
              <Wind className="w-3.5 h-3.5 text-teal-400" />
              Vento e Raffiche
            </span>
            <span className="text-[10px] text-slate-400">10m al suolo</span>
          </div>
          <div className="my-2">
            <div className="text-3xl font-bold text-white tracking-tight flex items-baseline gap-1">
              <span>{windData?.consensus ?? '--'}</span>
              <span className="text-base text-teal-400 font-normal">km/h</span>
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Raffiche max: <b className="text-amber-300">{gustsData?.max ?? '--'} km/h</b></span>
            </div>
          </div>
          <div className="text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800/60 flex justify-between">
            <span>Discrepanza Vento:</span>
            <span className="text-white font-medium">Δ {windData?.spread ?? 0} km/h</span>
          </div>
        </div>

        {/* Surface Pressure Card */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="flex items-center gap-1 font-medium">
              <Gauge className="w-3.5 h-3.5 text-purple-400" />
              Pressione Barica
            </span>
            <span className="text-[10px] text-slate-400">Al suolo</span>
          </div>
          <div className="my-2">
            <div className="text-3xl font-bold text-white tracking-tight flex items-baseline gap-1">
              <span>{pressData?.consensus ?? '--'}</span>
              <span className="text-base text-purple-400 font-normal">hPa</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {pressData && pressData.consensus && pressData.consensus > 1013
                ? regimeAnticiclonico(pressData.consensus)
                : 'Minimo barico o gradiente instabile'}
            </p>
          </div>
          <div className="text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800/60 flex justify-between">
            <span>Spread Barico:</span>
            <span className="text-white font-medium">Δ {pressData?.spread ?? 0} hPa</span>
          </div>
        </div>
      </div>

      {/* Telemetry note */}
      <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
        <p className="italic">
          {agreementExplanation}
        </p>
        <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
          Modelli attivi: {forecast.activeModels.length} / 8
        </span>
      </div>
    </div>
  );
};

function regimeAnticiclonico(val: number): string {
  if (val >= 1020) return 'Campo anticiclonico robusto e stabile';
  if (val >= 1014) return 'Pressione livellata / campo debole';
  return 'Area depressionaria';
}
