#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_ROOT/backend"

echo "=== Starting Diwali AirSense Backend (FastAPI) ==="
cd "$BACKEND_DIR"

if [ ! -d ".venv" ]; then
    echo "Virtual environment not found. Please create .venv and install dependencies."
    exit 1
fi

export PYTHONPATH="$BACKEND_DIR"
exec .venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
