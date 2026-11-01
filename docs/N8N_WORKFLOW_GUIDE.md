# n8n Automation & Workflow Orchestration Guide

## 1. Overview
The **Diwali AirSense** backend includes 6 production-grade, version-controlled n8n workflow definitions located in the `workflows/` directory.

These workflows orchestrate scheduled data ingestion, model recalibration, threshold alerting, satellite fire detection sync, citizen report moderation, and system health monitoring.

---

## 2. Included Workflows

| File | Name | Schedule / Trigger | Purpose |
|---|---|---|---|
| `workflow_a_data_ingestion.json` | Hourly Data Ingestion | `0 * * * *` (Hourly) | Ingests CPCB/DPCC data, validates units, detects anomalies, updates rolling features. |
| `workflow_b_forecasting_pipeline.json` | Forecasting Pipeline | On Ingestion Complete | Computes 1h/3h/6h/24h predictions using the Hybrid Ensemble, refreshes cache. |
| `workflow_c_alert_dispatcher.json` | Severe Threshold Alert | `*/30 * * * *` (Every 30m) | Evaluates predicted AQI > 350 (Severe) and > 400 (Hazardous), dispatches alerts. |
| `workflow_d_satellite_firms_sync.json` | NASA FIRMS Fire Sync | `0 */6 * * *` (Every 6h) | Pulls active VIIRS fire pixels in Punjab/Haryana/NCR buffer, filters confidence > 50%. |
| `workflow_e_community_moderation.json` | Citizen Report Moderation | On Report Submission | Applies multi-factor reliability scoring (distance penalty, station delta, cluster density). |
| `workflow_f_system_health_monitor.json` | Health & Staleness Monitor | `*/15 * * * *` (Every 15m) | Verifies SQLite WAL integrity, probes API uptime, warns if station data > 180m stale. |

---

## 3. Importing into n8n
1. Start your local n8n instance:
   ```bash
   n8n start
   ```
2. Navigate to `http://localhost:5678`.
3. In the sidebar, select **Workflows** &rarr; **Import from File**.
4. Select any JSON workflow from the `workflows/` folder.
5. Activate the workflow toggle.

---

## 4. FastAPI Integration Endpoints
- `GET /api/automation/workflow-status`: Returns execution history, schedules, and last-run status for all 6 workflows.
- `POST /api/automation/trigger/{workflow_id}`: Allows manual or programmatic triggering of any workflow.
- `GET /api/automation/integrations/n8n/health`: Validates that all 6 workflow JSON files exist and are syntactically sound.
- `POST /api/automation/callback/{action}`: Ingests callbacks from executing n8n nodes.
