import React, { useState, useEffect } from 'react';
import { Cpu, Play, CheckCircle2, Clock, Activity, Zap, RefreshCw, AlertCircle } from 'lucide-react';
import { WorkflowStatus } from '../types';
import { fetchWorkflowStatuses, triggerWorkflow, fetchN8nHealth } from '../services/api';

export const AutomationView: React.FC = () => {
  const [workflows, setWorkflows] = useState<WorkflowStatus[]>([]);
  const [health, setHealth] = useState<any>(null);
  const [triggeringId, setTriggeringId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [wfs, hlth] = await Promise.all([
        fetchWorkflowStatuses(),
        fetchN8nHealth()
      ]);
      setWorkflows(wfs);
      setHealth(hlth);
    } catch (e) {
      console.error(e);
    }
  };

  const handleTrigger = async (workflowId: string) => {
    setTriggeringId(workflowId);
    setActionMessage(null);
    try {
      const res = await triggerWorkflow(workflowId);
      setActionMessage(`✅ ${res.message} (Run time: ${res.duration_ms}ms)`);
      loadData();
    } catch (e: any) {
      setActionMessage(`❌ Trigger failed: ${e.message}`);
    } finally {
      setTriggeringId(null);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-lg border border-[#D1DFD4] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-[#133E26]" />
            <h2 className="text-base font-bold text-[#0D2818] tracking-tight">
              n8n Automation &amp; Workflow Orchestration Engine
            </h2>
          </div>
          <p className="text-xs text-[#4A6B56] mt-0.5">
            Idempotent background pipelines for automated CPCB ingestion, model retraining, threshold alerting, and health monitoring
          </p>
        </div>

        <div className="flex items-center gap-3">
          {health && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EBF3EA] border border-[#85A98F] text-xs font-semibold text-[#133E26]">
              <span className="w-2 h-2 rounded-full bg-[#047857] animate-pulse" />
              <span>{health.workflows_verified}/6 JSON Workflows Verified</span>
            </div>
          )}
          <button
            onClick={loadData}
            className="p-1.5 rounded border border-[#D1DFD4] hover:bg-[#EBF3EA] text-[#0D2818]"
            title="Refresh Status"
          >
            <RefreshCw className="w-4 h-4 text-[#4A6B56]" />
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 rounded-lg border border-[#85A98F] bg-[#EBF3EA] text-xs text-[#133E26] font-semibold flex items-center justify-between">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="text-xs text-[#4A6B56] hover:text-[#0D2818]">&times;</button>
        </div>
      )}

      {/* Workflows Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workflows.map((wf) => (
          <div key={wf.workflow_id} className="bg-white p-5 rounded-lg border border-[#D1DFD4] shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="flex justify-between items-start gap-2">
                <h3 className="text-xs font-bold text-[#0D2818]">{wf.name}</h3>
                <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-[#EBF3EA] text-[#047857]">
                  {wf.last_status}
                </span>
              </div>
              <p className="text-xs text-[#4A6B56] mt-1.5 leading-relaxed">
                {wf.description}
              </p>
            </div>

            <div className="space-y-2 border-t border-[#EBF3EA] pt-3 text-[11px] text-[#4A6B56]">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-[#2D6A4F]" /> Schedule:</span>
                <strong className="text-[#0D2818]">{wf.schedule}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1"><Activity className="w-3 h-3 text-[#2D6A4F]" /> Records Processed:</span>
                <strong className="text-[#0D2818]">{wf.records_processed}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-[#2D6A4F]" /> Execution Time:</span>
                <strong className="text-[#0D2818]">{wf.execution_time_ms} ms</strong>
              </div>
            </div>

            <button
              onClick={() => handleTrigger(wf.workflow_id)}
              disabled={triggeringId === wf.workflow_id}
              className="w-full py-2 bg-[#F8FAF8] hover:bg-[#EBF3EA] border border-[#D1DFD4] rounded text-xs font-semibold text-[#133E26] flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Play className={`w-3.5 h-3.5 ${triggeringId === wf.workflow_id ? 'animate-spin' : ''}`} />
              <span>{triggeringId === wf.workflow_id ? 'Executing Pipeline...' : 'Trigger Workflow'}</span>
            </button>
          </div>
        ))}
      </div>

      {/* Integration Verification Card */}
      <div className="bg-white p-5 rounded-lg border border-[#D1DFD4] shadow-sm text-xs space-y-3">
        <h4 className="font-bold text-[#0D2818] flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-[#047857]" />
          <span>Production n8n Architecture &amp; Webhook Endpoints</span>
        </h4>
        <p className="text-[#4A6B56] leading-relaxed">
          All workflows are saved in <code className="bg-[#EBF3EA] px-1 py-0.5 rounded font-mono text-[#133E26]">workflows/*.json</code> and conform strictly to n8n node formats.
          When running in production, n8n polls CPCB endpoints hourly, calls local machine learning inference, and broadcasts alerts via webhook.
        </p>
      </div>
    </div>
  );
};
