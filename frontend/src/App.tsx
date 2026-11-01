import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { LandingPage } from './pages/LandingPage';
import { Overview } from './pages/Overview';
import { ProgressionView } from './pages/ProgressionView';
import { ForecastExplorer } from './pages/ForecastExplorer';
import { EnvironmentalView } from './pages/EnvironmentalView';
import { ScenarioView } from './pages/ScenarioView';
import { EvaluationView } from './pages/EvaluationView';
import { AIAssistantView } from './pages/AIAssistantView';
import { VehicleView } from './pages/VehicleView';
import { AnalyticsView } from './pages/AnalyticsView';
import { CommunityView } from './pages/CommunityView';
import { BloomsView } from './pages/BloomsView';
import { AutomationView } from './pages/AutomationView';
import { PollutionMap } from './maps/PollutionMap';
import { Station, SystemStatus, FireDetection, RoadCorridor, CommunityReport } from './types';
import {
  fetchNeighbourhoods,
  fetchSystemStatus,
  fetchEnvironmentalSources,
  fetchRoadCorridors,
  fetchCommunityReports
} from './services/api';

export default function App() {
  const [tab, setTab] = useState('overview');
  const [stations, setStations] = useState<Station[]>([
    { id: 'DEL_ANAND_VIHAR', name: 'Anand Vihar', city: 'Delhi', state: 'Delhi', latitude: 28.6469, longitude: 77.3160, is_active: true },
    { id: 'DEL_PUNJABI_BAGH', name: 'Punjabi Bagh', city: 'Delhi', state: 'Delhi', latitude: 28.6740, longitude: 77.1310, is_active: true },
    { id: 'DEL_RK_PURAM', name: 'R.K. Puram', city: 'Delhi', state: 'Delhi', latitude: 28.5632, longitude: 77.1869, is_active: true },
    { id: 'DEL_LODHI_ROAD', name: 'Lodhi Road', city: 'Delhi', state: 'Delhi', latitude: 28.5918, longitude: 77.2273, is_active: true },
    { id: 'PUN_PATIALA_THAPAR', name: 'Thapar Campus, Patiala', city: 'Patiala', state: 'Punjab', latitude: 30.3564, longitude: 76.3647, is_active: true },
  ]);
  const [selectedStationId, setSelectedStationId] = useState<string>('DEL_ANAND_VIHAR');
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [fires, setFires] = useState<FireDetection[]>([]);
  const [corridors, setCorridors] = useState<RoadCorridor[]>([]);
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const loadData = () => {
    setIsRefreshing(true);
    Promise.all([
      fetchNeighbourhoods().catch(() => stations),
      fetchSystemStatus().catch(() => null),
      fetchEnvironmentalSources().catch(() => null),
      fetchRoadCorridors().catch(() => []),
      fetchCommunityReports().catch(() => [])
    ]).then(([stns, stat, env, corrs, reps]) => {
      if (stns && stns.length) setStations(stns);
      if (stat) setStatus(stat);
      if (env) setFires(env.active_fires);
      if (corrs) setCorridors(corrs);
      if (reps) setReports(reps);
      setIsRefreshing(false);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#0D2818] flex flex-col font-sans">
      <Header
        currentTab={tab}
        onSelectTab={setTab}
        status={status}
        onRefresh={loadData}
        isRefreshing={isRefreshing}
      />

      {/* Main View Router */}
      {tab === 'overview' ? (
        <LandingPage onNavigate={setTab} />
      ) : (
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          {tab === 'station_monitor' && (
            <Overview
              stations={stations}
              selectedStationId={selectedStationId}
              onSelectStation={setSelectedStationId}
              onRefresh={loadData}
            />
          )}

          {tab === 'map' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-[#D1DFD4] shadow-xs flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                  <h2 className="text-lg font-extrabold text-[#133E26] tracking-tight">
                    Multi-Source Geospatial Intelligence Map
                  </h2>
                  <p className="text-xs text-[#4A6B56] mt-0.5">
                    Layered spatial view of CPCB reference stations, NASA FIRMS fire pixels, arterial corridors, and citizen ground reports
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-xs text-[#4A6B56] font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>5 Active Layers</span>
                </div>
              </div>
              <PollutionMap
                stations={stations}
                selectedStationId={selectedStationId}
                onSelectStation={setSelectedStationId}
                fires={fires}
                corridors={corridors}
                reports={reports}
              />
            </div>
          )}

          {tab === 'analytics' && <AnalyticsView />}

          {tab === 'evaluation' && <EvaluationView />}

          {tab === 'ai' && (
            <AIAssistantView
              stations={stations}
              selectedStationId={selectedStationId}
              onSelectStation={setSelectedStationId}
            />
          )}

          {tab === 'vehicles' && <VehicleView />}

          {tab === 'community' && (
            <CommunityView
              stations={stations}
              selectedStationId={selectedStationId}
            />
          )}

          {tab === 'blooms' && (
            <BloomsView
              stations={stations}
              selectedStationId={selectedStationId}
            />
          )}

          {tab === 'automation' && <AutomationView />}

          {tab === 'progression' && <ProgressionView />}

          {tab === 'forecast' && (
            <ForecastExplorer
              stations={stations}
              selectedStationId={selectedStationId}
              onSelectStation={setSelectedStationId}
            />
          )}

          {tab === 'environmental' && (
            <EnvironmentalView
              stations={stations}
              selectedStationId={selectedStationId}
              onSelectStation={setSelectedStationId}
            />
          )}

          {tab === 'scenarios' && (
            <ScenarioView
              stations={stations}
              selectedStationId={selectedStationId}
              onSelectStation={setSelectedStationId}
            />
          )}
        </main>
      )}

      {tab !== 'overview' && (
        <footer className="border-t border-[#D1DFD4] bg-white py-4 px-6 text-center text-xs text-[#4A6B56]">
          Diwali AirSense v2.0 &bull; AI-Powered Multi-Source Air Quality Intelligence, Prediction &amp; Environmental Monitoring Platform &bull; Offline-First Engine
        </footer>
      )}
    </div>
  );
}
