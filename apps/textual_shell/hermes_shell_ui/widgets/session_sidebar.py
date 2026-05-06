"""Session sidebar widget."""

from __future__ import annotations

from textual.widgets import Static
from textual.reactive import reactive

from rich.text import Text

from hermes_shell_ui.messages import SessionSelected


class SessionSidebar(Static):
    """Sidebar listing sessions with active highlight."""

    DEFAULT_CSS = """
    SessionSidebar {
        width: 26;
        height: 100%;
        background: #16161e;
        border-right: solid #24283b;
        padding: 0 1;
    }
    """

    sessions: reactive[list[dict]] = reactive(list)
    active_session_id: reactive[str | None] = reactive(None)

    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)
        self.sessions = []
        self.active_session_id = None

    def watch_sessions(self, sessions: list[dict]) -> None:
        self._update_display()

    def watch_active_session_id(self, session_id: str | None) -> None:
        self._update_display()

    def on_mount(self) -> None:
        self._update_display()

    def _update_display(self) -> None:
        lines: list[Text] = [Text("Sessions", style="bold #7aa2f7 underline")]
        for sess in self.sessions:
            sid = sess.get("id", "unknown")
            title = sess.get("title", "Untitled")
            is_active = sid == self.active_session_id
            style = "bold #c0caf5" if is_active else "#a9b1d6"
            prefix = "> " if is_active else "  "
            lines.append(Text(f"{prefix}{title}", style=style))
        self.update(Text("\n").join(lines) if lines else Text("No sessions"))

    def on_click(self, event) -> None:
        """Select session by click position (1 header line + sessions)."""
        index = event.y - 1
        if index >= 0:
            self.action_select_session(index)

    def action_select_session(self, index: int) -> None:
        """Select session by index."""
        if 0 <= index < len(self.sessions):
            sid = self.sessions[index].get("id")
            if sid:
                self.post_message(SessionSelected(sid))
