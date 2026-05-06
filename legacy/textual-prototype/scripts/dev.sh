#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "=== Hermes Local Shell Dev Environment ==="
echo ""
echo "To start the adapter:"
echo "  ./scripts/run-adapter.sh"
echo ""
echo "To start the UI (in another terminal):"
echo "  ./scripts/run-ui.sh"
echo ""
echo "Or use Python modules directly:"
echo "  python -m hermes_adapter.server"
echo "  python -m hermes_shell_ui.main"
echo ""
