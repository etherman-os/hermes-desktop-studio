"""Status bar widget."""

from __future__ import annotations

from textual.widgets import Static
from textual.reactive import reactive

from rich.text import Text


class StatusBar(Static):
    """Reactive status bar showing profile, cwd, transport, theme, and clock."""

    DEFAULT_CSS = """
    StatusBar {
        width: 100%;
        height: 1;
        background: #24283b;
        color: #7aa2f7;
        content-align: center middle;
    }
    """

    profile: reactive[str] = reactive("default")
    cwd: reactive[str] = reactive("~")
    transport_status: reactive[str] = reactive("disconnected")
    theme: reactive[str] = reactive("default-dark")
    clock: reactive[str] = reactive("")

    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    def watch_profile(self, value: str) -> None:
        self._update_display()

    def watch_cwd(self, value: str) -> None:
        self._update_display()

    def watch_transport_status(self, value: str) -> None:
        self._update_display()

    def watch_theme(self, value: str) -> None:
        self._update_display()

    def watch_clock(self, value: str) -> None:
        self._update_display()

    def on_mount(self) -> None:
        self._update_display()

    def _update_display(self) -> None:
        transport_color = "#9ece6a" if self.transport_status == "connected" else "#f7768e"
        parts = [
            ("profile:", "#565f89"),
            (f" {self.profile}", "#c0caf5"),
            (" | cwd:", "#565f89"),
            (f" {self.cwd}", "#c0caf5"),
            (" | ", "#414868"),
            (self.transport_status, transport_color),
            (" | theme:", "#565f89"),
            (f" {self.theme}", "#c0caf5"),
            (" | ", "#414868"),
            (self.clock, "#a9b1d6"),
        ]
        self.update(Text.assemble(*[(t, s) for t, s in parts]))
