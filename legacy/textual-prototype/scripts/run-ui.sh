#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "Starting Hermes Local Shell UI (dev mode)..."
python -m hermes_shell_ui.main "$@"
