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
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { DiwaliProgressionPoint, YearProgression } from '../types';

interface ProgressionChartProps {
  baselineProfile: DiwaliProgressionPoint[];
  historicalYears: YearProgression[];
  pollutant?: string;
}

export const ProgressionChart: React.FC<ProgressionChartProps> = ({
  baselineProfile,
  historicalYears,
  pollutant = 'PM2.5'
}) => {
  // Merge baseline profile with historical years points by relative_day
  const chartData = baselineProfile.map((pt) => {
    const row: any = {
      relative_day: pt.relative_day,
      median: pt.median,
      mean: pt.mean,
      q25: pt.q25,
      q75: pt.q75,
      iqr_band: [pt.q25, pt.q75],
      count: pt.count,
    };

    // Attach historical year points
    historicalYears.forEach((yr) => {
      const match = yr.points.find((p) => p.relative_day === pt.relative_day);
      if (match) {
        row[`year_${yr.year}`] = match.value;
      }
    });

    return row;
  });

  return (
    <div className="w-full bg-white p-4 rounded border border-[#D1DFD4] shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
        <div>
          <h3 className="text-sm font-bold text-[#0D2818] tracking-tight">
            Diwali-Relative Historical Progression ({pollutant})
          </h3>
          <p className="text-xs text-[#4A6B56]">
            Aligned progression from Day -30 (pre-Diwali) through Day 0 (Diwali) to Day +30 (dispersion)
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#EBF3EA] text-[#1B4332] font-mono text-[11px]">
            Peak: Day 0 to +1
          </span>
        </div>
      </div>

      <div className="h-[340px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
            <CartesianGrid stroke="#EBF3EA" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="relative_day"
              stroke="#4A6B56"
              tick={{ fontSize: 11 }}
              tickFormatter={(val) => (val === 0 ? 'Day 0 (Diwali)' : `Day ${val > 0 ? `+${val}` : val}`)}
            />
            <YAxis
              stroke="#4A6B56"
              tick={{ fontSize: 11 }}
              unit=" µg"
              domain={[0, 'auto']}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-white border border-[#D1DFD4] p-2.5 rounded shadow-md text-xs font-sans">
                    <div className="font-bold text-[#0D2818] border-b border-[#EBF3EA] pb-1 mb-1">
                      {label === 0 ? 'Diwali Day (Day 0)' : `Relative Day ${label > 0 ? `+${label}` : label}`}
                    </div>
                    <div className="text-[#1B4332] font-semibold">
                      Historical Median: {d.median} µg/m³
                    </div>
                    <div className="text-[#4A6B56]">
                      Interquartile Range: [{d.q25} – {d.q75}] µg/m³
                    </div>
                    {historicalYears.map((yr) => {
                      const val = d[`year_${yr.year}`];
                      if (val === undefined) return null;
                      return (
                        <div key={yr.year} className="text-[#0D2818] mt-0.5">
                          Observed {yr.year}: <strong>{val} µg/m³</strong>
                        </div>
                      );
                    })}
                  </div>
                );
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
              formatter={(value) => <span className="text-[#0D2818]">{value}</span>}
            />

            {/* Vertical Marker for Diwali Day */}
            <ReferenceLine x={0} stroke="#7F1D1D" strokeDasharray="4 4" label={{ value: 'Diwali', position: 'insideTopRight', fill: '#7F1D1D', fontSize: 11 }} />

            {/* Shaded IQR Envelope */}
            <Area
              type="monotone"
              dataKey="q75"
              stroke="none"
              fill="#D8E2DC"
              fillOpacity={0.6}
              name="75th Percentile"
            />
            <Area
              type="monotone"
              dataKey="q25"
              stroke="none"
              fill="#FFFFFF"
              fillOpacity={1.0}
              name="25th Percentile"
            />

            {/* Multi-year Median Line */}
            <Line
              type="monotone"
              dataKey="median"
              stroke="#1B4332"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#1B4332' }}
              name="Multi-Year Median"
            />

            {/* Specific Year Line */}
            {historicalYears.map((yr, idx) => (
              <Line
                key={yr.year}
                type="monotone"
                dataKey={`year_${yr.year}`}
                stroke={idx === 0 ? '#C2410C' : '#2563EB'}
                strokeWidth={1.5}
                strokeDasharray="4 2"
                dot={{ r: 2 }}
                name={`${yr.year} Observations`}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 pt-2 border-t border-[#EBF3EA] text-[11px] text-[#4A6B56] flex flex-wrap gap-4 justify-between">
        <span>Pre-Diwali Baseline: Day -30 to -1</span>
        <span>Festival Episode: Day 0 to +2</span>
        <span>Post-Diwali Dispersion: Day +3 to +30</span>
      </div>
    </div>
  );
};
