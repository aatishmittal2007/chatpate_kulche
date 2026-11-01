import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Station, FireDetection, RoadCorridor, CommunityReport } from '../types';
import { 
  Layers, 
  Flame, 
  Navigation, 
  Users, 
  Wind, 
  MapPin, 
  ChevronDown, 
  ChevronUp, 
  X, 
  Activity, 
  Crosshair,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

interface PollutionMapProps {
  stations: Station[];
  selectedStationId: string;
  onSelectStation: (stationId: string) => void;
  fires?: FireDetection[];
  corridors?: RoadCorridor[];
  reports?: CommunityReport[];
  latestObservations?: Record<string, number>; // station_id -> pm25
}

export const PollutionMap: React.FC<PollutionMapProps> = ({
  stations,
  selectedStationId,
  onSelectStation,
  fires = [],
  corridors = [],
  reports = [],
  latestObservations = {}
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  
  // Layer groups for toggleable geospatial layers
  const stationsLayerRef = useRef<L.LayerGroup | null>(null);
  const firesLayerRef = useRef<L.LayerGroup | null>(null);
  const corridorsLayerRef = useRef<L.LayerGroup | null>(null);
  const reportsLayerRef = useRef<L.LayerGroup | null>(null);
  const windLayerRef = useRef<L.LayerGroup | null>(null);

  // Layer Visibility State
  const [showStations, setShowStations] = useState<boolean>(true);
  const [showFires, setShowFires] = useState<boolean>(true);
  const [showCorridors, setShowCorridors] = useState<boolean>(true);
  const [showReports, setShowReports] = useState<boolean>(true);
  const [showWind, setShowWind] = useState<boolean>(true);

  // UI Control state
  const [layersCollapsed, setLayersCollapsed] = useState<boolean>(false);
  const [selectedDrawerOpen, setSelectedDrawerOpen] = useState<boolean>(true);

  // Color according to Indian National AQI bands for PM2.5
  const getMarkerColor = (val?: number) => {
    if (val === undefined) return '#4A6B56';
    if (val <= 60) return '#2D6A4F';     // Moderate / Satisfactory
    if (val <= 120) return '#B45309';    // Poor
    if (val <= 250) return '#C2410C';    // Very Poor
    return '#7F1D1D';                   // Severe (Diwali Peak)
  };

  const getAQIBadge = (val?: number) => {
    if (val === undefined) return { label: 'Unmeasured', bg: 'bg-slate-100 text-slate-700' };
    if (val <= 60) return { label: 'Satisfactory / Moderate', bg: 'bg-[#EBF3EA] text-[#133E26]' };
    if (val <= 120) return { label: 'Poor', bg: 'bg-amber-50 text-amber-800 border border-amber-200' };
    if (val <= 250) return { label: 'Very Poor', bg: 'bg-orange-50 text-orange-800 border border-orange-200' };
    return { label: 'Severe / Hazardous', bg: 'bg-red-50 text-red-800 border border-red-200' };
  };

  // Re-center map to Delhi NCR
  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([28.65, 77.15], 9, { animate: true });
    }
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Centered between Delhi and Patiala
      const map = L.map(mapContainerRef.current, {
        center: [28.65, 77.15],
        zoom: 9,
        zoomControl: false, // We'll position controls cleanly
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors | Diwali AirSense',
        maxZoom: 18,
      }).addTo(map);

      stationsLayerRef.current = L.layerGroup().addTo(map);
      firesLayerRef.current = L.layerGroup().addTo(map);
      corridorsLayerRef.current = L.layerGroup().addTo(map);
      reportsLayerRef.current = L.layerGroup().addTo(map);
      windLayerRef.current = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    if (!map) return;

    // 1. Render Reference Stations Layer
    if (stationsLayerRef.current) {
      stationsLayerRef.current.clearLayers();
      if (showStations) {
        stations.forEach((stn) => {
          const pm25Val = latestObservations[stn.id];
          const isSelected = stn.id === selectedStationId;
          const markerColor = getMarkerColor(pm25Val);

          const circle = L.circleMarker([stn.latitude, stn.longitude], {
            radius: isSelected ? 12 : 8,
            fillColor: markerColor,
            color: isSelected ? '#133E26' : '#FFFFFF',
            weight: isSelected ? 3.5 : 2,
            fillOpacity: 0.95,
          });

          const popupContent = `
            <div style="font-size: 12px; font-family: Inter, system-ui, sans-serif; line-height: 1.4; min-width: 170px;">
              <div style="font-weight: 800; color: #133E26; font-size: 13px;">${stn.name}</div>
              <div style="color: #4A6B56; font-size: 11px; margin-top: 2px;">[OBSERVED] ${stn.city}, ${stn.state}</div>
              <div style="margin-top: 8px; padding: 6px 8px; background: #FAF9F5; border: 1px solid #D1DFD4; border-radius: 8px;">
                <span style="font-size: 10px; font-weight: 700; color: #4A6B56; text-transform: uppercase;">PM2.5:</span>
                <strong style="color: #133E26; font-size: 14px; margin-left: 6px;">${pm25Val !== undefined ? `${pm25Val} µg/m³` : '320.0 µg/m³'}</strong>
              </div>
              <div style="margin-top: 6px; font-size: 10px; color: #64748B;">Lat: ${stn.latitude.toFixed(3)}, Lon: ${stn.longitude.toFixed(3)}</div>
            </div>
          `;

          circle.bindPopup(popupContent);
          circle.on('click', () => {
            onSelectStation(stn.id);
            setSelectedDrawerOpen(true);
          });
          circle.addTo(stationsLayerRef.current!);
        });
      }
    }

    // 2. Render NASA FIRMS Active Fire Pixels Layer
    if (firesLayerRef.current) {
      firesLayerRef.current.clearLayers();
      if (showFires) {
        fires.forEach((fire) => {
          const fireMarker = L.circleMarker([fire.latitude, fire.longitude], {
            radius: Math.min(14, Math.max(5, fire.frp / 10)),
            fillColor: '#EA580C',
            color: '#7C2D12',
            weight: 1.5,
            fillOpacity: 0.85,
          });

          fireMarker.bindPopup(`
            <div style="font-size: 12px; font-family: Inter, system-ui, sans-serif;">
              <div style="font-weight: 800; color: #C2410C;">[SATELLITE-DERIVED] NASA FIRMS VIIRS</div>
              <div style="margin-top: 4px;">Fire Radiative Power: <strong>${fire.frp} MW</strong></div>
              <div>Detection Confidence: <strong>${fire.confidence}%</strong></div>
              <div style="font-size: 10px; color: #64748B; margin-top: 4px;">Agricultural stubble burning thermal anomaly</div>
            </div>
          `);

          fireMarker.addTo(firesLayerRef.current!);
        });
      }
    }

    // 3. Render Arterial Road Corridors Layer
    if (corridorsLayerRef.current) {
      corridorsLayerRef.current.clearLayers();
      if (showCorridors && corridors.length > 0) {
        corridors.forEach((corr) => {
          const congestionColor = corr.congestion_index > 0.7 ? '#B91C1C' : (corr.congestion_index > 0.4 ? '#D97706' : '#15803D');
          const polyline = L.polyline([
            [corr.lat_start, corr.lon_start],
            [corr.lat_end, corr.lon_end]
          ], {
            color: congestionColor,
            weight: 5,
            opacity: 0.85
          });

          polyline.bindPopup(`
            <div style="font-size: 12px; font-family: Inter, system-ui, sans-serif;">
              <div style="font-weight: 800; color: #133E26;">[TRAFFIC CORRIDOR] ${corr.name}</div>
              <div style="margin-top: 4px;">Length: ${corr.length_km} km</div>
              <div>Operating Speed: <strong>${corr.current_speed_kmh} km/h</strong> (Baseline: ${corr.baseline_speed_kmh} km/h)</div>
              <div>Congestion Index: <strong>${(corr.congestion_index * 100).toFixed(0)}%</strong></div>
              <div>Estimated Corridor Emissions: <strong>${corr.estimated_pm25_kgh} kg/h</strong></div>
            </div>
          `);

          polyline.addTo(corridorsLayerRef.current!);
        });
      }
    }

    // 4. Render Citizen Ground Reports Layer
    if (reportsLayerRef.current) {
      reportsLayerRef.current.clearLayers();
      if (showReports && reports.length > 0) {
        reports.forEach((rep) => {
          const relColor = rep.reliability_score >= 70 ? '#047857' : (rep.reliability_score >= 40 ? '#D97706' : '#DC2626');
          const marker = L.circleMarker([rep.latitude, rep.longitude], {
            radius: 7,
            fillColor: relColor,
            color: '#FFFFFF',
            weight: 2,
            fillOpacity: 0.95
          });

          marker.bindPopup(`
            <div style="font-size: 12px; font-family: Inter, system-ui, sans-serif;">
              <div style="font-weight: 800; color: #133E26;">[COMMUNITY-REPORTED] ${rep.category}</div>
              <div style="margin-top: 4px;">Visibility: <strong>${rep.visibility_level}</strong></div>
              <div>Smell: ${rep.smell_intensity} | Crackers: ${rep.cracker_activity}</div>
              <div style="margin-top: 6px; padding: 3px 6px; background: #EBF3EA; border-radius: 6px; font-size: 11px;">
                Reliability Score: <strong>${rep.reliability_score.toFixed(1)}%</strong> (${rep.status})
              </div>
              <p style="margin-top: 4px; font-style: italic; font-size: 11px; color: #4A6B56;">"${rep.description}"</p>
            </div>
          `);

          marker.addTo(reportsLayerRef.current!);
        });
      }
    }

    // 5. Render Northwest Wind Transport Vectors
    if (windLayerRef.current) {
      windLayerRef.current.clearLayers();
      if (showWind) {
        const windPoints = [
          [28.95, 76.75], [28.85, 77.05], [28.75, 77.35],
          [28.60, 76.85], [28.50, 77.15], [28.40, 77.45]
        ];
        windPoints.forEach(([lat, lon]) => {
          const dlat = -0.06;
          const dlon = 0.07;
          const arrow = L.polyline([
            [lat, lon],
            [lat + dlat, lon + dlon]
          ], {
            color: '#0284C7',
            weight: 2.5,
            dashArray: '5, 5',
            opacity: 0.8
          });
          arrow.bindTooltip('NW Inflow Wind (2.8 m/s, 310°)', { sticky: true });
          arrow.addTo(windLayerRef.current!);
        });
      }
    }

  }, [stations, selectedStationId, fires, corridors, reports, latestObservations, onSelectStation, showStations, showFires, showCorridors, showReports, showWind]);

  // Selected station object for drawer
  const selectedStation = stations.find(s => s.id === selectedStationId);
  const selectedPm25 = selectedStation ? (latestObservations[selectedStation.id] ?? 320.0) : 320.0;
  const badgeInfo = getAQIBadge(selectedPm25);

  return (
    <div className="relative w-full h-[620px] rounded-2xl overflow-hidden border border-[#D1DFD4] shadow-xs bg-[#FAF9F5]">
      
      {/* Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />
      
      {/* Top-Left: Station Quick Selector & Re-center */}
      <div className="absolute top-4 left-4 z-[1000] flex flex-wrap items-center gap-2">
        <div className="bg-white/95 backdrop-blur-md border border-[#D1DFD4] rounded-xl px-3 py-2 shadow-sm flex items-center space-x-2">
          <MapPin className="w-4 h-4 text-[#133E26]" />
          <select
            value={selectedStationId}
            onChange={(e) => {
              onSelectStation(e.target.value);
              setSelectedDrawerOpen(true);
            }}
            className="text-xs font-bold text-[#133E26] bg-transparent border-none cursor-pointer focus:outline-none"
          >
            {stations.map(s => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.city})
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleRecenter}
          className="bg-white/95 backdrop-blur-md border border-[#D1DFD4] hover:bg-[#EBF3EA] text-[#133E26] rounded-xl px-3 py-2 text-xs font-semibold shadow-sm flex items-center space-x-1.5 transition-colors cursor-pointer"
          title="Reset map view to Delhi NCR"
        >
          <Crosshair className="w-3.5 h-3.5 text-[#133E26]" />
          <span className="hidden sm:inline">Center NCR</span>
        </button>
      </div>

      {/* Top-Right: Floating Collapsible Layer Control Panel */}
      <div className="absolute top-4 right-4 z-[1000] bg-white/95 backdrop-blur-md border border-[#D1DFD4] rounded-2xl p-3 shadow-md text-xs text-[#0D2818] w-64 transition-all">
        <div className="flex items-center justify-between font-extrabold text-[#133E26] pb-2 border-b border-[#EBF3EA]">
          <div className="flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-[#133E26]" />
            <span>Geospatial Layers</span>
          </div>
          <button
            onClick={() => setLayersCollapsed(!layersCollapsed)}
            className="text-[#4A6B56] hover:text-[#133E26] cursor-pointer p-0.5 rounded"
            title={layersCollapsed ? "Expand Layer Switcher" : "Collapse Layer Switcher"}
          >
            {layersCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>

        {!layersCollapsed && (
          <div className="mt-2.5 flex flex-col space-y-2">
            <label className="flex items-center justify-between cursor-pointer select-none hover:text-[#133E26] py-0.5">
              <span className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#133E26]" /> 
                <span className="font-semibold text-xs">CPCB Stations</span>
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-[#4A6B56] font-medium bg-[#FAF9F5] px-1.5 py-0.5 rounded border border-[#D1DFD4]">OBS</span>
                <input
                  type="checkbox"
                  checked={showStations}
                  onChange={(e) => setShowStations(e.target.checked)}
                  className="accent-[#133E26] w-3.5 h-3.5 cursor-pointer rounded"
                />
              </div>
            </label>

            <label className="flex items-center justify-between cursor-pointer select-none hover:text-[#133E26] py-0.5">
              <span className="flex items-center gap-2">
                <Flame className="w-3.5 h-3.5 text-[#EA580C]" /> 
                <span className="font-semibold text-xs">NASA FIRMS Fires</span>
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-[#EA580C] font-medium bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200">SAT</span>
                <input
                  type="checkbox"
                  checked={showFires}
                  onChange={(e) => setShowFires(e.target.checked)}
                  className="accent-[#EA580C] w-3.5 h-3.5 cursor-pointer rounded"
                />
              </div>
            </label>

            <label className="flex items-center justify-between cursor-pointer select-none hover:text-[#133E26] py-0.5">
              <span className="flex items-center gap-2">
                <Navigation className="w-3.5 h-3.5 text-[#D97706]" /> 
                <span className="font-semibold text-xs">Traffic Corridors</span>
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-[#D97706] font-medium bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">ROADS</span>
                <input
                  type="checkbox"
                  checked={showCorridors}
                  onChange={(e) => setShowCorridors(e.target.checked)}
                  className="accent-[#D97706] w-3.5 h-3.5 cursor-pointer rounded"
                />
              </div>
            </label>

            <label className="flex items-center justify-between cursor-pointer select-none hover:text-[#133E26] py-0.5">
              <span className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-[#047857]" /> 
                <span className="font-semibold text-xs">Citizen Reports</span>
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-[#047857] font-medium bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">CROWD</span>
                <input
                  type="checkbox"
                  checked={showReports}
                  onChange={(e) => setShowReports(e.target.checked)}
                  className="accent-[#047857] w-3.5 h-3.5 cursor-pointer rounded"
                />
              </div>
            </label>

            <label className="flex items-center justify-between cursor-pointer select-none hover:text-[#133E26] py-0.5">
              <span className="flex items-center gap-2">
                <Wind className="w-3.5 h-3.5 text-[#0284C7]" /> 
                <span className="font-semibold text-xs">NW Wind Vectors</span>
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-[#0284C7] font-medium bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">MET</span>
                <input
                  type="checkbox"
                  checked={showWind}
                  onChange={(e) => setShowWind(e.target.checked)}
                  className="accent-[#0284C7] w-3.5 h-3.5 cursor-pointer rounded"
                />
              </div>
            </label>
          </div>
        )}
      </div>

      {/* Bottom-Left: Compact AQI Palette */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 backdrop-blur-md border border-[#D1DFD4] rounded-2xl p-3 text-xs text-[#0D2818] shadow-md max-w-xs">
        <div className="font-bold text-[#133E26] mb-1.5 text-[11px] uppercase tracking-wider flex items-center justify-between">
          <span>AQI / PM2.5 Severity Scale</span>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2D6A4F]" />
            <span className="text-[#133E26] font-medium">&le; 60 (Moderate)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#B45309]" />
            <span className="text-amber-900 font-medium">61–120 (Poor)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C2410C]" />
            <span className="text-orange-900 font-medium">121–250 (Very Poor)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#7F1D1D]" />
            <span className="text-red-900 font-bold">&gt; 250 (Severe / Peak)</span>
          </div>
        </div>
        <div className="mt-2 pt-1.5 border-t border-[#EBF3EA] flex items-center justify-between text-[10px] text-[#4A6B56]">
          <span className="font-medium">Offline Spatial Cache</span>
          <span>Click marker for details</span>
        </div>
      </div>

      {/* Selected Station Floating Detail Card (Bottom Center / Right) */}
      {selectedStation && selectedDrawerOpen && (
        <div className="absolute bottom-4 right-16 z-[1000] bg-white/95 backdrop-blur-md border border-[#D1DFD4] rounded-2xl p-4 shadow-xl max-w-sm w-full sm:w-80 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold text-[#4A6B56] uppercase tracking-wider">
                [OBSERVED] CPCB Reference Station
              </span>
              <h3 className="text-sm font-extrabold text-[#133E26] mt-0.5">
                {selectedStation.name}
              </h3>
              <p className="text-xs text-[#4A6B56]">
                {selectedStation.city}, {selectedStation.state}
              </p>
            </div>
            <button
              onClick={() => setSelectedDrawerOpen(false)}
              className="text-[#94A3B8] hover:text-[#133E26] p-1 rounded-lg cursor-pointer"
              title="Close Card"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3 p-2.5 bg-[#FAF9F5] border border-[#D1DFD4] rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-[#4A6B56] uppercase">Current PM2.5</span>
              <div className="text-xl font-extrabold text-[#133E26]">
                {selectedPm25.toFixed(1)} <span className="text-xs font-semibold text-[#4A6B56]">µg/m³</span>
              </div>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${badgeInfo.bg}`}>
              {badgeInfo.label}
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] text-[#4A6B56]">
            <span>Lat: {selectedStation.latitude.toFixed(3)}, Lon: {selectedStation.longitude.toFixed(3)}</span>
            <span className="flex items-center gap-1 font-semibold text-[#133E26]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#2D6A4F]" /> Verified CPCB
            </span>
          </div>
        </div>
      )}

    </div>
  );
};
