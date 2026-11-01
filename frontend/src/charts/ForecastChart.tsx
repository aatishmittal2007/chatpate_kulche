import React from 'react';
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { HorizonForecast } from '../types';

interface ForecastChartProps {
  forecasts: HorizonForecast[];
  currentValue?: number;
  pollutant?: string;
}

export const ForecastChart: React.FC<ForecastChartProps> = ({
  forecasts,
  currentValue,
  pollutant = 'PM2.5'
}) => {
  // Sort forecasts by horizon
  const sorted = [...forecasts].sort((a, b) => a.horizon_hours - b.horizon_hours);

  // Initial point at t=0
  const chartData = [
    ...(currentValue !== undefined
      ? [
          {
            horizon_label: 'Now (+0h)',
            horizon_hours: 0,
            point_forecast: currentValue,
            lower_bound_80: currentValue,
            upper_bound_80: currentValue,
            lower_bound_95: currentValue,
            upper_bound_95: currentValue,
            baseline_persistence: currentValue,
          },
        ]
      : []),
    ...sorted.map((fc) => ({
      horizon_label: `+${fc.horizon_hours}h`,
      horizon_hours: fc.horizon_hours,
      point_forecast: fc.point_forecast,
      lower_bound_80: fc.lower_bound_80,
      upper_bound_80: fc.upper_bound_80,
      lower_bound_95: fc.lower_bound_95,
      upper_bound_95: fc.upper_bound_95,
      baseline_persistence: fc.baseline_persistence,
    })),
  ];

  return (
    <div className="w-full bg-white p-4 rounded border border-[#D1DFD4] shadow-sm">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-[#0D2818] tracking-tight">
          Multi-Horizon Forecast Trajectory ({pollutant})
        </h3>
        <p className="text-xs text-[#4A6B56]">
          1h, 3h, 6h, and 24h direct XGBoost forecasts with 80% and 95% empirical uncertainty bands
        </p>
      </div>

      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
            <CartesianGrid stroke="#EBF3EA" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="horizon_label" stroke="#4A6B56" tick={{ fontSize: 11 }} />
            <YAxis stroke="#4A6B56" tick={{ fontSize: 11 }} unit=" µg" domain={[0, 'auto']} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-white border border-[#D1DFD4] p-2.5 rounded shadow-md text-xs font-sans">
                    <div className="font-bold text-[#0D2818] border-b border-[#EBF3EA] pb-1 mb-1">
                      Forecast Horizon: {label}
                    </div>
                    <div className="text-[#1B4332] font-semibold">
                      Model Forecast: {d.point_forecast} µg/m³
                    </div>
                    <div className="text-[#4A6B56]">
                      80% Interval: [{d.lower_bound_80} – {d.upper_bound_80}] µg/m³
                    </div>
                    <div className="text-[#4A6B56]">
                      95% Interval: [{d.lower_bound_95} – {d.upper_bound_95}] µg/m³
                    </div>
                    <div className="text-[#0D2818] border-t border-[#EBF3EA] pt-1 mt-1">
                      Persistence Baseline: {d.baseline_persistence} µg/m³
                    </div>
                  </div>
                );
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px' }} />

            {/* Shaded 95% and 80% Uncertainty Bands */}
            <Area
              type="monotone"
              dataKey="upper_95"
              stroke="none"
              fill="#D8E2DC"
              fillOpacity={0.4}
              name="95% Interval Upper"
            />
            <Area
              type="monotone"
              dataKey="lower_95"
              stroke="none"
              fill="#FFFFFF"
              fillOpacity={1.0}
              name="95% Interval Lower"
            />

            {/* Forecast Line */}
            <Line
              type="monotone"
              dataKey="point_forecast"
              stroke="#1B4332"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#1B4332' }}
              name="Model Forecast"
            />

            {/* Baseline Persistence Reference Line */}
            <Line
              type="stepAfter"
              dataKey="baseline_persistence"
              stroke="#B45309"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
              name="Persistence Baseline"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
