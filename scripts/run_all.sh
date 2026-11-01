#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=========================================================="
echo " Starting Diwali AirSense Full-Stack Offline Application  "
echo "=========================================================="

cleanup() {
    echo ""
    echo "Shutting down Diwali AirSense services..."
    kill $(jobs -p) 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# Start backend in background
"$SCRIPT_DIR/run_backend.sh" &
BACKEND_PID=$!
echo "Backend started with PID $BACKEND_PID on http://127.0.0.1:8000"

# Wait briefly for backend to initialize
sleep 2

# Start frontend
"$SCRIPT_DIR/run_frontend.sh" &
FRONTEND_PID=$!
echo "Frontend started with PID $FRONTEND_PID on http://127.0.0.1:5173"

echo ""
echo "Diwali AirSense is running locally!"
echo "Open your browser at: http://127.0.0.1:5173"
echo "Press Ctrl+C to terminate both servers."
echo ""

wait
