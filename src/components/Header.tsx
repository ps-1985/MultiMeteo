import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Navigation,
  CloudSun,
  Download,
  Wifi,
  WifiOff,
  RotateCw,
  Server
} from 'lucide-react';
import type { GeoLocation } from '../types/weather';
import { searchLocations } from '../services/api';
import { PRESET_LOCATIONS } from '../constants/models';

interface HeaderProps {
  currentLocation: GeoLocation;
  onSelectLocation: (loc: GeoLocation) => void;
  onRefresh: () => void;
  isLoading: boolean;
  isOffline: boolean;
  onOpenDeployModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentLocation,
  onSelectLocation,
  onRefresh,
  isLoading,
  isOffline,
  onOpenDeployModal
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
    <header className="sticky top-0 z-40 bg-[#0b1329]/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Logo & Brand */}
          <div className="flex items-center justify-between w-full md:w-auto">
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
                <p className="text-xs text-slate-400 hidden sm:block">
                  Confronto previsionale multi-modello numerico in tempo reale
                </p>
              </div>
            </div>

            {/* Quick Actions (Mobile) */}
            <div className="flex items-center gap-1.5 md:hidden">
              {deferredPrompt && !isInstalled && (
                <button
                  onClick={handleInstallPWA}
                  title="Installa PWA"
                  className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs flex items-center gap-1"
                >
                  <Download className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={onRefresh}
                disabled={isLoading}
                title="Ricarica Dati"
                className="p-2 rounded-lg bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700/60 transition disabled:opacity-50"
              >
                <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
              </button>
            </div>
          </div>

          {/* Search bar & Location selector */}
          <div ref={searchContainerRef} className="relative w-full md:max-w-md">
            <div className="relative flex items-center">
              <div className="absolute left-3 text-slate-400 pointer-events-none">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Cerca città o località (es. Milano, Zurigo, Parigi)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (results.length > 0) setIsDropdownOpen(true);
                }}
                className="w-full pl-9 pr-10 py-2 text-sm bg-slate-900/90 text-white placeholder-slate-400 rounded-xl border border-slate-700/70 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 transition shadow-inner"
              />
              <button
                type="button"
                onClick={handleGPSLocation}
                title="Usa posizione GPS del dispositivo"
                className="absolute right-2 p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition"
              >
                <Navigation className="w-4 h-4" />
              </button>
            </div>

            {/* Autocomplete Dropdown */}
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

          {/* Controls & Badges (Desktop) */}
          <div className="hidden md:flex items-center gap-2">
            {/* Online / Offline status */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border ${
                isOffline
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              }`}
              title={isOffline ? 'Modalità Offline: visualizzazione cache locale' : 'Connesso a Open-Meteo API'}
            >
              {isOffline ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
              <span>{isOffline ? 'Offline' : 'Online'}</span>
            </div>

            {/* Deploy Server info button */}
            <button
              onClick={onOpenDeployModal}
              title="Configurazione Deploy Ubuntu Server (Porta 8085)"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 text-xs transition"
            >
              <Server className="w-3.5 h-3.5 text-indigo-400" />
              <span>Ubuntu 8085</span>
            </button>

            {/* Install PWA Button */}
            {deferredPrompt && !isInstalled && (
              <button
                onClick={handleInstallPWA}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium shadow-md shadow-emerald-950 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Installa App</span>
              </button>
            )}

            {/* Refresh */}
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

        {/* Quick Presets Bar */}
        <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <span className="text-slate-400 text-[11px] uppercase tracking-wider font-semibold mr-1 shrink-0">
            Predefiniti:
          </span>
          {PRESET_LOCATIONS.map((preset) => {
            const isSelected = currentLocation.name === preset.name;
            return (
              <button
                key={preset.id}
                onClick={() => onSelectLocation(preset)}
                className={`px-2.5 py-1 rounded-md transition shrink-0 flex items-center gap-1 text-xs border ${
                  isSelected
                    ? 'bg-blue-600/30 text-blue-300 border-blue-500/50 font-medium'
                    : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>{preset.name}</span>
                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
