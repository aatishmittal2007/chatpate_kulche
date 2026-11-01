import React, { useState, useEffect } from 'react';
import { DiwaliProgressionPoint, YearProgression } from '../types';
import { fetchDiwaliProgression } from '../services/api';
import { ProgressionChart } from '../charts/ProgressionChart';
import { Calendar, AlertTriangle, Info, TrendingUp } from 'lucide-react';

export const ProgressionView: React.FC = () => {
  const [pollutant, setPollutant] = useState<'PM2.5' | 'PM10'>('PM2.5');
  const [baselineProfile, setBaselineProfile] = useState<DiwaliProgressionPoint[]>([]);
  const [historicalYears, setHistoricalYears] = useState<YearProgression[]>([]);
  const [peakDay, setPeakDay] = useState<number>(0);
  const [totalObs, setTotalObs] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    fetchDiwaliProgression().then((data) => {
      setBaselineProfile(data.baseline_profile);
      setHistoricalYears(data.historical_years);
      setPeakDay(data.peak_relative_day);
      setTotalObs(data.total_observations_analyzed);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [pollutant]);

  const preDiwaliPoints = baselineProfile.filter((p) => p.relative_day < 0);
  const diwaliDayPoints = baselineProfile.filter((p) => p.relative_day === 0);
  const postDiwaliPoints = baselineProfile.filter((p) => p.relative_day > 0);

  const preMedian = preDiwaliPoints.length ? Math.round(preDiwaliPoints.reduce((a, b) => a + b.median, 0) / preDiwaliPoints.length) : '—';
  const diwaliMedian = diwaliDayPoints.length ? diwaliDayPoints[0].median : '—';
  const postMedian = postDiwaliPoints.length ? Math.round(postDiwaliPoints.reduce((a, b) => a + b.median, 0) / postDiwaliPoints.length) : '—';

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded border border-[#D1DFD4] shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-base font-bold text-[#0D2818] tracking-tight flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#1B4332]" />
            Diwali-Relative Historical Pollution Progression
          </h2>
          <p className="text-xs text-[#4A6B56] mt-0.5">
            Synchronized calendar alignment across multiple years: Day -30 to Day +30 relative to festival date
          </p>
        </div>

        {/* Pollutant selector */}
        <div className="flex rounded border border-[#D1DFD4] p-0.5 bg-[#F8FAF8] text-xs">
          <button
            onClick={() => setPollutant('PM2.5')}
            className={`px-3 py-1 rounded font-medium ${
              pollutant === 'PM2.5' ? 'bg-[#1B4332] text-white' : 'text-[#4A6B56]'
            }`}
          >
            PM2.5
          </button>
          <button
            onClick={() => setPollutant('PM10')}
            className={`px-3 py-1 rounded font-medium ${
              pollutant === 'PM10' ? 'bg-[#1B4332] text-white' : 'text-[#4A6B56]'
            }`}
          >
            PM10
          </button>
        </div>
      </div>

      {/* Period Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded border border-[#D1DFD4] shadow-sm">
          <div className="text-[11px] font-semibold text-[#4A6B56] uppercase">Pre-Diwali Baseline (Day -30 to -1)</div>
          <div className="text-2xl font-bold font-mono text-[#0D2818] mt-2">
            {preMedian} <span className="text-xs font-normal text-[#4A6B56]">µg/m³</span>
          </div>
          <p className="text-[11px] text-[#4A6B56] mt-1">
            Represents autumn seasonal buildup influenced by cooling temperatures and early stubble fires.
          </p>
        </div>

        <div className="bg-white p-4 rounded border border-[#7F1D1D]/30 shadow-sm bg-[#FEE2E2]/20">
          <div className="text-[11px] font-semibold text-[#7F1D1D] uppercase">Diwali Festival Episode (Day 0)</div>
          <div className="text-2xl font-bold font-mono text-[#7F1D1D] mt-2">
            {diwaliMedian} <span className="text-xs font-normal text-[#7F1D1D]">µg/m³</span>
          </div>
          <p className="text-[11px] text-[#4A6B56] mt-1">
            Typical peak concentration occurring between 18:00 on Day 0 and 06:00 on Day +1.
          </p>
        </div>

        <div className="bg-white p-4 rounded border border-[#D1DFD4] shadow-sm">
          <div className="text-[11px] font-semibold text-[#4A6B56] uppercase">Post-Diwali Dispersion (Day +1 to +30)</div>
          <div className="text-2xl font-bold font-mono text-[#0D2818] mt-2">
            {postMedian} <span className="text-xs font-normal text-[#4A6B56]">µg/m³</span>
          </div>
          <p className="text-[11px] text-[#4A6B56] mt-1">
            Gradual relaxation trajectory strongly conditioned by boundary-layer height and ventilation.
          </p>
        </div>
      </div>

      {/* Progression Recharts Chart */}
      <ProgressionChart
        baselineProfile={baselineProfile}
        historicalYears={historicalYears}
        pollutant={pollutant}
      />

      {/* Scientific Notice Card */}
      <div className="bg-[#F8FAF8] border border-[#D1DFD4] rounded p-4 text-xs text-[#0D2818]">
        <div className="flex items-center gap-2 font-bold text-[#1B4332] mb-1.5">
          <Info className="w-4 h-4 text-[#2D6A4F]" />
          <span>Scientific Ground Rules & Multi-Year Caveats</span>
        </div>
        <ul className="list-disc pl-5 space-y-1 text-[#4A6B56]">
          <li>
            <strong>No Linear Multi-Year Extrapolation:</strong> Three or five years of historical festival data do NOT establish a deterministic long-term trend. Future progression depends heavily on shifting Diwali dates (lunar calendar) and prevailing meteorology.
          </li>
          <li>
            <strong>Meteorological Conditioning:</strong> Stagnant wind (&lt; 1.5 m/s) and shallow inversion heights can double concentrations even with identical emissions.
          </li>
          <li>
            <strong>Total Analyzed Observations:</strong> {totalObs} observations validated and aligned chronologically.
          </li>
        </ul>
      </div>

      {/* Statistical Table Breakdown */}
      <div className="bg-white rounded border border-[#D1DFD4] shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-[#EBF3EA] border-b border-[#D1DFD4]">
          <h3 className="text-xs font-bold text-[#1B4332] uppercase tracking-wide">
            Detailed Progression Statistics by Relative Day
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs text-left">
            <thead className="bg-[#F8FAF8] text-[#4A6B56] border-b border-[#D1DFD4]">
              <tr>
                <th className="px-4 py-2 font-semibold">Relative Day</th>
                <th className="px-4 py-2 font-semibold">Phase</th>
                <th className="px-4 py-2 font-semibold">Median ({pollutant})</th>
                <th className="px-4 py-2 font-semibold">Mean</th>
                <th className="px-4 py-2 font-semibold">25th Percentile (Q1)</th>
                <th className="px-4 py-2 font-semibold">75th Percentile (Q3)</th>
                <th className="px-4 py-2 font-semibold">Valid Obs Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBF3EA]">
              {baselineProfile.map((pt) => {
                const phase = pt.relative_day < 0 ? 'Pre-Diwali' : pt.relative_day === 0 ? 'Diwali Day' : 'Post-Diwali';
                const isDiwali = pt.relative_day === 0;
                return (
                  <tr key={pt.relative_day} className={isDiwali ? 'bg-[#FEE2E2]/30 font-semibold' : 'hover:bg-[#F8FAF8]'}>
                    <td className="px-4 py-2 font-mono">
                      {pt.relative_day === 0 ? 'Day 0' : `Day ${pt.relative_day > 0 ? `+${pt.relative_day}` : pt.relative_day}`}
                    </td>
                    <td className="px-4 py-2 text-[#4A6B56]">{phase}</td>
                    <td className="px-4 py-2 font-mono text-[#0D2818]">{pt.median} µg/m³</td>
                    <td className="px-4 py-2 font-mono text-[#4A6B56]">{pt.mean} µg/m³</td>
                    <td className="px-4 py-2 font-mono text-[#4A6B56]">{pt.q25} µg/m³</td>
                    <td className="px-4 py-2 font-mono text-[#4A6B56]">{pt.q75} µg/m³</td>
                    <td className="px-4 py-2 font-mono text-[#4A6B56]">{pt.count}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
