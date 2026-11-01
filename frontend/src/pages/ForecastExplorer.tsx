import React, { useState, useEffect } from 'react';
import { Station, HorizonForecast } from '../types';
import { fetchSingleForecast } from '../services/api';
import { UncertaintyBadge } from '../components/UncertaintyBadge';
import { Compass, Wind, Thermometer, Droplets, Car, Flame, Satellite, CheckCircle2 } from 'lucide-react';

interface ForecastExplorerProps {
  stations: Station[];
  selectedStationId: string;
  onSelectStation: (id: string) => void;
}

export const ForecastExplorer: React.FC<ForecastExplorerProps> = ({
  stations,
  selectedStationId,
  onSelectStation
}) => {
  const [pollutant, setPollutant] = useState<'PM2.5' | 'PM10'>('PM2.5');
  const [horizon, setHorizon] = useState<number>(1);
  const [forecast, setForecast] = useState<HorizonForecast | null>(null);
  const [inputSnapshot, setInputSnapshot] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedStationId) return;
    setLoading(true);
    setErrorMsg(null);
    fetchSingleForecast(selectedStationId, pollutant, horizon)
      .then((data: any) => {
        setForecast(data);
        setInputSnapshot(data.input_snapshot || {});
        setLoading(false);
      })
      .catch((err) => {
        setErrorMsg(err.message);
        setLoading(false);
      });
  }, [selectedStationId, pollutant, horizon]);

  const selectedStation = stations.find((s) => s.id === selectedStationId) || stations[0];

  return (
    <div className="space-y-6">
      {/* Selector Control Bar */}
      <div className="bg-white p-5 rounded-2xl border border-[#D1DFD4] shadow-xs">
        <h2 className="text-base font-bold text-[#0D2818] tracking-tight mb-4">
          Local Forecasting Engine Explorer
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. Station Select */}
          <div>
            <label className="block text-xs font-semibold text-[#4A6B56] uppercase mb-1">
              Neighbourhood
            </label>
            <select
              value={selectedStationId}
              onChange={(e) => onSelectStation(e.target.value)}
              className="w-full text-xs p-2 rounded border border-[#D1DFD4] bg-[#F8FAF8] text-[#0D2818] font-medium"
            >
              {stations.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.city})
                </option>
              ))}
            </select>
          </div>

          {/* 2. Pollutant Toggle */}
          <div>
            <label className="block text-xs font-semibold text-[#4A6B56] uppercase mb-1">
              Target Pollutant
            </label>
            <div className="flex rounded border border-[#D1DFD4] p-0.5 bg-[#F8FAF8] text-xs">
              <button
                onClick={() => setPollutant('PM2.5')}
                className={`flex-1 py-1.5 rounded font-medium ${
                  pollutant === 'PM2.5' ? 'bg-[#133E26] text-white' : 'text-[#4A6B56]'
                }`}
              >
                PM2.5 (Fine Particulate)
              </button>
              <button
                onClick={() => setPollutant('PM10')}
                className={`flex-1 py-1.5 rounded font-medium ${
                  pollutant === 'PM10' ? 'bg-[#133E26] text-white' : 'text-[#4A6B56]'
                }`}
              >
                PM10 (Respirable)
              </button>
            </div>
          </div>

          {/* 3. Horizon Selector */}
          <div>
            <label className="block text-xs font-semibold text-[#4A6B56] uppercase mb-1">
              Forecast Horizon
            </label>
            <div className="grid grid-cols-4 gap-1 text-xs">
              {[1, 3, 6, 24].map((h) => (
                <button
                  key={h}
                  onClick={() => setHorizon(h)}
                  className={`py-1.5 rounded border text-center font-mono font-medium ${
                    horizon === h
                      ? 'bg-[#133E26] text-white border-[#1B4332]'
                      : 'bg-[#F8FAF8] text-[#0D2818] border-[#D1DFD4] hover:bg-[#EBF3EA]'
                  }`}
                >
                  +{h}h
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-[#FEE2E2] border border-[#FCA5A5] text-[#7F1D1D] p-3 rounded text-xs">
          {errorMsg}
        </div>
      )}

      {/* Main Forecast Card */}
      {forecast && (
        <div className="bg-white p-6 rounded-2xl border border-[#D1DFD4] shadow-xs">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-[#EBF3EA] pb-4 mb-4 gap-2">
            <div>
              <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-[#EBF3EA] text-[#133E26]">
                Horizon: +{forecast.horizon_hours} Hours
              </span>
              <h3 className="text-lg font-bold text-[#0D2818] tracking-tight mt-1">
                {selectedStation?.name} — {pollutant} Forecast
              </h3>
              <p className="text-xs text-[#4A6B56]">
                Target Time: {new Date(forecast.target_timestamp).toLocaleString()}
              </p>
            </div>

            <div className="text-right">
              <div className="text-xs text-[#4A6B56]">Architecture:</div>
              <div className="text-xs font-semibold text-[#133E26]">
                {forecast.model_name}
              </div>
            </div>
          </div>

          {/* Large Prediction Number & Uncertainty */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div>
              <div className="text-xs text-[#4A6B56] font-medium">Model Point Forecast:</div>
              <div className="text-5xl font-extrabold font-mono text-[#133E26] mt-1">
                {forecast.point_forecast.toFixed(1)} <span className="text-lg font-normal text-[#4A6B56]">µg/m³</span>
              </div>

              <div className="mt-4 flex items-center gap-4 text-xs font-mono">
                <div>
                  <span className="text-[#4A6B56]">Persistence Base:</span>{' '}
                  <strong className="text-[#0D2818]">{forecast.baseline_persistence.toFixed(1)} µg/m³</strong>
                </div>
                <div>
                  <span className="text-[#4A6B56]">Residual Delta:</span>{' '}
                  <strong className={forecast.point_forecast >= forecast.baseline_persistence ? 'text-[#7F1D1D]' : 'text-[#2D6A4F]'}>
                    {(forecast.point_forecast - forecast.baseline_persistence).toFixed(1)} µg/m³
                  </strong>
                </div>
              </div>
            </div>

            <div>
              <UncertaintyBadge
                calibrated={forecast.uncertainty_calibrated}
                lower80={forecast.lower_bound_80}
                upper80={forecast.upper_bound_80}
                lower95={forecast.lower_bound_95}
                upper95={forecast.upper_bound_95}
              />
            </div>
          </div>
        </div>
      )}

      {/* Input Feature Snapshot Grid */}
      <div className="bg-white p-5 rounded-2xl border border-[#D1DFD4] shadow-xs">
        <h3 className="text-xs font-bold text-[#133E26] uppercase tracking-wide mb-3 flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-[#2D6A4F]" />
          Feature Vector Telemetry at Inference Time
        </h3>
        <p className="text-xs text-[#4A6B56] mb-4">
          Features consumed locally by the XGBoost regression model. All values strictly respect temporal precedence.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          {/* Lags */}
          <div className="p-3 rounded bg-[#F8FAF8] border border-[#EBF3EA]">
            <div className="text-[#4A6B56] text-[11px]">Latest Obs (t)</div>
            <div className="font-mono font-bold text-[#0D2818] mt-1">
              {inputSnapshot.latest_val ?? '—'} µg/m³
            </div>
          </div>

          <div className="p-3 rounded bg-[#F8FAF8] border border-[#EBF3EA]">
            <div className="text-[#4A6B56] text-[11px]">Rolling 6h Mean</div>
            <div className="font-mono font-bold text-[#0D2818] mt-1">
              {inputSnapshot.rolling_mean_6h ?? '—'} µg/m³
            </div>
          </div>

          {/* Weather */}
          <div className="p-3 rounded bg-[#F8FAF8] border border-[#EBF3EA]">
            <div className="text-[#4A6B56] text-[11px] flex items-center gap-1">
              <Thermometer className="w-3 h-3 text-[#B45309]" />
              Temp / Dew Pt
            </div>
            <div className="font-mono font-bold text-[#0D2818] mt-1">
              {inputSnapshot.temperature_c ?? '—'}° / {inputSnapshot.dew_point_c ?? '—'}°C
            </div>
          </div>

          <div className="p-3 rounded bg-[#F8FAF8] border border-[#EBF3EA]">
            <div className="text-[#4A6B56] text-[11px] flex items-center gap-1">
              <Droplets className="w-3 h-3 text-[#2563EB]" />
              Magnus RH
            </div>
            <div className="font-mono font-bold text-[#0D2818] mt-1">
              {inputSnapshot.relative_humidity ?? '—'} %
            </div>
          </div>

          <div className="p-3 rounded bg-[#F8FAF8] border border-[#EBF3EA]">
            <div className="text-[#4A6B56] text-[11px] flex items-center gap-1">
              <Wind className="w-3 h-3 text-[#4A6B56]" />
              Wind Speed & Dir
            </div>
            <div className="font-mono font-bold text-[#0D2818] mt-1">
              {inputSnapshot.wind_speed_ms ?? '—'} m/s ({inputSnapshot.wind_direction_deg ?? '—'}°)
            </div>
          </div>

          {/* Fire Screening */}
          <div className="p-3 rounded bg-[#F8FAF8] border border-[#EBF3EA]">
            <div className="text-[#4A6B56] text-[11px] flex items-center gap-1">
              <Flame className="w-3 h-3 text-[#EA580C]" />
              Fire Screen Index
            </div>
            <div className="font-mono font-bold text-[#0D2818] mt-1">
              {inputSnapshot.directional_fire_index ?? '—'}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-[#EBF3EA] text-[11px] text-[#4A6B56]">
          <strong>Notice on Interpretation:</strong> Features describe predictive statistical associations. They do not constitute certified causal proof of individual emission sources.
        </div>
      </div>
    </div>
  );
};
