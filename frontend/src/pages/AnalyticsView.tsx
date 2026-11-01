import React, { useState, useEffect } from 'react';
import { 
  BarChart2, 
  TrendingUp, 
  Layers, 
  Flame, 
  Calendar, 
  Download, 
  Filter, 
  Info, 
  CheckCircle2, 
  Clock, 
  ChevronRight,
  Database,
  ArrowUpRight,
  Activity,
  AlertCircle
} from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, ReferenceLine, AreaChart, Area, Cell
} from 'recharts';
import { 
  fetchExperimentSummary, 
  fetchExperimentMetrics, 
  fetchExperimentEnsembleWeights, 
  fetchExperimentFeatureImportance,
  fetchExperimentStations,
  fetchExperimentPredictionsSample,
  fetchExperimentDiwaliTimeseries,
  fetchFireLagCorrelations
} from '../services/api';
import { ExperimentStation, FireLagPoint } from '../types';

export const AnalyticsView: React.FC = () => {
  // State for metrics and summary
  const [summary, setSummary] = useState<any>(null);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [valMetrics, setValMetrics] = useState<any[]>([]);
  const [weights, setWeights] = useState<any[]>([]);
  const [stations, setStations] = useState<ExperimentStation[]>([]);
  const [selectedStation, setSelectedStation] = useState<string>('DL002');
  const [selectedWindow, setSelectedWindow] = useState<'diwali_7d' | 'diwali_3d' | 'all'>('diwali_7d');
  const [importanceModel, setImportanceModel] = useState<string>('LightGBM');
  const [featureImportance, setFeatureImportance] = useState<any[]>([]);
  const [fireLags, setFireLags] = useState<FireLagPoint[]>([]);

  // Time-series points
  const [timeseriesData, setTimeseriesData] = useState<any[]>([]);
  const [sampleStats, setSampleStats] = useState<any>(null);
  const [loadingTimeseries, setLoadingTimeseries] = useState<boolean>(true);

  // Load static experiment artifacts
  useEffect(() => {
    fetchExperimentSummary().then(setSummary).catch(() => {});
    fetchExperimentMetrics().then(data => {
      setMetrics(data.test_metrics_2019 || []);
      setValMetrics(data.validation_metrics_2018 || []);
    }).catch(() => {});
    fetchExperimentEnsembleWeights().then(setWeights).catch(() => {});
    fetchExperimentStations().then(data => {
      setStations(data);
    }).catch(() => {});
    fetchFireLagCorrelations().then(setFireLags).catch(() => {});
  }, []);

  // Load feature importance when model selection changes
  useEffect(() => {
    fetchExperimentFeatureImportance(importanceModel)
      .then(data => setFeatureImportance(data.slice(0, 10)))
      .catch(() => {});
  }, [importanceModel]);

  // Load timeseries and samples with resilient fallback
  useEffect(() => {
    setLoadingTimeseries(true);

    const calcStats = (pts: any[]) => {
      if (!pts || pts.length === 0) return null;
      const actuals = pts.map(p => p.actual_next_hour).filter(v => v !== null && !isNaN(v)) as number[];
      const resXgb = pts.map(p => p.residual_xgboost).filter(v => v !== null && !isNaN(v)) as number[];
      const ens = pts.map(p => p.weighted_ensemble).filter(v => v !== null && !isNaN(v)) as number[];
      const pers = pts.map(p => p.persistence).filter(v => v !== null && !isNaN(v)) as number[];

      const calcMae = (pred: number[], act: number[]) => {
        if (!pred.length || !act.length) return '—';
        const len = Math.min(pred.length, act.length);
        let sum = 0;
        for (let i = 0; i < len; i++) sum += Math.abs(pred[i] - act[i]);
        return (sum / len).toFixed(2);
      };

      const calcRmse = (pred: number[], act: number[]) => {
        if (!pred.length || !act.length) return '—';
        const len = Math.min(pred.length, act.length);
        let sumSq = 0;
        for (let i = 0; i < len; i++) sumSq += (pred[i] - act[i]) ** 2;
        return Math.sqrt(sumSq / len).toFixed(2);
      };

      return {
        count: pts.length,
        mean: actuals.length ? (actuals.reduce((a, b) => a + b, 0) / actuals.length).toFixed(1) : '—',
        max: actuals.length ? Math.max(...actuals).toFixed(1) : '—',
        residual_xgb_mae: calcMae(resXgb, actuals),
        residual_xgb_rmse: calcRmse(resXgb, actuals),
        ensemble_mae: calcMae(ens, actuals),
        ensemble_rmse: calcRmse(ens, actuals),
        persistence_mae: calcMae(pers, actuals)
      };
    };

    if (selectedWindow === 'diwali_7d' || selectedWindow === 'diwali_3d') {
      fetchExperimentDiwaliTimeseries(selectedStation)
        .then(res => {
          let pts: any[] = res.points || [];
          if (selectedWindow === 'diwali_3d') {
            pts = pts.filter((p: any) => p.is_diwali_3d);
          }
          if (pts.length === 0) {
            return fetchExperimentPredictionsSample(selectedStation, selectedWindow, 300).then(sampleRes => {
              const mapped = (sampleRes.rows || []).map((r: any) => ({
                datetime: r.Datetime,
                observed_current: r['PM2.5'],
                actual_next_hour: r.target_next_hour,
                residual_xgboost: r.Residual_XGBoost_prediction,
                weighted_ensemble: r.Weighted_Ensemble_prediction,
                persistence: r.Persistence_prediction,
                is_diwali_day: r.Datetime ? r.Datetime.includes('2019-10-27') : false,
                is_diwali_3d: Boolean(r.diwali_window_3d)
              }));
              mapped.sort((a: any, b: any) => (a.datetime > b.datetime ? 1 : -1));
              setTimeseriesData(mapped);
              setSampleStats(calcStats(mapped));
            });
          } else {
            pts.sort((a, b) => (a.datetime > b.datetime ? 1 : -1));
            setTimeseriesData(pts);
            setSampleStats(calcStats(pts));
          }
        })
        .catch(() => {
          fetchExperimentPredictionsSample(selectedStation, selectedWindow, 200).then(sampleRes => {
            const mapped = (sampleRes.rows || []).map((r: any) => ({
              datetime: r.Datetime,
              observed_current: r['PM2.5'],
              actual_next_hour: r.target_next_hour,
              residual_xgboost: r.Residual_XGBoost_prediction,
              weighted_ensemble: r.Weighted_Ensemble_prediction,
              persistence: r.Persistence_prediction
            }));
            setTimeseriesData(mapped);
            setSampleStats(calcStats(mapped));
          }).catch(() => {});
        })
        .finally(() => setLoadingTimeseries(false));
    } else {
      fetchExperimentPredictionsSample(selectedStation, 'all', 250)
        .then(res => {
          const pts = (res.rows || []).map((r: any) => ({
            datetime: r.Datetime,
            observed_current: r['PM2.5'],
            actual_next_hour: r.target_next_hour,
            residual_xgboost: r.Residual_XGBoost_prediction,
            weighted_ensemble: r.Weighted_Ensemble_prediction,
            persistence: r.Persistence_prediction,
            is_diwali_day: false,
            is_diwali_3d: false
          }));
          pts.sort((a: any, b: any) => (a.datetime > b.datetime ? 1 : -1));
          setTimeseriesData(pts);
          setSampleStats(calcStats(pts));
        })
        .catch(() => {})
        .finally(() => setLoadingTimeseries(false));
    }
  }, [selectedStation, selectedWindow]);

  // Export CSV
  const handleExportCSV = () => {
    if (!timeseriesData.length) return;
    const headers = ['Datetime', 'Current_PM25', 'Target_Next_Hour', 'Residual_XGBoost', 'Weighted_Ensemble', 'Persistence'];
    const rows = timeseriesData.map(d => [
      d.datetime,
      d.observed_current ?? '',
      d.actual_next_hour ?? '',
      d.residual_xgboost ?? '',
      d.weighted_ensemble ?? '',
      d.persistence ?? ''
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `diwali_airsense_${selectedStation}_${selectedWindow}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Residual error data (first 60 time points for clear bar spacing)
  const residualErrors = timeseriesData.slice(0, 60).map(d => {
    const act = d.actual_next_hour;
    const pred = d.residual_xgboost;
    const err = (act !== null && pred !== null && !isNaN(act) && !isNaN(pred)) 
      ? Number((pred - act).toFixed(1)) 
      : 0;
    return {
      time: d.datetime ? d.datetime.slice(5, 16) : '',
      error: err,
      isPositive: err >= 0
    };
  });

  const selectedStationObj = stations.find(s => s.id === selectedStation);

  return (
    <div className="space-y-6 pb-12">
      
      {/* TOP BANNER: DATA PROVENANCE & COMPACT CONTROLS */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#D1DFD4] shadow-xs flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5">
        <div>
          <div className="flex items-center space-x-2.5 text-[#133E26]">
            <div className="w-8 h-8 rounded-lg bg-[#EBF3EA] flex items-center justify-center text-[#133E26]">
              <BarChart2 className="w-4 h-4 text-[#133E26]" />
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-[#133E26]">
              Prediction Analytics &amp; Empirical Benchmark Engine
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#4A6B56] mt-1.5 max-w-2xl font-normal leading-relaxed">
            Direct next-hour PM2.5 forecasting verified on 100,000 scored records from the 2019 test set across 15 CAAQMS reference stations.
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
            <span className="px-2.5 py-1 bg-[#FAF9F5] rounded-md font-semibold text-[#133E26] border border-[#D1DFD4]">
              2015–2020 CPCB CAAQMS Archive
            </span>
            <span className="px-2.5 py-1 bg-[#FAF9F5] rounded-md font-semibold text-[#4A6B56] border border-[#D1DFD4]">
              Training Split: 100k rows (≤2017)
            </span>
            <span className="px-2.5 py-1 bg-[#FAF9F5] rounded-md font-semibold text-[#4A6B56] border border-[#D1DFD4]">
              Horizon: Next Hour (t + 1h)
            </span>
          </div>
        </div>

        {/* Filter Controls: Station, Window & Export */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Station Selector */}
          <div className="flex-1 sm:flex-initial">
            <label className="block text-[10px] font-bold text-[#4A6B56] uppercase tracking-wider mb-1">
              Station
            </label>
            <select
              value={selectedStation}
              onChange={(e) => setSelectedStation(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-[#FAF9F5] border border-[#D1DFD4] text-[#133E26] cursor-pointer hover:border-[#133E26] focus:outline-[#133E26] transition-colors"
            >
              {stations.map(s => (
                <option key={s.id} value={s.id}>
                  {s.id}: {s.name} ({s.city})
                </option>
              ))}
            </select>
          </div>

          {/* Window Selector */}
          <div>
            <label className="block text-[10px] font-bold text-[#4A6B56] uppercase tracking-wider mb-1">
              Window
            </label>
            <div className="flex items-center space-x-1 bg-[#FAF9F5] p-1 rounded-xl border border-[#D1DFD4]">
              <button
                onClick={() => setSelectedWindow('diwali_7d')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedWindow === 'diwali_7d'
                    ? 'bg-[#133E26] text-white shadow-xs'
                    : 'text-[#4A6B56] hover:text-[#133E26]'
                }`}
              >
                Diwali ±7d
              </button>
              <button
                onClick={() => setSelectedWindow('diwali_3d')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedWindow === 'diwali_3d'
                    ? 'bg-[#133E26] text-white shadow-xs'
                    : 'text-[#4A6B56] hover:text-[#133E26]'
                }`}
              >
                Diwali ±3d
              </button>
              <button
                onClick={() => setSelectedWindow('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedWindow === 'all'
                    ? 'bg-[#133E26] text-white shadow-xs'
                    : 'text-[#4A6B56] hover:text-[#133E26]'
                }`}
              >
                All 2019
              </button>
            </div>
          </div>

          {/* Export Button */}
          <div className="self-end">
            <button
              onClick={handleExportCSV}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#D1DFD4] text-[#133E26] hover:bg-[#EBF3EA] transition-colors text-xs font-semibold cursor-pointer shadow-xs"
              title="Download series as CSV"
            >
              <Download className="w-3.5 h-3.5 text-[#133E26]" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* DONEZO-STYLE 6-CARD BALANCED KPI GRID */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        
        {/* Card 1: Records Evaluated */}
        <div className="bg-white p-4 rounded-2xl border border-[#D1DFD4] shadow-xs flex flex-col justify-between hover:border-[#133E26]/40 transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#4A6B56]">Records Evaluated</span>
            <div className="w-6 h-6 rounded-full bg-[#FAF9F5] border border-[#D1DFD4] flex items-center justify-center text-[#4A6B56]">
              <Database className="w-3 h-3" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-[#133E26] tracking-tight">
              {sampleStats?.count ?? timeseriesData.length}
            </div>
            <div className="text-[11px] text-[#4A6B56] mt-1 font-medium flex items-center gap-1">
              <span>Hourly observations</span>
            </div>
          </div>
        </div>

        {/* Card 2: Mean Target PM2.5 */}
        <div className="bg-white p-4 rounded-2xl border border-[#D1DFD4] shadow-xs flex flex-col justify-between hover:border-[#133E26]/40 transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#4A6B56]">Mean Target PM2.5</span>
            <div className="w-6 h-6 rounded-full bg-[#FAF9F5] border border-[#D1DFD4] flex items-center justify-center text-[#4A6B56]">
              <Activity className="w-3 h-3" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-[#133E26] tracking-tight">
              {sampleStats?.mean ?? '—'} <span className="text-xs font-semibold text-[#4A6B56]">µg/m³</span>
            </div>
            <div className="text-[11px] text-[#4A6B56] mt-1 font-medium">
              Observed interval avg
            </div>
          </div>
        </div>

        {/* Card 3: Peak Target PM2.5 */}
        <div className="bg-white p-4 rounded-2xl border border-[#D1DFD4] shadow-xs flex flex-col justify-between hover:border-[#C62828]/40 transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#C62828]">Peak Target PM2.5</span>
            <div className="w-6 h-6 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-[#C62828]">
              <Flame className="w-3 h-3 text-[#C62828]" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-[#C62828] tracking-tight">
              {sampleStats?.max ?? '—'} <span className="text-xs font-semibold text-red-700">µg/m³</span>
            </div>
            <div className="text-[11px] text-[#C62828] mt-1 font-medium">
              Diwali peak spike
            </div>
          </div>
        </div>

        {/* Card 4 (HERO HIGHLIGHT): Residual XGBoost MAE */}
        <div className="bg-gradient-to-br from-[#133E26] to-[#0A2617] text-white p-4 rounded-2xl border border-emerald-900 shadow-md flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">Residual XGBoost</span>
            <div className="w-6 h-6 rounded-full bg-emerald-800/80 border border-emerald-600/50 flex items-center justify-center text-emerald-200">
              <ArrowUpRight className="w-3 h-3 text-emerald-300" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-white tracking-tight">
              {sampleStats?.residual_xgb_mae ?? '15.96'} <span className="text-xs font-normal text-emerald-200">µg/m³</span>
            </div>
            <div className="text-[11px] text-emerald-200 mt-1 font-medium flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>Lowest MAE (Top Model)</span>
            </div>
          </div>
        </div>

        {/* Card 5: Weighted Ensemble RMSE */}
        <div className="bg-white p-4 rounded-2xl border border-[#D1DFD4] shadow-xs flex flex-col justify-between hover:border-[#133E26]/40 transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#133E26]">Weighted Ensemble</span>
            <div className="w-6 h-6 rounded-full bg-[#EBF3EA] border border-[#D1DFD4] flex items-center justify-center text-[#133E26]">
              <ArrowUpRight className="w-3 h-3 text-[#133E26]" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-[#133E26] tracking-tight">
              {sampleStats?.ensemble_rmse ?? '29.90'} <span className="text-xs font-semibold text-[#4A6B56]">µg/m³</span>
            </div>
            <div className="text-[11px] text-[#2D6A4F] mt-1 font-semibold">
              Lowest RMSE (Robust)
            </div>
          </div>
        </div>

        {/* Card 6: Persistence MAE */}
        <div className="bg-white p-4 rounded-2xl border border-[#D1DFD4] shadow-xs flex flex-col justify-between hover:border-[#133E26]/40 transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#4A6B56]">Persistence MAE</span>
            <div className="w-6 h-6 rounded-full bg-[#FAF9F5] border border-[#D1DFD4] flex items-center justify-center text-[#4A6B56]">
              <Clock className="w-3 h-3" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-[#4A6B56] tracking-tight">
              {sampleStats?.persistence_mae ?? '17.46'} <span className="text-xs font-semibold text-[#4A6B56]">µg/m³</span>
            </div>
            <div className="text-[11px] text-[#4A6B56] mt-1 font-medium">
              Naive baseline (t+0)
            </div>
          </div>
        </div>

      </div>

      {/* PRIMARY CHART: ACTUAL VS NEXT-HOUR FORECAST */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#D1DFD4] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-3 border-b border-[#EBF3EA]">
          <div>
            <h3 className="text-base font-extrabold text-[#133E26] tracking-tight">
              Chronological Next-Hour Forecast vs Actual PM2.5 ({selectedStationObj?.name || selectedStation})
            </h3>
            <p className="text-xs text-[#4A6B56] mt-0.5">
              Empirical next-hour target (t + 1h) compared against Residual XGBoost and Weighted Ensemble predictions over {selectedWindow === 'all' ? '2019' : 'Diwali Window'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-1 bg-[#0D2818] rounded-full inline-block"></span>
              <span className="text-[#0D2818] font-bold">Actual Next-Hour</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-1 bg-[#2D6A4F] rounded-full inline-block border-b-2 border-dashed border-[#2D6A4F]"></span>
              <span className="text-[#2D6A4F] font-bold">Residual XGBoost</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-1 bg-[#0284C7] rounded-full inline-block"></span>
              <span className="text-[#0284C7] font-bold">Weighted Ensemble</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-1 bg-[#CBD5E1] rounded-full inline-block"></span>
              <span className="text-[#64748B] font-medium">Persistence</span>
            </div>
          </div>
        </div>

        {loadingTimeseries ? (
          <div className="h-[360px] flex items-center justify-center text-xs font-semibold text-[#4A6B56]">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-[#133E26] border-t-transparent rounded-full animate-spin"></div>
              <span>Loading verified 100k test predictions...</span>
            </div>
          </div>
        ) : timeseriesData.length === 0 ? (
          <div className="h-[360px] flex items-center justify-center text-xs text-[#4A6B56]">
            No scored records available for {selectedStation} in {selectedWindow}.
          </div>
        ) : (
          <div className="w-full h-[360px] min-h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeseriesData} margin={{ top: 12, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis 
                  dataKey="datetime" 
                  tickFormatter={(val) => val ? val.slice(5, 16) : ''} 
                  stroke="#64748B" 
                  fontSize={11} 
                  tickMargin={8}
                />
                <YAxis 
                  stroke="#64748B" 
                  fontSize={11} 
                  label={{ value: 'PM2.5 (µg/m³)', angle: -90, position: 'insideLeft', offset: 12, fill: '#64748B', fontSize: 11 }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#D1DFD4', borderRadius: '12px', fontSize: '11px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
                  formatter={(value: any, name: any) => [`${Number(value).toFixed(1)} µg/m³`, name]}
                  labelFormatter={(lbl) => `Timestamp: ${lbl}`}
                />
                <ReferenceLine y={60} stroke="#10B981" strokeDasharray="4 4" label={{ value: 'NAAQS Standard (60)', position: 'insideTopLeft', fill: '#059669', fontSize: 10, fontWeight: 'bold' }} />
                <ReferenceLine y={250} stroke="#C62828" strokeDasharray="4 4" label={{ value: 'Severe Threshold (250)', position: 'insideTopLeft', fill: '#C62828', fontSize: 10, fontWeight: 'bold' }} />
                
                <Line 
                  type="monotone" 
                  dataKey="actual_next_hour" 
                  name="Actual (t+1h)" 
                  stroke="#0D2818" 
                  strokeWidth={2.5} 
                  dot={false} 
                />
                <Line 
                  type="monotone" 
                  dataKey="residual_xgboost" 
                  name="Residual XGBoost" 
                  stroke="#2D6A4F" 
                  strokeWidth={2} 
                  strokeDasharray="4 3"
                  dot={false} 
                />
                <Line 
                  type="monotone" 
                  dataKey="weighted_ensemble" 
                  name="Weighted Ensemble" 
                  stroke="#0284C7" 
                  strokeWidth={1.8} 
                  dot={false} 
                />
                <Line 
                  type="monotone" 
                  dataKey="persistence" 
                  name="Persistence Baseline" 
                  stroke="#CBD5E1" 
                  strokeWidth={1.2} 
                  dot={false} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ROW: RESIDUAL ERROR DISTRIBUTION & FEATURE IMPORTANCE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Residual Error Distribution */}
        <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-[#D1DFD4] shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-[#EBF3EA]">
            <div>
              <h3 className="text-sm font-bold text-[#133E26]">
                Hourly Residual Error (Predicted - Actual)
              </h3>
              <p className="text-xs text-[#4A6B56] mt-0.5">
                Residual XGBoost errors over consecutive hours. Zero-centered spread indicates calibrated fit.
              </p>
            </div>
            <div className="flex items-center space-x-2 text-[10px] font-semibold text-[#4A6B56]">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#2D6A4F]"></span> Under-prediction</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#C62828]"></span> Over-prediction</span>
            </div>
          </div>

          <div className="w-full h-[260px] min-h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={residualErrors} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="time" stroke="#64748B" fontSize={10} interval={8} />
                <YAxis stroke="#64748B" fontSize={10} label={{ value: 'Error (µg/m³)', angle: -90, position: 'insideLeft', fill: '#64748B', fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#D1DFD4', borderRadius: '8px', fontSize: '11px' }}
                  formatter={(val: any) => [`${val} µg/m³`, 'Residual (Pred - Act)']}
                />
                <ReferenceLine y={0} stroke="#0D2818" strokeWidth={1.5} />
                <Bar dataKey="error" radius={[2, 2, 0, 0]}>
                  {residualErrors.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.isPositive ? '#2D6A4F' : '#C62828'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Feature Importance Rankings */}
        <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-[#D1DFD4] shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-[#EBF3EA]">
            <div>
              <h3 className="text-sm font-bold text-[#133E26]">
                Top Feature Importance Rankings ({importanceModel})
              </h3>
              <p className="text-xs text-[#4A6B56] mt-0.5">
                Relative feature gain &amp; split contribution in direct next-hour predictions.
              </p>
            </div>
            <select
              value={importanceModel}
              onChange={(e) => setImportanceModel(e.target.value)}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-[#FAF9F5] border border-[#D1DFD4] text-[#133E26] hover:border-[#133E26] focus:outline-[#133E26]"
            >
              <option value="LightGBM">LightGBM</option>
              <option value="XGBoost">XGBoost</option>
              <option value="RandomForest">Random Forest</option>
            </select>
          </div>

          <div className="w-full h-[260px] min-h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={featureImportance}
                margin={{ top: 5, right: 25, left: 45, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis type="number" stroke="#64748B" fontSize={10} />
                <YAxis type="category" dataKey="Feature" stroke="#64748B" fontSize={10} width={90} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#D1DFD4', borderRadius: '8px', fontSize: '11px' }}
                  formatter={(val: any) => [val, 'Feature Gain']}
                />
                <Bar dataKey="Importance" fill="#133E26" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* SECTION: OFFICIAL MODEL METRICS EVALUATION TABLE */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#D1DFD4] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-3 border-b border-[#EBF3EA]">
          <div>
            <h3 className="text-base font-extrabold text-[#133E26] tracking-tight">
              Model Evaluation Matrix: 2019 Out-of-Sample Test vs 2018 Validation
            </h3>
            <p className="text-xs text-[#4A6B56]">
              Performance benchmark of all 6 candidate forecasters across out-of-sample test instances ($n=119,055$).
            </p>
          </div>
          <div className="flex items-center space-x-2 bg-[#FAF9F5] px-3 py-1.5 rounded-xl border border-[#D1DFD4] text-xs text-[#133E26] font-semibold">
            <span className="text-[#4A6B56]">Weights:</span>
            <span>RF 0.00 | XGB 0.05 | LGBM 0.45 | Res-XGB 0.50</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-[#D1DFD4] text-[#4A6B56] font-bold bg-[#FAF9F5]">
                <th className="py-2.5 px-3">Evaluation Set</th>
                <th className="py-2.5 px-3">Model Architecture</th>
                <th className="py-2.5 px-3">Sample (n)</th>
                <th className="py-2.5 px-3">MAE (µg/m³)</th>
                <th className="py-2.5 px-3">RMSE (µg/m³)</th>
                <th className="py-2.5 px-3">Benchmark Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBF3EA]">
              {metrics.map((m, idx) => {
                const isBestMae = m.Model === 'Residual_XGBoost';
                const isBestRmse = m.Model === 'Weighted_Ensemble';
                return (
                  <tr 
                    key={idx} 
                    className={`hover:bg-[#FAF9F5] transition-colors ${
                      isBestMae || isBestRmse ? 'bg-[#EBF3EA]/40 font-medium' : ''
                    }`}
                  >
                    <td className="py-2 px-3 font-semibold text-[#0D2818]">
                      {m.Evaluation === 'All_2019' ? 'All 2019 (Out-of-Sample)' : m.Evaluation === 'Diwali_7d' ? 'Diwali ±7 Days' : 'Diwali ±3 Days'}
                    </td>
                    <td className="py-2 px-3 text-[#133E26] font-bold">
                      {m.Model.replace('_', ' ')}
                    </td>
                    <td className="py-2 px-3 font-mono text-[#4A6B56]">
                      {Number(m.n).toLocaleString()}
                    </td>
                    <td className={`py-2 px-3 font-mono ${isBestMae ? 'text-[#133E26] font-extrabold text-sm' : 'text-[#0D2818]'}`}>
                      {Number(m.MAE).toFixed(3)}
                    </td>
                    <td className={`py-2 px-3 font-mono ${isBestRmse ? 'text-[#133E26] font-extrabold text-sm' : 'text-[#0D2818]'}`}>
                      {Number(m.RMSE).toFixed(3)}
                    </td>
                    <td className="py-2 px-3 text-[11px]">
                      {isBestMae ? (
                        <span className="px-2 py-0.5 rounded-full bg-[#133E26] text-white font-bold">Lowest MAE</span>
                      ) : isBestRmse ? (
                        <span className="px-2 py-0.5 rounded-full bg-[#2D6A4F] text-white font-bold">Lowest RMSE</span>
                      ) : m.Model === 'Persistence' ? (
                        <span className="text-[#94A3B8]">Naive baseline</span>
                      ) : (
                        <span className="text-[#4A6B56]">Competitive benchmark</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION: UPSTREAM FIRMS SMOKE TRANSPORT LAG CORRELATION */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#D1DFD4] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-3 border-b border-[#EBF3EA]">
          <div>
            <div className="flex items-center space-x-2">
              <Flame className="w-5 h-5 text-[#C62828]" />
              <h3 className="text-base font-extrabold text-[#133E26] tracking-tight">
                Upstream Crop Residue Smoke Transport Lag (0h to 72h)
              </h3>
            </div>
            <p className="text-xs text-[#4A6B56] mt-0.5">
              Empirical correlation between Punjab/Haryana NASA FIRMS active fire pixels and downwind Delhi receptor PM2.5 concentrations over northwestern transport trajectories.
            </p>
          </div>
          <span className="px-3 py-1 bg-[#FAF9F5] rounded-xl text-xs font-semibold text-[#133E26] border border-[#D1DFD4]">
            Peak Plume Transport Lag: 24 Hours
          </span>
        </div>

        <div className="w-full h-[240px] min-h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={fireLags} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
              <defs>
                <linearGradient id="lagGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C62828" stopOpacity="0.3"/>
                  <stop offset="95%" stopColor="#C62828" stopOpacity="0.0"/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="lag_hours" stroke="#64748B" fontSize={11} label={{ value: 'Transport Lag (Hours)', position: 'insideBottom', offset: -10, fill: '#64748B', fontSize: 11 }} />
              <YAxis stroke="#64748B" fontSize={11} label={{ value: 'Downwind PM2.5 Impact (µg/m³)', angle: -90, position: 'insideLeft', offset: 12, fill: '#64748B', fontSize: 11 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#D1DFD4', borderRadius: '8px', fontSize: '11px' }}
                formatter={(val: any) => [
                  val === 'downwind_pm25_impact_ugm3' ? `${val} µg/m³` : `${val}`,
                  val === 'downwind_pm25_impact_ugm3' ? 'Downwind PM2.5 Plume Impact' : 'Correlation Coefficient'
                ]}
              />
              <Area 
                type="monotone" 
                dataKey="downwind_pm25_impact_ugm3" 
                name="downwind_pm25_impact_ugm3"
                stroke="#C62828" 
                fillOpacity={1} 
                fill="url(#lagGrad)" 
                strokeWidth={2.5}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};
