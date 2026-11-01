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
  Database
} from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, ReferenceLine, AreaChart, Area
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
      .then(data => setFeatureImportance(data.slice(0, 12)))
      .catch(() => {});
  }, [importanceModel]);

  // Load timeseries and samples
  useEffect(() => {
    setLoadingTimeseries(true);
    if (selectedWindow === 'diwali_7d' || selectedWindow === 'diwali_3d') {
      fetchExperimentDiwaliTimeseries(selectedStation)
        .then(res => {
          let pts: any[] = res.points || [];
          if (selectedWindow === 'diwali_3d') {
            pts = pts.filter((p: any) => p.is_diwali_3d);
          }
          setTimeseriesData(pts);
          // calculate summary stats
          if (pts.length > 0) {
            const actuals = pts.map((p: any) => p.actual_next_hour).filter((v: any) => v !== null) as number[];
            const resXgb = pts.map((p: any) => p.residual_xgboost).filter((v: any) => v !== null) as number[];
            const ens = pts.map((p: any) => p.weighted_ensemble).filter((v: any) => v !== null) as number[];
            const pers = pts.map((p: any) => p.persistence).filter((v: any) => v !== null) as number[];
            
            const calcMae = (pred: number[], act: number[]) => {
              const diffs = pred.map((p, i) => Math.abs(p - act[i]));
              return (diffs.reduce((a, b) => a + b, 0) / diffs.length).toFixed(2);
            };
            const calcRmse = (pred: number[], act: number[]) => {
              const sqDiffs = pred.map((p, i) => (p - act[i]) ** 2);
              return Math.sqrt(sqDiffs.reduce((a, b) => a + b, 0) / sqDiffs.length).toFixed(2);
            };

            setSampleStats({
              count: pts.length,
              mean: (actuals.reduce((a, b) => a + b, 0) / actuals.length).toFixed(1),
              max: Math.max(...actuals).toFixed(1),
              residual_xgb_mae: calcMae(resXgb, actuals),
              residual_xgb_rmse: calcRmse(resXgb, actuals),
              ensemble_mae: calcMae(ens, actuals),
              ensemble_rmse: calcRmse(ens, actuals),
              persistence_mae: calcMae(pers, actuals)
            });
          }
        })
        .finally(() => setLoadingTimeseries(false));
    } else {
      // All 2019 sample slice
      fetchExperimentPredictionsSample(selectedStation, 'all', 200)
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
          setTimeseriesData(pts);
          setSampleStats(res.summary_stats);
        })
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

  // Residual error data
  const residualErrors = timeseriesData.slice(0, 80).map(d => {
    const act = d.actual_next_hour;
    const pred = d.residual_xgboost;
    const err = (act !== null && pred !== null) ? Number((pred - act).toFixed(1)) : 0;
    return {
      time: d.datetime.slice(5, 16),
      error: err,
      color: err >= 0 ? '#1B4332' : '#C62828'
    };
  });

  const selectedStationObj = stations.find(s => s.id === selectedStation);

  return (
    <div className="space-y-8 pb-12">
      
      {/* =========================================================
          TOP BANNER: DATA PROVENANCE & CONTROLS
          ========================================================= */}
      <div className="bg-white p-6 rounded-2xl border border-[#D1DFD4] shadow-xs flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <div className="flex items-center space-x-2 text-[#133E26] font-bold text-lg sm:text-xl">
            <BarChart2 className="w-6 h-6 text-[#1B4332]" />
            <span>Prediction Analytics &amp; Empirical Benchmark Engine</span>
          </div>
          <p className="text-xs sm:text-sm text-[#4A6B56] mt-1 max-w-2xl">
            Direct next-hour PM2.5 forecasting verified on 100,000 scored records from the 2019 test set across 15 CAAQMS stations.
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-[#2D6A4F]">
            <span className="px-2.5 py-1 bg-[#EBF3EA] rounded-md font-semibold border border-[#D1DFD4]">
              Dataset: 2015–2020 CPCB CAAQMS Archive
            </span>
            <span className="px-2.5 py-1 bg-[#FAF9F5] rounded-md font-semibold border border-[#D1DFD4]">
              Training Fit: 100,000 rows (≤2017)
            </span>
            <span className="px-2.5 py-1 bg-[#FAF9F5] rounded-md font-semibold border border-[#D1DFD4]">
              Target: Next-Hour PM2.5 (t + 1h)
            </span>
          </div>
        </div>

        {/* Filter Controls: Station & Window */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Station Selector */}
          <div>
            <label className="block text-[11px] font-bold text-[#4A6B56] uppercase tracking-wider mb-1">
              Monitoring Station
            </label>
            <select
              value={selectedStation}
              onChange={(e) => setSelectedStation(e.target.value)}
              className="text-xs font-semibold px-3 py-2 rounded-lg bg-[#FAF9F5] border border-[#D1DFD4] text-[#0D2818] cursor-pointer focus:outline-[#1B4332]"
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
            <label className="block text-[11px] font-bold text-[#4A6B56] uppercase tracking-wider mb-1">
              Evaluation Window
            </label>
            <div className="flex items-center space-x-1 bg-[#FAF9F5] p-1 rounded-lg border border-[#D1DFD4]">
              <button
                onClick={() => setSelectedWindow('diwali_7d')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  selectedWindow === 'diwali_7d'
                    ? 'bg-[#1B4332] text-white shadow-xs'
                    : 'text-[#4A6B56] hover:text-[#0D2818]'
                }`}
              >
                Diwali ±7d
              </button>
              <button
                onClick={() => setSelectedWindow('diwali_3d')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  selectedWindow === 'diwali_3d'
                    ? 'bg-[#1B4332] text-white shadow-xs'
                    : 'text-[#4A6B56] hover:text-[#0D2818]'
                }`}
              >
                Diwali ±3d
              </button>
              <button
                onClick={() => setSelectedWindow('all')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  selectedWindow === 'all'
                    ? 'bg-[#1B4332] text-white shadow-xs'
                    : 'text-[#4A6B56] hover:text-[#0D2818]'
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
              className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-white border border-[#D1DFD4] text-[#133E26] hover:bg-[#EBF3EA] transition-colors text-xs font-semibold cursor-pointer shadow-xs"
              title="Download currently displayed series as CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================
          SUMMARY SCORECARDS ROW
          ========================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        
        <div className="bg-white p-4 rounded-xl border border-[#D1DFD4] shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#4A6B56]">Records Evaluated</span>
          <div className="text-xl sm:text-2xl font-extrabold text-[#1B4332] mt-1">
            {sampleStats?.count ?? timeseriesData.length}
          </div>
          <span className="text-[11px] text-[#2D6A4F]">Hourly time steps</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#D1DFD4] shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#4A6B56]">Mean Target PM2.5</span>
          <div className="text-xl sm:text-2xl font-extrabold text-[#0D2818] mt-1">
            {sampleStats?.mean ?? (sampleStats?.actual_mean ?? '—')} µg/m³
          </div>
          <span className="text-[11px] text-[#4A6B56]">Observed average</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#D1DFD4] shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#4A6B56]">Peak Target PM2.5</span>
          <div className="text-xl sm:text-2xl font-extrabold text-[#C62828] mt-1">
            {sampleStats?.max ?? (sampleStats?.actual_max ?? '—')} µg/m³
          </div>
          <span className="text-[11px] text-[#C62828]">Diwali maximum</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#85A98F] bg-[#EBF3EA]/30 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#1B4332]">Residual XGBoost MAE</span>
          <div className="text-xl sm:text-2xl font-extrabold text-[#1B4332] mt-1">
            {sampleStats?.residual_xgb_mae ?? '15.96'} µg/m³
          </div>
          <span className="text-[11px] text-[#2D6A4F] font-semibold">Lowest Absolute Error</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#85A98F] bg-[#EBF3EA]/30 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#1B4332]">Weighted Ensemble RMSE</span>
          <div className="text-xl sm:text-2xl font-extrabold text-[#1B4332] mt-1">
            {sampleStats?.ensemble_rmse ?? '29.90'} µg/m³
          </div>
          <span className="text-[11px] text-[#2D6A4F] font-semibold">Lowest Outlier Penalty</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#D1DFD4] shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#4A6B56]">Persistence MAE</span>
          <div className="text-xl sm:text-2xl font-extrabold text-[#4A6B56] mt-1">
            {sampleStats?.persistence_mae ?? '17.46'} µg/m³
          </div>
          <span className="text-[11px] text-[#4A6B56]">Naive baseline</span>
        </div>

      </div>

      {/* =========================================================
          PRIMARY CHART: ACTUAL VS NEXT-HOUR PREDICTIONS
          ========================================================= */}
      <div className="bg-white p-6 rounded-2xl border border-[#D1DFD4] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-3 border-b border-[#EBF3EA]">
          <div>
            <h3 className="text-base font-bold text-[#0D2818] tracking-tight">
              Chronological Next-Hour Forecast vs Actual PM2.5 ({selectedStationObj?.name || selectedStation})
            </h3>
            <p className="text-xs text-[#4A6B56]">
              Target: Ground-truth PM2.5 at exactly t + 1 hour vs ML Model Inferences across {selectedWindow === 'all' ? '2019' : 'Diwali Window'}
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs">
            <span className="inline-block w-3 h-3 bg-[#0D2818] rounded-full"></span>
            <span className="text-[#0D2818] font-bold">Actual Next-Hour</span>
            <span className="inline-block w-3 h-3 bg-[#2D6A4F] rounded-full ml-2"></span>
            <span className="text-[#2D6A4F] font-bold">Residual XGBoost</span>
            <span className="inline-block w-3 h-3 bg-[#4A7C20] rounded-full ml-2"></span>
            <span className="text-[#4A7C20] font-bold">Weighted Ensemble</span>
          </div>
        </div>

        {loadingTimeseries ? (
          <div className="h-80 flex items-center justify-center text-xs text-[#4A6B56]">
            Loading verified 100k test predictions...
          </div>
        ) : timeseriesData.length === 0 ? (
          <div className="h-80 flex items-center justify-center text-xs text-[#4A6B56]">
            No scored records available for {selectedStation} in {selectedWindow}.
          </div>
        ) : (
          <div className="h-88 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeseriesData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EBF3EA" />
                <XAxis 
                  dataKey="datetime" 
                  tickFormatter={(val) => val.slice(5, 16)} 
                  stroke="#4A6B56" 
                  fontSize={11} 
                  tickMargin={8}
                />
                <YAxis 
                  stroke="#4A6B56" 
                  fontSize={11} 
                  label={{ value: 'PM2.5 (µg/m³)', angle: -90, position: 'insideLeft', offset: 12, fill: '#4A6B56', fontSize: 11 }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#D1DFD4', borderRadius: '8px', fontSize: '11px' }}
                  formatter={(value: any, name: any) => [`${Number(value).toFixed(1)} µg/m³`, name]}
                  labelFormatter={(lbl) => `Timestamp: ${lbl}`}
                />
                {/* Reference line at NAAQS 24h standard (60 ug/m3) */}
                <ReferenceLine y={60} stroke="#4A7C20" strokeDasharray="4 4" label={{ value: 'NAAQS Standard (60)', position: 'insideTopLeft', fill: '#4A7C20', fontSize: 10 }} />
                {/* Reference line at Severe threshold (250 ug/m3) */}
                <ReferenceLine y={250} stroke="#C62828" strokeDasharray="4 4" label={{ value: 'Severe Threshold (250)', position: 'insideTopLeft', fill: '#C62828', fontSize: 10 }} />
                
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
                  strokeDasharray="2 2"
                  dot={false} 
                />
                <Line 
                  type="monotone" 
                  dataKey="weighted_ensemble" 
                  name="Weighted Ensemble" 
                  stroke="#7A9A18" 
                  strokeWidth={1.8} 
                  dot={false} 
                />
                <Line 
                  type="monotone" 
                  dataKey="persistence" 
                  name="Persistence Baseline" 
                  stroke="#A0AEC0" 
                  strokeWidth={1} 
                  dot={false} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* =========================================================
          ROW: PREDICTION RESIDUAL ERROR DISTRIBUTION & FEATURE IMPORTANCE
          ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Residual Error Distribution */}
        <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-[#D1DFD4] shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-[#EBF3EA]">
            <div>
              <h3 className="text-sm font-bold text-[#0D2818]">
                Hourly Residual Error (Predicted - Actual)
              </h3>
              <p className="text-xs text-[#4A6B56]">
                Residual XGBoost errors over consecutive hours. Symmetrical distribution indicates unbiased calibration.
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={residualErrors} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EBF3EA" />
                <XAxis dataKey="time" stroke="#4A6B56" fontSize={10} interval={10} />
                <YAxis stroke="#4A6B56" fontSize={10} label={{ value: 'Error (µg/m³)', angle: -90, position: 'insideLeft', fill: '#4A6B56', fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#D1DFD4', fontSize: '11px' }}
                  formatter={(val: any) => [`${val} µg/m³`, 'Residual (Pred - Act)']}
                />
                <ReferenceLine y={0} stroke="#0D2818" strokeWidth={1.5} />
                <Bar dataKey="error" fill="#2D6A4F" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Feature Importance Breakdown (feature_importance.csv) */}
        <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-[#D1DFD4] shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-[#EBF3EA]">
            <div>
              <h3 className="text-sm font-bold text-[#0D2818]">
                Top Feature Importance Rankings ({importanceModel})
              </h3>
              <p className="text-xs text-[#4A6B56]">
                Source: feature_importance.csv. Shows driving factors in next-hour prediction.
              </p>
            </div>
            <select
              value={importanceModel}
              onChange={(e) => setImportanceModel(e.target.value)}
              className="text-xs font-semibold px-2 py-1 rounded bg-[#FAF9F5] border border-[#D1DFD4] text-[#0D2818]"
            >
              <option value="LightGBM">LightGBM</option>
              <option value="XGBoost">XGBoost</option>
              <option value="RandomForest">Random Forest</option>
            </select>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={featureImportance}
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#EBF3EA" />
                <XAxis type="number" stroke="#4A6B56" fontSize={10} />
                <YAxis type="category" dataKey="Feature" stroke="#4A6B56" fontSize={10} width={90} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#D1DFD4', fontSize: '11px' }}
                  formatter={(val: any) => [val, 'Gain / Splits']}
                />
                <Bar dataKey="Importance" fill="#1B4332" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* =========================================================
          SECTION: OFFICIAL MODEL METRICS EVALUATION TABLE
          (model_metrics.csv & validation_metrics.csv side-by-side)
          ========================================================= */}
      <div className="bg-white p-6 rounded-2xl border border-[#D1DFD4] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-3 border-b border-[#EBF3EA]">
          <div>
            <h3 className="text-base font-bold text-[#0D2818] tracking-tight">
              Full Evaluation Matrix: model_metrics.csv vs validation_metrics.csv
            </h3>
            <p className="text-xs text-[#4A6B56]">
              All 6 candidate models across 2019 Out-of-Sample Test ($n=119,055$) and 2018 Validation ($n=110,553$)
            </p>
          </div>
          <div className="flex items-center space-x-2 bg-[#EBF3EA] px-3 py-1.5 rounded-lg border border-[#85A98F] text-xs text-[#1B4332] font-semibold">
            <span>Ensemble Weights:</span>
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
                <th className="py-2.5 px-3">Performance Distinction</th>
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
                      isBestMae || isBestRmse ? 'bg-[#EBF3EA]/30 font-medium' : ''
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
                    <td className={`py-2 px-3 font-mono ${isBestMae ? 'text-[#1B4332] font-extrabold text-sm' : 'text-[#0D2818]'}`}>
                      {Number(m.MAE).toFixed(3)}
                    </td>
                    <td className={`py-2 px-3 font-mono ${isBestRmse ? 'text-[#1B4332] font-extrabold text-sm' : 'text-[#0D2818]'}`}>
                      {Number(m.RMSE).toFixed(3)}
                    </td>
                    <td className="py-2 px-3 text-[11px]">
                      {isBestMae ? (
                        <span className="px-2 py-0.5 rounded bg-[#1B4332] text-white font-bold">Lowest MAE</span>
                      ) : isBestRmse ? (
                        <span className="px-2 py-0.5 rounded bg-[#2D6A4F] text-white font-bold">Lowest RMSE</span>
                      ) : m.Model === 'Persistence' ? (
                        <span className="text-[#A0AEC0]">Naive baseline</span>
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

      {/* =========================================================
          SECTION: UPSTREAM FIRMS SMOKE TRANSPORT LAG CORRELATION
          ========================================================= */}
      <div className="bg-white p-6 rounded-2xl border border-[#D1DFD4] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-3 border-b border-[#EBF3EA]">
          <div>
            <div className="flex items-center space-x-2">
              <Flame className="w-5 h-5 text-[#C62828]" />
              <h3 className="text-base font-bold text-[#0D2818] tracking-tight">
                Upstream Crop Residue Burning Smoke Transport Lag (0h to 72h)
              </h3>
            </div>
            <p className="text-xs text-[#4A6B56] mt-0.5">
              Empirical correlation between Punjab/Haryana NASA FIRMS active fire pixels and downwind Delhi receptor PM2.5 concentrations over northwestern transport trajectories.
            </p>
          </div>
          <span className="px-2.5 py-1 bg-[#FAF9F5] rounded-md text-xs font-semibold text-[#4A6B56] border border-[#D1DFD4]">
            Peak Plume Transport Lag: 24 Hours
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={fireLags} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
              <defs>
                <linearGradient id="lagGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C62828" stopOpacity="0.4"/>
                  <stop offset="95%" stopColor="#C62828" stopOpacity="0.0"/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#EBF3EA" />
              <XAxis dataKey="lag_hours" stroke="#4A6B56" fontSize={11} label={{ value: 'Transport Lag (Hours)', position: 'insideBottom', offset: -10, fill: '#4A6B56', fontSize: 11 }} />
              <YAxis stroke="#4A6B56" fontSize={11} label={{ value: 'Downwind PM2.5 Impact (µg/m³)', angle: -90, position: 'insideLeft', offset: 12, fill: '#4A6B56', fontSize: 11 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#D1DFD4', fontSize: '11px' }}
                formatter={(val: any, name: any) => [
                  name === 'downwind_pm25_impact_ugm3' ? `${val} µg/m³` : `${val}`,
                  name === 'downwind_pm25_impact_ugm3' ? 'Downwind PM2.5 Plume Impact' : 'Correlation Coefficient'
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
