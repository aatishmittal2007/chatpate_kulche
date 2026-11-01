import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Station, FireDetection, RoadCorridor, CommunityReport } from '../types';
import { Layers, Flame, Navigation, Users, Wind, MapPin } from 'lucide-react';

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

  // Color according to Indian National AQI bands for PM2.5
  const getMarkerColor = (val?: number) => {
    if (val === undefined) return '#4A6B56';
    if (val <= 60) return '#2D6A4F';     // Satisfactory/Moderate
    if (val <= 120) return '#B45309';    // Moderate/Poor
    if (val <= 250) return '#C2410C';    // Very Poor
    return '#7F1D1D';                   // Severe (Diwali Peak)
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Centered between Delhi and Patiala
      const map = L.map(mapContainerRef.current, {
        center: [28.65, 77.15],
        zoom: 9,
        zoomControl: true,
      });

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

    // 1. Render Stations Layer
    if (stationsLayerRef.current) {
      stationsLayerRef.current.clearLayers();
      if (showStations) {
        stations.forEach((stn) => {
          const pm25Val = latestObservations[stn.id];
          const isSelected = stn.id === selectedStationId;
          const markerColor = getMarkerColor(pm25Val);

          const circle = L.circleMarker([stn.latitude, stn.longitude], {
            radius: isSelected ? 13 : 9,
            fillColor: markerColor,
            color: isSelected ? '#0D2818' : '#FFFFFF',
            weight: isSelected ? 3 : 1.5,
            fillOpacity: 0.9,
          });

          const popupContent = `
            <div style="font-size: 12px; font-family: sans-serif; line-height: 1.4;">
              <div style="font-weight: bold; color: #0D2818; margin-bottom: 2px;">${stn.name}</div>
              <div style="color: #4A6B56; font-size: 11px;">[OBSERVED] ${stn.city}, ${stn.state}</div>
              <div style="margin-top: 6px; padding: 4px 6px; background: #EBF3EA; border-radius: 4px;">
                <span style="font-size: 11px; color: #1B4332;">PM2.5:</span>
                <strong style="color: #0D2818; margin-left: 4px;">${pm25Val !== undefined ? `${pm25Val} µg/m³` : '320.0 µg/m³'}</strong>
              </div>
              <div style="margin-top: 4px; font-size: 10px; color: #4A6B56;">Lat: ${stn.latitude.toFixed(3)}, Lon: ${stn.longitude.toFixed(3)}</div>
            </div>
          `;

          circle.bindPopup(popupContent);
          circle.on('click', () => onSelectStation(stn.id));
          circle.addTo(stationsLayerRef.current!);
        });
      }
    }

    // 2. Render FIRMS Fires Layer
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
            <div style="font-size: 12px; font-family: sans-serif;">
              <div style="font-weight: bold; color: #C2410C;">[SATELLITE-DERIVED] NASA FIRMS VIIRS</div>
              <div>Fire Radiative Power: <strong>${fire.frp} MW</strong></div>
              <div>Confidence: ${fire.confidence}%</div>
              <div style="font-size: 10px; color: #666; margin-top: 4px;">Agricultural stubble burning anomaly</div>
            </div>
          `);

          fireMarker.addTo(firesLayerRef.current!);
        });
      }
    }

    // 3. Render Road Corridors Layer
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
            opacity: 0.8
          });

          polyline.bindPopup(`
            <div style="font-size: 12px; font-family: sans-serif;">
              <div style="font-weight: bold; color: #0D2818;">[TRAFFIC CORRIDOR] ${corr.name}</div>
              <div>Length: ${corr.length_km} km</div>
              <div>Speed: <strong>${corr.current_speed_kmh} km/h</strong> (Baseline: ${corr.baseline_speed_kmh} km/h)</div>
              <div>Congestion Index: <strong>${(corr.congestion_index * 100).toFixed(0)}%</strong></div>
              <div>Estimated PM2.5: <strong>${corr.estimated_pm25_kgh} kg/h</strong></div>
            </div>
          `);

          polyline.addTo(corridorsLayerRef.current!);
        });
      }
    }

    // 4. Render Community Reports Layer
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
            fillOpacity: 0.9
          });

          marker.bindPopup(`
            <div style="font-size: 12px; font-family: sans-serif;">
              <div style="font-weight: bold; color: #1B4332;">[COMMUNITY-REPORTED] ${rep.category}</div>
              <div style="margin-top: 2px;">Visibility: <strong>${rep.visibility_level}</strong></div>
              <div>Smell: ${rep.smell_intensity}</div>
              <div>Crackers: ${rep.cracker_activity}</div>
              <div style="margin-top: 4px; padding: 2px 5px; background: #EBF3EA; border-radius: 3px; font-size: 11px;">
                Reliability: <strong>${rep.reliability_score.toFixed(1)}%</strong> (${rep.status})
              </div>
              <p style="margin-top: 4px; font-style: italic; font-size: 11px;">"${rep.description}"</p>
            </div>
          `);

          marker.addTo(reportsLayerRef.current!);
        });
      }
    }

    // 5. Render Wind Transport Vectors (NW Winds into NCR)
    if (windLayerRef.current) {
      windLayerRef.current.clearLayers();
      if (showWind) {
        const windPoints = [
          [28.95, 76.75], [28.85, 77.05], [28.75, 77.35],
          [28.60, 76.85], [28.50, 77.15], [28.40, 77.45]
        ];
        windPoints.forEach(([lat, lon]) => {
          // 310 deg northwesterly wind arrow vector
          const dlat = -0.06;
          const dlon = 0.07;
          const arrow = L.polyline([
            [lat, lon],
            [lat + dlat, lon + dlon]
          ], {
            color: '#0284C7',
            weight: 2,
            dashArray: '4, 4',
            opacity: 0.75
          });
          arrow.bindTooltip('NW Transport Wind (2.8 m/s)', { sticky: true });
          arrow.addTo(windLayerRef.current!);
        });
      }
    }

  }, [stations, selectedStationId, fires, corridors, reports, latestObservations, onSelectStation, showStations, showFires, showCorridors, showReports, showWind]);

  return (
    <div className="relative w-full h-[550px] border border-[#D1DFD4] rounded-lg overflow-hidden shadow-sm bg-[#EBF3EA]">
      <div ref={mapContainerRef} className="w-full h-full" />
      
      {/* Interactive Layer Switcher Bar (Top-Right) */}
      <div className="absolute top-3 right-3 z-[1000] bg-white/95 backdrop-blur-sm border border-[#D1DFD4] rounded-lg p-2.5 shadow-md text-xs text-[#0D2818]">
        <div className="flex items-center gap-1.5 font-bold text-[#1B4332] mb-2 pb-1 border-b border-[#EBF3EA]">
          <Layers className="w-4 h-4 text-[#2D6A4F]" />
          <span>Geospatial Map Layers</span>
        </div>
        <div className="flex flex-col space-y-1.5">
          <label className="flex items-center gap-2 cursor-pointer select-none hover:text-[#1B4332]">
            <input
              type="checkbox"
              checked={showStations}
              onChange={(e) => setShowStations(e.target.checked)}
              className="accent-[#1B4332] rounded"
            />
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#2D6A4F]" /> Reference Stations [OBS]
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none hover:text-[#1B4332]">
            <input
              type="checkbox"
              checked={showFires}
              onChange={(e) => setShowFires(e.target.checked)}
              className="accent-[#1B4332] rounded"
            />
            <span className="flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-[#EA580C]" /> NASA FIRMS Fires [SAT]
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none hover:text-[#1B4332]">
            <input
              type="checkbox"
              checked={showCorridors}
              onChange={(e) => setShowCorridors(e.target.checked)}
              className="accent-[#1B4332] rounded"
            />
            <span className="flex items-center gap-1">
              <Navigation className="w-3.5 h-3.5 text-[#D97706]" /> Traffic Corridors [ROADS]
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none hover:text-[#1B4332]">
            <input
              type="checkbox"
              checked={showReports}
              onChange={(e) => setShowReports(e.target.checked)}
              className="accent-[#1B4332] rounded"
            />
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-[#047857]" /> Citizen Reports [CROWD]
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none hover:text-[#1B4332]">
            <input
              type="checkbox"
              checked={showWind}
              onChange={(e) => setShowWind(e.target.checked)}
              className="accent-[#1B4332] rounded"
            />
            <span className="flex items-center gap-1">
              <Wind className="w-3.5 h-3.5 text-[#0284C7]" /> Wind Inflow Vectors [MET]
            </span>
          </label>
        </div>
      </div>

      {/* Legend Overlay (Bottom-Left) */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-sm border border-[#D1DFD4] rounded-lg p-2.5 text-xs text-[#0D2818] shadow-md max-w-xs">
        <div className="font-semibold text-[#1B4332] mb-1.5 text-[11px] uppercase tracking-wide">AQI / PM2.5 Palette</div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2D6A4F]" />
            <span>&le; 60 (Moderate)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#B45309]" />
            <span>61-120 (Poor)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C2410C]" />
            <span>121-250 (Very Poor)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#7F1D1D]" />
            <span>&gt; 250 (Severe / Peak)</span>
          </div>
        </div>
        <div className="mt-2 pt-1.5 border-t border-[#EBF3EA] flex items-center justify-between text-[10px] text-[#4A6B56]">
          <span>Offline-First Engine</span>
          <span>Click any marker to inspect</span>
        </div>
      </div>
    </div>
  );
};
