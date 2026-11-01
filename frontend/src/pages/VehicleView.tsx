import React, { useState, useEffect } from 'react';
import { Car, Bus, Truck, Bike, Navigation, Activity, ShieldCheck, Play, ArrowRight } from 'lucide-react';
import { RoadCorridor, VehicleDetectResponse, RouteExposureResponse } from '../types';
import { fetchRoadCorridors, runVehicleDetection, calculateRouteExposure } from '../services/api';

export const VehicleView: React.FC = () => {
  const [corridors, setCorridors] = useState<RoadCorridor[]>([]);
  const [detection, setDetection] = useState<VehicleDetectResponse | null>(null);
  const [isDetecting, setIsDetecting] = useState<boolean>(false);

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

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-5 rounded-lg border border-[#D1DFD4] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Car className="w-5 h-5 text-[#133E26]" />
            <h2 className="text-base font-bold text-[#0D2818] tracking-tight">
              Vehicle Intelligence &amp; Clean Route Exposure Advisor
            </h2>
          </div>
          <p className="text-xs text-[#4A6B56] mt-0.5">
            Arterial corridor traffic tracking, vehicle classification, and inhalation exposure reduction
          </p>
        </div>

        <button
          onClick={handleRunDetection}
          disabled={isDetecting}
          className="px-3.5 py-2 rounded bg-[#133E26] hover:bg-[#2D6A4F] text-white text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          <Play className={`w-3.5 h-3.5 ${isDetecting ? 'animate-spin' : ''}`} />
          <span>{isDetecting ? 'Processing Stream...' : 'Sample Video Stream (30s)'}</span>
        </button>
      </div>

      {/* Detection Telemetry Cards */}
      {detection && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white p-3.5 rounded border border-[#D1DFD4] shadow-xs">
            <div className="flex items-center gap-1.5 text-xs text-[#4A6B56] mb-1">
              <Car className="w-3.5 h-3.5 text-[#133E26]" />
              <span>Cars</span>
            </div>
            <div className="text-lg font-bold text-[#0D2818]">{detection.class_breakdown.cars}</div>
            <div className="text-[10px] text-[#4A6B56] mt-0.5">Pass/window</div>
          </div>

          <div className="bg-white p-3.5 rounded border border-[#D1DFD4] shadow-xs">
            <div className="flex items-center gap-1.5 text-xs text-[#4A6B56] mb-1">
              <Bus className="w-3.5 h-3.5 text-[#C2410C]" />
              <span>Buses</span>
            </div>
            <div className="text-lg font-bold text-[#0D2818]">{detection.class_breakdown.buses}</div>
            <div className="text-[10px] text-[#4A6B56] mt-0.5">Heavy Transit</div>
          </div>

          <div className="bg-white p-3.5 rounded border border-[#D1DFD4] shadow-xs">
            <div className="flex items-center gap-1.5 text-xs text-[#4A6B56] mb-1">
              <Truck className="w-3.5 h-3.5 text-[#B91C1C]" />
              <span>Trucks</span>
            </div>
            <div className="text-lg font-bold text-[#0D2818]">{detection.class_breakdown.trucks}</div>
            <div className="text-[10px] text-[#4A6B56] mt-0.5">Diesel Freight</div>
          </div>

          <div className="bg-white p-3.5 rounded border border-[#D1DFD4] shadow-xs">
            <div className="flex items-center gap-1.5 text-xs text-[#4A6B56] mb-1">
              <Bike className="w-3.5 h-3.5 text-[#2D6A4F]" />
              <span>2-Wheelers</span>
            </div>
            <div className="text-lg font-bold text-[#0D2818]">{detection.class_breakdown.motorcycles}</div>
            <div className="text-[10px] text-[#4A6B56] mt-0.5">Motorcycles</div>
          </div>

          <div className="bg-white p-3.5 rounded border border-[#D1DFD4] shadow-xs">
            <div className="flex items-center gap-1.5 text-xs text-[#4A6B56] mb-1">
              <Activity className="w-3.5 h-3.5 text-[#D97706]" />
              <span>3-Wheelers</span>
            </div>
            <div className="text-lg font-bold text-[#0D2818]">{detection.class_breakdown.three_wheelers}</div>
            <div className="text-[10px] text-[#4A6B56] mt-0.5">Auto-rickshaws</div>
          </div>

          <div className="bg-white p-3.5 rounded border border-[#D1DFD4] shadow-xs bg-[#EBF3EA]">
            <div className="text-xs text-[#133E26] font-semibold mb-1">Est. PM2.5 Load</div>
            <div className="text-lg font-bold text-[#0D2818]">{detection.estimated_hourly_pm25_kg} <span className="text-xs font-normal">kg/h</span></div>
            <div className="text-[10px] text-[#2D6A4F] mt-0.5">NOx: {detection.estimated_hourly_nox_kg} kg/h</div>
          </div>
        </div>
      )}

      {/* Two Column Layout: Corridors Table & Clean Route Exposure */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Road Corridors Congestion Table */}
        <div className="bg-white p-5 rounded-lg border border-[#D1DFD4] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#0D2818]">
              Delhi Arterial Corridors &amp; Congestion Index
            </h3>
            <span className="text-[11px] text-[#4A6B56]">Sorted by Congestion</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[#D1DFD4] text-[#4A6B56] font-semibold">
                  <th className="pb-2">Corridor Name</th>
                  <th className="pb-2">Speed</th>
                  <th className="pb-2">Congestion</th>
                  <th className="pb-2 text-right">Est. PM2.5</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBF3EA]">
                {corridors.map((c) => (
                  <tr key={c.id} className="hover:bg-[#F8FAF8]">
                    <td className="py-2.5 font-medium text-[#0D2818]">
                      <div>{c.name}</div>
                      <div className="text-[10px] text-[#4A6B56]">{c.from_point} &rarr; {c.to_point} ({c.length_km} km)</div>
                    </td>
                    <td className="py-2.5">
                      <span className="font-semibold">{c.current_speed_kmh}</span> <span className="text-[10px] text-[#4A6B56]">/ {c.baseline_speed_kmh} km/h</span>
                    </td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-16 bg-[#EBF3EA] rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              c.congestion_index > 0.7 ? 'bg-[#DC2626]' : (c.congestion_index > 0.4 ? 'bg-[#D97706]' : 'bg-[#059669]')
                            }`}
                            style={{ width: `${c.congestion_index * 100}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-bold">{(c.congestion_index * 100).toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="py-2.5 text-right font-bold text-[#0D2818]">
                      {c.estimated_pm25_kgh} <span className="text-[10px] font-normal text-[#4A6B56]">kg/h</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Clean Route Exposure Calculator */}
        <div className="bg-white p-5 rounded-lg border border-[#D1DFD4] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Navigation className="w-4 h-4 text-[#133E26]" />
              <h3 className="text-sm font-bold text-[#0D2818]">
                Clean Route Exposure Solver
              </h3>
            </div>
            <p className="text-xs text-[#4A6B56] mb-4">
              Computes cumulative particulate inhalation ($\int C(x) dt$) and recommends the lowest-exposure route
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-[#4A6B56] block mb-1">Origin Point:</label>
                <input
                  type="text"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="w-full text-xs p-2 rounded border border-[#D1DFD4] bg-[#F8FAF8]"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#4A6B56] block mb-1">Destination Point:</label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full text-xs p-2 rounded border border-[#D1DFD4] bg-[#F8FAF8]"
                />
              </div>

              <div className="flex justify-between items-center pt-1">
                <div className="flex gap-2 text-xs">
                  {['car', 'bike', 'bus'].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setTravelMode(mode)}
                      className={`px-3 py-1 rounded capitalize border text-xs font-medium ${
                        travelMode === mode
                          ? 'bg-[#133E26] text-white border-[#1B4332]'
                          : 'bg-[#F8FAF8] text-[#4A6B56] border-[#D1DFD4]'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleSolveRoute}
                  disabled={isSolvingRoute}
                  className="px-4 py-2 bg-[#133E26] hover:bg-[#2D6A4F] text-white text-xs font-semibold rounded transition-colors disabled:opacity-50"
                >
                  {isSolvingRoute ? 'Computing...' : 'Calculate Routes'}
                </button>
              </div>
            </div>

            {/* Route Comparison Output */}
            {routeResult && (
              <div className="mt-5 space-y-3 border-t border-[#EBF3EA] pt-4">
                <div className="p-3 rounded-lg border border-[#D1DFD4] bg-[#F8FAF8]">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-xs font-bold text-[#0D2818]">{routeResult.standard_route.route_name}</span>
                    <span className="text-xs text-[#DC2626] font-semibold">Standard Arterial</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-[#4A6B56] mt-2">
                    <div>Dist: <strong>{routeResult.standard_route.distance_km} km</strong></div>
                    <div>Time: <strong>{routeResult.standard_route.travel_time_min} min</strong></div>
                    <div>Avg PM2.5: <strong>{routeResult.standard_route.avg_pm25_ugm3} µg/m³</strong></div>
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-[#85A98F] bg-[#EBF3EA]">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-xs font-bold text-[#133E26] flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-[#2D6A4F]" />
                      {routeResult.clean_route.route_name}
                    </span>
                    <span className="text-xs text-[#047857] font-bold">
                      -{routeResult.potential_exposure_reduction_pct}% Inhaled PM2.5
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-[#133E26] mt-2">
                    <div>Dist: <strong>{routeResult.clean_route.distance_km} km</strong></div>
                    <div>Time: <strong>{routeResult.clean_route.travel_time_min} min</strong></div>
                    <div>Avg PM2.5: <strong>{routeResult.clean_route.avg_pm25_ugm3} µg/m³</strong></div>
                  </div>
                  <p className="text-[11px] text-[#2D6A4F] mt-2.5 font-medium">
                    💡 {routeResult.health_guidance}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
