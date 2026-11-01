import React, { useState, useEffect } from 'react';
import { Station, HorizonForecast, Observation, FireDetection, PeakAndRecoveryAnalysis } from '../types';
import { fetchLatestForecast, fetchEnvironmentalSources, triggerModelTraining, fetchPeakAndRecovery, fetchDataQuality } from '../services/api';
import { ForecastChart } from '../charts/ForecastChart';
import { PollutionMap } from '../maps/PollutionMap';
import { UncertaintyBadge } from '../components/UncertaintyBadge';
import { Clock, ShieldCheck, Activity, ArrowUpRight, Play, CheckCircle, TrendingUp, AlertTriangle } from 'lucide-react';

interface OverviewProps {
  stations: Station[];
  selectedStationId: string;
  onSelectStation: (id: string) => void;
  onRefresh: () => void;
}

export const Overview: React.FC<OverviewProps> = ({
  stations,
  selectedStationId,
  onSelectStation,
  onRefresh
}) => {
  const [pollutant, setPollutant] = useState<'PM2.5' | 'PM10'>('PM2.5');
  const [currentObs, setCurrentObs] = useState<Observation | null>(null);
  const [forecasts, setForecasts] = useState<HorizonForecast[]>([]);
  const [fires, setFires] = useState<FireDetection[]>([]);
  const [peakRecovery, setPeakRecovery] = useState<PeakAndRecoveryAnalysis | null>(null);
  const [qualityWarning, setQualityWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [training, setTraining] = useState<boolean>(false);
  const [trainMessage, setTrainMessage] = useState<string | null>(null);

  const selectedStation = stations.find((s) => s.id === selectedStationId) || stations[0];

  useEffect(() => {
    if (!selectedStationId) return;
    setLoading(true);
    Promise.all([
      fetchLatestForecast(selectedStationId, pollutant).catch(() => null),
      fetchEnvironmentalSources(selectedStationId).catch(() => null),
      fetchPeakAndRecovery(selectedStationId).catch(() => null),
      fetchDataQuality().catch(() => null)
    ]).then(([fcData, envData, prData, qData]) => {
      if (fcData) {
        setCurrentObs(fcData.current_observation);
        setForecasts(fcData.forecasts);
      }
      if (envData) {
        setFires(envData.active_fires);
      }
      if (prData) {
        setPeakRecovery(prData);
      }
      if (qData && qData.is_small_dataset_safeguard_active) {
        setQualityWarning(qData.small_dataset_warning);
      }
      setLoading(false);
    });
  }, [selectedStationId, pollutant]);

  const handleTrain = async () => {
    setTraining(true);
    setTrainMessage(null);
    try {
      const res = await triggerModelTraining();
      setTrainMessage(`Model training complete: ${res.models_trained} models updated locally.`);
      onRefresh();
    } catch (err: any) {
      setTrainMessage(`Training failed: ${err.message}`);
    } finally {
      setTraining(false);
    }
  };

  const getAQIBand = (val: number) => {
    if (val <= 60) return { label: 'Moderate', color: 'text-[#2D6A4F] bg-[#EBF3EA] border-[#85A98F]' };
    if (val <= 120) return { label: 'Poor', color: 'text-[#B45309] bg-[#FEF3C7] border-[#FCD34D]' };
    if (val <= 250) return { label: 'Very Poor', color: 'text-[#C2410C] bg-[#FFEDD5] border-[#FDBA74]' };
    return { label: 'Severe (Diwali Peak)', color: 'text-[#7F1D1D] bg-[#FEE2E2] border-[#FCA5A5]' };
  };

  const latestMapObs: Record<string, number> = {};
  if (currentObs) {
    latestMapObs[selectedStationId] = currentObs.value;
  }

  return (
    <div className="space-y-6">
      {/* Top Station Selector & Action Row */}
      <div className="bg-white p-4 rounded border border-[#D1DFD4] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <label className="block text-[11px] font-semibold text-[#4A6B56] uppercase tracking-wider mb-1">
            Monitoring Location / Neighbourhood
          </label>
          <div className="flex flex-wrap gap-2">
            {stations.map((stn) => (
              <button
                key={stn.id}
                onClick={() => onSelectStation(stn.id)}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  stn.id === selectedStationId
                    ? 'bg-[#1B4332] text-white shadow-sm'
                    : 'bg-[#F8FAF8] text-[#0D2818] border border-[#D1DFD4] hover:bg-[#EBF3EA]'
                }`}
              >
                {stn.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Pollutant Toggle */}
          <div className="flex rounded border border-[#D1DFD4] p-0.5 bg-[#F8FAF8] text-xs">
            <button
              onClick={() => setPollutant('PM2.5')}
              className={`px-2.5 py-1 rounded font-medium ${
                pollutant === 'PM2.5' ? 'bg-[#1B4332] text-white' : 'text-[#4A6B56]'
              }`}
            >
              PM2.5
            </button>
            <button
              onClick={() => setPollutant('PM10')}
              className={`px-2.5 py-1 rounded font-medium ${
                pollutant === 'PM10' ? 'bg-[#1B4332] text-white' : 'text-[#4A6B56]'
              }`}
            >
              PM10
            </button>
          </div>

          <button
            onClick={handleTrain}
            disabled={training}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#2D6A4F] text-white text-xs font-medium hover:bg-[#1B4332] transition-colors disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 ${training ? 'animate-spin' : ''}`} />
            <span>{training ? 'Training...' : 'Retrain Models'}</span>
          </button>
        </div>
      </div>

      {qualityWarning && (
        <div className="bg-[#FEF3C7] border border-[#FCD34D] text-[#B45309] px-4 py-3 rounded text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold">Dataset Coverage Notice:</strong> {qualityWarning}
          </div>
        </div>
      )}

      {trainMessage && (
        <div className="bg-[#EBF3EA] border border-[#85A98F] text-[#1B4332] px-4 py-2 rounded text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-[#2D6A4F]" />
          <span>{trainMessage}</span>
        </div>
      )}

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Ground Truth Observation */}
        <div className="bg-white p-4 rounded border border-[#D1DFD4] shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-semibold text-[#4A6B56] uppercase tracking-wide">
              Latest Observed {pollutant}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#EBF3EA] text-[#1B4332] font-mono">
              Ground Truth
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-[#0D2818]">
              {currentObs ? currentObs.value.toFixed(1) : '—'}
            </span>
            <span className="text-xs text-[#4A6B56]">µg/m³</span>
          </div>
          {currentObs && (
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className={`px-2 py-0.5 rounded border text-[10px] font-medium ${getAQIBand(currentObs.value).color}`}>
                {getAQIBand(currentObs.value).label}
              </span>
              <span className="text-[#4A6B56] flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(currentObs.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}
          <div className="mt-3 pt-2 border-t border-[#EBF3EA] text-[10px] text-[#4A6B56]">
            Source: CPCB Ground Monitor | Quality: {currentObs?.quality_flag || 'valid'}
          </div>
        </div>

        {/* Card 2: 1-Hour Horizon Forecast */}
        {(() => {
          const fc1 = forecasts.find((f) => f.horizon_hours === 1);
          return (
            <div className="bg-white p-4 rounded border border-[#D1DFD4] shadow-sm">
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-semibold text-[#4A6B56] uppercase tracking-wide">
                  +1 Hour Forecast
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#EBF3EA] text-[#1B4332] font-mono">
                  Direct ML
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold font-mono text-[#1B4332]">
                  {fc1 ? fc1.point_forecast.toFixed(1) : '—'}
                </span>
                <span className="text-xs text-[#4A6B56]">µg/m³</span>
              </div>
              {fc1 && (
                <div className="mt-2 text-[11px] text-[#4A6B56] font-mono">
                  80% Interval: [{fc1.lower_bound_80.toFixed(1)} – {fc1.upper_bound_80.toFixed(1)}]
                </div>
              )}
              <div className="mt-3 pt-2 border-t border-[#EBF3EA] text-[10px] text-[#4A6B56]">
                Model: {fc1?.model_name || 'XGBoost Residual'}
              </div>
            </div>
          );
        })()}

        {/* Card 3: 6-Hour Horizon Forecast */}
        {(() => {
          const fc6 = forecasts.find((f) => f.horizon_hours === 6);
          return (
            <div className="bg-white p-4 rounded border border-[#D1DFD4] shadow-sm">
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-semibold text-[#4A6B56] uppercase tracking-wide">
                  +6 Hour Forecast
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#EBF3EA] text-[#1B4332] font-mono">
                  Direct ML
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold font-mono text-[#1B4332]">
                  {fc6 ? fc6.point_forecast.toFixed(1) : '—'}
                </span>
                <span className="text-xs text-[#4A6B56]">µg/m³</span>
              </div>
              {fc6 && (
                <div className="mt-2 text-[11px] text-[#4A6B56] font-mono">
                  80% Interval: [{fc6.lower_bound_80.toFixed(1)} – {fc6.upper_bound_80.toFixed(1)}]
                </div>
              )}
              <div className="mt-3 pt-2 border-t border-[#EBF3EA] text-[10px] text-[#4A6B56]">
                Model: {fc6?.model_name || 'XGBoost Residual'}
              </div>
            </div>
          );
        })()}

        {/* Card 4: 24-Hour Horizon Forecast */}
        {(() => {
          const fc24 = forecasts.find((f) => f.horizon_hours === 24);
          return (
            <div className="bg-white p-4 rounded border border-[#D1DFD4] shadow-sm">
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-semibold text-[#4A6B56] uppercase tracking-wide">
                  +24 Hour Forecast
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#EBF3EA] text-[#1B4332] font-mono">
                  Direct ML
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold font-mono text-[#1B4332]">
                  {fc24 ? fc24.point_forecast.toFixed(1) : '—'}
                </span>
                <span className="text-xs text-[#4A6B56]">µg/m³</span>
              </div>
              {fc24 && (
                <div className="mt-2 text-[11px] text-[#4A6B56] font-mono">
                  80% Interval: [{fc24.lower_bound_80.toFixed(1)} – {fc24.upper_bound_80.toFixed(1)}]
                </div>
              )}
              <div className="mt-3 pt-2 border-t border-[#EBF3EA] text-[10px] text-[#4A6B56]">
                Model: {fc24?.model_name || 'XGBoost Residual'}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Main Charts & Spatial Map Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ForecastChart
          forecasts={forecasts}
          currentValue={currentObs?.value}
          pollutant={pollutant}
        />

        <div>
          <div className="bg-white p-4 rounded border border-[#D1DFD4] shadow-sm mb-2">
            <h3 className="text-sm font-bold text-[#0D2818] tracking-tight">
              Neighbourhood Spatial Overview & Fire Corridors
            </h3>
            <p className="text-xs text-[#4A6B56]">
              Ground monitoring stations across Delhi-NCR and Punjab with upwind agricultural fire indicators
            </p>
          </div>
          <PollutionMap
            stations={stations}
            selectedStationId={selectedStationId}
            onSelectStation={onSelectStation}
            fires={fires}
            latestObservations={latestMapObs}
          />
        </div>
      </div>

      {/* Pollution Peak & Recovery Analysis Section */}
      {peakRecovery && (
        <div className="bg-white p-5 rounded border border-[#D1DFD4] shadow-sm">
          <div className="flex items-center gap-2 border-b border-[#EBF3EA] pb-3 mb-4">
            <TrendingUp className="w-4 h-4 text-[#1B4332]" />
            <h3 className="text-xs font-bold text-[#1B4332] uppercase tracking-wide">
              Pollution Peak & Recovery Analysis (Supported Horizons: 1h, 3h, 6h, 24h)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-3 rounded bg-[#F8FAF8] border border-[#EBF3EA]">
              <span className="text-[#4A6B56] text-[11px] font-sans">Predicted Peak PM2.5</span>
              <div className="text-xl font-bold text-[#7F1D1D] mt-1">
                {peakRecovery.max_predicted_pm25.toFixed(1)} µg/m³
              </div>
              <div className="text-[10px] text-[#4A6B56] mt-0.5 font-sans">
                Peak Horizon: +{peakRecovery.predicted_peak_horizon_hours}h
              </div>
            </div>

            <div className="p-3 rounded bg-[#F8FAF8] border border-[#EBF3EA]">
              <span className="text-[#4A6B56] text-[11px] font-sans">Peak Δ from Latest</span>
              <div className="text-xl font-bold text-[#0D2818] mt-1">
                {peakRecovery.concentration_change_from_latest_pm25 > 0 ? `+${peakRecovery.concentration_change_from_latest_pm25}` : peakRecovery.concentration_change_from_latest_pm25} µg/m³
              </div>
              <div className="text-[10px] text-[#4A6B56] mt-0.5 font-sans">
                Base: {peakRecovery.latest_observed_pm25.toFixed(1)} µg/m³
              </div>
            </div>

            <div className="p-3 rounded bg-[#F8FAF8] border border-[#EBF3EA]">
              <span className="text-[#4A6B56] text-[11px] font-sans">Subsequent Trend</span>
              <div className="text-sm font-bold text-[#1B4332] mt-1 font-sans">
                {peakRecovery.subsequent_trend}
              </div>
              <div className="text-[10px] text-[#4A6B56] mt-0.5">
                Decline rate: ~{peakRecovery.decline_rate_pm25_per_hour} µg/m³/h
              </div>
            </div>

            <div className="p-3 rounded bg-[#F8FAF8] border border-[#EBF3EA]">
              <span className="text-[#4A6B56] text-[11px] font-sans">Recovery Status</span>
              <div className="text-sm font-bold text-[#B45309] mt-1 font-sans">
                {peakRecovery.recovery_status}
              </div>
              <div className="text-[10px] text-[#4A6B56] mt-0.5 font-sans">
                Threshold: &le; {peakRecovery.recovery_threshold_pm25} µg/m³
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#EBF3EA] text-[11px] text-[#4A6B56] space-y-1">
            <p>
              <strong>Recovery Criterion:</strong> {peakRecovery.recovery_criterion}
            </p>
            <p>
              <strong>Historical Context:</strong> {peakRecovery.historical_progression_comparison}
            </p>
          </div>
        </div>
      )}

      {/* Detailed Uncertainty Breakdown for 1h Horizon */}
      {forecasts.length > 0 && (
        <div className="bg-white p-4 rounded border border-[#D1DFD4] shadow-sm">
          <h4 className="text-xs font-bold text-[#0D2818] uppercase tracking-wide mb-2">
            Held-Out Uncertainty Calibration (+1 Hour Model)
          </h4>
          <UncertaintyBadge
            calibrated={forecasts[0].uncertainty_calibrated}
            lower80={forecasts[0].lower_bound_80}
            upper80={forecasts[0].upper_bound_80}
            lower95={forecasts[0].lower_bound_95}
            upper95={forecasts[0].upper_bound_95}
          />
        </div>
      )}
    </div>
  );
};
