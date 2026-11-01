import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Compass, 
  Calendar, 
  Sliders, 
  Bot, 
  Car, 
  Users, 
  BookOpen, 
  Cpu, 
  Search, 
  ArrowRight, 
  CheckCircle2, 
  Layers, 
  Sparkles,
  Zap,
  Activity,
  Filter
} from 'lucide-react';

interface ModulesViewProps {
  onNavigate: (tab: string) => void;
}

interface ModuleItem {
  id: string;
  name: string;
  category: 'analytics' | 'intelligence' | 'automation';
  icon: any;
  summary: string;
  badge: string;
  badgeColor: string;
  tags: string[];
  metricsPreview: string;
}

export const ModulesView: React.FC<ModulesViewProps> = ({ onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'analytics' | 'intelligence' | 'automation'>('all');

  const modules: ModuleItem[] = [
    {
      id: 'evaluation',
      name: 'Model Evaluation Matrix',
      category: 'analytics',
      icon: ShieldCheck,
      summary: 'Empirical benchmark comparing 6 candidate models across 119,055 scored test records with zero future leakage.',
      badge: 'Verified ML',
      badgeColor: 'bg-[#EBF3EA] text-[#133E26] border-[#85A98F]',
      tags: ['model_metrics.csv', 'MAE / RMSE', 'Ensemble Weights', 'Ablation'],
      metricsPreview: 'Residual XGBoost: MAE 12.711 | Weighted Ensemble: RMSE 26.334'
    },
    {
      id: 'forecast',
      name: 'Forecast Explorer',
      category: 'analytics',
      icon: Compass,
      summary: 'Direct horizon forecasting (+1h, +3h, +6h, +24h) with 80% empirical prediction intervals and input telemetry snapshots.',
      badge: 'Operational',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      tags: ['Direct Horizons', '80% Interval', 'Meteorology Snapshot', 'CPCB'],
      metricsPreview: '4 Horizons (+1h to +24h) across 15 CAAQMS Stations'
    },
    {
      id: 'progression',
      name: 'Diwali Relative Progression',
      category: 'analytics',
      icon: Calendar,
      summary: 'Multi-year calendar-synchronized pollution trajectories spanning Day -30 to Day +30 relative to the Diwali festival date.',
      badge: 'Verified Data',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
      tags: ['Day -30 to +30', 'Festival Peak', 'Multi-Year Curves', 'NAAQS Standard'],
      metricsPreview: 'Pre-Diwali: ~110 µg/m³ → Diwali Night Peak: ~380 µg/m³'
    },
    {
      id: 'scenarios',
      name: 'Scenario Comparator',
      category: 'analytics',
      icon: Sliders,
      summary: 'Statistical sensitivity laboratory evaluating perturbations in wind speed, wind direction, traffic, stubble fires, and humidity.',
      badge: 'Sensitivity Lab',
      badgeColor: 'bg-purple-50 text-purple-800 border-purple-200',
      tags: ['Non-Causal', 'Wind Vector Shifts', 'Traffic Reductions', 'Stubble Fires'],
      metricsPreview: 'Hypothetical perturbation deltas against live baseline'
    },
    {
      id: 'ai',
      name: 'Qwen 3.8 AI Assistant',
      category: 'intelligence',
      icon: Bot,
      summary: 'Grounded environmental intelligence assistant with zero hallucination and mathematical feature attribution.',
      badge: 'Qwen 3.8 LLM',
      badgeColor: 'bg-sky-50 text-sky-800 border-sky-200',
      tags: ['Chat Completions', 'Feature Attribution', 'Event Synthesis', 'Offline Fallback'],
      metricsPreview: 'Strict telemetry grounding in live CPCB and NASA FIRMS feeds'
    },
    {
      id: 'vehicles',
      name: 'Vehicle Intelligence & Routes',
      category: 'intelligence',
      icon: Car,
      summary: 'Arterial corridor traffic tracking, vehicle classification, and inhalation exposure reduction routing.',
      badge: 'Traffic Intel',
      badgeColor: 'bg-orange-50 text-orange-800 border-orange-200',
      tags: ['Corridor Congestion', 'Fleet Breakdown', 'Clean Route Solver', 'Exposure Reduction'],
      metricsPreview: 'Up to -28% cumulative inhalation exposure on clean routes'
    },
    {
      id: 'community',
      name: 'Citizen Ground Reports',
      category: 'intelligence',
      icon: Users,
      summary: 'Crowdsourced festival pollution observations validated via official station proximity and spatial clustering.',
      badge: 'Crowdsourced',
      badgeColor: 'bg-teal-50 text-teal-800 border-teal-200',
      tags: ['Ground Observations', 'Reliability Scoring', 'Spatial Clusters', 'Upvotes'],
      metricsPreview: 'Multi-factor reliability scoring (station proximity + clustering)'
    },
    {
      id: 'blooms',
      name: "Decision Support (Bloom's)",
      category: 'intelligence',
      icon: BookOpen,
      summary: '6-tier pedagogical cognitive framework spanning scientific recall to customized health action plan generation.',
      badge: '6-Tier Cognitive',
      badgeColor: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      tags: ['Remember to Create', 'Action Plans', 'Vulnerability Groups', 'Policy Briefs'],
      metricsPreview: 'Tailored plans for Children, Elderly, and Outdoor Workers'
    },
    {
      id: 'automation',
      name: 'n8n Automation Engine',
      category: 'automation',
      icon: Cpu,
      summary: 'Idempotent background pipelines for automated CPCB ingestion, model retraining, threshold alerting, and health monitoring.',
      badge: 'Orchestration',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      tags: ['6 JSON Workflows', 'Health Monitoring', 'Webhook Triggers', 'Idempotent Jobs'],
      metricsPreview: '6/6 JSON Workflows Verified | SQLite WAL Sync'
    }
  ];

  const filtered = modules.filter(m => {
    const matchesCategory = activeCategory === 'all' || m.category === activeCategory;
    const matchesSearch = searchQuery === '' || 
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Banner */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#D1DFD4] shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
        <div>
          <div className="flex items-center space-x-2.5 text-[#133E26]">
            <div className="w-9 h-9 rounded-xl bg-[#EBF3EA] flex items-center justify-center text-[#133E26]">
              <Layers className="w-5 h-5 text-[#133E26]" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-[#133E26]">
                Specialized Environmental Modules Hub
              </h2>
              <span className="text-xs text-[#4A6B56]">
                9 dedicated analytical and operational tools for Diwali air quality intelligence
              </span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="w-full md:w-80 relative">
          <Search className="w-4 h-4 text-[#4A6B56] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search modules or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl bg-[#FAF9F5] border border-[#D1DFD4] text-[#133E26] hover:border-[#133E26] focus:outline-[#133E26] transition-colors"
          />
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeCategory === 'all'
              ? 'bg-[#133E26] text-white shadow-xs'
              : 'bg-white text-[#4A6B56] border border-[#D1DFD4] hover:bg-[#FAF9F5]'
          }`}
        >
          All Modules ({modules.length})
        </button>
        <button
          onClick={() => setActiveCategory('analytics')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeCategory === 'analytics'
              ? 'bg-[#133E26] text-white shadow-xs'
              : 'bg-white text-[#4A6B56] border border-[#D1DFD4] hover:bg-[#FAF9F5]'
          }`}
        >
          Forecasting &amp; Analytics (4)
        </button>
        <button
          onClick={() => setActiveCategory('intelligence')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeCategory === 'intelligence'
              ? 'bg-[#133E26] text-white shadow-xs'
              : 'bg-white text-[#4A6B56] border border-[#D1DFD4] hover:bg-[#FAF9F5]'
          }`}
        >
          Environmental Intelligence (4)
        </button>
        <button
          onClick={() => setActiveCategory('automation')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeCategory === 'automation'
              ? 'bg-[#133E26] text-white shadow-xs'
              : 'bg-white text-[#4A6B56] border border-[#D1DFD4] hover:bg-[#FAF9F5]'
          }`}
        >
          Automation &amp; Pipelines (1)
        </button>
      </div>

      {/* Modules Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((mod) => {
          const Icon = mod.icon;
          return (
            <div 
              key={mod.id}
              className="bg-white p-5 rounded-2xl border border-[#D1DFD4] shadow-xs flex flex-col justify-between hover:border-[#133E26] transition-all group hover:shadow-md"
            >
              <div>
                {/* Top Row: Icon + Status Badge */}
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#EBF3EA] flex items-center justify-center text-[#133E26] group-hover:scale-105 transition-transform">
                    <Icon className="w-5 h-5 text-[#133E26]" />
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${mod.badgeColor}`}>
                    {mod.badge}
                  </span>
                </div>

                {/* Title & Description */}
                <h3 className="text-base font-extrabold text-[#133E26] mt-3 group-hover:text-[#2D6A4F] transition-colors">
                  {mod.name}
                </h3>
                <p className="text-xs text-[#4A6B56] mt-1.5 leading-relaxed">
                  {mod.summary}
                </p>

                {/* Metrics Preview */}
                <div className="mt-3 p-2.5 rounded-xl bg-[#FAF9F5] border border-[#EBF3EA] text-[11px] text-[#133E26] font-medium">
                  {mod.metricsPreview}
                </div>

                {/* Feature Tags */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {mod.tags.map((t, idx) => (
                    <span key={idx} className="text-[10px] px-2 py-0.5 rounded-md bg-[#FAF9F5] text-[#4A6B56] border border-[#D1DFD4]">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-5 pt-3 border-t border-[#EBF3EA]">
                <button
                  onClick={() => onNavigate(mod.id)}
                  className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-[#FAF9F5] hover:bg-[#133E26] hover:text-white text-[#133E26] text-xs font-bold transition-all cursor-pointer group/btn"
                >
                  <span>Launch Module</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="bg-white p-12 rounded-2xl border border-[#D1DFD4] text-center space-y-2">
          <p className="text-sm font-bold text-[#133E26]">No specialized modules match your search.</p>
          <p className="text-xs text-[#4A6B56]">Try clearing your search query or selecting "All Modules".</p>
          <button
            onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
            className="mt-2 px-4 py-2 rounded-xl bg-[#133E26] text-white text-xs font-semibold cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
};
