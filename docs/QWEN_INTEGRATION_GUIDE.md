# Qwen 3.8 LLM Integration Guide

## 1. Overview & Architectural Role
The **Diwali AirSense** platform integrates the Qwen 3.8 language model suite (`qwen3.8-max` and `qwen3.8-flash`) via an OpenAI-compatible Chat Completions proxy service (`backend/app/services/qwen_service.py`).

The architecture guarantees:
1. **Frontend Isolation**: The frontend NEVER calls external LLM endpoints directly and never holds API keys.
2. **Strict Telemetry Grounding**: The LLM prompt is dynamically injected with real-time SQLite database state (station observations, calibrated forecasts, meteorological inversions, and NASA FIRMS fire pixels).
3. **Data Tier Discipline**: The LLM is instructed to tag every assertion with strict source labels: `[OBSERVED]`, `[PREDICTED]`, `[SATELLITE-DERIVED]`, `[MODELLED]`, or `[COMMUNITY-REPORTED]`.
4. **Offline Resilience**: When `QWEN_API_KEY` is not provided or the machine is offline, the backend uses a deterministic local rule-based explanation engine that produces structured responses matching the exact same schema.

---

## 2. Model Selection & Dual-Routing Strategy
- **`qwen3.8-max` (Deep Reasoning Model)**:
  - Used for multi-source event synthesis, scientific causation analysis, and complex public policy evaluations.
  - Activated when `use_reasoning_model: true` is passed to `/api/ai/chat`.
- **`qwen3.8-flash` (Fast Low-Latency Model)**:
  - Used for rapid real-time conversational assistance, natural language search query translation, and citizen report moderation.

---

## 3. Configuration & Environment Variables
In your `.env` or system environment:

```bash
# Alibaba Cloud DashScope / OpenAI-Compatible Endpoint
QWEN_API_KEY="sk-your-qwen-api-key"
QWEN_BASE_URL="https://dashscope-intl.aliyuncs.com/compatible-mode/v1"
QWEN_MODEL_REASONING="qwen3.8-max"
QWEN_MODEL_FAST="qwen3.8-flash"
QWEN_TIMEOUT_SECONDS=15.0
```

---

## 4. API Endpoints
- `POST /api/ai/chat`: Interactive conversational assistant grounded in station observations and forecasts.
- `POST /api/ai/explain-prediction`: Decomposes direct multi-horizon forecasts into mathematical feature attributions (fireworks surge %, thermal inversion %, stubble smoke %, vehicular proxy %).
- `POST /api/ai/analyze-event`: Generates structured multi-source event briefings for festival pollution episodes.
- `POST /api/ai/natural-search`: Interprets natural English queries (e.g. "Stations above 400 AQI") into filtered forecast records.
- `GET /api/ai/health`: Returns API key status, model configurations, and offline fallback status.
