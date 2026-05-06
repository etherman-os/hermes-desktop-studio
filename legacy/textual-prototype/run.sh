#!/usr/bin/env bash
# One-click launcher for Hermes Local Shell
# Usage: ./run.sh

set -euo pipefail

cd "$(dirname "$0")"

# 1. Ensure virtual environment exists
if [ ! -d ".venv" ]; then
    echo "[1/5] Virtual environment not found. Creating..."
    python3 -m venv .venv
fi

# 2. Activate
source .venv/bin/activate

# 3. Ensure dependencies are installed
if ! python3 -c "import hermes_adapter" 2>/dev/null; then
    echo "[2/5] Installing dependencies (first time)..."
    pip install -q --upgrade pip
    pip install -q -e ".[dev]"
    echo "[2/5] Dependencies installed."
else
    echo "[2/5] Dependencies already installed."
fi

# 4. Kill any old adapter on port 39191
OLD_PID=$(lsof -ti:39191 2>/dev/null || true)
if [ -n "$OLD_PID" ]; then
    echo "[3/5] Killing old adapter on port 39191 (PID: $OLD_PID)..."
    kill -9 "$OLD_PID" 2>/dev/null || true
    sleep 1
else
    echo "[3/5] Port 39191 is free."
fi

# 5. Start adapter in background
echo "[4/5] Starting Hermes Local Adapter..."
python3 -m hermes_adapter.server > /tmp/hermes-adapter.log 2>&1 &
ADAPTER_PID=$!
sleep 2

# Verify adapter is healthy
if ! curl -sf -H "Authorization: Bearer $(cat ~/.hermes-local-shell/runtime/token)" http://127.0.0.1:39191/shell/bootstrap > /dev/null 2>&1; then
    echo "ERROR: Adapter failed to start. Check /tmp/hermes-adapter.log"
    cat /tmp/hermes-adapter.log
    exit 1
fi

echo "[4/5] Adapter running on http://127.0.0.1:39191 (PID: $ADAPTER_PID)"

# 6. Start UI
echo "[5/5] Starting Hermes Local Shell UI..."
echo ""
echo "==========================================="
echo "  Hermes Local Shell is starting..."
echo "  Press 'q' to quit UI, then Ctrl+C here"
echo "==========================================="
echo ""

# Trap to kill adapter when UI exits or user hits Ctrl+C
cleanup() {
    echo ""
    echo "Shutting down adapter (PID: $ADAPTER_PID)..."
    kill "$ADAPTER_PID" 2>/dev/null || true
    wait "$ADAPTER_PID" 2>/dev/null || true
    echo "Goodbye."
}
trap cleanup EXIT INT TERM

# Run UI
python3 -m hermes_shell_ui.main "$@"
