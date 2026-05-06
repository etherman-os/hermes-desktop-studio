#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "Starting Hermes Local Adapter (dev mode)..."
python -m hermes_adapter.server "$@"
