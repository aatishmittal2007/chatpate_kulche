import React, { useState, useMemo } from 'react';
import { 
  Wifi, RefreshCw, Sun, Moon, ChevronDown, Sparkles, SlidersHorizontal, 
  ShieldCheck, Compass, Calendar, Car, Users, BookOpen, Cpu, Search, ArrowRight, X, LayoutGrid
} from 'lucide-react';
import { SystemStatus } from '../types';

interface HeaderProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  status: SystemStatus | null;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  status,
  onRefresh,
  isRefreshing
}) => {
  const [darkMode, setDarkMode] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [moduleSearch, setModuleSearch] = useState('');

  const mainNav = [
    { id: 'overview', label: 'Home' },
    { id: 'map', label: 'Map' },
    { id: 'analytics', label: 'Insights' },
    { id: 'environmental', label: 'About' },
  ];

  const analysisModules = [
    { 
      id: 'evaluation', 
      label: 'Model Evaluation', 
      desc: 'Metrics & ablation audit',
      icon: ShieldCheck,
      badge: 'Verified ML'
    },
    { 
      id: 'forecast', 
      label: 'Forecast Explorer', 
      desc: 'Multi-horizon neighborhood view',
      icon: Compass,
      badge: '+1h to +24h'
    },
    { 
      id: 'progression', 
      label: 'Diwali Progression', 
      desc: 'Synchronized multi-year curve',
      icon: Calendar,
      badge: 'Multi-Year'
    },
    { 
      id: 'scenarios', 
      label: 'Scenario Comparator', 
      desc: 'Intervention sensitivity lab',
      icon: SlidersHorizontal,
      badge: 'Sensitivity'
    },
  ];

  const intelligenceModules = [
    { 
      id: 'ai', 
      label: 'Qwen AI Assistant', 
      desc: 'Grounded reasoning copilot',
      icon: Sparkles,
      badge: 'Qwen 3.8'
    },
    { 
      id: 'vehicles', 
      label: 'Vehicle Intelligence', 
      desc: 'Arterial flow & exposure advisor',
      icon: Car,
      badge: 'Traffic Intel'
    },
    { 
      id: 'community', 
      label: 'Citizen Reports', 
      desc: 'Crowdsourced ground incidents',
      icon: Users,
      badge: 'Crowdsourced'
    },
    { 
      id: 'blooms', 
      label: 'Decision Support', 
      desc: '6-tier cognitive action system',
      icon: BookOpen,
      badge: 'Cognitive'
    },
    { 
      id: 'automation', 
      label: 'n8n Automation', 
      desc: 'Data ingestion & alert workflows',
      icon: Cpu,
      badge: 'Workflows'
    },
  ];

  const isToolActive = currentTab === 'modules' || [...analysisModules, ...intelligenceModules].some(t => t.id === currentTab);

  const filteredAnalysis = useMemo(() => {
    if (!moduleSearch.trim()) return analysisModules;
    const q = moduleSearch.toLowerCase();
    return analysisModules.filter(m => m.label.toLowerCase().includes(q) || m.desc.toLowerCase().includes(q));
  }, [moduleSearch]);

  const filteredIntelligence = useMemo(() => {
    if (!moduleSearch.trim()) return intelligenceModules;
    const q = moduleSearch.toLowerCase();
    return intelligenceModules.filter(m => m.label.toLowerCase().includes(q) || m.desc.toLowerCase().includes(q));
  }, [moduleSearch]);

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-[#D1DFD4] sticky top-0 z-40 transition-colors shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Brand Mark with Leaf inside Cloud Outline */}
          <div 
            onClick={() => onSelectTab('overview')}
            className="flex items-center space-x-2.5 cursor-pointer group select-none"
          >
            <div className="w-9 h-9 flex items-center justify-center">
              <svg viewBox="0 0 64 64" className="w-full h-full text-[#4A7C20]" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M18 42 C12 42 8 36 8 30 C8 24 13 20 18 20 C20 12 28 8 38 10 C46 12 52 18 54 26 C59 28 62 33 60 38 C58 43 54 44 48 44 Z" stroke="#133E26" strokeWidth="3.5" fill="#FAF9F5" />
                <path d="M30 36 C34 24 46 22 46 22 C46 22 46 34 36 38 C33 39 30 36 30 36 Z" fill="#2D6A4F" stroke="#133E26" strokeWidth="2" />
                <path d="M30 36 L44 24" stroke="#FAF9F5" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight text-[#133E26] font-sans leading-none">
                Diwali AirSense
              </span>
              <span className="text-[10px] font-semibold text-[#4A6B56] tracking-wider uppercase">
                Environmental Intelligence
              </span>
            </div>
          </div>

          {/* Center Pill Navigation */}
          <nav className="hidden md:flex items-center space-x-1 bg-[#FAF9F5] p-1.5 rounded-2xl border border-[#D1DFD4] shadow-2xs">
            {mainNav.map((item) => {
              const active = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
                    active
                      ? 'bg-[#133E26] text-white shadow-xs'
                      : 'text-[#4A6B56] hover:text-[#133E26] hover:bg-white/80'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}

            {/* Specialized Modules Dropdown */}
            <div className="relative">
              <button
                onClick={() => setMoreOpen(!moreOpen)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                  isToolActive
                    ? 'bg-[#133E26] text-white shadow-xs'
                    : 'text-[#4A6B56] hover:text-[#133E26] hover:bg-white/80'
                }`}
              >
                <span>Modules</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${moreOpen ? 'rotate-180' : ''}`} />
              </button>

              {moreOpen && (
                <div 
                  className="absolute right-0 mt-2.5 w-[460px] max-w-[90vw] bg-white rounded-2xl shadow-xl border border-[#D1DFD4] p-3 z-50 animate-in fade-in slide-in-from-top-2"
                  onMouseLeave={() => setMoreOpen(false)}
                >
                  {/* Top Bar: Quick Search + Hub Link */}
                  <div className="flex items-center gap-2 mb-3 pb-2.5 border-b border-[#EBF3EA]">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 text-[#4A6B56] absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Quick search modules..."
                        value={moduleSearch}
                        onChange={(e) => setModuleSearch(e.target.value)}
                        className="w-full pl-8 pr-7 py-1 text-xs bg-[#FAF9F5] border border-[#D1DFD4] rounded-lg text-[#0D2818] placeholder-[#85A98F] focus:outline-none focus:border-[#133E26]"
                      />
                      {moduleSearch && (
                        <button 
                          onClick={() => setModuleSearch('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-[#4A6B56] hover:text-[#133E26]"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        onSelectTab('modules');
                        setMoreOpen(false);
                      }}
                      className="px-2.5 py-1 text-[11px] font-bold text-[#133E26] bg-[#EBF3EA] hover:bg-[#D1DFD4] rounded-lg flex items-center gap-1 transition-colors whitespace-nowrap cursor-pointer"
                    >
                      <LayoutGrid className="w-3 h-3 text-[#2D6A4F]" />
                      <span>All Modules</span>
                    </button>
                  </div>

                  {/* Two Column Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-0.5">
                    {/* Col 1: Forecasting & Analytics */}
                    <div className="space-y-1">
                      <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#4A6B56] px-2 py-0.5">
                        Forecasting & Analytics
                      </div>
                      {filteredAnalysis.map((tool) => {
                        const Icon = tool.icon;
                        const isCurrent = currentTab === tool.id;
                        return (
                          <button
                            key={tool.id}
                            onClick={() => {
                              onSelectTab(tool.id);
                              setMoreOpen(false);
                            }}
                            className={`w-full text-left p-2 rounded-xl text-xs transition-all flex items-start gap-2.5 cursor-pointer ${
                              isCurrent
                                ? 'bg-[#EBF3EA] text-[#133E26]'
                                : 'hover:bg-[#FAF9F5] text-[#0D2818]'
                            }`}
                          >
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                              isCurrent ? 'bg-[#133E26] text-white' : 'bg-[#EBF3EA] text-[#133E26]'
                            }`}>
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-[11px] leading-tight flex items-center justify-between">
                                <span className="truncate">{tool.label}</span>
                              </div>
                              <div className="text-[10px] text-[#4A6B56] truncate mt-0.5">{tool.desc}</div>
                            </div>
                          </button>
                        );
                      })}
                      {filteredAnalysis.length === 0 && (
                        <div className="text-[11px] text-[#85A98F] italic px-2 py-1">No matching models</div>
                      )}
                    </div>

                    {/* Col 2: Intelligence & Operations */}
                    <div className="space-y-1">
                      <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#4A6B56] px-2 py-0.5">
                        Intelligence & Ops
                      </div>
                      {filteredIntelligence.map((tool) => {
                        const Icon = tool.icon;
                        const isCurrent = currentTab === tool.id;
                        return (
                          <button
                            key={tool.id}
                            onClick={() => {
                              onSelectTab(tool.id);
                              setMoreOpen(false);
                            }}
                            className={`w-full text-left p-2 rounded-xl text-xs transition-all flex items-start gap-2.5 cursor-pointer ${
                              isCurrent
                                ? 'bg-[#EBF3EA] text-[#133E26]'
                                : 'hover:bg-[#FAF9F5] text-[#0D2818]'
                            }`}
                          >
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                              isCurrent ? 'bg-[#133E26] text-white' : 'bg-[#EBF3EA] text-[#133E26]'
                            }`}>
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-[11px] leading-tight flex items-center justify-between">
                                <span className="truncate">{tool.label}</span>
                              </div>
                              <div className="text-[10px] text-[#4A6B56] truncate mt-0.5">{tool.desc}</div>
                            </div>
                          </button>
                        );
                      })}
                      {filteredIntelligence.length === 0 && (
                        <div className="text-[11px] text-[#85A98F] italic px-2 py-1">No matching modules</div>
                      )}
                    </div>
                  </div>

                  {/* Bottom Footer bar */}
                  <div className="mt-2 pt-2 border-t border-[#EBF3EA] flex items-center justify-between text-[11px]">
                    <span className="text-[#4A6B56] font-medium">9 Specialized Subsystems</span>
                    <button
                      onClick={() => {
                        onSelectTab('modules');
                        setMoreOpen(false);
                      }}
                      className="font-bold text-[#133E26] hover:text-[#2D6A4F] flex items-center gap-1 cursor-pointer"
                    >
                      <span>Explore Hub</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* Right Status Indicator & Controls */}
          <div className="flex items-center space-x-2 sm:space-x-2.5 text-xs">
            
            {/* Offline Ready Pill */}
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#EBF3EA] border border-[#85A98F] text-[#133E26] font-bold shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
              <span className="text-[11px]">Offline Ready</span>
            </div>

            {/* Refresh SQLite Observation Cache */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Refresh local telemetry data"
              className="p-2 rounded-xl border border-[#D1DFD4] hover:bg-[#EBF3EA] text-[#133E26] transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>

            {/* Sun / Dark Theme Toggle Button */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              title="Toggle color theme"
              className="p-2 rounded-xl border border-[#D1DFD4] hover:bg-[#EBF3EA] text-[#133E26] transition-colors cursor-pointer shadow-xs"
            >
              {darkMode ? <Moon className="w-3.5 h-3.5 text-[#133E26]" /> : <Sun className="w-3.5 h-3.5 text-[#133E26]" />}
            </button>

          </div>

        </div>

        {/* Mobile Navigation Row */}
        <div className="md:hidden flex items-center space-x-1.5 overflow-x-auto py-2 border-t border-[#EBF3EA]">
          <button
            onClick={() => onSelectTab('modules')}
            className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1 ${
              currentTab === 'modules'
                ? 'bg-[#133E26] text-white'
                : 'text-[#133E26] bg-[#EBF3EA] hover:bg-[#D1DFD4]'
            }`}
          >
            <LayoutGrid className="w-3 h-3" />
            <span>Modules Hub</span>
          </button>
          {mainNav.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                currentTab === item.id
                  ? 'bg-[#133E26] text-white'
                  : 'text-[#4A6B56] hover:bg-[#EBF3EA]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

      </div>
    </header>
  );
};
