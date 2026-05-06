"""Log panel widget."""

from __future__ import annotations

from collections import deque

from textual.widgets import Static
from textual.reactive import reactive

from rich.text import Text


class LogPanel(Static):
    """Panel showing recent log lines."""

    DEFAULT_CSS = """
    LogPanel {
        width: 100%;
        height: 1fr;
        background: #1a1b26;
        border-top: solid #24283b;
        padding: 0 1;
    }
    """

    lines: reactive[deque[str]] = reactive(deque)

    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)
        self.lines = deque(maxlen=200)

    def watch_lines(self, lines: deque[str]) -> None:
        self._update_display()

    def on_mount(self) -> None:
        self._update_display()

    def _update_display(self) -> None:
        header = Text("Logs", style="bold #565f89 underline")
        if self.lines:
            body = Text("\n").join(Text(line) for line in self.lines)
            self.update(Text.assemble(header, "\n", body))
        else:
            self.update(header)

    def add_line(self, line: str) -> None:
        """Append a log line."""
        self.lines.append(line)
        self.refresh()
