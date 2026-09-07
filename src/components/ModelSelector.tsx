import React from 'react';
import type { WeatherModelId, GeoLocation } from '../types/weather';
import { MODEL_LIST, WEATHER_MODELS } from '../constants/models';
import { Check, SlidersHorizontal, AlertCircle } from 'lucide-react';

interface ModelSelectorProps {
  activeModels: WeatherModelId[];
  onToggleModel: (modelId: WeatherModelId) => void;
  onSelectAll: () => void;
  onSelectPrimaryOnly: () => void;
  location: GeoLocation;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  activeModels,
  onToggleModel,
  onSelectAll,
  onSelectPrimaryOnly,
  location
}) => {
  // Check if a model is outside geographical coverage
  const isOutOfDomain = (modelId: WeatherModelId): boolean => {
    const model = WEATHER_MODELS[modelId];
    if (!model.isRegional || !model.bounds) return false;
    const { minLat, maxLat, minLon, maxLon } = model.bounds;
    return (
      location.latitude < minLat ||
      location.latitude > maxLat ||
      location.longitude < minLon ||
      location.longitude > maxLon
    );
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-blue-400" />
          <h2 className="text-sm font-semibold text-white tracking-wide uppercase">
            Modelli Meteorologici Numerici ({activeModels.length}/{MODEL_LIST.length})
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onSelectAll}
            className="text-[11px] px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            Seleziona Tutti (8)
          </button>
          <button
            onClick={onSelectPrimaryOnly}
            className="text-[11px] px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-blue-400 font-medium transition"
          >
            Big-3 (ECMWF, ICON, GFS)
          </button>
        </div>
      </div>

      {/* Models Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {MODEL_LIST.map((model) => {
          const isActive = activeModels.includes(model.id);
          const outOfDomain = isOutOfDomain(model.id);

          return (
            <button
              key={model.id}
              onClick={() => onToggleModel(model.id)}
              disabled={outOfDomain}
              title={
                outOfDomain
                  ? `${model.name} non è disponibile per queste coordinate (solo Alpi / Centro Europa).`
                  : model.description
              }
              className={`relative flex flex-col p-2.5 rounded-xl border text-left transition ${
                outOfDomain
                  ? 'opacity-35 bg-slate-950/50 border-slate-900 cursor-not-allowed'
                  : isActive
                  ? 'bg-slate-800/90 border-slate-600 shadow-md ring-1 ring-slate-600/50'
                  : 'bg-slate-950/40 border-slate-800/60 hover:border-slate-700 opacity-60'
              }`}
            >
              {/* Header with color pip & flag */}
              <div className="flex items-center justify-between w-full mb-1.5">
                <span className="text-base leading-none">{model.flag}</span>
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: model.color }}
                />
              </div>

              {/* Model Name */}
              <div className="font-semibold text-xs text-white truncate w-full">
                {model.shortName}
              </div>

              {/* Resolution / Details */}
              <div className="text-[10px] text-slate-400 truncate w-full mt-0.5">
                {model.resolution}
              </div>

              {/* Status footer */}
              <div className="mt-2 flex items-center justify-between w-full pt-1.5 border-t border-slate-800/60">
                {outOfDomain ? (
                  <span className="text-[9px] text-amber-500 flex items-center gap-0.5">
                    <AlertCircle className="w-2.5 h-2.5" /> Fuori area
                  </span>
                ) : (
                  <span
                    className={`text-[10px] font-mono font-medium ${
                      isActive ? 'text-emerald-400' : 'text-slate-500'
                    }`}
                  >
                    {isActive ? 'ATTIVO' : 'OFF'}
                  </span>
                )}

                {isActive && !outOfDomain && (
                  <span className="w-3.5 h-3.5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Check className="w-2.5 h-2.5" />
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
