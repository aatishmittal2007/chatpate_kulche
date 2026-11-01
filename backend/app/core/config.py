import os
from pathlib import Path
from typing import Optional

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent

# Load .env file if present
def _load_env_files():
    env_paths = [BASE_DIR / ".env", BASE_DIR / "backend" / ".env"]
    for p in env_paths:
        if p.exists():
            try:
                with open(p, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            k, v = line.split("=", 1)
                            k = k.strip()
                            v = v.strip().strip("'\"")
                            if k not in os.environ:
                                os.environ[k] = v
            except Exception:
                pass

_load_env_files()

# Qwen / OpenRouter LLM Configuration
QWEN_API_KEY: Optional[str] = os.getenv("QWEN_API_KEY", "")

# Smart routing: if using an OpenRouter key (sk-or-v1-), route to OpenRouter API
_is_openrouter = bool(QWEN_API_KEY and QWEN_API_KEY.startswith("sk-or-v1-"))
_default_base_url = "https://openrouter.ai/api/v1" if _is_openrouter else "https://dashscope-intl.aliyuncs.com/compatible-mode/v1"
QWEN_BASE_URL: str = os.getenv("QWEN_BASE_URL", _default_base_url)

_default_reasoning = "qwen/qwen-2.5-72b-instruct" if ("openrouter" in QWEN_BASE_URL) else "qwen3.8-max"
_default_fast = "qwen/qwen-2.5-72b-instruct" if ("openrouter" in QWEN_BASE_URL) else "qwen3.8-flash"

QWEN_MODEL_REASONING: str = os.getenv("QWEN_MODEL_REASONING", _default_reasoning)
QWEN_MODEL_FAST: str = os.getenv("QWEN_MODEL_FAST", _default_fast)
QWEN_TIMEOUT_SECONDS: float = float(os.getenv("QWEN_TIMEOUT_SECONDS", "20.0"))

# n8n Automation Configuration
N8N_BASE_URL: str = os.getenv("N8N_BASE_URL", "http://localhost:5678")
N8N_WEBHOOK_URL: str = os.getenv("N8N_WEBHOOK_URL", "http://localhost:5678/webhook/diwali-airsense")
N8N_API_KEY: Optional[str] = os.getenv("N8N_API_KEY", "")

# App Database & Model Paths
DB_PATH = BASE_DIR / "data" / "processed" / "airsense.db"
MODELS_DIR = BASE_DIR / "models"
WORKFLOWS_DIR = BASE_DIR / "workflows"
