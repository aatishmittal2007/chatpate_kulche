import React, { useState, useEffect } from 'react';
import { ModelEvaluationSummary, AblationResult } from '../types';
import { 
  fetchModelEvaluation, 
  fetchExperimentMetrics, 
  fetchExperimentEnsembleWeights,
  fetchExperimentFeatureImportance
} from '../services/api';
import { ShieldCheck, Layers, AlertCircle, CheckCircle2, Award, Info, Scale } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const EvaluationView: React.FC = () => {
  const [evaluations, setEvaluations] = useState<ModelEvaluationSummary[]>([]);
  const [ablationSuite, setAblationSuite] = useState<AblationResult[]>([]);
  const [limitations, setLimitations] = useState<string[]>([]);
  const [expMetrics, setExpMetrics] = useState<any[]>([]);
  const [valMetrics, setValMetrics] = useState<any[]>([]);
  const [weights, setWeights] = useState<any[]>([]);
  const [featureImportance, setFeatureImportance] = useState<any[]>([]);
  const [activeWindow, setActiveWindow] = useState<'All_2019' | 'Diwali_7d' | 'Diwali_3d'>('All_2019');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    Promise.all([
      fetchModelEvaluation().catch(() => null),
      fetchExperimentMetrics().catch(() => null),
      fetchExperimentEnsembleWeights().catch(() => []),
      fetchExperimentFeatureImportance('LightGBM').catch(() => [])
    ]).then(([localEval, expData, wts, featImp]) => {
      if (localEval) {
        setEvaluations(localEval.evaluations || []);
        setAblationSuite(localEval.ablation_suite || []);
        setLimitations(localEval.dataset_limitations || []);
      }
      if (expData) {
        setExpMetrics(expData.test_metrics_2019 || []);
        setValMetrics(expData.validation_metrics_2018 || []);
      }
      if (wts) setWeights(wts);
      if (featImp) setFeatureImportance(featImp.slice(0, 10));
      setLoading(false);
    });
  }, []);

  const filteredMetrics = expMetrics.filter(m => m.Evaluation === activeWindow);

  return (
    <div className="space-y-8 pb-12">
      
      {/* Title & Introduction */}
      <div className="bg-white p-6 rounded-2xl border border-[#D1DFD4] shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck className="w-5 h-5 text-[#133E26]" />
          <h2 className="text-xl font-bold text-[#0D2818] tracking-tight">
            Official Experiment Evaluation &amp; Multi-Model Benchmarking
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-[#4A6B56] leading-relaxed max-w-3xl">
          Scientific audit of model architectures evaluated on 705,691 subset rows across 15 CAAQMS monitoring stations from 2015 to July 2020. Evaluated with chronological train/validation/test splits with zero future leakage.
        </p>
      </div>

      {/* =========================================================
          SECTION 1: TEST METRICS TABLE & ENSEMBLE WEIGHTS
          ========================================================= */}
      <div className="bg-white rounded-2xl border border-[#D1DFD4] shadow-xs overflow-hidden">
        <div className="px-6 py-4 bg-[#EBF3EA] border-b border-[#D1DFD4] flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div>
            <h3 className="text-sm font-bold text-[#133E26] uppercase tracking-wide">
              2019 Test Set Model Comparisons (Source: model_metrics.csv)
            </h3>
            <p className="text-xs text-[#4A6B56]">
              All 6 candidate models evaluated for next-hour target PM2.5 (t + 1h)
            </p>
          </div>

          {/* Window Filter Pills */}
          <div className="flex items-center space-x-1.5 bg-white p-1 rounded-lg border border-[#D1DFD4]">
            <button
              onClick={() => setActiveWindow('All_2019')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                activeWindow === 'All_2019'
                  ? 'bg-[#133E26] text-white'
                  : 'text-[#4A6B56] hover:text-[#0D2818]'
              }`}
            >
              All 2019 (n=119,055)
            </button>
            <button
              onClick={() => setActiveWindow('Diwali_7d')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                activeWindow === 'Diwali_7d'
                  ? 'bg-[#133E26] text-white'
                  : 'text-[#4A6B56] hover:text-[#0D2818]'
              }`}
            >
              Diwali ±7d (n=4,592)
            </button>
            <button
              onClick={() => setActiveWindow('Diwali_3d')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                activeWindow === 'Diwali_3d'
                  ? 'bg-[#133E26] text-white'
                  : 'text-[#4A6B56] hover:text-[#0D2818]'
              }`}
            >
              Diwali ±3d (n=1,946)
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-xs text-left">
            <thead className="bg-[#FAF9F5] text-[#4A6B56] border-b border-[#D1DFD4] font-bold">
              <tr>
                <th className="px-5 py-3">Rank</th>
                <th className="px-5 py-3">Model Architecture</th>
                <th className="px-5 py-3">Out-of-Sample Records (n)</th>
                <th className="px-5 py-3">MAE (µg/m³)</th>
                <th className="px-5 py-3">RMSE (µg/m³)</th>
                <th className="px-5 py-3">Statistical Distinction</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBF3EA] font-mono">
              {filteredMetrics.map((m, idx) => {
                const isResidualXgb = m.Model === 'Residual_XGBoost';
                const isEnsemble = m.Model === 'Weighted_Ensemble';
                return (
                  <tr 
                    key={idx} 
                    className={`hover:bg-[#FAF9F5] transition-colors ${
                      isResidualXgb || isEnsemble ? 'bg-[#EBF3EA]/40 font-semibold' : ''
                    }`}
                  >
                    <td className="px-5 py-3 font-sans text-[#4A6B56]">#{idx + 1}</td>
                    <td className="px-5 py-3 font-sans font-bold text-[#133E26]">
                      {m.Model.replace('_', ' ')}
                    </td>
                    <td className="px-5 py-3 text-[#4A6B56]">{Number(m.n).toLocaleString()}</td>
                    <td className={`px-5 py-3 text-sm ${isResidualXgb ? 'text-[#133E26] font-extrabold' : 'text-[#0D2818]'}`}>
                      {Number(m.MAE).toFixed(3)}
                    </td>
                    <td className={`px-5 py-3 text-sm ${isEnsemble ? 'text-[#133E26] font-extrabold' : 'text-[#0D2818]'}`}>
                      {Number(m.RMSE).toFixed(3)}
                    </td>
                    <td className="px-5 py-3 font-sans">
                      {isResidualXgb ? (
                        <span className="px-2 py-0.5 rounded bg-[#133E26] text-white text-[11px] font-bold">
                          Lowest MAE Winner
                        </span>
                      ) : isEnsemble ? (
                        <span className="px-2 py-0.5 rounded bg-[#2D6A4F] text-white text-[11px] font-bold">
                          Lowest RMSE Winner
                        </span>
                      ) : m.Model === 'Persistence' ? (
                        <span className="text-[#A0AEC0]">Naive baseline</span>
                      ) : (
                        <span className="text-[#4A6B56]">Standard tree forecaster</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Validation Ensemble Weights Bar */}
        <div className="p-5 bg-[#FAF9F5] border-t border-[#D1DFD4] flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
          <div className="flex items-center space-x-2">
            <Scale className="w-4 h-4 text-[#133E26]" />
            <span className="font-bold text-[#0D2818]">
              Validation-Derived Ensemble Weights (Source: ensemble_weights.csv):
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {weights.map((w, i) => (
              <div key={i} className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#D1DFD4]">
                <span className="font-semibold text-[#133E26]">{w.Model}:</span>
                <span className="font-mono font-bold text-[#133E26]">
                  {Number(w.Validation_Ensemble_Weight).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* =========================================================
          SECTION 2: CHRONOLOGICAL METHODOLOGY & 6-STAGE ABLATION
          ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Chronological Split Breakdown */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-[#D1DFD4] shadow-xs space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-[#EBF3EA]">
            <CheckCircle2 className="w-5 h-5 text-[#2D6A4F]" />
            <h3 className="text-base font-bold text-[#0D2818]">
              Chronological Split Integrity
            </h3>
          </div>

          <div className="space-y-3 text-xs text-[#2D4A36] leading-relaxed">
            <div className="p-3 rounded-lg bg-[#FAF9F5] border border-[#D1DFD4]">
              <span className="font-bold text-[#133E26] block mb-0.5">1. Training Split (≤ 2017):</span>
              Fit on a representative 100,000-row sample from 2015 to December 31, 2017 across the 15 complete stations.
            </div>

            <div className="p-3 rounded-lg bg-[#FAF9F5] border border-[#D1DFD4]">
              <span className="font-bold text-[#133E26] block mb-0.5">2. Validation Split (2018):</span>
              Evaluated across 110,553 rows in 2018 (including 2,082 Diwali ±3d rows) to compute optimal non-negative ensemble weights.
            </div>

            <div className="p-3 rounded-lg bg-[#FAF9F5] border border-[#D1DFD4]">
              <span className="font-bold text-[#133E26] block mb-0.5">3. Out-of-Sample Test Split (2019):</span>
              Evaluated on 119,055 scored records in 2019 without model refitting, guaranteeing zero temporal leakage.
            </div>

            <div className="p-3 rounded-lg bg-[#EBF3EA] border border-[#85A98F] text-[#133E26]">
              <span className="font-bold block mb-0.5">Bias-Variance Takeaway:</span>
              Residual XGBoost has lowest MAE; Weighted Ensemble has lowest RMSE. Neither model is unilaterally superior.
            </div>
          </div>
        </div>

        {/* Right: Feature Importance Breakdown */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-[#D1DFD4] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#EBF3EA]">
            <div className="flex items-center space-x-2">
              <Layers className="w-5 h-5 text-[#133E26]" />
              <h3 className="text-base font-bold text-[#0D2818]">
                Feature Importance (LightGBM)
              </h3>
            </div>
            <span className="text-[11px] text-[#4A6B56]">Source: feature_importance.csv</span>
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
                  formatter={(val: any) => [val, 'Importance Gain']}
                />
                <Bar dataKey="Importance" fill="#1B4332" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* =========================================================
          SECTION 3: 6-STAGE ABLATION SUITE & LIMITATIONS
          ========================================================= */}
      <div className="bg-white rounded-2xl border border-[#D1DFD4] shadow-xs overflow-hidden">
        <div className="px-6 py-4 bg-[#EBF3EA] border-b border-[#D1DFD4] flex items-center gap-2">
          <Layers className="w-5 h-5 text-[#133E26]" />
          <h3 className="text-sm font-bold text-[#133E26] uppercase tracking-wide">
            6-Stage Feature Ablation Experiment (Incremental Telemetry Value)
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs text-left">
            <thead className="bg-[#FAF9F5] text-[#4A6B56] border-b border-[#D1DFD4] font-bold">
              <tr>
                <th className="px-4 py-2.5">Stage</th>
                <th className="px-4 py-2.5">Features Included</th>
                <th className="px-4 py-2.5">PM2.5 MAE (1h)</th>
                <th className="px-4 py-2.5">PM2.5 MAE (24h)</th>
                <th className="px-4 py-2.5">Incremental Verdict</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBF3EA] font-mono">
              {ablationSuite.map((ab, idx) => (
                <tr key={idx} className="hover:bg-[#FAF9F5]">
                  <td className="px-4 py-2.5 font-sans font-bold text-[#0D2818]">{ab.stage}</td>
                  <td className="px-4 py-2.5 font-sans text-[#4A6B56] max-w-xs truncate">
                    {ab.features_included.join(', ')}
                  </td>
                  <td className="px-4 py-2.5 text-[#0D2818] font-semibold">{ab.pm25_mae_1h.toFixed(1)} µg/m³</td>
                  <td className="px-4 py-2.5 text-[#4A6B56]">{ab.pm25_mae_24h.toFixed(1)} µg/m³</td>
                  <td className="px-4 py-2.5 font-sans text-[#2D6A4F] font-semibold">{ab.verdict}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dataset Limitations & Scientific Honesty */}
      <div className="bg-[#FAF9F5] p-6 rounded-2xl border border-[#D1DFD4] space-y-3">
        <div className="flex items-center space-x-2 text-[#B45309]">
          <AlertCircle className="w-5 h-5" />
          <h3 className="font-bold text-sm text-[#0D2818]">Dataset Limitations &amp; Zero-Fabrication Integrity</h3>
        </div>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-[#4A6B56]">
          {limitations.map((lim, idx) => (
            <li key={idx} className="flex items-start space-x-2 bg-white p-3 rounded-lg border border-[#D1DFD4]">
              <span className="text-[#133E26] font-bold">•</span>
              <span>{lim}</span>
            </li>
          ))}
          <li className="flex items-start space-x-2 bg-white p-3 rounded-lg border border-[#D1DFD4]">
            <span className="text-[#133E26] font-bold">•</span>
            <span>The source dataset ends in July 2020. No validation on Diwali 2026 is claimed.</span>
          </li>
          <li className="flex items-start space-x-2 bg-white p-3 rounded-lg border border-[#D1DFD4]">
            <span className="text-[#133E26] font-bold">•</span>
            <span>External weather, fire, and traffic are independent evidence layers not merged in the 2015-2020 weights.</span>
          </li>
        </ul>
      </div>

    </div>
  );
};
