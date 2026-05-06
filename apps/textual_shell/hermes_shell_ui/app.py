"""Main Textual App for Hermes Local Shell."""

from __future__ import annotations

import json

import httpx
from textual.app import App
from textual.reactive import reactive

from hermes_shell_ui.messages import ShellEventMessage
from hermes_shell_ui.screens.main_screen import MainScreen
from hermes_shell_ui.screens.settings_screen import SettingsScreen
from hermes_shell_ui.screens.theme_screen import ThemeScreen
from hermes_shell_ui.widgets.log_panel import LogPanel
from hermes_shell_ui.widgets.session_sidebar import SessionSidebar
from hermes_shell_ui.widgets.status_bar import StatusBar


class HermesShellApp(App):
    """Root Textual application for Hermes Local Shell."""

    CSS_PATH = "styles/base.tcss"
    TITLE = "Hermes Local Shell"

    BINDINGS = [
        ("q", "quit", "Quit"),
        ("ctrl+t", "theme", "Theme"),
        ("ctrl+s", "settings", "Settings"),
        ("ctrl+r", "refresh_sessions", "Refresh"),
        ("/", "slash", "Command"),
    ]

    active_session_id: reactive[str | None] = reactive(None)
    profile_name: reactive[str] = reactive("default")
    active_theme_id: reactive[str] = reactive("default-dark")

    def __init__(
        self,
        *,
        theme_id: str | None = None,
        token: str | None = None,
        adapter_url: str = "http://127.0.0.1:39191",
    ) -> None:
        self._adapter_url = adapter_url
        self._token = token or ""
        self._http: httpx.AsyncClient | None = None
        self._bootstrap: dict = {}
        self._main_screen: MainScreen | None = None
        if theme_id:
            self.active_theme_id = theme_id
        super().__init__()

    def _headers(self) -> dict[str, str]:
        headers: dict[str, str] = {"Content-Type": "application/json"}
        if self._token:
            headers["Authorization"] = f"Bearer {self._token}"
        return headers

    async def on_mount(self) -> None:
        self._http = httpx.AsyncClient(timeout=30.0)
        await self.fetch_bootstrap()
        self.apply_theme(self.active_theme_id)
        self._main_screen = MainScreen()
        await self.push_screen(self._main_screen)
        self.set_interval(1, self._update_clock)

    def _update_clock(self) -> None:
        from datetime import datetime

        clock = datetime.now().strftime("%H:%M:%S")
        if self._main_screen is not None:
            try:
                status = self._main_screen.query_one("#status", StatusBar)
                status.clock = clock
            except Exception:
                pass

    async def fetch_bootstrap(self) -> dict:
        """Load bootstrap data from the adapter."""
        if self._http is None:
            return {}
        try:
            resp = await self._http.get(
                f"{self._adapter_url}/shell/bootstrap",
                headers=self._headers(),
            )
            resp.raise_for_status()
            data = resp.json()
            self._bootstrap = data
            self.profile_name = data.get("profile", "default")
            sessions = data.get("recent_sessions", [])
            if sessions and self.active_session_id is None:
                self.active_session_id = sessions[0].get("id")
            if self._main_screen is not None:
                sidebar = self._main_screen.query_one("#sidebar", SessionSidebar)
                sidebar.sessions = sessions
                sidebar.active_session_id = self.active_session_id
                status = self._main_screen.query_one("#status", StatusBar)
                status.profile = self.profile_name
                status.transport_status = "connected"
            return data
        except Exception as exc:
            self._show_error(f"Adapter unreachable: {exc}")
            return {}

    async def fetch_theme(self, theme_id: str) -> dict:
        """Fetch a single theme definition."""
        if self._http is None:
            return {}
        resp = await self._http.get(
            f"{self._adapter_url}/shell/themes/{theme_id}",
            headers=self._headers(),
        )
        resp.raise_for_status()
        return resp.json()

    async def fetch_themes(self) -> list[dict]:
        """Fetch all installed themes."""
        if self._http is None:
            return []
        resp = await self._http.get(
            f"{self._adapter_url}/shell/themes",
            headers=self._headers(),
        )
        resp.raise_for_status()
        return resp.json()

    def apply_theme(self, theme_id: str) -> None:
        """Apply a theme id to the app state and status bar."""
        self.active_theme_id = theme_id
        if self._main_screen is not None:
            try:
                status = self._main_screen.query_one("#status", StatusBar)
                status.theme = theme_id
            except Exception:
                pass

    async def send_prompt(self, prompt: str, session_id: str) -> None:
        """Send a prompt and stream SSE events back to the UI."""
        if self._http is None:
            self._show_error("HTTP client not initialized")
            return

        payload = {"prompt": prompt, "session_id": session_id}
        try:
            resp = await self._http.post(
                f"{self._adapter_url}/shell/runs",
                json=payload,
                headers=self._headers(),
            )
            resp.raise_for_status()
            run = resp.json()
            run_id = run.get("run_id")
            if not run_id:
                self._show_error("No run_id returned by adapter")
                return
        except Exception as exc:
            self._show_error(f"Failed to start run: {exc}")
            return

        try:
            async with self._http.stream(
                "GET",
                f"{self._adapter_url}/shell/runs/{run_id}/events",
                headers={**self._headers(), "Accept": "text/event-stream"},
            ) as stream:
                async for line in stream.aiter_lines():
                    if not line.startswith("data: "):
                        continue
                    data_str = line[len("data: ") :]
                    try:
                        event = json.loads(data_str)
                    except json.JSONDecodeError:
                        continue
                    if self._main_screen is not None:
                        self._main_screen.post_message(ShellEventMessage(event))
        except Exception as exc:
            self._show_error(f"SSE stream error: {exc}")

    def _show_error(self, msg: str) -> None:
        """Show an error in the status bar and log panel."""
        if self._main_screen is not None:
            try:
                status = self._main_screen.query_one("#status", StatusBar)
                status.transport_status = "error"
            except Exception:
                pass
            try:
                logs = self._main_screen.query_one("#logs", LogPanel)
                logs.add_line(msg)
            except Exception:
                pass

    def action_theme(self) -> None:
        self.push_screen(ThemeScreen())

    def action_settings(self) -> None:
        self.push_screen(SettingsScreen())

    def action_refresh_sessions(self) -> None:
        self.run_worker(self.fetch_bootstrap())

    def action_slash(self) -> None:
        if self._main_screen is not None:
            try:
                composer = self._main_screen.query_one("#composer")
                composer.focus()
                if hasattr(composer, "action_slash_command"):
                    composer.action_slash_command()
            except Exception:
                pass

    async def on_unmount(self) -> None:
        if self._http is not None:
            await self._http.aclose()
