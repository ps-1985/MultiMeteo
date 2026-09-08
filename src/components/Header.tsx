import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Navigation,
  CloudSun,
  Download,
  Wifi,
  WifiOff,
  RotateCw,
  Server,
  Star,
  Activity,
  Plus
} from 'lucide-react';
import type { GeoLocation } from '../types/weather';
import type { FavoriteItem } from '../types/verification';
import { searchLocations } from '../services/api';

interface HeaderProps {
  currentLocation: GeoLocation;
  onSelectLocation: (loc: GeoLocation) => void;
  onRefresh: () => void;
  isLoading: boolean;
  isOffline: boolean;
  onOpenDeployModal: () => void;
  activeTab: 'forecast' | 'favorites';
  onChangeTab: (tab: 'forecast' | 'favorites') => void;
  onToggleFavorite: () => void;
  isFavorite: boolean;
  favorites?: FavoriteItem[];
}

export const Header: React.FC<HeaderProps> = ({
  currentLocation,
  onSelectLocation,
  onRefresh,
  isLoading,
  isOffline,
  onOpenDeployModal,
  activeTab,
  onChangeTab,
  onToggleFavorite,
  isFavorite,
  favorites = []
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<GeoLocation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Handle PWA installation prompt
  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallPWA = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      const searchRes = await searchLocations(searchQuery);
      setResults(searchRes);
      setIsSearching(false);
      setIsDropdownOpen(true);
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // GPS geolocation
  const handleGPSLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocalizzazione non supportata dal browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const gpsLoc: GeoLocation = {
          id: Math.round(pos.coords.latitude * 1000 + pos.coords.longitude),
          name: 'Posizione GPS',
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'auto',
          admin1: `${pos.coords.latitude.toFixed(2)}°N, ${pos.coords.longitude.toFixed(2)}°E`,
          country: 'Rilevamento GPS'
        };
        onSelectLocation(gpsLoc);
      },
      (err) => {
        console.error('GPS error', err);
        alert('Impossibile ottenere la posizione GPS: ' + err.message);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0b1329]/95 backdrop-blur-md border-b border-slate-800 max-w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3">
        {/* DESKTOP HEADER (md and above) */}
        <div className="hidden md:flex items-center justify-between gap-3">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-emerald-400 p-0.5 shadow-lg shadow-indigo-950/50 flex items-center justify-center">
              <div className="w-full h-full bg-[#090d16] rounded-[10px] flex items-center justify-center">
                <CloudSun className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                  Multi<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Meteo</span>
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  PWA 8-Model
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Confronto previsionale multi-modello & Verifica accuratezza H24
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800 shadow-inner">
            <button
              onClick={() => onChangeTab('forecast')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeTab === 'forecast'
                  ? 'bg-blue-600 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-blue-300" />
              <span>Previsioni Live</span>
            </button>

            <button
              onClick={() => onChangeTab('favorites')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeTab === 'favorites'
                  ? 'bg-indigo-600 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>Preferiti & Accuratezza H24</span>
            </button>
          </div>

          {/* Desktop Search Bar */}
          <div ref={searchContainerRef} className="relative w-full max-w-xs lg:max-w-sm flex items-center gap-1.5">
            <div className="relative flex-1 flex items-center">
              <div className="absolute left-3 text-slate-400 pointer-events-none">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Cerca città (es. Milano, Zurigo)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (results.length > 0) setIsDropdownOpen(true);
                }}
                className="w-full pl-9 pr-8 py-2 text-sm bg-slate-900/90 text-white placeholder-slate-400 rounded-xl border border-slate-700/70 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 transition shadow-inner"
              />
              <button
                type="button"
                onClick={handleGPSLocation}
                title="Usa posizione GPS del dispositivo"
                className="absolute right-2 p-1 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition"
              >
                <Navigation className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Desktop Favorite Star */}
            <button
              onClick={onToggleFavorite}
              title={
                isFavorite
                  ? `Rimuovi ${currentLocation.name} dai preferiti H24`
                  : `Aggiungi ${currentLocation.name} ai preferiti H24`
              }
              className={`p-2 rounded-xl border transition flex items-center justify-center shrink-0 ${
                isFavorite
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                  : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-amber-400'
              }`}
            >
              <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
            </button>

            {/* Desktop Autocomplete Dropdown */}
            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 max-h-72 overflow-y-auto divide-y divide-slate-800/60">
                {isSearching ? (
                  <div className="p-3 text-center text-xs text-slate-400">
                    Ricerca coordinate in corso...
                  </div>
                ) : results.length > 0 ? (
                  results.map((loc) => (
                    <button
                      key={loc.id}
                      onClick={() => {
                        onSelectLocation(loc);
                        setIsDropdownOpen(false);
                        setSearchQuery('');
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-800 flex items-center justify-between text-slate-200 hover:text-white transition group"
                    >
                      <div>
                        <span className="font-medium text-white">{loc.name}</span>
                        <span className="text-xs text-slate-400 ml-2">
                          {[loc.admin1, loc.country].filter(Boolean).join(', ')}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400 group-hover:text-blue-400">
                        {loc.latitude.toFixed(2)}°, {loc.longitude.toFixed(2)}°
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="p-3 text-center text-xs text-slate-400">
                    Nessuna località trovata per "{searchQuery}"
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Desktop Controls */}
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border ${
                isOffline
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              }`}
              title={isOffline ? 'Modalità Offline' : 'Connesso a Open-Meteo API'}
            >
              {isOffline ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
              <span>{isOffline ? 'Offline' : 'Online'}</span>
            </div>

            <button
              onClick={onOpenDeployModal}
              title="Configurazione Deploy Ubuntu Server (Porta 8085)"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 text-xs transition"
            >
              <Server className="w-3.5 h-3.5 text-indigo-400" />
              <span>Ubuntu 8085</span>
            </button>

            {deferredPrompt && !isInstalled && (
              <button
                onClick={handleInstallPWA}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium shadow-md transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Installa</span>
              </button>
            )}

            <button
              onClick={onRefresh}
              disabled={isLoading}
              title="Aggiorna previsioni"
              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 transition disabled:opacity-50"
            >
              <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Desktop Quick Favorites Bar */}
        <div className="hidden md:flex items-center gap-1.5 mt-2.5 overflow-x-auto pb-1 text-xs no-scrollbar touch-pan-x max-w-full">
          <span className="text-amber-400 text-[11px] uppercase tracking-wider font-semibold mr-1 shrink-0 flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            Preferiti:
          </span>
          {favorites.length > 0 ? (
            favorites.map((fav) => {
              const isSelected =
                currentLocation.name.toLowerCase() === fav.name.toLowerCase() ||
                (Math.abs(currentLocation.latitude - fav.latitude) < 0.05 &&
                  Math.abs(currentLocation.longitude - fav.longitude) < 0.05);
              return (
                <button
                  key={fav.id}
                  onClick={() =>
                    onSelectLocation({
                      id: fav.id,
                      name: fav.name,
                      latitude: fav.latitude,
                      longitude: fav.longitude,
                      country: fav.country,
                      timezone: fav.timezone || 'auto'
                    })
                  }
                  className={`px-3 py-1 rounded-lg transition shrink-0 flex items-center gap-1.5 text-xs border ${
                    isSelected
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold shadow-sm'
                      : 'bg-slate-900/80 text-slate-300 hover:text-white border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span>{fav.name}</span>
                  {fav.latestObservation?.temperature_2m !== null &&
                    fav.latestObservation?.temperature_2m !== undefined && (
                      <span className="font-mono text-[11px] opacity-75">
                        {fav.latestObservation.temperature_2m}°
                      </span>
                    )}
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                </button>
              );
            })
          ) : (
            <span className="text-[11px] text-slate-500 italic">
              Nessun preferito salvato. Cerca una città e premi ⭐ per salvarla qui!
            </span>
          )}

          {!isFavorite && (
            <button
              onClick={onToggleFavorite}
              title={`Aggiungi ${currentLocation.name} ai preferiti H24`}
              className="px-2.5 py-1 rounded-lg bg-slate-900 text-slate-400 hover:text-amber-300 hover:bg-slate-800 border border-dashed border-slate-700 text-xs transition flex items-center gap-1 shrink-0"
            >
              <Plus className="w-3 h-3 text-amber-400" />
              <span>Aggiungi {currentLocation.name}</span>
            </button>
          )}
        </div>

        {/* MOBILE HEADER (Phones and small screens < md) */}
        <div className="block md:hidden space-y-2.5 max-w-full overflow-x-hidden">
          {/* 1. Mobile Top Minimal App Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 p-0.5 flex items-center justify-center shrink-0">
                <div className="w-full h-full bg-[#090d16] rounded-[6px] flex items-center justify-center">
                  <CloudSun className="w-3.5 h-3.5 text-indigo-400" />
                </div>
              </div>
              <span className="text-base font-bold tracking-tight text-white">
                Multi<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Meteo</span>
              </span>
              <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                8 Modelli
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {deferredPrompt && !isInstalled && (
                <button
                  onClick={handleInstallPWA}
                  title="Installa PWA"
                  className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={onRefresh}
                disabled={isLoading}
                title="Ricarica Dati"
                className="p-1.5 rounded-lg bg-slate-900 text-slate-300 border border-slate-800 transition disabled:opacity-50"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
              </button>
            </div>
          </div>

          {/* 2. IN ALTO UN BEL SELETTORE GROSSO "Live / Accuratezza" */}
          <div className="grid grid-cols-2 p-1 bg-slate-950/90 rounded-2xl border border-slate-800 shadow-xl">
            <button
              onClick={() => onChangeTab('forecast')}
              className={`py-2.5 px-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition active:scale-[0.98] ${
                activeTab === 'forecast'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-950/60 ring-1 ring-blue-400/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-4 h-4 text-blue-300" />
              <span>Previsioni Live</span>
            </button>
            <button
              onClick={() => onChangeTab('favorites')}
              className={`py-2.5 px-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition active:scale-[0.98] ${
                activeTab === 'favorites'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/60 ring-1 ring-indigo-400/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>Accuratezza H24</span>
            </button>
          </div>

          {/* 3. POI LA CITTÀ */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              {/* Search Bar Mobile */}
              <div className="relative flex-1 flex items-center">
                <div className="absolute left-3 text-slate-400 pointer-events-none">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder={`Città attuale: ${currentLocation.name}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    if (results.length > 0) setIsDropdownOpen(true);
                  }}
                  className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-slate-900 text-white placeholder-slate-400 rounded-xl border border-slate-800 focus:outline-none focus:border-blue-500 shadow-inner"
                />
                <button
                  type="button"
                  onClick={handleGPSLocation}
                  title="Posizione GPS"
                  className="absolute right-2 p-1 text-slate-400 hover:text-blue-400 rounded-lg transition"
                >
                  <Navigation className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Mobile Favorite Star Button */}
              <button
                onClick={onToggleFavorite}
                title={isFavorite ? 'Rimuovi dai Preferiti H24' : 'Salva nei Preferiti H24'}
                className={`p-2 rounded-xl border transition shrink-0 ${
                  isFavorite
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
              >
                <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
              </button>
            </div>

            {/* Mobile Autocomplete Results Dropdown */}
            {isDropdownOpen && (
              <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 max-h-60 overflow-y-auto divide-y divide-slate-800/60">
                {isSearching ? (
                  <div className="p-3 text-center text-xs text-slate-400">
                    Ricerca coordinate...
                  </div>
                ) : results.length > 0 ? (
                  results.map((loc) => (
                    <button
                      key={loc.id}
                      onClick={() => {
                        onSelectLocation(loc);
                        setIsDropdownOpen(false);
                        setSearchQuery('');
                      }}
                      className="w-full px-3 py-2 text-left text-xs hover:bg-slate-800 flex items-center justify-between text-slate-200"
                    >
                      <span className="font-medium text-white">{loc.name}</span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {[loc.admin1, loc.country].filter(Boolean).join(', ')}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="p-3 text-center text-xs text-slate-400">
                    Nessuna località trovata
                  </div>
                )}
              </div>
            )}

            {/* Mobile Quick Favorites Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar touch-pan-x max-w-full">
              <span className="text-amber-400 text-[10px] uppercase tracking-wider font-semibold mr-1 shrink-0 flex items-center gap-1">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> Preferiti:
              </span>
              {favorites.length > 0 ? (
                favorites.map((fav) => {
                  const isSelected =
                    currentLocation.name.toLowerCase() === fav.name.toLowerCase() ||
                    (Math.abs(currentLocation.latitude - fav.latitude) < 0.05 &&
                      Math.abs(currentLocation.longitude - fav.longitude) < 0.05);
                  return (
                    <button
                      key={fav.id}
                      onClick={() =>
                        onSelectLocation({
                          id: fav.id,
                          name: fav.name,
                          latitude: fav.latitude,
                          longitude: fav.longitude,
                          country: fav.country,
                          timezone: fav.timezone || 'auto'
                        })
                      }
                      className={`px-2.5 py-1 rounded-lg transition shrink-0 flex items-center gap-1 text-[11px] border ${
                        isSelected
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold shadow-sm'
                          : 'bg-slate-900/80 text-slate-300 border-slate-800/80'
                      }`}
                    >
                      <span>{fav.name}</span>
                      {fav.latestObservation?.temperature_2m !== null &&
                        fav.latestObservation?.temperature_2m !== undefined && (
                          <span className="font-mono text-[10px] opacity-75">
                            {fav.latestObservation.temperature_2m}°
                          </span>
                        )}
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                    </button>
                  );
                })
              ) : (
                <span className="text-[10px] text-slate-500 italic">
                  Premi ⭐ per salvare la città
                </span>
              )}

              {!isFavorite && (
                <button
                  onClick={onToggleFavorite}
                  title={`Aggiungi ${currentLocation.name} ai preferiti`}
                  className="px-2 py-0.5 rounded-lg bg-slate-900 text-slate-400 hover:text-amber-300 border border-dashed border-slate-700 text-[10px] transition flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-3 h-3 text-amber-400" />
                  <span>+ {currentLocation.name}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
