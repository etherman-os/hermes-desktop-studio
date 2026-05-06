"""Tests for FastAPI bootstrap endpoint and token authentication."""

import pytest
from httpx import ASGITransport, AsyncClient

from hermes_adapter import server
from hermes_adapter.security import set_auth_token


@pytest.fixture
def app():
    return server.create_app()


class TestBootstrap:
    async def test_bootstrap_schema(self, app) -> None:
        set_auth_token("correct-token")
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get(
                "/studio/bootstrap",
                headers={"Authorization": "Bearer correct-token"},
            )

        assert response.status_code == 200
        data = response.json()
        assert data["adapter_version"] == "0.1.0"
        assert "active_profile" in data
        assert "capabilities" in data
        assert "recent_sessions" in data
        assert "active_theme" in data

    async def test_missing_token_returns_401(self, app) -> None:
        set_auth_token("some-token")
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get("/studio/bootstrap")

        assert response.status_code == 401
        data = response.json()
        assert data["error"]["code"] == "auth_missing"
        assert "Authorization" in data["error"]["message"]

    async def test_wrong_token_returns_401(self, app) -> None:
        set_auth_token("right-token")
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get(
                "/studio/bootstrap",
                headers={"Authorization": "Bearer wrong-token"},
            )

        assert response.status_code == 401
        assert response.json()["error"]["code"] == "auth_invalid"

    async def test_correct_token_returns_200(self, app) -> None:
        set_auth_token("secret-42")
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get(
                "/studio/bootstrap",
                headers={"Authorization": "Bearer secret-42"},
            )

        assert response.status_code == 200


class TestLegacyShellRoutes:
    def test_legacy_shell_routes_disabled_by_default(self) -> None:
        app = server.create_app(enable_legacy_shell_routes=False)
        paths = {getattr(route, "path", "") for route in app.routes}
        assert not any(path.startswith("/shell/") for path in paths)

    def test_legacy_shell_routes_can_be_enabled(self) -> None:
        app = server.create_app(enable_legacy_shell_routes=True)
        paths = {getattr(route, "path", "") for route in app.routes}
        assert "/shell/bootstrap" in paths
