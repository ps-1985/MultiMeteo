import React, { useState, useEffect, useCallback } from 'react';
import type {
  GeoLocation,
  MultiModelForecast,
  WeatherModelId,
  WeatherVariable,
  TimeHorizon
} from './types/weather';
import type { FavoriteItem } from './types/verification';
import { DEFAULT_ACTIVE_MODELS } from './constants/models';
import { fetchMultiModelForecast } from './services/api';
import {
  loadStoredLocation,
  saveStoredLocation,
  loadActiveModels,
  saveActiveModels,
  loadTimeHorizon,
  saveTimeHorizon,
  loadCachedForecast
} from './services/storage';
import { getFavorites, addFavorite, removeFavorite } from './services/verificationApi';

import { Header } from './components/Header';
import { ConsensusCard } from './components/ConsensusCard';
import { ModelSelector } from './components/ModelSelector';
import { ForecastChart } from './components/ForecastChart';
import { ComparisonTable } from './components/ComparisonTable';
import { FavoritesView } from './components/FavoritesView';
import { OfflineBanner } from './components/OfflineBanner';
import { DeployGuideModal } from './components/DeployGuideModal';
import { AlertTriangle, RotateCw } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'forecast' | 'favorites'>('forecast');
  const [location, setLocation] = useState<GeoLocation>(loadStoredLocation);
  const [activeModels, setActiveModels] = useState<WeatherModelId[]>(loadActiveModels);
  const [timeHorizon, setTimeHorizon] = useState<TimeHorizon>(loadTimeHorizon);
  const [activeVariable, setActiveVariable] = useState<WeatherVariable>('temperature_2m');
  const [selectedHourIndex, setSelectedHourIndex] = useState<number>(0);

  const [forecast, setForecast] = useState<MultiModelForecast | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [error, setError] = useState<string | null>(null);
  const [isDeployModalOpen, setIsDeployModalOpen] = useState<boolean>(false);

  // Server-side favorites
  const [serverFavorites, setServerFavorites] = useState<FavoriteItem[]>([]);

  // Fetch server favorites list
  const refreshServerFavorites = useCallback(async () => {
    const list = await getFavorites();
    setServerFavorites(list);
  }, []);

  useEffect(() => {
    refreshServerFavorites();
  }, [refreshServerFavorites]);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch forecast function
  const loadForecastData = useCallback(
    async (targetLoc: GeoLocation, models: WeatherModelId[]) => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchMultiModelForecast(targetLoc, models, 7);
        setForecast(data);
        if (data.isOfflineCached) {
          setIsOffline(true);
        }
      } catch (err: any) {
        console.error('Failed to load forecast:', err);
        const cached = loadCachedForecast();
        if (cached) {
          setForecast(cached);
          setIsOffline(true);
        } else {
          setError(
            err?.message ||
              'Impossibile connettersi all’API di Open-Meteo. Verifica la connessione di rete.'
          );
        }
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Initial load or on location change
  useEffect(() => {
    loadForecastData(location, activeModels);
  }, [location, loadForecastData]);

  // Handle location selection
  const handleSelectLocation = (loc: GeoLocation) => {
    setLocation(loc);
    saveStoredLocation(loc);
    setSelectedHourIndex(0);
    setActiveTab('forecast');
  };

  // Handle toggling of weather models
  const handleToggleModel = (modelId: WeatherModelId) => {
    let updated: WeatherModelId[];
    if (activeModels.includes(modelId)) {
      if (activeModels.length <= 1) {
        alert('È necessario mantenere attivo almeno un modello.');
        return;
      }
      updated = activeModels.filter((m) => m !== modelId);
    } else {
      updated = [...activeModels, modelId];
    }
    setActiveModels(updated);
    saveActiveModels(updated);
    loadForecastData(location, updated);
  };

  // Select all 8 models
  const handleSelectAll = () => {
    setActiveModels(DEFAULT_ACTIVE_MODELS);
    saveActiveModels(DEFAULT_ACTIVE_MODELS);
    loadForecastData(location, DEFAULT_ACTIVE_MODELS);
  };

  // Select primary models only (ECMWF, ICON, GFS)
  const handleSelectPrimaryOnly = () => {
    const primary: WeatherModelId[] = ['ecmwf_ifs025', 'icon_seamless', 'gfs_seamless'];
    setActiveModels(primary);
    saveActiveModels(primary);
    loadForecastData(location, primary);
  };

  // Handle time horizon change
  const handleTimeHorizonChange = (h: TimeHorizon) => {
    setTimeHorizon(h);
    saveTimeHorizon(h);
  };

  // Check if current location is favorite
  const currentFavItem = serverFavorites.find(
    (f) =>
      f.name.toLowerCase() === location.name.toLowerCase() ||
      (Math.abs(f.latitude - location.latitude) < 0.05 &&
        Math.abs(f.longitude - location.longitude) < 0.05)
  );
  const isFavorite = Boolean(currentFavItem);

  const handleToggleFavorite = async () => {
    if (currentFavItem) {
      const ok = await removeFavorite(currentFavItem.id);
      if (ok) {
        await refreshServerFavorites();
      }
    } else {
      const added = await addFavorite(location);
      if (added) {
        await refreshServerFavorites();
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#080d1a] text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white w-full max-w-full overflow-x-hidden">
      {/* App Header */}
      <Header
        currentLocation={location}
        onSelectLocation={handleSelectLocation}
        onRefresh={() => {
          loadForecastData(location, activeModels);
          refreshServerFavorites();
        }}
        isLoading={isLoading}
        isOffline={isOffline}
        onOpenDeployModal={() => setIsDeployModalOpen(true)}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        onToggleFavorite={handleToggleFavorite}
        isFavorite={isFavorite}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-3.5 sm:py-6 space-y-4 sm:space-y-5 max-w-full overflow-x-hidden">
        {/* Offline Banner Notification */}
        {(isOffline || forecast?.isOfflineCached) && (
          <OfflineBanner
            lastUpdated={forecast?.lastUpdated || ''}
            onRetry={() => loadForecastData(location, activeModels)}
            isLoading={isLoading}
          />
        )}

        {/* Global Error Banner */}
        {error && (
          <div className="bg-rose-950/50 border border-rose-500/40 rounded-2xl p-4 flex items-center justify-between text-xs text-rose-200">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <div>
                <p className="font-semibold text-rose-300">Errore di comunicazione API</p>
                <p className="text-rose-300/80">{error}</p>
              </div>
            </div>
            <button
              onClick={() => loadForecastData(location, activeModels)}
              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium flex items-center gap-1 transition"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Riprova</span>
            </button>
          </div>
        )}

        {/* View Switcher Content */}
        {activeTab === 'favorites' ? (
          <FavoritesView
            onSelectCityForLiveForecast={(fav) => {
              handleSelectLocation({
                id: fav.id,
                name: fav.name,
                latitude: fav.latitude,
                longitude: fav.longitude,
                country: fav.country,
                timezone: fav.timezone || 'auto'
              });
            }}
          />
        ) : (
          <>
            {/* Loading Indicator for first load */}
            {isLoading && !forecast && (
              <div className="min-h-[400px] flex flex-col items-center justify-center gap-3 text-slate-400">
                <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-medium">
                  Interrogazione simultanea degli 8 modelli Open-Meteo in corso...
                </p>
              </div>
            )}

            {/* Loaded Forecast Content */}
            {forecast && (
              <>
                {/* Top Telemetry & Consensus Card */}
                <ConsensusCard
                  forecast={forecast}
                  currentHourIndex={selectedHourIndex}
                />

                {/* Model Selector Bar */}
                <ModelSelector
                  activeModels={activeModels}
                  onToggleModel={handleToggleModel}
                  onSelectAll={handleSelectAll}
                  onSelectPrimaryOnly={handleSelectPrimaryOnly}
                  location={location}
                />

                {/* Interactive Multi-Model Chart */}
                <ForecastChart
                  forecast={forecast}
                  activeVariable={activeVariable}
                  onChangeVariable={setActiveVariable}
                  timeHorizon={timeHorizon}
                  onChangeTimeHorizon={handleTimeHorizonChange}
                  selectedHourIndex={selectedHourIndex}
                  onSelectHourIndex={setSelectedHourIndex}
                />

                {/* Synthesis Comparison Table */}
                <ComparisonTable
                  forecast={forecast}
                  activeVariable={activeVariable}
                  selectedHourIndex={selectedHourIndex}
                  onSelectHourIndex={setSelectedHourIndex}
                />
              </>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-10 border-t border-slate-800/80 bg-slate-950/80 py-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-slate-300">
              MultiMeteo PWA • Meteorologia Comparativa Multi-Modello & Logger H24
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Dati Open-Meteo API • Modelli: ECMWF, DWD ICON, NOAA GFS, Météo-France, UKMO, JMA, GEM, MeteoSwiss.
            </p>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-mono">
            <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400">
              Ubuntu Host: 100.115.154.44:8085
            </span>
            <button
              onClick={() => setIsDeployModalOpen(true)}
              className="text-blue-400 hover:text-blue-300 underline transition"
            >
              Guida Deploy
            </button>
          </div>
        </div>
      </footer>

      {/* Ubuntu Deploy Guide Modal */}
      <DeployGuideModal
        isOpen={isDeployModalOpen}
        onClose={() => setIsDeployModalOpen(false)}
      />
    </div>
  );
};

export default App;
