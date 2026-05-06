"""Contract guards for the desktop client integration surface."""

from __future__ import annotations

import json
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


def test_desktop_client_does_not_use_root_health_or_shell_routes() -> None:
    source = (REPO_ROOT / "apps" / "desktop-studio" / "src" / "api" / "studioClient.ts").read_text(
        encoding="utf-8"
    )

    assert "/studio/health" in source
    assert "`${config.baseUrl}/health`" not in source
    assert "/shell/" not in source


def test_tauri_csp_is_non_null_and_restrictive() -> None:
    config_path = REPO_ROOT / "apps" / "desktop-studio" / "src-tauri" / "tauri.conf.json"
    config = json.loads(config_path.read_text(encoding="utf-8"))
    csp = config["app"]["security"]["csp"]

    assert isinstance(csp, str)
    assert csp.strip()
    assert "default-src 'self'" in csp
    assert "object-src 'none'" in csp
    assert "'unsafe-eval'" not in csp


def test_auth_bootstrap_dev_workflow_is_documented() -> None:
    readme = (REPO_ROOT / "README.md").read_text(encoding="utf-8")
    contract = (REPO_ROOT / "docs" / "ADAPTER_CONTRACT.md").read_text(encoding="utf-8")

    assert "VITE_HERMES_STUDIO_ADAPTER_TOKEN" in readme
    assert "HERMES_STUDIO_ADAPTER_TOKEN" in readme
    assert "localStorage" in contract
    assert "~/.hermes-local-shell/runtime/token" in contract
