import React, { useState } from 'react';
import { Wifi, RefreshCw, Sun, Moon, ChevronDown, Sparkles, SlidersHorizontal } from 'lucide-react';
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

  const mainNav = [
    { id: 'overview', label: 'Home' },
    { id: 'map', label: 'Map' },
    { id: 'analytics', label: 'Insights' },
    { id: 'environmental', label: 'About' },
  ];

  const analysisModules = [
    { id: 'evaluation', label: 'Model Evaluation' },
    { id: 'forecast', label: 'Forecast Explorer' },
    { id: 'progression', label: 'Diwali Progression' },
    { id: 'scenarios', label: 'Scenario Comparator' },
  ];

  const intelligenceModules = [
    { id: 'ai', label: 'Qwen AI Assistant' },
    { id: 'vehicles', label: 'Vehicle Intelligence' },
    { id: 'community', label: 'Citizen Reports' },
    { id: 'blooms', label: 'Decision Support' },
    { id: 'automation', label: 'n8n Automation' },
  ];

  const isToolActive = [...analysisModules, ...intelligenceModules].some(t => t.id === currentTab);

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-[#D1DFD4] sticky top-0 z-40 transition-colors">
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
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer ${
                  isToolActive
                    ? 'bg-[#133E26] text-white shadow-xs'
                    : 'text-[#4A6B56] hover:text-[#133E26] hover:bg-white/80'
                }`}
              >
                <span>Modules</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {moreOpen && (
                <div 
                  className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-[#D1DFD4] py-2 z-50 animate-in fade-in slide-in-from-top-2"
                  onMouseLeave={() => setMoreOpen(false)}
                >
                  <div className="px-3.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#4A6B56]">
                    Forecasting &amp; Analytics
                  </div>
                  {analysisModules.map((tool) => (
                    <button
                      key={tool.id}
                      onClick={() => {
                        onSelectTab(tool.id);
                        setMoreOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-1.5 text-xs font-semibold transition-colors flex items-center justify-between cursor-pointer ${
                        currentTab === tool.id
                          ? 'bg-[#EBF3EA] text-[#133E26] font-bold'
                          : 'text-[#0D2818] hover:bg-[#FAF9F5]'
                      }`}
                    >
                      <span>{tool.label}</span>
                    </button>
                  ))}

                  <div className="px-3.5 py-1 mt-2 text-[10px] font-extrabold uppercase tracking-wider text-[#4A6B56] border-t border-[#EBF3EA]">
                    Intelligence &amp; Operations
                  </div>
                  {intelligenceModules.map((tool) => (
                    <button
                      key={tool.id}
                      onClick={() => {
                        onSelectTab(tool.id);
                        setMoreOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-1.5 text-xs font-semibold transition-colors flex items-center justify-between cursor-pointer ${
                        currentTab === tool.id
                          ? 'bg-[#EBF3EA] text-[#133E26] font-bold'
                          : 'text-[#0D2818] hover:bg-[#FAF9F5]'
                      }`}
                    >
                      <span>{tool.label}</span>
                    </button>
                  ))}
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
          {mainNav.concat(analysisModules.slice(0, 2)).concat(intelligenceModules.slice(0, 2)).map((item) => (
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
