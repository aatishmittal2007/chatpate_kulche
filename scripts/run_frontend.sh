#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

echo "=== Starting Diwali AirSense Frontend (Vite + React) ==="
cd "$FRONTEND_DIR"

if [ ! -d "node_modules" ]; then
    echo "node_modules not found. Running npm install..."
    npm install
fi

exec npm run dev
