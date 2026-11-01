import React, { useState, useEffect } from 'react';
import { BookOpen, Shield, Award, CheckCircle, FileText, Sliders, AlertTriangle } from 'lucide-react';
import { Station, BloomsFramework, ActionPlanResponse } from '../types';
import { fetchBloomsFramework, generateActionPlan } from '../services/api';

interface BloomsViewProps {
  stations: Station[];
  selectedStationId: string;
}

export const BloomsView: React.FC<BloomsViewProps> = ({ stations, selectedStationId }) => {
  const [framework, setFramework] = useState<BloomsFramework | null>(null);
  const [activeLevel, setActiveLevel] = useState<string>('Remember');
  const [vulnerability, setVulnerability] = useState<string>('children');
  const [actionPlan, setActionPlan] = useState<ActionPlanResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const loadFramework = async () => {
    try {
      const data = await fetchBloomsFramework();
      setFramework(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleGeneratePlan = async () => {
    setIsGenerating(true);
    try {
      const plan = await generateActionPlan(selectedStationId, vulnerability);
      setActionPlan(plan);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    loadFramework();
    handleGeneratePlan();
  }, [selectedStationId, vulnerability]);

  const levelColors: Record<string, string> = {
    Remember: '#2D6A4F',
    Understand: '#1B4332',
    Apply: '#0284C7',
    Analyze: '#C2410C',
    Evaluate: '#7C2D12',
    Create: '#047857'
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-lg border border-[#D1DFD4] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#133E26]" />
            <h2 className="text-base font-bold text-[#0D2818] tracking-tight">
              Bloom's Taxonomy Environmental Decision-Support &amp; Learning
            </h2>
          </div>
          <p className="text-xs text-[#4A6B56] mt-0.5">
            Progressive 6-tier pedagogical cognitive framework from scientific recall to policy brief generation
          </p>
        </div>

        {/* Level Switcher Pills */}
        <div className="flex flex-wrap gap-1.5 text-xs">
          {['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setActiveLevel(lvl)}
              className={`px-3 py-1.5 rounded font-semibold transition-colors border ${
                activeLevel === lvl
                  ? 'bg-[#133E26] text-white border-[#1B4332]'
                  : 'bg-[#F8FAF8] text-[#4A6B56] border-[#D1DFD4] hover:bg-[#EBF3EA]'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Main Framework Body */}
      {framework && (
        <div className="bg-white p-6 rounded-lg border border-[#D1DFD4] shadow-sm space-y-6">
          {activeLevel === 'Remember' && (
            <div className="space-y-4">
              <div className="border-b border-[#EBF3EA] pb-3">
                <span className="text-xs px-2.5 py-1 rounded bg-[#EBF3EA] text-[#2D6A4F] font-bold">Level 1: Factual Recall</span>
                <h3 className="text-sm font-bold text-[#0D2818] mt-2">Core Scientific Standards &amp; Chemical Compounds</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {framework.levels[0]?.topics?.map((t, idx) => (
                  <div key={idx} className="p-4 rounded-lg border border-[#D1DFD4] bg-[#F8FAF8] space-y-1.5">
                    <h4 className="text-xs font-bold text-[#133E26]">{t.title}</h4>
                    <p className="text-xs text-[#0D2818] leading-relaxed">{t.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeLevel === 'Understand' && (
            <div className="space-y-4">
              <div className="border-b border-[#EBF3EA] pb-3">
                <span className="text-xs px-2.5 py-1 rounded bg-[#EBF3EA] text-[#133E26] font-bold">Level 2: Conceptual Physics</span>
                <h3 className="text-sm font-bold text-[#0D2818] mt-2">Atmospheric Mechanics of Stagnation</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {framework.levels[1]?.topics?.map((t, idx) => (
                  <div key={idx} className="p-4 rounded-lg border border-[#D1DFD4] bg-[#F8FAF8] space-y-1.5">
                    <h4 className="text-xs font-bold text-[#133E26]">{t.title}</h4>
                    <p className="text-xs text-[#0D2818] leading-relaxed">{t.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeLevel === 'Apply' && (
            <div className="space-y-4">
              <div className="border-b border-[#EBF3EA] pb-3">
                <span className="text-xs px-2.5 py-1 rounded bg-[#EBF3EA] text-[#0284C7] font-bold">Level 3: Protective Implementation</span>
                <h3 className="text-sm font-bold text-[#0D2818] mt-2">Scientific Protocols for Public Health Defense</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {framework.levels[2]?.topics?.map((t, idx) => (
                  <div key={idx} className="p-4 rounded-lg border border-[#D1DFD4] bg-[#F8FAF8] space-y-1.5">
                    <h4 className="text-xs font-bold text-[#0284C7]">{t.title}</h4>
                    <p className="text-xs text-[#0D2818] leading-relaxed">{t.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeLevel === 'Analyze' && (
            <div className="space-y-4">
              <div className="border-b border-[#EBF3EA] pb-3">
                <span className="text-xs px-2.5 py-1 rounded bg-[#EBF3EA] text-[#C2410C] font-bold">Level 4: Causal Apportionment</span>
                <h3 className="text-sm font-bold text-[#0D2818] mt-2">Multi-Source Factor Attribution for Festival Peaks</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {framework.levels[3]?.topics?.map((t, idx) => (
                  <div key={idx} className="p-4 rounded-lg border border-[#D1DFD4] bg-[#F8FAF8] space-y-1.5">
                    <h4 className="text-xs font-bold text-[#C2410C]">{t.title}</h4>
                    <p className="text-xs text-[#0D2818] leading-relaxed">{t.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeLevel === 'Evaluate' && (
            <div className="space-y-4">
              <div className="border-b border-[#EBF3EA] pb-3">
                <span className="text-xs px-2.5 py-1 rounded bg-[#EBF3EA] text-[#7C2D12] font-bold">Level 5: Critical Policy Assessment</span>
                <h3 className="text-sm font-bold text-[#0D2818] mt-2">Mitigation Policy Scorecard (Cost vs. Efficacy)</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-[#D1DFD4] text-[#4A6B56] font-semibold">
                      <th className="pb-2">Intervention Policy</th>
                      <th className="pb-2">Efficacy (1-10)</th>
                      <th className="pb-2">Cost</th>
                      <th className="pb-2">Feasibility</th>
                      <th className="pb-2">Scientific Evaluation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EBF3EA]">
                    {framework.levels[4]?.policies?.map((p, idx) => (
                      <tr key={idx} className="hover:bg-[#F8FAF8]">
                        <td className="py-2.5 font-bold text-[#0D2818]">{p.policy}</td>
                        <td className="py-2.5">
                          <span className={`px-2 py-0.5 rounded font-bold ${
                            p.effectiveness_score >= 7 ? 'bg-[#EBF3EA] text-[#047857]' : 'bg-[#FEF3C7] text-[#B45309]'
                          }`}>
                            {p.effectiveness_score}/10
                          </span>
                        </td>
                        <td className="py-2.5 text-[#4A6B56]">{p.cost}</td>
                        <td className="py-2.5 text-[#4A6B56]">{p.feasibility}</td>
                        <td className="py-2.5 text-xs text-[#0D2818]">{p.scientific_verdict}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeLevel === 'Create' && (
            <div className="space-y-6">
              <div className="border-b border-[#EBF3EA] pb-3 flex justify-between items-center">
                <div>
                  <span className="text-xs px-2.5 py-1 rounded bg-[#EBF3EA] text-[#047857] font-bold">Level 6: Creation &amp; Synthesis</span>
                  <h3 className="text-sm font-bold text-[#0D2818] mt-1">Personalized Citizen Action Plan &amp; Ward Brief</h3>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[#4A6B56] font-medium">Vulnerability:</span>
                  <select
                    value={vulnerability}
                    onChange={(e) => setVulnerability(e.target.value)}
                    className="p-1.5 rounded border border-[#D1DFD4] bg-[#F8FAF8] font-semibold"
                  >
                    <option value="children">Children / School Students</option>
                    <option value="elderly">Elderly (&gt;65 years)</option>
                    <option value="respiratory_asthma">Cardiopulmonary / Asthma Patients</option>
                    <option value="outdoor_worker">Outdoor Commuters &amp; Workers</option>
                  </select>
                </div>
              </div>

              {actionPlan ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-[#EBF3EA] border border-[#85A98F] flex justify-between items-center">
                    <div>
                      <div className="text-xs text-[#133E26]">Target: <strong>{actionPlan.neighbourhood_name}</strong> &bull; Profile: <strong>{actionPlan.vulnerability_group}</strong></div>
                      <div className="text-sm font-bold text-[#0D2818] mt-0.5">
                        Current AQI: {actionPlan.current_aqi} &bull; Forecasted Peak: {actionPlan.predicted_peak_aqi} (Severe)
                      </div>
                    </div>
                    <Award className="w-8 h-8 text-[#2D6A4F]" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="p-4 rounded-lg border border-[#D1DFD4] bg-[#F8FAF8] space-y-2">
                      <h4 className="font-bold text-[#C2410C]">🚨 Immediate Protections</h4>
                      <ul className="list-disc pl-4 space-y-1 text-[#0D2818]">
                        {actionPlan.immediate_actions.map((act, i) => <li key={i}>{act}</li>)}
                      </ul>
                    </div>

                    <div className="p-4 rounded-lg border border-[#D1DFD4] bg-[#F8FAF8] space-y-2">
                      <h4 className="font-bold text-[#133E26]">🏠 Indoor Safe Zone</h4>
                      <ul className="list-disc pl-4 space-y-1 text-[#0D2818]">
                        {actionPlan.indoor_guidance.map((act, i) => <li key={i}>{act}</li>)}
                      </ul>
                      <div className="pt-2 text-[11px] text-[#2D6A4F] border-t border-[#EBF3EA]">
                        <strong>Purifier Sizing:</strong> {actionPlan.purifier_sizing_recommendation}
                      </div>
                    </div>

                    <div className="p-4 rounded-lg border border-[#D1DFD4] bg-[#F8FAF8] space-y-2">
                      <h4 className="font-bold text-[#B91C1C]">⛔ Outdoor Restrictions</h4>
                      <ul className="list-disc pl-4 space-y-1 text-[#0D2818]">
                        {actionPlan.outdoor_restrictions.map((act, i) => <li key={i}>{act}</li>)}
                      </ul>
                      <div className="pt-2 text-[11px] text-[#4A6B56] border-t border-[#EBF3EA]">
                        <strong>Mask Spec:</strong> {actionPlan.mask_specification}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg border border-[#D1DFD4] bg-[#F8FAF8] text-xs">
                    <div className="font-bold text-[#0D2818] mb-1 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-[#133E26]" />
                      <span>Ward-Level Policy Brief Recommendation:</span>
                    </div>
                    <p className="text-[#4A6B56] leading-relaxed italic">
                      "{actionPlan.ward_level_policy_recommendation}"
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-[#4A6B56]">Generating action plan...</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
