import React, { useMemo } from 'react';
import type { ChartOptions } from 'chart.js';
import { Line } from 'react-chartjs-2';
import type { VerificationTimelinePoint } from '../types/verification';
import { WEATHER_MODELS } from '../constants/models';
import { Thermometer, CloudRain, Wind, ShieldCheck } from 'lucide-react';

interface VerificationChartProps {
  timeline: VerificationTimelinePoint[];
  variable: 'temperature_2m' | 'precipitation' | 'wind_speed_10m';
  onChangeVariable: (v: 'temperature_2m' | 'precipitation' | 'wind_speed_10m') => void;
}

export const VerificationChart: React.FC<VerificationChartProps> = ({
  timeline,
  variable,
  onChangeVariable
}) => {
  const labels = useMemo(() => {
    return timeline.map((pt) => {
      const date = new Date(pt.time);
      const day = date.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric' });
      const hour = date.getHours().toString().padStart(2, '0') + ':00';
      return `${day} ${hour}`;
    });
  }, [timeline]);

  const unit = variable === 'temperature_2m' ? '°C' : variable === 'precipitation' ? 'mm' : 'km/h';

  const chartData = useMemo(() => {
    const datasets: any[] = [];

    // 1. Ground Truth (Actual Observation)
    const actualValues = timeline.map((pt) => (pt.actual ? pt.actual[variable] : null));
    datasets.push({
      label: '● REALTÀ EFFETTIVA RILEVATA',
      data: actualValues,
      borderColor: '#10b981', // Neon Emerald
      backgroundColor: '#10b981',
      borderWidth: 3.5,
      tension: 0.25,
      pointRadius: 3,
      pointHoverRadius: 6,
      pointBackgroundColor: '#10b981',
      zIndex: 100
    });

    // 2. Individual Model predictions
    // Collect all modelIds present in timeline
    const modelIds = new Set<string>();
    timeline.forEach((pt) => {
      Object.keys(pt.models).forEach((m) => modelIds.add(m));
    });

    modelIds.forEach((modelId) => {
      const info = WEATHER_MODELS[modelId as keyof typeof WEATHER_MODELS];
      const values = timeline.map((pt) =>
        pt.models[modelId] && pt.models[modelId][variable] !== undefined
          ? pt.models[modelId][variable]
          : null
      );

      const hasData = values.some((v) => v !== null);
      if (!hasData) return;

      datasets.push({
        label: info?.shortName || modelId,
        data: values,
        borderColor: info?.color || '#94a3b8',
        backgroundColor: info?.color || '#94a3b8',
        borderWidth: 1.5,
        borderDash: [4, 4],
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 5,
        spanGaps: true
      });
    });

    return { labels, datasets };
  }, [timeline, labels, variable]);

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false
    },
    plugins: {
      legend: {
        position: 'top' as const,
        align: 'end',
        labels: {
          boxWidth: 10,
          boxHeight: 10,
          usePointStyle: true,
          color: '#cbd5e1',
          font: { size: 11, family: 'monospace' }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(11, 19, 43, 0.95)',
        titleColor: '#ffffff',
        bodyColor: '#e2e8f0',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: (ctx) => {
            const val = ctx.parsed.y;
            if (val === null || val === undefined) return '';
            return ` ${ctx.dataset.label}: ${val} ${unit}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.04)' },
        ticks: { color: '#64748b', font: { size: 10 }, maxRotation: 45 }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: {
          color: '#94a3b8',
          font: { size: 11, family: 'monospace' },
          callback: (v) => `${v} ${unit}`
        }
      }
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <h4 className="text-sm font-semibold text-white uppercase tracking-wide">
            Grafico Verifica: Realtà Rilevata vs Previsioni Passate
          </h4>
        </div>

        {/* Variable Switcher */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => onChangeVariable('temperature_2m')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition ${
              variable === 'temperature_2m'
                ? 'bg-blue-600/30 text-blue-300 border border-blue-500/50'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Thermometer className="w-3.5 h-3.5 text-blue-400" />
            <span>Temperatura</span>
          </button>
          <button
            onClick={() => onChangeVariable('precipitation')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition ${
              variable === 'precipitation'
                ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200'
            }`}
          >
            <CloudRain className="w-3.5 h-3.5 text-indigo-400" />
            <span>Precipitazioni</span>
          </button>
          <button
            onClick={() => onChangeVariable('wind_speed_10m')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition ${
              variable === 'wind_speed_10m'
                ? 'bg-teal-600/30 text-teal-300 border border-teal-500/50'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wind className="w-3.5 h-3.5 text-teal-400" />
            <span>Vento</span>
          </button>
        </div>
      </div>

      <div className="relative w-full h-80 sm:h-96">
        <Line data={chartData} options={options} />
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400 mt-2 pt-2 border-t border-slate-800/60 font-mono">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-1 bg-emerald-400 rounded-full inline-block" />
          <b className="text-white">Linea Solida Verde</b>: Condizioni Reali Rilevate dalle Stazioni
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-1 bg-slate-400 rounded-full inline-block border-dashed" />
          <b>Linee Tratteggiate</b>: Previsioni formulate in precedenza dai singoli modelli
        </span>
      </div>
    </div>
  );
};
