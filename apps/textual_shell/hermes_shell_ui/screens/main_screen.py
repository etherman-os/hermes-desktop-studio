"""Main screen composing the primary UI layout."""

from __future__ import annotations

from textual.app import ComposeResult
from textual.containers import Container, Horizontal
from textual.screen import Screen

from hermes_shell_ui.messages import PromptSubmitted, SessionSelected, ShellEventMessage
from hermes_shell_ui.widgets.chat_view import ChatView
from hermes_shell_ui.widgets.composer import Composer
from hermes_shell_ui.widgets.log_panel import LogPanel
from hermes_shell_ui.widgets.session_sidebar import SessionSidebar
from hermes_shell_ui.widgets.status_bar import StatusBar
from hermes_shell_ui.widgets.tool_activity import ToolActivity


class MainScreen(Screen):
    """Main 3-pane screen with chat, tools, logs, and sidebar."""

    BINDINGS = [
        ("ctrl+s", "settings", "Settings"),
        ("ctrl+t", "theme", "Theme"),
    ]

    def compose(self) -> ComposeResult:
        with Horizontal():
            yield SessionSidebar(id="sidebar")
            with Container(id="center-pane"):
                yield ChatView(id="chat")
                yield Composer(id="composer")
            with Container(id="right-pane"):
                yield ToolActivity(id="tools")
                yield LogPanel(id="logs")
        yield StatusBar(id="status")

    def on_prompt_submitted(self, event: PromptSubmitted) -> None:
        """Forward prompt to app for sending."""
        chat = self.query_one("#chat", ChatView)
        chat.add_user_message(event.prompt)
        app = self.app
        if hasattr(app, "send_prompt"):
            session_id = getattr(app, "active_session_id", None) or ""
            app.run_worker(app.send_prompt(event.prompt, session_id))

    def on_session_selected(self, event: SessionSelected) -> None:
        """Update active session in app and sidebar."""
        app = self.app
        if hasattr(app, "active_session_id"):
            app.active_session_id = event.session_id
        sidebar = self.query_one("#sidebar", SessionSidebar)
        sidebar.active_session_id = event.session_id

    def on_shell_event(self, event: ShellEventMessage) -> None:
        """Route shell events to the correct widgets."""
        data = event.event
        ev_type = data.get("type", "")
        chat = self.query_one("#chat", ChatView)
        tools = self.query_one("#tools", ToolActivity)
        logs = self.query_one("#logs", LogPanel)

        if ev_type == "assistant.delta":
            delta = data.get("content", "")
            chat.add_assistant_delta(delta)
        elif ev_type == "assistant.completed":
            chat.finalize_assistant()
        elif ev_type == "tool.started":
            name = data.get("tool", "tool")
            tools.add_tool(name)
        elif ev_type == "tool.progress":
            name = data.get("tool", "tool")
            detail = data.get("detail", "")
            tools.update_progress(name, detail)
        elif ev_type == "tool.completed":
            name = data.get("tool", "tool")
            tools.complete_tool(name)
        elif ev_type == "log.line":
            line = data.get("message", "")
            logs.add_line(line)
        elif ev_type in ("run.completed", "run.failed", "run.cancelled"):
            logs.add_line(f"Run finished: {ev_type}")
        else:
            # Unknown events go to logs for visibility
            logs.add_line(str(data))

    def action_settings(self) -> None:
        """Push settings screen."""
        from hermes_shell_ui.screens.settings_screen import SettingsScreen

        self.app.push_screen(SettingsScreen())

    def action_theme(self) -> None:
        """Push theme screen."""
        from hermes_shell_ui.screens.theme_screen import ThemeScreen

        self.app.push_screen(ThemeScreen())
