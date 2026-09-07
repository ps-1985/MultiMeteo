import React from 'react';
import { WifiOff, RotateCw, HardDrive } from 'lucide-react';

interface OfflineBannerProps {
  lastUpdated: string;
  onRetry: () => void;
  isLoading: boolean;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  lastUpdated,
  onRetry,
  isLoading
}) => {
  const formattedTime = lastUpdated
    ? new Date(lastUpdated).toLocaleString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'data non disponibile';

  return (
    <div className="bg-amber-950/40 border border-amber-500/30 rounded-2xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
          <WifiOff className="w-4 h-4 text-amber-400" />
        </div>
        <div className="text-xs">
          <p className="font-semibold text-amber-300 flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-amber-400" /> Modalità Offline attiva: Dati da Cache Locale
          </p>
          <p className="text-amber-400/80 mt-0.5">
            Connessione a Open-Meteo assente. Ultima sincronizzazione registrata il: <span className="font-mono font-medium text-white">{formattedTime}</span>.
          </p>
        </div>
      </div>

      <button
        onClick={onRetry}
        disabled={isLoading}
        className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-medium flex items-center gap-1.5 transition shrink-0 disabled:opacity-50"
      >
        <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        <span>Riprova Connessione</span>
      </button>
    </div>
  );
};
