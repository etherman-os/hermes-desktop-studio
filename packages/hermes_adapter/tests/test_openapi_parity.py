"""Route parity checks between FastAPI and the protocol OpenAPI document."""

from __future__ import annotations

from pathlib import Path

import yaml

from hermes_adapter.server import create_app

HTTP_METHODS = {"get", "post", "put", "patch", "delete"}


def _implemented_studio_methods() -> set[tuple[str, str]]:
    app = create_app()
    implemented: set[tuple[str, str]] = set()
    for route in app.routes:
        path = getattr(route, "path", "")
        methods = getattr(route, "methods", set())
        if path.startswith("/studio/"):
            implemented.update(
                (path, method.lower())
                for method in methods
                if method.lower() in HTTP_METHODS
            )
    return implemented


def _documented_studio_methods() -> set[tuple[str, str]]:
    openapi_path = Path(__file__).resolve().parents[2] / "protocol" / "openapi.yaml"
    spec = yaml.safe_load(openapi_path.read_text(encoding="utf-8"))
    documented: set[tuple[str, str]] = set()
    for path, path_item in spec["paths"].items():
        if not path.startswith("/studio/"):
            continue
        documented.update((path, method) for method in path_item if method in HTTP_METHODS)
    return documented


def test_studio_routes_match_openapi_exactly() -> None:
    """Implemented /studio/* routes and documented OpenAPI paths must stay in lockstep."""
    implemented = _implemented_studio_methods()
    documented = _documented_studio_methods()

    assert implemented - documented == set()
    assert documented - implemented == set()


def test_legacy_shell_routes_are_not_part_of_openapi_contract() -> None:
    """Legacy /shell/* routes are prototype-only and must not enter OpenAPI."""
    openapi_path = Path(__file__).resolve().parents[2] / "protocol" / "openapi.yaml"
    spec = yaml.safe_load(openapi_path.read_text(encoding="utf-8"))

    assert not any(path.startswith("/shell/") for path in spec["paths"])
