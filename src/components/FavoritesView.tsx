import React, { useState, useEffect } from 'react';
import type { FavoriteItem, VerificationResponse } from '../types/verification';
import {
  getFavorites,
  removeFavorite,
  getVerificationData,
  triggerManualSync
} from '../services/verificationApi';
import { VerificationChart } from './VerificationChart';
import { AccuracyLeaderboard } from './AccuracyLeaderboard';
import {
  Star,
  Trash2,
  RotateCw,
  Server,
  Calendar,
  Thermometer,
  ShieldAlert,
  Activity
} from 'lucide-react';
import { WEATHER_MODELS } from '../constants/models';

interface FavoritesViewProps {
  onSelectCityForLiveForecast: (fav: FavoriteItem) => void;
}

export const FavoritesView: React.FC<FavoritesViewProps> = ({
  onSelectCityForLiveForecast
}) => {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [selectedFavId, setSelectedFavId] = useState<number | null>(null);
  const [verificationData, setVerificationData] = useState<VerificationResponse | null>(null);
  const [days, setDays] = useState<number>(3);
  const [activeVar, setActiveVar] = useState<'temperature_2m' | 'precipitation' | 'wind_speed_10m'>('temperature_2m');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Load favorites list
  const loadFavoritesList = async () => {
    setIsLoading(true);
    const list = await getFavorites();
    setFavorites(list);
    if (list.length > 0 && !selectedFavId) {
      setSelectedFavId(list[0].id);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadFavoritesList();
  }, []);

  // Load verification data when selected favorite or days changes
  useEffect(() => {
    if (!selectedFavId) return;

    let isMounted = true;
    getVerificationData(selectedFavId, days).then((data) => {
      if (isMounted) {
        setVerificationData(data);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [selectedFavId, days]);

  // Handle delete favorite
  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Rimuovere ${name} dai preferiti monitorati H24 dal server?`)) return;
    const ok = await removeFavorite(id);
    if (ok) {
      setFavorites((prev) => prev.filter((f) => f.id !== id));
      if (selectedFavId === id) {
        const remaining = favorites.filter((f) => f.id !== id);
        setSelectedFavId(remaining.length > 0 ? remaining[0].id : null);
      }
    }
  };

  // Handle manual sync
  const handleSync = async () => {
    setIsSyncing(true);
    await triggerManualSync();
    await loadFavoritesList();
    if (selectedFavId) {
      const data = await getVerificationData(selectedFavId, days);
      setVerificationData(data);
    }
    setIsSyncing(false);
  };

  const selectedFav = favorites.find((f) => f.id === selectedFavId);

  return (
    <div className="space-y-6">
      {/* Top Banner: Server H24 Status */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">
                Archivio Telemetria & Logger H24
              </h3>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Server Ubuntu 24/7 Attivo
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Il server campiona ogni ora le previsioni dei modelli e le confronta con le rilevazioni effettive per verificare scientificamente quale centro meteo è più affidabile.
            </p>
          </div>
        </div>

        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-2 transition disabled:opacity-50 shrink-0 shadow-sm"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-400' : ''}`} />
          <span>{isSyncing ? 'Sincronizzazione...' : 'Sincronizza Adesso'}</span>
        </button>
      </div>

      {/* Favorites Cards Carousel / Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            Località Preferite Monitorate ({favorites.length})
          </h4>
          <span className="text-[11px] text-slate-400">
            Seleziona una città per visualizzare il grafico di verifica
          </span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            Caricamento archivio preferiti in corso...
          </div>
        ) : favorites.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-8 text-center text-slate-400 text-xs space-y-2">
            <ShieldAlert className="w-8 h-8 text-slate-400 mx-auto" />
            <p>Nessuna località preferita salvata nel database del server.</p>
            <p className="text-slate-400">
              Usa la stella ⭐ nella barra superiore per aggiungere qualsiasi città al monitoraggio continuo!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {favorites.map((fav) => {
              const isSelected = selectedFavId === fav.id;
              const topModelInfo = fav.topModel
                ? WEATHER_MODELS[fav.topModel.model_id as keyof typeof WEATHER_MODELS]
                : null;

              return (
                <div
                  key={fav.id}
                  onClick={() => setSelectedFavId(fav.id)}
                  className={`cursor-pointer rounded-2xl border p-4 transition flex flex-col justify-between relative ${
                    isSelected
                      ? 'bg-slate-800/90 border-blue-500/70 shadow-lg ring-1 ring-blue-500/40'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h5 className="font-bold text-sm text-white">{fav.name}</h5>
                        <span className="text-xs text-slate-400 font-normal">
                          {fav.country}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">
                        {fav.latitude.toFixed(2)}°, {fav.longitude.toFixed(2)}°
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Jump to Live Forecast button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectCityForLiveForecast(fav);
                        }}
                        title={`Apri previsioni multi-modello live per ${fav.name}`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition"
                      >
                        <Activity className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(fav.id, fav.name);
                        }}
                        title="Elimina dai preferiti"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Telemetry Row */}
                  <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-xs">
                    {/* Observed Temp */}
                    <div className="flex items-center gap-1.5">
                      <Thermometer className="w-3.5 h-3.5 text-blue-400" />
                      <span className="text-slate-400">Rilevato:</span>
                      <span className="font-bold text-white font-mono">
                        {fav.latestObservation?.temperature_2m !== null &&
                        fav.latestObservation?.temperature_2m !== undefined
                          ? `${fav.latestObservation.temperature_2m}°C`
                          : '--'}
                      </span>
                    </div>

                    {/* Top Model Badge */}
                    {topModelInfo ? (
                      <div className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
                        <span>🏆</span>
                        <span>{topModelInfo.shortName}</span>
                        <span className="font-mono text-[10px] opacity-80">
                          ±{fav.topModel?.mae_temp}°
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-mono">
                        In calcolo...
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Favorite Verification Details */}
      {selectedFav && verificationData && (
        <div className="space-y-5 pt-3 border-t border-slate-800">
          {/* Section Header with Day Range filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Verifica Previsioni: {selectedFav.name}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-normal">
                  {selectedFav.country}
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Confronto tra le condizioni effettive rilevate e le previsioni formulate nelle 24h precedenti.
              </p>
            </div>

            {/* Days Filter */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 px-2 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Finestra:
              </span>
              {[1, 2, 3, 7].map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono transition ${
                    days === d
                      ? 'bg-blue-600 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {d === 1 ? '24h' : d === 2 ? '48h' : `${d}d`}
                </button>
              ))}
            </div>
          </div>

          {/* Verification Chart: Real vs Forecasted */}
          <VerificationChart
            timeline={verificationData.timeline}
            variable={activeVar}
            onChangeVariable={setActiveVar}
          />

          {/* Accuracy Leaderboard */}
          <AccuracyLeaderboard
            stats={verificationData.leaderboard}
            cityName={selectedFav.name}
          />
        </div>
      )}
    </div>
  );
};
