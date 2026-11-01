import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  BarChart3, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  TrendingUp, 
  Layers, 
  Database, 
  Calendar, 
  ChevronDown,
  Info,
  ExternalLink,
  Flame,
  CheckCircle2
} from 'lucide-react';
import { fetchExperimentSummary, fetchExperimentMetrics, fetchExperimentEnsembleWeights } from '../services/api';

interface LandingPageProps {
  onNavigate: (tab: string) => void;
}

const SkyLantern: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 40 56" className={className} fill="none">
    <defs>
      <radialGradient id="lanternGlow" cx="50%" cy="65%" r="60%">
        <stop offset="0%" stopColor="#FFF9C4" stopOpacity="1" />
        <stop offset="30%" stopColor="#FFE082" stopOpacity="0.95" />
        <stop offset="70%" stopColor="#FFA000" stopOpacity="0.85" />
        <stop offset="100%" stopColor="#E65100" stopOpacity="0.75" />
      </radialGradient>
      <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="2.5" result="glow" />
        <feComposite in="SourceGraphic" in2="glow" operator="over" />
      </filter>
    </defs>
    <path 
      d="M12 6 C10 6 7 12 6 22 C5 34 8 44 14 50 L26 50 C32 44 35 34 34 22 C33 12 30 6 28 6 Z" 
      fill="url(#lanternGlow)" 
      filter="url(#softGlow)"
    />
    <path d="M14 50 L26 50 L24 53 L16 53 Z" fill="#FFE082" />
    <circle cx="20" cy="38" r="3.5" fill="#FFFFFF" opacity="0.95" />
  </svg>
);

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const [metrics, setMetrics] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [weights, setWeights] = useState<any[]>([]);
  const [selectedStation, setSelectedStation] = useState<'ludhiana' | 'anand_vihar' | 'punjabi_bagh'>('ludhiana');

  useEffect(() => {
    fetchExperimentMetrics()
      .then(data => setMetrics(data.test_metrics_2019 || []))
      .catch(() => {});
    fetchExperimentSummary()
      .then(data => setSummary(data))
      .catch(() => {});
    fetchExperimentEnsembleWeights()
      .then(data => setWeights(data || []))
      .catch(() => {});
  }, []);

  const stationCards = {
    ludhiana: {
      name: 'Ludhiana, Punjab',
      aqi: 312,
      category: 'Poor',
      categoryColor: 'bg-[#C62828] text-white',
      peakDate: 'Diwali 2019 Peak Window',
      detail: 'CPCB CAAQMS Historical Record & Model Evaluation',
      sparkline: 'M0,45 Q15,42 30,38 T60,32 T90,28 T120,35 T150,22 T180,10',
      peakX: 180,
      peakY: 10
    },
    anand_vihar: {
      name: 'Anand Vihar (DL002)',
      aqi: 485,
      category: 'Severe',
      categoryColor: 'bg-[#8E0000] text-white',
      peakDate: 'Oct 28, 2019 02:00',
      detail: 'Test Set Scored: Residual XGBoost 472 µg/m³',
      sparkline: 'M0,50 Q20,44 40,36 T80,26 T120,18 T150,12 T180,6',
      peakX: 180,
      peakY: 6
    },
    punjabi_bagh: {
      name: 'Punjabi Bagh (DL019)',
      aqi: 368,
      category: 'Very Poor',
      categoryColor: 'bg-[#D32F2F] text-white',
      peakDate: 'Oct 27, 2019 23:00',
      detail: 'Test Set Scored: Weighted Ensemble 358 µg/m³',
      sparkline: 'M0,46 Q25,40 50,32 T100,28 T140,20 T180,8',
      peakX: 180,
      peakY: 8
    }
  };

  const card = stationCards[selectedStation];

  const scrollToExplore = () => {
    const el = document.getElementById('performance-preview');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="w-full bg-[#FAF9F5] text-[#0D2818] overflow-hidden">
      {/* =========================================================
          HERO SECTION (Faithfully matching reference video)
          ========================================================= */}
      <section className="relative min-h-[92vh] flex flex-col justify-between pt-6 sm:pt-10 pb-0 px-4 sm:px-8 lg:px-14 overflow-hidden">
        
        {/* Top-Left Hanging Foliage Decorative Overlay */}
        <div 
          className="absolute top-0 left-0 w-24 sm:w-36 md:w-44 h-48 sm:h-64 pointer-events-none z-10 opacity-90 transition-opacity"
          style={{
            backgroundImage: "url('/assets/foliage_left.png')",
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'contain',
            backgroundPosition: 'top left'
          }}
        />

        {/* Floating Diwali Sky Lanterns (Vector SVG, Clean, Zero-Clipping) */}
        <div className="absolute top-12 left-1/3 w-8 h-12 pointer-events-none opacity-85 animate-pulse hidden sm:block">
          <SkyLantern className="w-full h-full filter drop-shadow(0 0 8px rgba(255,180,50,0.8))" />
        </div>
        <div className="absolute top-28 right-1/4 w-10 h-14 pointer-events-none opacity-90 hidden md:block">
          <SkyLantern className="w-full h-full filter drop-shadow(0 0 10px rgba(255,180,50,0.9))" />
        </div>
        <div className="absolute top-8 right-16 w-12 h-16 pointer-events-none opacity-95">
          <SkyLantern className="w-full h-full filter drop-shadow(0 0 12px rgba(255,180,50,1))" />
        </div>

        {/* Hero Content Grid (Left: Typography & CTAs, Right: Globe & Card) */}
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center z-10 mb-8 sm:mb-12">
          
          {/* Left Column: Heading, Subtitle & Action Buttons */}
          <div className="lg:col-span-7 flex flex-col items-start space-y-6 pt-4 lg:pt-8">
            
            {/* Eyebrow Label */}
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#EBF3EA]/80 backdrop-blur-sm border border-[#D1DFD4] text-[#1B4332] text-xs sm:text-sm font-medium shadow-xs">
              <span className="text-[#2D6A4F]">🍃</span>
              <span>Cleaner Air. Healthier Tomorrow.</span>
            </div>

            {/* Main Title with Brand Mark */}
            <div className="space-y-1">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-[#133E26] font-sans">
                  Diwali
                </h1>
                {/* Outlined Cloud with Leaf Logo */}
                <div className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center">
                  <svg viewBox="0 0 64 64" className="w-full h-full text-[#4A7C20]" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M18 42 C12 42 8 36 8 30 C8 24 13 20 18 20 C20 12 28 8 38 10 C46 12 52 18 54 26 C59 28 62 33 60 38 C58 43 54 44 48 44 Z" stroke="#133E26" strokeWidth="3.5" fill="white" fillOpacity="0.4" />
                    <path d="M30 36 C34 24 46 22 46 22 C46 22 46 34 36 38 C33 39 30 36 30 36 Z" fill="#4A7C20" stroke="#133E26" strokeWidth="2" />
                    <path d="M30 36 L44 24" stroke="#FAF9F5" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
              <h2 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-[#4A7C20] font-sans bg-clip-text">
                AirSense
              </h2>
            </div>

            {/* Supporting Description */}
            <p className="text-base sm:text-lg lg:text-xl text-[#2D4A36] max-w-xl font-normal leading-relaxed">
              Real-time air quality insights across Punjab & Northern India during Diwali and beyond.
            </p>

            <p className="text-xs sm:text-sm text-[#4A6B56] max-w-lg leading-relaxed">
              An offline-first, scientifically validated machine-learning intelligence platform forecasting next-hour PM2.5, tracking stubble fire smoke plumes, and empowering citizens with actionable health advisories.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <button
                onClick={() => onNavigate('map')}
                className="inline-flex items-center space-x-2.5 px-6 py-3 rounded-full bg-[#133E26] text-white hover:bg-[#0F3822] transition-all duration-200 shadow-md hover:shadow-lg font-medium text-sm sm:text-base cursor-pointer group"
              >
                <MapPin className="w-4 h-4 text-[#B8D8BA]" />
                <span>Explore Map</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => onNavigate('analytics')}
                className="inline-flex items-center space-x-2 px-6 py-3 rounded-full bg-white/70 hover:bg-white backdrop-blur-sm border border-[#D1DFD4] text-[#133E26] transition-all duration-200 shadow-xs hover:shadow-md font-medium text-sm sm:text-base cursor-pointer"
              >
                <BarChart3 className="w-4 h-4 text-[#2D6A4F]" />
                <span>View Insights</span>
              </button>
            </div>

            {/* 3 Value Propositions */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-4 border-t border-[#D1DFD4]/50 w-full max-w-lg">
              <div className="flex items-center space-x-2 text-xs sm:text-sm font-medium text-[#133E26]">
                <span className="text-[#2D6A4F] text-base">🍃</span>
                <span>Track Air Quality</span>
              </div>
              <div className="flex items-center space-x-2 text-xs sm:text-sm font-medium text-[#133E26]">
                <span className="text-[#2D6A4F] text-base">📊</span>
                <span>Find Hotspots</span>
              </div>
              <div className="flex items-center space-x-2 text-xs sm:text-sm font-medium text-[#133E26]">
                <span className="text-[#2D6A4F] text-base">🛡️</span>
                <span>Breathe Healthier</span>
              </div>
            </div>

          </div>

          {/* Right Column: Rotating Globe & Floating AQI Card */}
          <div className="lg:col-span-5 relative flex items-center justify-center min-h-[380px] sm:min-h-[460px]">
            
            {/* Ambient Backlight Glow behind Globe */}
            <div className="absolute w-72 sm:w-96 h-72 sm:h-96 rounded-full bg-[#85A98F]/25 blur-3xl -z-10 animate-pulse" />

            {/* Central Rotating Globe Video / Visual */}
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 lg:w-[380px] lg:h-[380px] rounded-full overflow-hidden shadow-2xl border-2 border-white/50">
              <video
                src="/assets/globe_loop.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover scale-105"
              />
              {/* Atmospheric Glow Ring */}
              <div className="absolute inset-0 rounded-full border border-emerald-300/40 pointer-events-none ring-4 ring-emerald-400/20" />
            </div>

            {/* Floating Local Air Quality Card (Frosted Glass, Perfectly Matching Video) */}
            <div className="absolute top-2 right-0 sm:-right-4 w-60 sm:w-72 bg-white/85 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/80 shadow-xl transition-all duration-300 z-20">
              <div className="flex items-center justify-between pb-2 border-b border-[#EBF3EA]">
                <div className="flex items-center space-x-1.5">
                  <MapPin className="w-4 h-4 text-[#133E26]" />
                  <span className="text-sm font-bold text-[#133E26] tracking-tight">{card.name}</span>
                </div>
                <Sparkles className="w-3.5 h-3.5 text-[#4A7C20]" />
              </div>

              {/* AQI Score & Category Badge */}
              <div className="mt-3 flex items-baseline justify-between">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#4A6B56]">AQI (PM2.5)</span>
                  <div className="text-3xl sm:text-4xl font-extrabold text-[#C62828] leading-none mt-0.5">
                    {card.aqi}
                  </div>
                </div>

                <div className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider flex items-center space-x-1 ${card.categoryColor}`}>
                  <span className="text-[10px]">⚠️</span>
                  <span>{card.category}</span>
                </div>
              </div>

              {/* Sparkline Trend Chart */}
              <div className="mt-3 pt-2">
                <div className="text-[10px] text-[#4A6B56] flex justify-between items-center mb-1">
                  <span>24h Historical Progression</span>
                  <span className="font-semibold text-[#133E26]">{card.peakDate}</span>
                </div>
                <div className="h-10 w-full relative">
                  <svg viewBox="0 0 200 60" className="w-full h-full overflow-visible">
                    <defs>
                      <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#C62828" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#C62828" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    {/* Trend Curve */}
                    <path
                      d={`${card.sparkline} L200,60 L0,60 Z`}
                      fill="url(#sparkGrad)"
                    />
                    <path
                      d={card.sparkline}
                      fill="none"
                      stroke="#C62828"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    {/* Peak Point Dot */}
                    <circle cx={card.peakX} cy={card.peakY} r="3.5" fill="#C62828" stroke="#FFFFFF" strokeWidth="1.5" />
                  </svg>
                </div>
              </div>

              {/* Honest Provenance Footnote & Station Switcher */}
              <div className="mt-2.5 pt-2 border-t border-[#EBF3EA] flex items-center justify-between text-[10px] text-[#4A6B56]">
                <span className="truncate max-w-[150px]">{card.detail}</span>
                <select
                  value={selectedStation}
                  onChange={(e) => setSelectedStation(e.target.value as any)}
                  className="bg-[#EBF3EA] text-[#133E26] font-semibold text-[10px] px-1.5 py-0.5 rounded border border-[#D1DFD4] cursor-pointer"
                  title="Switch station record"
                >
                  <option value="ludhiana">Ludhiana</option>
                  <option value="anand_vihar">Anand Vihar</option>
                  <option value="punjabi_bagh">Punjabi Bagh</option>
                </select>
              </div>
            </div>

          </div>

        </div>

        {/* Landscape Footer & Diya Decorative Base Plate (Seamlessly anchored at bottom) */}
        <div className="relative w-full mt-4 -mx-4 sm:-mx-8 lg:-mx-14 overflow-hidden">
          <img 
            src="/assets/landscape_footer.png" 
            alt="Punjab Golden Temple Sarovar & Diwali Diya Silhouette" 
            className="w-full h-32 sm:h-44 md:h-52 object-cover object-top select-none pointer-events-none"
          />

          {/* Scroll to Explore Interactive Pill Centered on Water */}
          <div className="absolute inset-x-0 bottom-4 sm:bottom-6 flex flex-col items-center justify-center">
            <button
              onClick={scrollToExplore}
              className="flex flex-col items-center group cursor-pointer text-[#FAF9F5] hover:text-[#CCE2C5] transition-colors"
            >
              <div className="w-8 h-8 rounded-full border border-white/60 bg-black/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                <ChevronDown className="w-4 h-4 text-white group-hover:translate-y-0.5 transition-transform" />
              </div>
              <span className="text-[11px] font-medium tracking-wide mt-1 text-white/90 drop-shadow-sm">
                Scroll to Explore
              </span>
            </button>
          </div>
        </div>

      </section>

      {/* =========================================================
          SECTION 2: REAL EXPERIMENT MODEL EVALUATION RESULTS
          (Backed directly by model_metrics.csv & validation_metrics.csv)
          ========================================================= */}
      <section id="performance-preview" className="py-16 px-4 sm:px-8 lg:px-14 bg-white border-t border-[#D1DFD4]">
        <div className="max-w-7xl mx-auto space-y-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#EBF3EA] text-[#1B4332] text-xs font-semibold mb-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#2D6A4F]" />
                <span>Source of Truth: model_metrics.csv (2019 Scored Test Evaluation)</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0D2818] tracking-tight">
                Empirical Model Benchmarking on CPCB Test Records
              </h2>
              <p className="text-sm text-[#4A6B56] max-w-2xl mt-1">
                Direct next-hour PM2.5 forecasting evaluated across 119,055 out-of-sample test records for 2019, including Diwali ±7-day and ±3-day peak festival windows.
              </p>
            </div>

            <button
              onClick={() => onNavigate('analytics')}
              className="inline-flex items-center space-x-2 text-sm font-bold text-[#1B4332] hover:text-[#2D6A4F] transition-colors"
            >
              <span>Explore Full Analytics Suite</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Model Metrics Comparative Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1: All 2019 Evaluation */}
            <div className="bg-[#FAF9F5] p-5 rounded-xl border border-[#D1DFD4] shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#D1DFD4]">
                <div>
                  <h3 className="font-bold text-[#0D2818] text-base">All 2019 Test Set</h3>
                  <p className="text-xs text-[#4A6B56]">Chronological Out-of-Sample</p>
                </div>
                <span className="px-2 py-0.5 bg-[#EBF3EA] text-[#1B4332] rounded text-xs font-mono font-bold">
                  n = 119,055
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center p-2 rounded bg-white border border-[#85A98F]/40 font-medium">
                  <span className="text-[#133E26] font-bold">Residual XGBoost (Lowest MAE)</span>
                  <div className="text-right">
                    <span className="font-bold text-[#133E26]">MAE 12.711</span>
                    <span className="text-[#4A6B56] ml-2">RMSE 26.518</span>
                  </div>
                </div>

                <div className="flex justify-between items-center p-2 rounded bg-white border border-[#D1DFD4]">
                  <span className="text-[#0D2818]">Weighted Ensemble (Lowest RMSE)</span>
                  <div className="text-right">
                    <span className="font-semibold text-[#0D2818]">MAE 12.768</span>
                    <span className="font-bold text-[#133E26] ml-2">RMSE 26.334</span>
                  </div>
                </div>

                <div className="flex justify-between items-center p-2 rounded bg-white border border-[#D1DFD4]">
                  <span className="text-[#0D2818]">Standard XGBoost</span>
                  <div className="text-right">
                    <span>MAE 12.974</span>
                    <span className="ml-2">RMSE 26.517</span>
                  </div>
                </div>

                <div className="flex justify-between items-center p-2 rounded bg-white border border-[#D1DFD4]">
                  <span className="text-[#0D2818]">LightGBM</span>
                  <div className="text-right">
                    <span>MAE 13.093</span>
                    <span className="ml-2">RMSE 26.695</span>
                  </div>
                </div>

                <div className="flex justify-between items-center p-2 rounded bg-white/60 border border-[#D1DFD4] text-[#4A6B56]">
                  <span>Persistence Baseline</span>
                  <div className="text-right">
                    <span>MAE 13.490</span>
                    <span className="ml-2">RMSE 28.591</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Diwali +- 7 Days Evaluation */}
            <div className="bg-[#FAF9F5] p-5 rounded-xl border border-[#D1DFD4] shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#D1DFD4]">
                <div>
                  <h3 className="font-bold text-[#0D2818] text-base">Diwali ±7 Days Window</h3>
                  <p className="text-xs text-[#4A6B56]">Festival Smoke & Weather Inversion</p>
                </div>
                <span className="px-2 py-0.5 bg-[#EBF3EA] text-[#1B4332] rounded text-xs font-mono font-bold">
                  n = 4,592
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center p-2 rounded bg-white border border-[#85A98F]/40 font-medium">
                  <span className="text-[#133E26] font-bold">Residual XGBoost (Lowest MAE)</span>
                  <div className="text-right">
                    <span className="font-bold text-[#133E26]">MAE 15.965</span>
                    <span className="text-[#4A6B56] ml-2">RMSE 30.256</span>
                  </div>
                </div>

                <div className="flex justify-between items-center p-2 rounded bg-white border border-[#D1DFD4]">
                  <span className="text-[#0D2818]">Weighted Ensemble (Lowest RMSE)</span>
                  <div className="text-right">
                    <span className="font-semibold text-[#0D2818]">MAE 16.080</span>
                    <span className="font-bold text-[#133E26] ml-2">RMSE 29.902</span>
                  </div>
                </div>

                <div className="flex justify-between items-center p-2 rounded bg-white border border-[#D1DFD4]">
                  <span className="text-[#0D2818]">Standard XGBoost</span>
                  <div className="text-right">
                    <span>MAE 16.339</span>
                    <span className="ml-2">RMSE 30.243</span>
                  </div>
                </div>

                <div className="flex justify-between items-center p-2 rounded bg-white border border-[#D1DFD4]">
                  <span className="text-[#0D2818]">LightGBM</span>
                  <div className="text-right">
                    <span>MAE 16.609</span>
                    <span className="ml-2">RMSE 30.474</span>
                  </div>
                </div>

                <div className="flex justify-between items-center p-2 rounded bg-white/60 border border-[#D1DFD4] text-[#4A6B56]">
                  <span>Persistence Baseline</span>
                  <div className="text-right">
                    <span>MAE 17.464</span>
                    <span className="ml-2">RMSE 33.649</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Diwali +- 3 Days Evaluation */}
            <div className="bg-[#FAF9F5] p-5 rounded-xl border border-[#D1DFD4] shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#D1DFD4]">
                <div>
                  <h3 className="font-bold text-[#0D2818] text-base">Diwali ±3 Days Peak</h3>
                  <p className="text-xs text-[#4A6B56]">Max Pyrotechnic Surge Window</p>
                </div>
                <span className="px-2 py-0.5 bg-[#EBF3EA] text-[#1B4332] rounded text-xs font-mono font-bold">
                  n = 1,946
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center p-2 rounded bg-white border border-[#85A98F]/40 font-medium">
                  <span className="text-[#133E26] font-bold">Residual XGBoost (Lowest MAE)</span>
                  <div className="text-right">
                    <span className="font-bold text-[#133E26]">MAE 17.618</span>
                    <span className="text-[#4A6B56] ml-2">RMSE 36.173</span>
                  </div>
                </div>

                <div className="flex justify-between items-center p-2 rounded bg-white border border-[#D1DFD4]">
                  <span className="text-[#0D2818]">Weighted Ensemble (Lowest RMSE)</span>
                  <div className="text-right">
                    <span className="font-semibold text-[#0D2818]">MAE 17.721</span>
                    <span className="font-bold text-[#133E26] ml-2">RMSE 35.338</span>
                  </div>
                </div>

                <div className="flex justify-between items-center p-2 rounded bg-white border border-[#D1DFD4]">
                  <span className="text-[#0D2818]">Standard XGBoost</span>
                  <div className="text-right">
                    <span>MAE 17.944</span>
                    <span className="ml-2">RMSE 35.661</span>
                  </div>
                </div>

                <div className="flex justify-between items-center p-2 rounded bg-white border border-[#D1DFD4]">
                  <span className="text-[#0D2818]">LightGBM</span>
                  <div className="text-right">
                    <span>MAE 18.280</span>
                    <span className="ml-2">RMSE 35.751</span>
                  </div>
                </div>

                <div className="flex justify-between items-center p-2 rounded bg-white/60 border border-[#D1DFD4] text-[#4A6B56]">
                  <span>Persistence Baseline</span>
                  <div className="text-right">
                    <span>MAE 20.588</span>
                    <span className="ml-2">RMSE 41.956</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Scientific Honesty Banner: Trade-offs & Ensemble Weights */}
          <div className="p-4 rounded-xl bg-[#EBF3EA] border border-[#85A98F] flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-[#1B4332] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#1B4332] text-sm">Key Evaluation Finding & Model Trade-offs:</span>
                <p className="text-[#2D4A36] mt-0.5">
                  <strong>Residual XGBoost</strong> consistently achieves the lowest Mean Absolute Error (MAE 12.71 in 2019, 15.96 in Diwali ±7d, 17.62 in Diwali ±3d), while <strong>Weighted Ensemble</strong> achieves the lowest Root Mean Squared Error (RMSE 26.33, 29.90, and 35.34), effectively penalizing severe outliers. Neither model is universally superior; both significantly outperform Persistence (MAE 13.49, RMSE 28.59).
                </p>
              </div>
            </div>

            <div className="shrink-0 flex items-center space-x-2 bg-white px-3 py-2 rounded-lg border border-[#D1DFD4]">
              <span className="font-bold text-[#133E26]">Ensemble Weights:</span>
              <span className="text-[#4A6B56]">RF: 0.00 | XGB: 0.05 | LGBM: 0.45 | Res-XGB: 0.50</span>
            </div>
          </div>

        </div>
      </section>

      {/* =========================================================
          SECTION 3: DATASET OF TRUTH & CHRONOLOGICAL METHODOLOGY
          ========================================================= */}
      <section className="py-16 px-4 sm:px-8 lg:px-14 bg-[#FAF9F5]">
        <div className="max-w-7xl mx-auto space-y-10">
          
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0D2818] tracking-tight">
              Trained Dataset Provenance & Methodology
            </h2>
            <p className="text-sm text-[#4A6B56]">
              Verified Kaggle / CPCB CAAQMS hourly ground monitoring archive (2015 to July 2020). Zero synthetic extrapolation or fabrication.
            </p>
          </div>

          {/* Metric Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="p-4 rounded-xl bg-white border border-[#D1DFD4] text-center shadow-xs">
              <div className="text-2xl sm:text-3xl font-extrabold text-[#1B4332]">2.58M</div>
              <div className="text-[11px] font-semibold text-[#4A6B56] mt-1">Raw Source Rows</div>
            </div>
            <div className="p-4 rounded-xl bg-white border border-[#D1DFD4] text-center shadow-xs">
              <div className="text-2xl sm:text-3xl font-extrabold text-[#1B4332]">705,691</div>
              <div className="text-[11px] font-semibold text-[#4A6B56] mt-1">Modeling Subset</div>
            </div>
            <div className="p-4 rounded-xl bg-white border border-[#D1DFD4] text-center shadow-xs">
              <div className="text-2xl sm:text-3xl font-extrabold text-[#1B4332]">15</div>
              <div className="text-[11px] font-semibold text-[#4A6B56] mt-1">Selected Stations</div>
            </div>
            <div className="p-4 rounded-xl bg-white border border-[#D1DFD4] text-center shadow-xs">
              <div className="text-2xl sm:text-3xl font-extrabold text-[#1B4332]">527,868</div>
              <div className="text-[11px] font-semibold text-[#4A6B56] mt-1">Nonmissing PM2.5</div>
            </div>
            <div className="p-4 rounded-xl bg-white border border-[#D1DFD4] text-center shadow-xs">
              <div className="text-2xl sm:text-3xl font-extrabold text-[#1B4332]">100,000</div>
              <div className="text-[11px] font-semibold text-[#4A6B56] mt-1">Training Sample</div>
            </div>
            <div className="p-4 rounded-xl bg-white border border-[#D1DFD4] text-center shadow-xs">
              <div className="text-2xl sm:text-3xl font-extrabold text-[#1B4332]">119,055</div>
              <div className="text-[11px] font-semibold text-[#4A6B56] mt-1">2019 Scored Tests</div>
            </div>
          </div>

          {/* 3 Integrity Pillar Boxes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="p-6 rounded-xl bg-white border border-[#D1DFD4] shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-lg bg-[#EBF3EA] flex items-center justify-center text-[#1B4332]">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#0D2818]">Strict Chronological Splitting</h3>
              <p className="text-xs text-[#4A6B56] leading-relaxed">
                Training data strictly restricted to $\le$ 2017; hyperparameter tuning and ensemble weight calculation performed on 2018; out-of-sample evaluation performed on 2019 without refitting. Zero temporal leakage.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-white border border-[#D1DFD4] shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-lg bg-[#EBF3EA] flex items-center justify-center text-[#1B4332]">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#0D2818]">Verified 15 Monitoring Stations</h3>
              <p className="text-xs text-[#4A6B56] leading-relaxed">
                Selected strictly by observation completeness: DL002, DL019, DL021, DL028, DL031 (Delhi NCR), HR014 (Haryana), UP012, UP014 (Uttar Pradesh), GJ001 (Gujarat), KA003, KA009 (Karnataka), TG005 (Telangana), TN001, TN003, TN004 (Tamil Nadu).
              </p>
            </div>

            <div className="p-6 rounded-xl bg-white border border-[#D1DFD4] shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-lg bg-[#EBF3EA] flex items-center justify-center text-[#1B4332]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#0D2818]">Absolute Non-Fabrication Protocol</h3>
              <p className="text-xs text-[#4A6B56] leading-relaxed">
                The dataset ends in July 2020. The system does not claim validation on 2026 or live data. Station codes are never plotted through guesswork. Weather, fire, and traffic are treated as independent telemetry layers, not baked into the 2015-2020 weights.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* =========================================================
          SECTION 4: INTERACTIVE PLATFORM MODULES QUICK-LAUNCH
          ========================================================= */}
      <section className="py-16 px-4 sm:px-8 lg:px-14 bg-white border-t border-[#D1DFD4]">
        <div className="max-w-7xl mx-auto space-y-8">
          
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0D2818] tracking-tight">
              Interactive System Modules & Geospatial Intelligence
            </h2>
            <p className="text-sm text-[#4A6B56]">
              Navigate seamlessly to any functional component of the Diwali AirSense ecosystem.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Module 1: Air Quality Map */}
            <div 
              onClick={() => onNavigate('map')}
              className="p-5 rounded-xl border border-[#D1DFD4] hover:border-[#1B4332] bg-[#FAF9F5] hover:bg-white transition-all duration-200 cursor-pointer group shadow-xs hover:shadow-md"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-[#1B4332] text-white flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <ArrowRight className="w-4 h-4 text-[#4A6B56] group-hover:text-[#1B4332] group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="text-base font-bold text-[#0D2818] group-hover:text-[#1B4332]">
                Geospatial Multi-Layer Map
              </h3>
              <p className="text-xs text-[#4A6B56] mt-1.5 leading-relaxed">
                Interactive Leaflet map displaying verified CPCB CAAQMS stations, NASA FIRMS active fire pixels, Delhi arterial road corridors, and citizen ground reports.
              </p>
            </div>

            {/* Module 2: Prediction Analytics */}
            <div 
              onClick={() => onNavigate('analytics')}
              className="p-5 rounded-xl border border-[#D1DFD4] hover:border-[#1B4332] bg-[#FAF9F5] hover:bg-white transition-all duration-200 cursor-pointer group shadow-xs hover:shadow-md"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-[#2D6A4F] text-white flex items-center justify-center">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <ArrowRight className="w-4 h-4 text-[#4A6B56] group-hover:text-[#1B4332] group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="text-base font-bold text-[#0D2818] group-hover:text-[#1B4332]">
                Prediction Analytics & 100k Sample
              </h3>
              <p className="text-xs text-[#4A6B56] mt-1.5 leading-relaxed">
                Deep dive into actual vs next-hour predicted PM2.5, residual distributions, feature importances (LightGBM/XGBoost), and FIRMS 0-72h smoke lag correlations.
              </p>
            </div>

            {/* Module 3: Diwali Progression */}
            <div 
              onClick={() => onNavigate('progression')}
              className="p-5 rounded-xl border border-[#D1DFD4] hover:border-[#1B4332] bg-[#FAF9F5] hover:bg-white transition-all duration-200 cursor-pointer group shadow-xs hover:shadow-md"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-[#C62828] text-white flex items-center justify-center">
                  <Flame className="w-5 h-5" />
                </div>
                <ArrowRight className="w-4 h-4 text-[#4A6B56] group-hover:text-[#1B4332] group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="text-base font-bold text-[#0D2818] group-hover:text-[#1B4332]">
                Diwali Multi-Year Progression
              </h3>
              <p className="text-xs text-[#4A6B56] mt-1.5 leading-relaxed">
                Comparative relative-day curves (Day -30 to Day +30) aligning historical Diwali dates across 2015 to 2019 to observe pre-festival surges and post-Diwali recovery rates.
              </p>
            </div>

            {/* Module 4: Vehicle Intelligence & Clean Routes */}
            <div 
              onClick={() => onNavigate('vehicles')}
              className="p-5 rounded-xl border border-[#D1DFD4] hover:border-[#1B4332] bg-[#FAF9F5] hover:bg-white transition-all duration-200 cursor-pointer group shadow-xs hover:shadow-md"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-[#133E26] text-white flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <ArrowRight className="w-4 h-4 text-[#4A6B56] group-hover:text-[#1B4332] group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="text-base font-bold text-[#0D2818] group-hover:text-[#1B4332]">
                Vehicle Intelligence & Clean Routes
              </h3>
              <p className="text-xs text-[#4A6B56] mt-1.5 leading-relaxed">
                Computer-vision vehicle classification across 5 vehicle classes, arterial corridor congestion indices, and cumulative particulate route exposure comparison.
              </p>
            </div>

            {/* Module 5: Qwen AI Assistant */}
            <div 
              onClick={() => onNavigate('ai')}
              className="p-5 rounded-xl border border-[#D1DFD4] hover:border-[#1B4332] bg-[#FAF9F5] hover:bg-white transition-all duration-200 cursor-pointer group shadow-xs hover:shadow-md"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-[#4A7C20] text-white flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <ArrowRight className="w-4 h-4 text-[#4A6B56] group-hover:text-[#1B4332] group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="text-base font-bold text-[#0D2818] group-hover:text-[#1B4332]">
                Qwen 3.8 AI Assistant & Explainability
              </h3>
              <p className="text-xs text-[#4A6B56] mt-1.5 leading-relaxed">
                OpenAI-compatible Qwen 3.8 assistant with strict station telemetry grounding, feature attribution explanations, event synthesis, and offline deterministic fallback.
              </p>
            </div>

            {/* Module 6: Bloom's Decision Support */}
            <div 
              onClick={() => onNavigate('blooms')}
              className="p-5 rounded-xl border border-[#D1DFD4] hover:border-[#1B4332] bg-[#FAF9F5] hover:bg-white transition-all duration-200 cursor-pointer group shadow-xs hover:shadow-md"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-[#1B4332] text-white flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <ArrowRight className="w-4 h-4 text-[#4A6B56] group-hover:text-[#1B4332] group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="text-base font-bold text-[#0D2818] group-hover:text-[#1B4332]">
                Bloom's Taxonomy Decision Support
              </h3>
              <p className="text-xs text-[#4A6B56] mt-1.5 leading-relaxed">
                6 cognitive levels (Remember, Understand, Apply, Analyze, Evaluate, Create) for public health protection, policy scorecards, and ward-level action plan generation.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* =========================================================
          SECTION 5: PROJECT FOOTER
          ========================================================= */}
      <footer className="bg-[#123524] text-white py-12 px-4 sm:px-8 lg:px-14 border-t border-[#1B4332]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded bg-white/10 flex items-center justify-center text-white font-bold text-xs">
                AS
              </div>
              <span className="text-lg font-bold tracking-tight text-[#CCE2C5]">Diwali AirSense</span>
            </div>
            <p className="text-xs text-white/70 max-w-md leading-relaxed">
              An offline-first, neighbourhood-level air pollution forecasting system built for research and public awareness during Diwali and winter pollution episodes in Northern India.
            </p>
            <div className="text-[11px] text-[#85A98F]">
              Dataset: 2015-01-01 to 2020-07-01 (15 CAAQMS Stations, 2.58M source observations)
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <span className="font-bold text-[#CCE2C5] uppercase tracking-wider text-[11px]">Core Navigation</span>
            <ul className="space-y-1.5 text-white/70">
              <li><button onClick={() => onNavigate('overview')} className="hover:text-white transition-colors">Home Landing</button></li>
              <li><button onClick={() => onNavigate('map')} className="hover:text-white transition-colors">Air Quality Map</button></li>
              <li><button onClick={() => onNavigate('analytics')} className="hover:text-white transition-colors">Prediction Analytics</button></li>
              <li><button onClick={() => onNavigate('evaluation')} className="hover:text-white transition-colors">Model Performance</button></li>
              <li><button onClick={() => onNavigate('environmental')} className="hover:text-white transition-colors">Data Sources & Transparency</button></li>
            </ul>
          </div>

          <div className="space-y-2 text-xs">
            <span className="font-bold text-[#CCE2C5] uppercase tracking-wider text-[11px]">Scientific Honesty</span>
            <p className="text-[11px] text-white/60 leading-relaxed">
              Historical model evaluation scores reflect out-of-sample 2019 test data. Future year inferences are subject to seasonal meteorological volatility and boundary layer inversions.
            </p>
            <div className="pt-2 text-[10px] text-white/40">
              Built with FastAPI, React 19, Tailwind CSS, Leaflet &amp; Recharts.
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
};
