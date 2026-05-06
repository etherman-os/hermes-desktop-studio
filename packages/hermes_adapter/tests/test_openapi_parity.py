"""Route parity checks between FastAPI and the protocol OpenAPI document."""

from __future__ import annotations

from pathlib import Path

import yaml

from hermes_adapter.server import create_app

HTTP_METHODS = {"get", "post", "put", "patch", "delete"}


def test_studio_routes_are_documented_in_openapi() -> None:
    """Every implemented /studio/* route must be present in OpenAPI."""
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

    openapi_path = Path(__file__).resolve().parents[2] / "protocol" / "openapi.yaml"
    spec = yaml.safe_load(openapi_path.read_text(encoding="utf-8"))
    documented: set[tuple[str, str]] = set()
    for path, path_item in spec["paths"].items():
        if not path.startswith("/studio/"):
            continue
        documented.update((path, method) for method in path_item if method in HTTP_METHODS)

    assert implemented - documented == set()
