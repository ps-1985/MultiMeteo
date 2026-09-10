import React, { useState, useEffect, useMemo } from 'react';
import type { FavoriteItem, VerificationResponse } from '../types/verification';
import {
  getFavorites,
  removeFavorite,
  getVerificationData,
  triggerManualSync
} from '../services/verificationApi';
import type { VerificationQueryOptions } from '../services/verificationApi';
import { VerificationChart } from './VerificationChart';
import { AccuracyLeaderboard } from './AccuracyLeaderboard';
import {
  Star,
  Trash2,
  RotateCw,
  Server,
  Thermometer,
  ShieldAlert,
  Activity,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { WEATHER_MODELS } from '../constants/models';
import { CustomTimeWindowModal } from './CustomTimeWindowModal';

const PAST_OPTIONS = [
  { days: 1, label: '24h', desc: '1 giorno' },
  { days: 2, label: '48h', desc: '2 giorni' },
  { days: 3, label: '72h', desc: '3 giorni' },
  { days: 7, label: '7d', desc: '7 giorni' }
];

const FUTURE_OPTIONS = [
  { days: 0, label: 'Off', desc: 'Nessuno' },
  { days: 1, label: '24h', desc: '1 giorno' },
  { days: 2, label: '48h', desc: '2 giorni' },
  { days: 3, label: '72h', desc: '3 giorni' },
  { days: 7, label: '7d', desc: '7 giorni' }
];

interface FavoritesViewProps {
  onSelectCityForLiveForecast: (fav: FavoriteItem) => void;
}

export const FavoritesView: React.FC<FavoritesViewProps> = ({
  onSelectCityForLiveForecast
}) => {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [selectedFavId, setSelectedFavId] = useState<number | null>(null);
  const [verificationData, setVerificationData] = useState<VerificationResponse | null>(null);
  
  // Past options state
  const [pastDays, setPastDays] = useState<number>(2);
  const [pastMode, setPastMode] = useState<'preset' | 'custom'>('preset');
  const [pastCustomHours, setPastCustomHours] = useState<number>(48);
  const [pastCustomRange, setPastCustomRange] = useState<{ startDate?: string; endDate?: string } | null>(null);
  const [isPastModalOpen, setIsPastModalOpen] = useState<boolean>(false);

  // Future options state
  const [futureDays, setFutureDays] = useState<number>(3);
  const [futureMode, setFutureMode] = useState<'preset' | 'custom'>('preset');
  const [futureCustomHours, setFutureCustomHours] = useState<number>(72);
  const [futureCustomRange, setFutureCustomRange] = useState<{ startDate?: string; endDate?: string } | null>(null);
  const [isFutureModalOpen, setIsFutureModalOpen] = useState<boolean>(false);

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

  // Load verification data when selected favorite or horizon options change
  useEffect(() => {
    if (!selectedFavId) return;

    let isMounted = true;
    const queryOpts: VerificationQueryOptions = {};

    if (pastMode === 'custom') {
      if (pastCustomRange?.startDate && pastCustomRange?.endDate) {
        queryOpts.startTime = pastCustomRange.startDate;
      } else {
        queryOpts.pastHours = pastCustomHours;
      }
    } else {
      queryOpts.pastDays = pastDays;
    }

    if (futureMode === 'custom') {
      if (futureCustomRange?.startDate && futureCustomRange?.endDate) {
        queryOpts.endTime = futureCustomRange.endDate;
      } else {
        queryOpts.futureHours = futureCustomHours;
      }
    } else {
      queryOpts.futureDays = futureDays;
    }

    getVerificationData(selectedFavId, queryOpts).then((data) => {
      if (isMounted) {
        setVerificationData(data);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [
    selectedFavId,
    pastMode,
    pastDays,
    pastCustomHours,
    pastCustomRange,
    futureMode,
    futureDays,
    futureCustomHours,
    futureCustomRange
  ]);

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
      const queryOpts: VerificationQueryOptions = {};
      if (pastMode === 'custom') {
        if (pastCustomRange?.startDate && pastCustomRange?.endDate) {
          queryOpts.startTime = pastCustomRange.startDate;
        } else {
          queryOpts.pastHours = pastCustomHours;
        }
      } else {
        queryOpts.pastDays = pastDays;
      }
      if (futureMode === 'custom') {
        if (futureCustomRange?.startDate && futureCustomRange?.endDate) {
          queryOpts.endTime = futureCustomRange.endDate;
        } else {
          queryOpts.futureHours = futureCustomHours;
        }
      } else {
        queryOpts.futureDays = futureDays;
      }

      const data = await getVerificationData(selectedFavId, queryOpts);
      setVerificationData(data);
    }
    setIsSyncing(false);
  };

  const pastLabel = useMemo(() => {
    if (pastMode === 'custom') {
      if (pastCustomRange?.startDate && pastCustomRange?.endDate) {
        return 'Intervallo Date';
      }
      if (pastCustomHours % 24 === 0) return `${pastCustomHours / 24} giorni (${pastCustomHours}h)`;
      return `${pastCustomHours} ore`;
    }
    return pastDays === 1 ? '24 ore' : pastDays === 2 ? '48 ore' : pastDays === 3 ? '72 ore (3 giorni)' : `${pastDays} giorni`;
  }, [pastMode, pastCustomHours, pastCustomRange, pastDays]);

  const futureLabel = useMemo(() => {
    if (futureMode === 'custom') {
      if (futureCustomRange?.startDate && futureCustomRange?.endDate) {
        return 'Intervallo Date';
      }
      if (futureCustomHours === 0) return 'Disattivato';
      if (futureCustomHours % 24 === 0) return `${futureCustomHours / 24} giorni (${futureCustomHours}h)`;
      return `${futureCustomHours} ore`;
    }
    return futureDays === 0 ? 'Disattivato' : futureDays === 1 ? '24 ore' : futureDays === 2 ? '48 ore' : futureDays === 3 ? '72 ore (3 giorni)' : `${futureDays} giorni`;
  }, [futureMode, futureCustomHours, futureCustomRange, futureDays]);

  const selectedFav = favorites.find((f) => f.id === selectedFavId);

  return (
    <div className="space-y-6">
      {/* Top Banner: Server H24 Status (Desktop only) */}
      <div className="hidden md:flex bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl items-start sm:items-center justify-between gap-4">
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

      {/* Mobile Favorites Pill Switcher (Less dense on mobile) */}
      {favorites.length > 0 && (
        <div className="flex md:hidden items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar touch-pan-x max-w-full">
          <span className="text-slate-400 text-[11px] uppercase tracking-wider font-semibold mr-1 shrink-0 flex items-center gap-1">
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" /> Preferiti:
          </span>
          {favorites.map((fav) => {
            const isSelected = selectedFavId === fav.id;
            return (
              <button
                key={fav.id}
                onClick={() => setSelectedFavId(fav.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium shrink-0 flex items-center gap-1.5 border transition ${
                  isSelected
                    ? 'bg-blue-600 text-white font-bold border-blue-500 shadow-md ring-1 ring-blue-400/40'
                    : 'bg-slate-900/90 text-slate-300 border-slate-800'
                }`}
              >
                <span>{fav.name}</span>
                {fav.latestObservation?.temperature_2m !== null && (
                  <span className="font-mono text-[11px] opacity-80">
                    {fav.latestObservation?.temperature_2m}°
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Favorites Cards Grid (Desktop only) */}
      <div className="hidden md:block">
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
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Verifica & Proiezione: {selectedFav.name}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-normal">
                  {selectedFav.country}
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Valuta l'aspettativa passata vs realtà per identificare il modello più affidabile e proiettarlo nel futuro.
              </p>
            </div>
          </div>

          {/* Dual Horizon Selectors Bar */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Selector 1: Passato (Verifica) */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  ⏪ Passato (Verifica Realtà)
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Stazioni Meteo H24
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                {PAST_OPTIONS.map((opt) => (
                  <button
                    key={opt.days}
                    onClick={() => {
                      setPastMode('preset');
                      setPastDays(opt.days);
                    }}
                    className={`py-2 px-2 rounded-lg text-xs font-mono font-medium transition flex flex-col items-center justify-center ${
                      pastMode === 'preset' && pastDays === opt.days
                        ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-950 ring-1 ring-emerald-400/50'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <span className="text-sm">{opt.label}</span>
                    <span className="text-[9px] opacity-75 font-sans">{opt.desc}</span>
                  </button>
                ))}

                {/* Custom Past Button */}
                <button
                  onClick={() => {
                    setPastMode('custom');
                    setIsPastModalOpen(true);
                  }}
                  className={`py-2 px-2 rounded-lg text-xs font-mono font-medium transition flex flex-col items-center justify-center ${
                    pastMode === 'custom'
                      ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-950 ring-1 ring-emerald-400/50'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                  title="Configura intervallo passato personalizzato"
                >
                  <span className="text-sm">
                    {pastMode === 'custom'
                      ? pastCustomRange?.startDate
                        ? 'Range'
                        : `${pastCustomHours}h`
                      : 'Custom'}
                  </span>
                  <span className="text-[9px] opacity-75 font-sans">Personalizzato</span>
                </button>
              </div>
            </div>

            {/* Visual separator icon */}
            <div className="hidden md:flex flex-col items-center justify-center px-1 text-slate-600 font-mono">
              <ArrowRight className="w-5 h-5 text-slate-600" />
            </div>

            {/* Selector 2: Futuro (Proiezione) */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-indigo-400 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-indigo-400" />
                  ⏩ Futuro (Proiezione Previsioni)
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  7 Modelli a Confronto
                </span>
              </div>
              <div className="grid grid-cols-6 gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                {FUTURE_OPTIONS.map((opt) => (
                  <button
                    key={opt.days}
                    onClick={() => {
                      setFutureMode('preset');
                      setFutureDays(opt.days);
                    }}
                    className={`py-2 px-2 rounded-lg text-xs font-mono font-medium transition flex flex-col items-center justify-center ${
                      futureMode === 'preset' && futureDays === opt.days
                        ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-950 ring-1 ring-indigo-400/50'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <span className="text-sm">{opt.label}</span>
                    <span className="text-[9px] opacity-75 font-sans">{opt.desc}</span>
                  </button>
                ))}

                {/* Custom Future Button */}
                <button
                  onClick={() => {
                    setFutureMode('custom');
                    setIsFutureModalOpen(true);
                  }}
                  className={`py-2 px-2 rounded-lg text-xs font-mono font-medium transition flex flex-col items-center justify-center ${
                    futureMode === 'custom'
                      ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-950 ring-1 ring-indigo-400/50'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                  title="Configura intervallo futuro personalizzato"
                >
                  <span className="text-sm">
                    {futureMode === 'custom'
                      ? futureCustomRange?.startDate
                        ? 'Range'
                        : `${futureCustomHours}h`
                      : 'Custom'}
                  </span>
                  <span className="text-[9px] opacity-75 font-sans">Personalizzato</span>
                </button>
              </div>
            </div>
          </div>

          {/* User Insight Box (Desktop only) */}
          <div className="hidden md:flex bg-slate-900/60 border border-slate-800/80 rounded-xl px-4 py-3 items-start sm:items-center gap-3 text-xs text-slate-300">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
            <p className="leading-relaxed">
              <b className="text-white">Analisi Comparativa Intelligente:</b> Guardando lo scarto tra previsione e realtà nelle{' '}
              <span className="text-emerald-400 font-semibold font-mono">
                {pastLabel}
              </span>
              , puoi valutare quale modello matematico si è dimostrato più preciso e decidere se fidarti della sua traiettoria per le{' '}
              <span className="text-indigo-400 font-semibold font-mono">
                {futureLabel}
              </span>
              .
            </p>
          </div>

          {/* Verification Chart: Real vs Forecasted */}
          <VerificationChart
            timeline={verificationData.timeline}
            variable={activeVar}
            onChangeVariable={setActiveVar}
            nowLocal={verificationData.nowLocal}
            pastDays={pastDays}
            futureDays={futureDays}
            pastLabel={pastLabel}
            futureLabel={futureLabel}
          />

          {/* Accuracy Leaderboard */}
          <AccuracyLeaderboard
            stats={verificationData.leaderboard}
            cityName={selectedFav.name}
            pastDaysLabel={pastLabel}
          />

          {/* Custom Past Modal */}
          <CustomTimeWindowModal
            isOpen={isPastModalOpen}
            onClose={() => setIsPastModalOpen(false)}
            title="Finestra Passato Personalizzata (Verifica Stazioni)"
            subtitle="Configura l’estensione a ritroso per confrontare i dati effettivi registrati sul campo"
            currentHours={pastCustomHours}
            currentStartDate={pastCustomRange?.startDate || ''}
            currentEndDate={pastCustomRange?.endDate || ''}
            maxHours={720}
            minHours={1}
            allowRange={true}
            onApply={(res) => {
              setPastMode('custom');
              setPastCustomHours(res.hours);
              if (res.mode === 'range') {
                setPastCustomRange({ startDate: res.startDate, endDate: res.endDate });
              } else {
                setPastCustomRange(null);
              }
            }}
          />

          {/* Custom Future Modal */}
          <CustomTimeWindowModal
            isOpen={isFutureModalOpen}
            onClose={() => setIsFutureModalOpen(false)}
            title="Finestra Futuro Personalizzata (Proiezione Previsioni)"
            subtitle="Configura l’estensione in avanti per proiettare le traiettorie dei modelli matematici"
            currentHours={futureCustomHours}
            currentStartDate={futureCustomRange?.startDate || ''}
            currentEndDate={futureCustomRange?.endDate || ''}
            maxHours={384}
            minHours={0}
            allowRange={true}
            onApply={(res) => {
              setFutureMode('custom');
              setFutureCustomHours(res.hours);
              if (res.mode === 'range') {
                setFutureCustomRange({ startDate: res.startDate, endDate: res.endDate });
              } else {
                setFutureCustomRange(null);
              }
            }}
          />
        </div>
      )}
    </div>
  );
};
