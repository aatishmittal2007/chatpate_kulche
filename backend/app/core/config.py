import os
from pathlib import Path
from typing import Optional

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent

# Qwen 3.8 LLM Configuration
QWEN_API_KEY: Optional[str] = os.getenv("QWEN_API_KEY", "")
QWEN_BASE_URL: str = os.getenv("QWEN_BASE_URL", "https://dashscope-intl.aliyuncs.com/compatible-mode/v1")
QWEN_MODEL_REASONING: str = os.getenv("QWEN_MODEL_REASONING", "qwen3.8-max")
QWEN_MODEL_FAST: str = os.getenv("QWEN_MODEL_FAST", "qwen3.8-flash")
QWEN_TIMEOUT_SECONDS: float = float(os.getenv("QWEN_TIMEOUT_SECONDS", "15.0"))

# n8n Automation Configuration
N8N_BASE_URL: str = os.getenv("N8N_BASE_URL", "http://localhost:5678")
N8N_WEBHOOK_URL: str = os.getenv("N8N_WEBHOOK_URL", "http://localhost:5678/webhook/diwali-airsense")
N8N_API_KEY: Optional[str] = os.getenv("N8N_API_KEY", "")

# App Database & Model Paths
DB_PATH = BASE_DIR / "data" / "processed" / "airsense.db"
MODELS_DIR = BASE_DIR / "models"
WORKFLOWS_DIR = BASE_DIR / "workflows"
