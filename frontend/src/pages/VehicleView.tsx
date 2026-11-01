import React, { useState, useEffect, useMemo } from 'react';
import { 
  Car, Bus, Truck, Bike, Navigation, Activity, ShieldCheck, Play, ArrowRight, 
  Search, Sliders, AlertTriangle, CheckCircle2, MapPin, Gauge, Leaf, Info
} from 'lucide-react';
import { RoadCorridor, VehicleDetectResponse, RouteExposureResponse } from '../types';
import { fetchRoadCorridors, runVehicleDetection, calculateRouteExposure } from '../services/api';

export const VehicleView: React.FC = () => {
  const [corridors, setCorridors] = useState<RoadCorridor[]>([]);
  const [detection, setDetection] = useState<VehicleDetectResponse | null>(null);
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [corridorSearch, setCorridorSearch] = useState<string>('');

  // Route Exposure state
  const [origin, setOrigin] = useState('Connaught Place, Central Delhi');
  const [destination, setDestination] = useState('Anand Vihar ISBT, East Delhi');
  const [travelMode, setTravelMode] = useState('car');
  const [routeResult, setRouteResult] = useState<RouteExposureResponse | null>(null);
  const [isSolvingRoute, setIsSolvingRoute] = useState(false);

  const loadCorridors = async () => {
    try {
      const data = await fetchRoadCorridors();
      setCorridors(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRunDetection = async () => {
    setIsDetecting(true);
    try {
      const res = await runVehicleDetection(30);
      setDetection(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDetecting(false);
    }
  };

  const handleSolveRoute = async () => {
    setIsSolvingRoute(true);
    try {
      const res = await calculateRouteExposure(origin, destination, travelMode);
      setRouteResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSolvingRoute(false);
    }
  };

  useEffect(() => {
    loadCorridors();
    handleRunDetection();
    handleSolveRoute();
  }, []);

  const filteredCorridors = useMemo(() => {
    if (!corridorSearch.trim()) return corridors;
    const q = corridorSearch.toLowerCase();
    return corridors.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.from_point.toLowerCase().includes(q) || 
      c.to_point.toLowerCase().includes(q)
    );
  }, [corridors, corridorSearch]);

  const originPresets = [
    'Connaught Place, Central Delhi',
    'ITO Junction, Central Delhi',
    'AIIMS Delhi, South Delhi',
    'Dwarka Sector 21, South West Delhi'
  ];

  const destinationPresets = [
    'Anand Vihar ISBT, East Delhi',
    'Rohini Sector 14, North West Delhi',
    'Noida Sector 62, NCR Border',
    'IGI Airport T3, South West Delhi'
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Standardized Module Header */}
      <div className="bg-white p-5 rounded-2xl border border-[#D1DFD4] shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#EBF3EA] border border-[#D1DFD4] flex items-center justify-center text-[#133E26] shrink-0">
            <Car className="w-5 h-5 text-[#133E26]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight text-[#133E26] font-sans">
                Vehicle Intelligence & Clean Route Exposure Advisor
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-md bg-[#EBF3EA] text-[#133E26] border border-[#85A98F]">
                Traffic Intel
              </span>
            </div>
            <p className="text-xs text-[#4A6B56] mt-0.5">
              Arterial corridor traffic tracking, automated vehicle classification, and personal inhalation exposure reduction
            </p>
          </div>
        </div>

        <button
          onClick={handleRunDetection}
          disabled={isDetecting}
          className="px-4 py-2 rounded-xl bg-[#133E26] hover:bg-[#2D6A4F] text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-50 whitespace-nowrap"
        >
          <Play className={`w-3.5 h-3.5 ${isDetecting ? 'animate-spin' : ''}`} />
          <span>{isDetecting ? 'Processing 30s Stream...' : 'Sample Video Stream (30s)'}</span>
        </button>
      </div>

      {/* 5-KPI Responsive Scorecard Grid */}
      {detection && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {/* 1. Cars */}
          <div className="bg-white p-4 rounded-2xl border border-[#D1DFD4] shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-[#4A6B56]">
              <span className="font-bold">Cars</span>
              <div className="w-6 h-6 rounded-lg bg-[#EBF3EA] flex items-center justify-center text-[#133E26]">
                <Car className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-black text-[#0D2818] tracking-tight">{detection.class_breakdown.cars}</div>
              <div className="text-[10px] text-[#4A6B56] mt-0.5">Sedans &amp; SUVs / 30s</div>
            </div>
          </div>

          {/* 2. Buses */}
          <div className="bg-white p-4 rounded-2xl border border-[#D1DFD4] shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-[#4A6B56]">
              <span className="font-bold">Buses</span>
              <div className="w-6 h-6 rounded-lg bg-amber-50 flex items-center justify-center text-[#C2410C]">
                <Bus className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-black text-[#0D2818] tracking-tight">{detection.class_breakdown.buses}</div>
              <div className="text-[10px] text-[#4A6B56] mt-0.5">Heavy Transit &amp; DTC</div>
            </div>
          </div>

          {/* 3. Trucks */}
          <div className="bg-white p-4 rounded-2xl border border-[#D1DFD4] shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-[#4A6B56]">
              <span className="font-bold">Trucks</span>
              <div className="w-6 h-6 rounded-lg bg-red-50 flex items-center justify-center text-[#B91C1C]">
                <Truck className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-black text-[#0D2818] tracking-tight">{detection.class_breakdown.trucks}</div>
              <div className="text-[10px] text-[#4A6B56] mt-0.5">Commercial Freight</div>
            </div>
          </div>

          {/* 4. 2- & 3-Wheelers */}
          <div className="bg-white p-4 rounded-2xl border border-[#D1DFD4] shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-[#4A6B56]">
              <span className="font-bold">2 &amp; 3-Wheelers</span>
              <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center text-[#2D6A4F]">
                <Bike className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-black text-[#0D2818] tracking-tight">
                {detection.class_breakdown.motorcycles + detection.class_breakdown.three_wheelers}
              </div>
              <div className="text-[10px] text-[#4A6B56] mt-0.5">
                {detection.class_breakdown.motorcycles} bikes • {detection.class_breakdown.three_wheelers} autos
              </div>
            </div>
          </div>

          {/* 5. HERO CARD: Estimated PM2.5 Load */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-1 bg-gradient-to-br from-[#133E26] to-[#0A2617] text-white p-4 rounded-2xl shadow-md border border-emerald-900 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] text-emerald-200">
              <span className="font-bold uppercase tracking-wider text-[10px]">Est. PM2.5 Load</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-emerald-100 font-medium">
                {detection.congestion_status || 'Normal'}
              </span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-black tracking-tight text-white flex items-baseline gap-1">
                {detection.estimated_hourly_pm25_kg} <span className="text-xs font-semibold text-emerald-200">kg/h</span>
              </div>
              <div className="text-[10px] text-emerald-200/90 mt-0.5 font-medium">
                NOx: {detection.estimated_hourly_nox_kg} kg/h • {detection.total_vehicles_detected} veh detected ({detection.average_speed_kmh} km/h)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Two-Column Grid: Corridors Table & Exposure Solver */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Delhi Arterial Corridors (7 cols) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-[#D1DFD4] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-[#EBF3EA]">
              <div>
                <h2 className="text-sm font-bold text-[#0D2818] tracking-tight">
                  Delhi Arterial Corridors &amp; Congestion Index
                </h2>
                <p className="text-[11px] text-[#4A6B56] mt-0.5">
                  Real-time average speeds, congestion bottlenecks, and vehicular emission contribution
                </p>
              </div>

              {/* Corridor Search input */}
              <div className="relative w-full sm:w-52">
                <Search className="w-3.5 h-3.5 text-[#4A6B56] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter corridors..."
                  value={corridorSearch}
                  onChange={(e) => setCorridorSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#FAF9F5] border border-[#D1DFD4] rounded-xl text-[#0D2818] placeholder-[#85A98F] focus:outline-none focus:border-[#133E26]"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-[#D1DFD4] text-[#4A6B56] font-bold text-[11px] uppercase tracking-wider">
                    <th className="pb-2.5 pl-1">Corridor</th>
                    <th className="pb-2.5">Speed</th>
                    <th className="pb-2.5">Congestion</th>
                    <th className="pb-2.5 text-right pr-1">Est. PM2.5</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EBF3EA]">
                  {filteredCorridors.map((c) => {
                    const pct = Math.round(c.congestion_index * 100);
                    const isSevere = c.congestion_index > 0.7;
                    const isMod = c.congestion_index > 0.4 && !isSevere;
                    
                    return (
                      <tr key={c.id} className="hover:bg-[#FAF9F5] transition-colors">
                        <td className="py-3 pl-1 font-medium text-[#0D2818]">
                          <div className="font-bold text-[#133E26] text-xs">{c.name}</div>
                          <div className="text-[10px] text-[#4A6B56] flex items-center gap-1 mt-0.5">
                            <span>{c.from_point}</span>
                            <span>&rarr;</span>
                            <span>{c.to_point}</span>
                            <span className="text-[#85A98F]">({c.length_km} km)</span>
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="font-bold text-[#0D2818]">{c.current_speed_kmh} <span className="text-[10px] font-normal text-[#4A6B56]">km/h</span></div>
                          <div className="text-[10px] text-[#85A98F]">Base: {c.baseline_speed_kmh} km/h</div>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${
                              isSevere
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : isMod
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}>
                              {pct}% {isSevere ? 'Severe' : isMod ? 'Moderate' : 'Fluid'}
                            </span>
                          </div>
                          <div className="w-24 bg-[#EBF3EA] rounded-full h-1.5 overflow-hidden mt-1.5">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isSevere ? 'bg-red-500' : isMod ? 'bg-amber-500' : 'bg-emerald-600'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </td>
                        <td className="py-3 pr-1 text-right">
                          <div className="font-bold text-[#0D2818]">{c.estimated_pm25_kgh}</div>
                          <div className="text-[10px] text-[#4A6B56]">kg/h</div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredCorridors.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-xs text-[#85A98F] italic">
                        No arterial corridors match your search filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#EBF3EA] flex items-center justify-between text-[11px] text-[#4A6B56]">
            <span>Showing {filteredCorridors.length} of {corridors.length} key arterial roads</span>
            <span className="font-medium">Data source: Traffic Telemetry Engine</span>
          </div>
        </div>

        {/* Right Column: Clean Route Exposure Solver (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-[#D1DFD4] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Navigation className="w-4 h-4 text-[#133E26]" />
              <h2 className="text-sm font-bold text-[#0D2818]">
                Clean Route Exposure Solver
              </h2>
            </div>
            <p className="text-xs text-[#4A6B56] mb-4">
              Minimizes cumulative particulate exposure by computing exposure integrals along route alternatives
            </p>

            <div className="space-y-4">
              {/* Origin */}
              <div>
                <label className="text-[11px] font-bold text-[#133E26] uppercase tracking-wider block mb-1">
                  Origin Location:
                </label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-[#4A6B56] absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-[#D1DFD4] bg-[#FAF9F5] text-[#0D2818] font-medium focus:outline-none focus:border-[#133E26]"
                  />
                </div>
                {/* Presets */}
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {originPresets.map((p) => (
                    <button
                      key={p}
                      onClick={() => setOrigin(p)}
                      className={`text-[10px] px-2 py-0.5 rounded-lg border transition-colors cursor-pointer ${
                        origin === p
                          ? 'bg-[#133E26] text-white border-[#133E26]'
                          : 'bg-[#FAF9F5] text-[#4A6B56] border-[#D1DFD4] hover:bg-[#EBF3EA]'
                      }`}
                    >
                      {p.split(',')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Destination */}
              <div>
                <label className="text-[11px] font-bold text-[#133E26] uppercase tracking-wider block mb-1">
                  Destination Location:
                </label>
                <div className="relative">
                  <Navigation className="w-3.5 h-3.5 text-[#4A6B56] absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-[#D1DFD4] bg-[#FAF9F5] text-[#0D2818] font-medium focus:outline-none focus:border-[#133E26]"
                  />
                </div>
                {/* Presets */}
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {destinationPresets.map((p) => (
                    <button
                      key={p}
                      onClick={() => setDestination(p)}
                      className={`text-[10px] px-2 py-0.5 rounded-lg border transition-colors cursor-pointer ${
                        destination === p
                          ? 'bg-[#133E26] text-white border-[#133E26]'
                          : 'bg-[#FAF9F5] text-[#4A6B56] border-[#D1DFD4] hover:bg-[#EBF3EA]'
                      }`}
                    >
                      {p.split(',')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Travel Mode Pills & Submit */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex gap-1.5 p-1 bg-[#FAF9F5] rounded-xl border border-[#D1DFD4]">
                  {[
                    { mode: 'car', icon: Car, label: 'Car' },
                    { mode: 'bike', icon: Bike, label: 'Two-Wheeler' },
                    { mode: 'bus', icon: Bus, label: 'Bus' }
                  ].map(({ mode, icon: Icon, label }) => (
                    <button
                      key={mode}
                      onClick={() => setTravelMode(mode)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        travelMode === mode
                          ? 'bg-[#133E26] text-white shadow-xs'
                          : 'text-[#4A6B56] hover:bg-white/80'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleSolveRoute}
                  disabled={isSolvingRoute}
                  className="px-4 py-2 bg-[#133E26] hover:bg-[#2D6A4F] text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-xs whitespace-nowrap text-center"
                >
                  {isSolvingRoute ? 'Computing...' : 'Solve Clean Route'}
                </button>
              </div>
            </div>

            {/* Route Comparison Output */}
            {routeResult && (
              <div className="mt-5 space-y-3 border-t border-[#EBF3EA] pt-4">
                {/* Standard Arterial Card */}
                <div className="p-3.5 rounded-2xl border border-[#D1DFD4] bg-[#FAF9F5]">
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-xs font-bold text-[#0D2818]">{routeResult.standard_route.route_name}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-200 text-neutral-700">
                      Standard Arterial
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-[#4A6B56]">
                    <div>Distance: <strong className="text-[#0D2818]">{routeResult.standard_route.distance_km} km</strong></div>
                    <div>Duration: <strong className="text-[#0D2818]">{routeResult.standard_route.travel_time_min} min</strong></div>
                    <div>Avg PM2.5: <strong className="text-[#0D2818]">{routeResult.standard_route.avg_pm25_ugm3} µg/m³</strong></div>
                  </div>
                </div>

                {/* Lowest Exposure Clean Route Card */}
                <div className="p-4 rounded-2xl border border-[#85A98F] bg-[#EBF3EA]/80 shadow-xs">
                  <div className="flex justify-between items-start mb-2.5">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-black text-[#133E26]">
                        <ShieldCheck className="w-4 h-4 text-[#2D6A4F]" />
                        <span>{routeResult.clean_route.route_name}</span>
                      </div>
                      <div className="text-[10px] font-semibold text-[#2D6A4F] mt-0.5">
                        Optimized exposure bypass
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-[#133E26] text-white shadow-xs">
                      -{routeResult.potential_exposure_reduction_pct}% Inhaled PM2.5
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs text-[#133E26] font-medium pt-1">
                    <div>Distance: <strong className="font-bold">{routeResult.clean_route.distance_km} km</strong></div>
                    <div>Duration: <strong className="font-bold">{routeResult.clean_route.travel_time_min} min</strong></div>
                    <div>Avg PM2.5: <strong className="font-bold">{routeResult.clean_route.avg_pm25_ugm3} µg/m³</strong></div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-[#85A98F]/40 flex items-start gap-2 text-[11px] text-[#133E26]">
                    <Leaf className="w-3.5 h-3.5 text-[#2D6A4F] shrink-0 mt-0.5" />
                    <span className="leading-tight">{routeResult.health_guidance}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
