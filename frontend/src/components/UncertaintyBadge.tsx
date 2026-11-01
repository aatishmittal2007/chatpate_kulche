import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface UncertaintyBadgeProps {
  calibrated: boolean;
  lower80: number;
  upper80: number;
  lower95: number;
  upper95: number;
  unit?: string;
}

export const UncertaintyBadge: React.FC<UncertaintyBadgeProps> = ({
  calibrated,
  lower80,
  upper80,
  lower95,
  upper95,
  unit = 'µg/m³'
}) => {
  return (
    <div className="bg-[#F8FAF8] border border-[#D1DFD4] rounded p-3 text-xs">
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-semibold text-[#0D2818] flex items-center gap-1.5">
          {calibrated ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-[#2D6A4F]" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 text-[#B45309]" />
          )}
          {calibrated ? 'Calibrated Empirical Intervals' : 'Uncalibrated Contextual Range'}
        </span>
        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#EBF3EA] text-[#1B4332]">
          {calibrated ? 'Quantile Res.' : 'Approx.'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-2">
        <div className="bg-white p-2 rounded border border-[#EBF3EA]">
          <div className="text-[#4A6B56] text-[11px]">80% Interval (IQR-like)</div>
          <div className="font-mono text-[#0D2818] font-semibold text-xs mt-0.5">
            [{lower80.toFixed(1)} – {upper80.toFixed(1)}] <span className="text-[10px] font-normal">{unit}</span>
          </div>
        </div>
        <div className="bg-white p-2 rounded border border-[#EBF3EA]">
          <div className="text-[#4A6B56] text-[11px]">95% Interval (Coverage)</div>
          <div className="font-mono text-[#0D2818] font-semibold text-xs mt-0.5">
            [{lower95.toFixed(1)} – {upper95.toFixed(1)}] <span className="text-[10px] font-normal">{unit}</span>
          </div>
        </div>
      </div>
      <p className="text-[10px] text-[#4A6B56] mt-2 leading-tight">
        Intervals derived from held-out chronological forecast errors; they reflect empirical predictive uncertainty, not guaranteed physical bounds.
      </p>
    </div>
  );
};
