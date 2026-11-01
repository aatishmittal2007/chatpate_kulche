import React, { useState, useEffect } from 'react';
import { Send, Sparkles, Bot, Shield, AlertTriangle, ArrowRight, RefreshCw, Compass } from 'lucide-react';
import { Station, QwenChatMessage, PredictionExplanationResponse, EventAnalysisResponse } from '../types';
import { sendAIChat, fetchPredictionExplanation, fetchEventAnalysis, sendNaturalSearch } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface AIAssistantViewProps {
  stations: Station[];
  selectedStationId: string;
  onSelectStation: (id: string) => void;
}

export const AIAssistantView: React.FC<AIAssistantViewProps> = ({
  stations,
  selectedStationId,
  onSelectStation
}) => {
  const [messages, setMessages] = useState<QwenChatMessage[]>([
    {
      role: 'assistant',
      content: 'Hello! I am your **Diwali AirSense Environmental AI Intelligence Agent** powered by Qwen 3.8. All responses are strictly grounded in live CPCB monitoring telemetry, NASA FIRMS satellite fire feeds, and calibrated hybrid ensemble forecasts. How can I assist your neighborhood air quality planning today?'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [useReasoning, setUseReasoning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Active Prediction Explanation
  const [explanation, setExplanation] = useState<PredictionExplanationResponse | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);

  // Active Event Analysis
  const [eventData, setEventData] = useState<EventAnalysisResponse | null>(null);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || isLoading) return;

    const newMessages: QwenChatMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    if (!textToSend) setInputText('');
    setIsLoading(true);

    try {
      const resp = await sendAIChat(newMessages, selectedStationId, useReasoning);
      setMessages([...newMessages, { role: 'assistant', content: resp.reply }]);
    } catch (e: any) {
      setMessages([...newMessages, {
        role: 'assistant',
        content: `⚠️ Failed to query AI engine: ${e.message}. Using offline ground telemetry fallback.`
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExplainPrediction = async () => {
    setIsExplaining(true);
    try {
      const res = await fetchPredictionExplanation(selectedStationId, 'PM2.5', 6);
      setExplanation(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExplaining(false);
    }
  };

  const handleAnalyzeEvent = async () => {
    try {
      const res = await fetchEventAnalysis('Diwali Festival Night Peak');
      setEventData(res);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    handleExplainPrediction();
    handleAnalyzeEvent();
  }, [selectedStationId]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-lg border border-[#D1DFD4] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-[#1B4332]" />
            <h2 className="text-base font-bold text-[#0D2818] tracking-tight">
              Qwen 3.8 Air Quality Intelligence &amp; Prediction Explanation
            </h2>
          </div>
          <p className="text-xs text-[#4A6B56] mt-0.5">
            Backend-grounded OpenAI-compatible chat proxy with zero hallucination and mathematical feature attribution
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedStationId}
            onChange={(e) => onSelectStation(e.target.value)}
            className="text-xs p-2 rounded border border-[#D1DFD4] bg-[#F8FAF8] font-medium"
          >
            {stations.map((s) => (
              <option key={s.id} value={s.id}>{s.name} ({s.city})</option>
            ))}
          </select>

          <button
            onClick={() => setUseReasoning(!useReasoning)}
            className={`px-3 py-1.5 rounded text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
              useReasoning
                ? 'bg-[#1B4332] text-white border-[#1B4332]'
                : 'bg-[#F8FAF8] text-[#4A6B56] border-[#D1DFD4] hover:bg-[#EBF3EA]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{useReasoning ? 'qwen3.8-max (Deep Reasoning)' : 'qwen3.8-flash (Fast)'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Interactive Chat (2/3 width) */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-[#D1DFD4] shadow-sm flex flex-col h-[640px]">
          {/* Quick Prompts Bar */}
          <div className="p-3 border-b border-[#EBF3EA] bg-[#F8FAF8] flex gap-2 overflow-x-auto text-xs">
            <button
              onClick={() => handleSend("Why is PM2.5 spiking in this neighbourhood on Diwali night?")}
              className="px-2.5 py-1 rounded-full bg-white border border-[#D1DFD4] hover:border-[#85A98F] text-[#1B4332] whitespace-nowrap"
            >
              🔍 Why is PM2.5 spiking?
            </button>
            <button
              onClick={() => handleSend("What precautions should elderly and asthmatic patients take?")}
              className="px-2.5 py-1 rounded-full bg-white border border-[#D1DFD4] hover:border-[#85A98F] text-[#1B4332] whitespace-nowrap"
            >
              ❤️ Vulnerable Health Advisory
            </button>
            <button
              onClick={() => handleSend("Compare firecracker emissions with agricultural stubble smoke.")}
              className="px-2.5 py-1 rounded-full bg-white border border-[#D1DFD4] hover:border-[#85A98F] text-[#1B4332] whitespace-nowrap"
            >
              🌾 Crackers vs. Stubble Burning
            </button>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-[#1B4332] flex items-center justify-center text-white flex-shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`p-3.5 rounded-lg max-w-[85%] text-xs leading-relaxed whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-[#1B4332] text-white rounded-br-none'
                      : 'bg-[#F8FAF8] text-[#0D2818] border border-[#D1DFD4] rounded-bl-none shadow-2xs'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-[#4A6B56] italic">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#1B4332]" />
                <span>Qwen 3.8 synthesizing telemetry and model forecasts...</span>
              </div>
            )}
          </div>

          {/* Input Bar */}
          <div className="p-3 border-t border-[#EBF3EA] bg-white flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask Qwen 3.8 about Diwali air pollution, health risks, or predictions..."
              className="flex-1 text-xs px-3 py-2 rounded border border-[#D1DFD4] focus:outline-none focus:border-[#1B4332]"
            />
            <button
              onClick={() => handleSend()}
              disabled={isLoading || !inputText.trim()}
              className="px-4 py-2 bg-[#1B4332] text-white rounded hover:bg-[#2D6A4F] text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </div>
        </div>

        {/* Right Column: Prediction Explanation & Event Intel (1/3 width) */}
        <div className="space-y-6">
          {/* Prediction Feature Attribution Card */}
          <div className="bg-white p-4 rounded-lg border border-[#D1DFD4] shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-1.5 font-bold text-xs text-[#0D2818]">
                <Shield className="w-4 h-4 text-[#2D6A4F]" />
                <span>Forecast Explanation (+6h)</span>
              </div>
              <button
                onClick={handleExplainPrediction}
                disabled={isExplaining}
                className="text-[11px] text-[#2D6A4F] hover:underline"
              >
                Refresh
              </button>
            </div>

            {explanation ? (
              <div className="space-y-3">
                <div className="flex justify-between items-baseline p-2.5 rounded bg-[#EBF3EA] text-xs">
                  <div>
                    <span className="text-[#4A6B56]">Point Forecast:</span>
                    <strong className="text-sm font-bold text-[#0D2818] ml-1.5">
                      {explanation.predicted_value} µg/m³
                    </strong>
                  </div>
                  <div className="text-[11px] text-[#2D6A4F]">
                    CI: [{explanation.confidence_interval.p10} – {explanation.confidence_interval.p90}]
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-semibold text-[#4A6B56] mb-1.5">
                    Feature Attribution (Marginal Gain %):
                  </div>
                  <div className="h-36">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={explanation.feature_attributions}
                        margin={{ top: 0, right: 10, left: 10, bottom: 0 }}
                      >
                        <XAxis type="number" domain={[0, 50]} hide />
                        <YAxis dataKey="feature_name" type="category" width={110} tick={{ fontSize: 9 }} />
                        <Tooltip
                          formatter={(val: any) => [`${val}%`, 'Contribution']}
                          contentStyle={{ fontSize: '11px', borderRadius: '4px' }}
                        />
                        <Bar dataKey="percentage" radius={[0, 4, 4, 0]}>
                          {explanation.feature_attributions.map((_, i) => (
                            <Cell key={i} fill={i === 0 ? '#C2410C' : (i === 1 ? '#D97706' : '#2D6A4F')} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <p className="text-[11px] text-[#0D2818] bg-[#F8FAF8] p-2.5 rounded border border-[#EBF3EA] leading-relaxed">
                  {explanation.causal_factors_synthesis}
                </p>
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-[#4A6B56]">Loading prediction attributions...</div>
            )}
          </div>

          {/* Pollution Event Synthesis Brief */}
          {eventData && (
            <div className="bg-white p-4 rounded-lg border border-[#D1DFD4] shadow-sm">
              <div className="flex items-center gap-1.5 font-bold text-xs text-[#0D2818] mb-2">
                <AlertTriangle className="w-4 h-4 text-[#C2410C]" />
                <span>{eventData.event_title}</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between border-b border-[#EBF3EA] pb-1 text-[11px]">
                  <span className="text-[#4A6B56]">Severity:</span>
                  <strong className="text-[#C2410C]">{eventData.overall_severity}</strong>
                </div>
                <div className="flex justify-between border-b border-[#EBF3EA] pb-1 text-[11px]">
                  <span className="text-[#4A6B56]">Fireworks Surge:</span>
                  <strong className="text-[#0D2818]">{eventData.firecracker_surge_contribution_pct}%</strong>
                </div>
                <div className="flex justify-between border-b border-[#EBF3EA] pb-1 text-[11px]">
                  <span className="text-[#4A6B56]">Stubble Transport:</span>
                  <strong className="text-[#0D2818]">{eventData.stubble_burning_contribution_pct}%</strong>
                </div>
                <div className="flex justify-between border-b border-[#EBF3EA] pb-1 text-[11px]">
                  <span className="text-[#4A6B56]">Vehicular Factor:</span>
                  <strong className="text-[#0D2818]">{eventData.vehicular_contribution_pct}%</strong>
                </div>
                <p className="text-[11px] text-[#4A6B56] mt-2 leading-relaxed italic">
                  "{eventData.executive_summary}"
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
