import React, { useState } from 'react';
import { Station, ScenarioResponse, PollutantType } from '../types';
import { compareScenarios } from '../services/api';
import { Sliders, AlertTriangle, ArrowRight, RotateCcw, CheckCircle } from 'lucide-react';

interface ScenarioViewProps {
  stations: Station[];
  selectedStationId: string;
  onSelectStation: (id: string) => void;
}

export const ScenarioView: React.FC<ScenarioViewProps> = ({
  stations,
  selectedStationId,
  onSelectStation
}) => {
  const [pollutant, setPollutant] = useState<PollutantType>('PM2.5');
  const [horizon, setHorizon] = useState<number>(1);

  // Sliders state
  const [windSpeedMult, setWindSpeedMult] = useState<number>(1.0);
  const [windDirShift, setWindDirShift] = useState<number>(0);
  const [trafficReduc, setTrafficReduc] = useState<number>(0);
  const [fireMult, setFireMult] = useState<number>(1.0);
  const [humidityShift, setHumidityShift] = useState<number>(0);

  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<ScenarioResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRunScenario = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await compareScenarios({
        location_id: selectedStationId,
        pollutant,
        horizon_hours: horizon,
        wind_speed_multiplier: windSpeedMult,
        wind_direction_shift_deg: windDirShift,
        traffic_reduction_pct: trafficReduc,
        fire_activity_multiplier: fireMult,
        humidity_shift_pct: humidityShift
      });
      setResult(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Scenario calculation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setWindSpeedMult(1.0);
    setWindDirShift(0);
    setTrafficReduc(0);
    setFireMult(1.0);
    setHumidityShift(0);
    setResult(null);
  };

  const selectedStation = stations.find((s) => s.id === selectedStationId) || stations[0];

  return (
    <div className="space-y-6">
      {/* Standardized Module Header */}
      <div className="bg-white p-5 rounded-2xl border border-[#D1DFD4] shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#EBF3EA] border border-[#D1DFD4] flex items-center justify-center text-[#133E26] shrink-0">
            <Sliders className="w-5 h-5 text-[#133E26]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight text-[#133E26] font-sans">
                Hypothetical Environmental Scenario Laboratory
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-md bg-[#EBF3EA] text-[#133E26] border border-[#85A98F]">
                Sensitivity Lab
              </span>
            </div>
            <p className="text-xs text-[#4A6B56] mt-0.5">
              Simulate statistical model sensitivity under hypothetical meteorological and anthropogenic perturbations
            </p>
          </div>
        </div>
      </div>

      {/* Mandatory Causal Caveat Banner */}
      <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3.5 rounded-2xl text-xs flex items-start gap-2.5 shadow-xs">
        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-700" />
        <div className="leading-relaxed">
          <strong className="font-bold">Strict Scientific Distinction:</strong> Outputs represent statistical model sensitivity conditioned on historical correlations. They do <em>NOT</em> represent validated hydrodynamic physical causal simulations.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Column */}
        <div className="bg-white p-5 rounded-2xl border border-[#D1DFD4] shadow-xs space-y-4">
          <div className="flex justify-between items-center border-b border-[#EBF3EA] pb-2">
            <h3 className="text-xs font-bold text-[#133E26] uppercase tracking-wide">
              Scenario Perturbations
            </h3>
            <button
              onClick={handleReset}
              className="text-xs text-[#4A6B56] hover:text-[#0D2818] flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          </div>

          {/* Location & Horizon */}
          <div>
            <label className="block text-[11px] font-semibold text-[#4A6B56] uppercase mb-1">
              Neighbourhood
            </label>
            <select
              value={selectedStationId}
              onChange={(e) => onSelectStation(e.target.value)}
              className="w-full text-xs p-1.5 rounded border border-[#D1DFD4] bg-[#F8FAF8] text-[#0D2818]"
            >
              {stations.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-[#4A6B56] uppercase mb-1">
                Pollutant
              </label>
              <select
                value={pollutant}
                onChange={(e) => setPollutant(e.target.value as any)}
                className="w-full text-xs p-1.5 rounded border border-[#D1DFD4] bg-[#F8FAF8] text-[#0D2818]"
              >
                <option value="PM2.5">PM2.5</option>
                <option value="PM10">PM10</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#4A6B56] uppercase mb-1">
                Horizon
              </label>
              <select
                value={horizon}
                onChange={(e) => setHorizon(Number(e.target.value))}
                className="w-full text-xs p-1.5 rounded border border-[#D1DFD4] bg-[#F8FAF8] text-[#0D2818]"
              >
                <option value={1}>+1 Hour</option>
                <option value={3}>+3 Hours</option>
                <option value={6}>+6 Hours</option>
                <option value={24}>+24 Hours</option>
              </select>
            </div>
          </div>

          {/* Slider 1: Wind Speed */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[#0D2818] font-medium">Wind Speed Multiplier</span>
              <span className="font-mono text-[#133E26] font-bold">{windSpeedMult.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.1"
              value={windSpeedMult}
              onChange={(e) => setWindSpeedMult(Number(e.target.value))}
              className="w-full accent-[#1B4332]"
            />
            <div className="flex justify-between text-[10px] text-[#4A6B56]">
              <span>0.5x (Stagnant)</span>
              <span>1.0x (Observed)</span>
              <span>2.5x (Strong Ventilation)</span>
            </div>
          </div>

          {/* Slider 2: Wind Direction Shift */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[#0D2818] font-medium">Wind Direction Shift</span>
              <span className="font-mono text-[#133E26] font-bold">
                {windDirShift > 0 ? `+${windDirShift}°` : `${windDirShift}°`}
              </span>
            </div>
            <input
              type="range"
              min="-90"
              max="90"
              step="15"
              value={windDirShift}
              onChange={(e) => setWindDirShift(Number(e.target.value))}
              className="w-full accent-[#1B4332]"
            />
            <div className="flex justify-between text-[10px] text-[#4A6B56]">
              <span>-90° (Easterly)</span>
              <span>0° (As Observed)</span>
              <span>+90° (Northerly)</span>
            </div>
          </div>

          {/* Slider 3: Traffic Reduction */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[#0D2818] font-medium">Traffic Flow Reduction</span>
              <span className="font-mono text-[#133E26] font-bold">-{trafficReduc}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="5"
              value={trafficReduc}
              onChange={(e) => setTrafficReduc(Number(e.target.value))}
              className="w-full accent-[#1B4332]"
            />
            <div className="flex justify-between text-[10px] text-[#4A6B56]">
              <span>0% (No restriction)</span>
              <span>25% (Odd-Even policy)</span>
              <span>50% (Lockdown)</span>
            </div>
          </div>

          {/* Slider 4: Fire Multiplier */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[#0D2818] font-medium">Agricultural Fire Activity</span>
              <span className="font-mono text-[#133E26] font-bold">{fireMult.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="3.0"
              step="0.2"
              value={fireMult}
              onChange={(e) => setFireMult(Number(e.target.value))}
              className="w-full accent-[#1B4332]"
            />
            <div className="flex justify-between text-[10px] text-[#4A6B56]">
              <span>0.0x (Zero burning)</span>
              <span>1.0x (Observed FIRMS)</span>
              <span>3.0x (Intense stubble burning)</span>
            </div>
          </div>

          {/* Slider 5: Humidity Shift */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[#0D2818] font-medium">Relative Humidity Shift</span>
              <span className="font-mono text-[#133E26] font-bold">
                {humidityShift > 0 ? `+${humidityShift}%` : `${humidityShift}%`}
              </span>
            </div>
            <input
              type="range"
              min="-20"
              max="20"
              step="5"
              value={humidityShift}
              onChange={(e) => setHumidityShift(Number(e.target.value))}
              className="w-full accent-[#1B4332]"
            />
            <div className="flex justify-between text-[10px] text-[#4A6B56]">
              <span>-20% (Dry air)</span>
              <span>0% (Current)</span>
              <span>+20% (Fog / Inversion risk)</span>
            </div>
          </div>

          <button
            onClick={handleRunScenario}
            disabled={loading}
            className="w-full py-2.5 rounded bg-[#133E26] text-white text-xs font-semibold hover:bg-[#0D2818] transition-colors disabled:opacity-50"
          >
            {loading ? 'Evaluating Scenario...' : 'Simulate Hypothetical Scenario'}
          </button>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-2 space-y-4">
          {errorMsg && (
            <div className="bg-[#FEE2E2] border border-[#FCA5A5] text-[#7F1D1D] p-3 rounded text-xs">
              {errorMsg}
            </div>
          )}

          {result ? (
            <div className="space-y-4">
              {/* Comparison Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Baseline Card */}
                <div className="bg-white p-5 rounded-2xl border border-[#D1DFD4] shadow-xs">
                  <div className="text-[11px] font-semibold text-[#4A6B56] uppercase">
                    Baseline Forecast (+{result.horizon_hours}h)
                  </div>
                  <div className="text-3xl font-extrabold font-mono text-[#0D2818] mt-2">
                    {result.baseline_forecast.toFixed(1)} <span className="text-xs font-normal text-[#4A6B56]">µg/m³</span>
                  </div>
                  <div className="text-[11px] text-[#4A6B56] mt-2">
                    Forecast using actual, unperturbed environmental conditions.
                  </div>
                </div>

                {/* Scenario Card */}
                <div className="bg-white p-5 rounded border border-[#1B4332] shadow-sm bg-[#EBF3EA]/30">
                  <div className="text-[11px] font-semibold text-[#133E26] uppercase">
                    Hypothetical Scenario Forecast (+{result.horizon_hours}h)
                  </div>
                  <div className="text-3xl font-extrabold font-mono text-[#133E26] mt-2">
                    {result.scenario_forecast.toFixed(1)} <span className="text-xs font-normal text-[#133E26]">µg/m³</span>
                  </div>
                  <div className="text-[11px] font-mono mt-2 flex items-center gap-2">
                    <span className="text-[#4A6B56]">Model Delta:</span>
                    <strong className={result.delta_concentration <= 0 ? 'text-[#2D6A4F]' : 'text-[#7F1D1D]'}>
                      {result.delta_concentration > 0 ? `+${result.delta_concentration}` : result.delta_concentration} µg/m³
                      {' '}({result.delta_percentage > 0 ? `+${result.delta_percentage}` : result.delta_percentage}%)
                    </strong>
                  </div>
                </div>
              </div>

              {/* Counterfactual Assumptions Box */}
              <div className="bg-white p-5 rounded-2xl border border-[#D1DFD4] shadow-xs">
                <h4 className="text-xs font-bold text-[#0D2818] uppercase tracking-wide mb-2">
                  Explicit Counterfactual Assumptions in this Scenario:
                </h4>
                <ul className="list-disc pl-5 text-xs text-[#4A6B56] space-y-1">
                  {result.counterfactual_assumptions.map((assump, idx) => (
                    <li key={idx} className="font-mono text-[11px] text-[#0D2818]">{assump}</li>
                  ))}
                </ul>

                <div className="mt-4 p-3 rounded bg-[#F8FAF8] border border-[#EBF3EA] text-[11px] text-[#4A6B56] leading-relaxed">
                  <strong>Formal Limitation:</strong> {result.disclaimer}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-2xl border border-[#D1DFD4] shadow-xs text-center">
              <Sliders className="w-8 h-8 text-[#85A98F] mx-auto mb-3" />
              <h3 className="text-sm font-bold text-[#0D2818]">No Scenario Simulated Yet</h3>
              <p className="text-xs text-[#4A6B56] max-w-md mx-auto mt-1">
                Adjust the environmental sliders on the left (e.g. increase wind speed to test dispersion, or reduce traffic volume) and click "Simulate Hypothetical Scenario".
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
