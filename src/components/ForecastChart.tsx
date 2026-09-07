import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import type { ChartOptions } from 'chart.js';
import { Line } from 'react-chartjs-2';
import type {
  MultiModelForecast,
  WeatherVariable,
  TimeHorizon
} from '../types/weather';
import { WEATHER_MODELS, WEATHER_VARIABLES } from '../constants/models';
import {
  Thermometer,
  CloudRain,
  Wind,
  Zap,
  Gauge,
  Clock,
  Layers
} from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ForecastChartProps {
  forecast: MultiModelForecast;
  activeVariable: WeatherVariable;
  onChangeVariable: (v: WeatherVariable) => void;
  timeHorizon: TimeHorizon;
  onChangeTimeHorizon: (h: TimeHorizon) => void;
  selectedHourIndex: number;
  onSelectHourIndex: (idx: number) => void;
}

export const ForecastChart: React.FC<ForecastChartProps> = ({
  forecast,
  activeVariable,
  onChangeVariable,
  timeHorizon,
  onChangeTimeHorizon,
  selectedHourIndex,
  onSelectHourIndex
}) => {
  // Determine number of hours to show
  const hoursCount = useMemo(() => {
    switch (timeHorizon) {
      case '24h':
        return 24;
      case '48h':
        return 48;
      case '72h':
        return 72;
      case '7d':
      default:
        return 168;
    }
  }, [timeHorizon]);

  // Sliced data
  const rawHourlyData = forecast.hourly[activeVariable] || [];
  const currentData = useMemo(() => {
    return rawHourlyData.slice(0, hoursCount);
  }, [rawHourlyData, hoursCount]);

  // Labels for X Axis
  const labels = useMemo(() => {
    return currentData.map((d) => {
      const date = new Date(d.time);
      const hour = date.getHours().toString().padStart(2, '0') + ':00';
      const day = date.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric' });
      return `${day} ${hour}`;
    });
  }, [currentData]);

  // Prepare Datasets
  const chartData = useMemo(() => {
    const datasets: any[] = [];

    // 1. Min boundary for spread area
    const minValues = currentData.map((d) => d.min);
    // 2. Max boundary for spread area
    const maxValues = currentData.map((d) => d.max);

    // Spread Band (Min to Max)
    datasets.push({
      label: 'Banda Minima Spread',
      data: minValues,
      borderColor: 'transparent',
      backgroundColor: 'transparent',
      pointRadius: 0,
      fill: false
    });

    datasets.push({
      label: 'Incertezza / Spread Modelli (Min-Max)',
      data: maxValues,
      borderColor: 'transparent',
      backgroundColor: 'rgba(99, 102, 241, 0.12)', // Subtle indigo glow
      pointRadius: 0,
      fill: '-1' // Fill between min and max
    });

    // 3. Individual Model Lines
    forecast.activeModels.forEach((modelId) => {
      const modelInfo = WEATHER_MODELS[modelId];
      if (!modelInfo) return;

      const values = currentData.map((d) => d.modelValues[modelId]);

      // Check if model has any non-null data in this slice
      const hasData = values.some((v) => v !== null);
      if (!hasData) return;

      datasets.push({
        label: modelInfo.shortName,
        data: values,
        borderColor: modelInfo.color,
        backgroundColor: modelInfo.color,
        borderWidth: 1.6,
        tension: 0.35,
        pointRadius: (ctx: any) => (ctx.dataIndex === selectedHourIndex ? 5 : 0),
        pointHoverRadius: 6,
        pointBackgroundColor: modelInfo.color,
        spanGaps: true
      });
    });

    // 4. Multi-Model Consensus (Mean) Line (Prominent White Line)
    const consensusValues = currentData.map((d) => d.consensus);
    datasets.push({
      label: 'CONSENSO MEDIO',
      data: consensusValues,
      borderColor: '#ffffff',
      backgroundColor: '#ffffff',
      borderWidth: 3,
      borderDash: [5, 4],
      tension: 0.35,
      pointRadius: (ctx: any) => (ctx.dataIndex === selectedHourIndex ? 6 : 1),
      pointHoverRadius: 7,
      pointBackgroundColor: '#ffffff',
      pointBorderColor: '#090d16',
      pointBorderWidth: 2,
      zIndex: 100
    });

    return { labels, datasets };
  }, [currentData, labels, forecast.activeModels, selectedHourIndex]);

  const unit = forecast.units[activeVariable] || '';
  const currentVarInfo = WEATHER_VARIABLES[activeVariable];

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 350
    },
    interaction: {
      mode: 'index',
      intersect: false
    },
    onClick: (_e, elements) => {
      if (elements && elements.length > 0) {
        onSelectHourIndex(elements[0].index);
      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
        align: 'end',
        labels: {
          boxWidth: 10,
          boxHeight: 10,
          usePointStyle: true,
          pointStyle: 'circle',
          color: '#cbd5e1',
          font: { size: 11, family: 'monospace' },
          filter: (legendItem) => {
            // Filter out internal spread fill datasets from legend
            return (
              legendItem.text !== 'Banda Minima Spread' &&
              legendItem.text !== 'Incertezza / Spread Modelli (Min-Max)'
            );
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(11, 19, 43, 0.95)',
        titleColor: '#ffffff',
        titleFont: { size: 13, weight: 'bold' },
        bodyColor: '#e2e8f0',
        bodyFont: { size: 11, family: 'monospace' },
        borderColor: '#334155',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          title: (items) => {
            if (!items.length) return '';
            return `Orario: ${items[0].label}`;
          },
          label: (context) => {
            if (
              context.dataset.label === 'Banda Minima Spread' ||
              context.dataset.label === 'Incertezza / Spread Modelli (Min-Max)'
            ) {
              return '';
            }
            const val = context.parsed.y;
            if (val === null || val === undefined) return '';
            return ` ${context.dataset.label}: ${val} ${unit}`;
          },
          afterBody: (items) => {
            if (!items.length) return '';
            const idx = items[0].dataIndex;
            const pt = currentData[idx];
            if (!pt || pt.spread === null) return '';
            return `\n-----------------------\nConsenso: ${pt.consensus} ${unit}\nSpread Min-Max: Δ ${pt.spread} ${unit}\nDev. Standard: ±${pt.stdDev ?? 0} ${unit}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.04)'
        },
        ticks: {
          color: '#64748b',
          font: { size: 10 },
          maxRotation: 45,
          autoSkip: true,
          maxTicksLimit: timeHorizon === '24h' ? 12 : timeHorizon === '48h' ? 16 : 24
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)'
        },
        ticks: {
          color: '#94a3b8',
          font: { size: 11, family: 'monospace' },
          callback: (value) => `${value} ${unit}`
        }
      }
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl">
      {/* Chart Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-800">
        {/* Variable Selector Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => onChangeVariable('temperature_2m')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition border shrink-0 ${
              activeVariable === 'temperature_2m'
                ? 'bg-blue-600/30 text-blue-300 border-blue-500/50 shadow-sm'
                : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <Thermometer className="w-3.5 h-3.5 text-blue-400" />
            <span>Temperatura (°C)</span>
          </button>

          <button
            onClick={() => onChangeVariable('precipitation')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition border shrink-0 ${
              activeVariable === 'precipitation'
                ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/50 shadow-sm'
                : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <CloudRain className="w-3.5 h-3.5 text-indigo-400" />
            <span>Precipitazioni (mm)</span>
          </button>

          <button
            onClick={() => onChangeVariable('wind_speed_10m')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition border shrink-0 ${
              activeVariable === 'wind_speed_10m'
                ? 'bg-teal-600/30 text-teal-300 border-teal-500/50 shadow-sm'
                : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <Wind className="w-3.5 h-3.5 text-teal-400" />
            <span>Vento (km/h)</span>
          </button>

          <button
            onClick={() => onChangeVariable('wind_gusts_10m')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition border shrink-0 ${
              activeVariable === 'wind_gusts_10m'
                ? 'bg-amber-600/30 text-amber-300 border-amber-500/50 shadow-sm'
                : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Raffiche (km/h)</span>
          </button>

          <button
            onClick={() => onChangeVariable('surface_pressure')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition border shrink-0 ${
              activeVariable === 'surface_pressure'
                ? 'bg-purple-600/30 text-purple-300 border-purple-500/50 shadow-sm'
                : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <Gauge className="w-3.5 h-3.5 text-purple-400" />
            <span>Pressione (hPa)</span>
          </button>
        </div>

        {/* Time Horizon Selector */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 shrink-0 self-start lg:self-auto">
          <span className="text-[11px] text-slate-400 px-2 flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" /> Orizzonte:
          </span>
          {(['24h', '48h', '72h', '7d'] as TimeHorizon[]).map((horizon) => (
            <button
              key={horizon}
              onClick={() => onChangeTimeHorizon(horizon)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono transition ${
                timeHorizon === horizon
                  ? 'bg-blue-600 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {horizon}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="relative w-full h-80 sm:h-96">
        <Line data={chartData} options={options} />
      </div>

      {/* Chart Footer description */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-3 pt-3 border-t border-slate-800/60 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          <span>
            {currentVarInfo.label}: <span className="text-slate-300">{currentVarInfo.description}</span>
          </span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[11px]">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-white inline-block" /> Consenso
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-indigo-500/30 inline-block border border-indigo-500/50" /> Banda Spread Min-Max
          </span>
        </div>
      </div>
    </div>
  );
};
