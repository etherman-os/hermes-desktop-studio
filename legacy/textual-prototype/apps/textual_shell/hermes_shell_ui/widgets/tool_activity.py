"""Tool activity widget."""

from __future__ import annotations

from textual.widgets import Static
from textual.reactive import reactive

from rich.text import Text


class ToolActivity(Static):
    """Panel showing active tool calls."""

    DEFAULT_CSS = """
    ToolActivity {
        width: 100%;
        height: 1fr;
        background: #16161e;
        padding: 0 1;
    }
    """

    tools: reactive[dict[str, dict]] = reactive(dict)

    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)
        self.tools = {}

    def watch_tools(self, tools: dict[str, dict]) -> None:
        self._update_display()

    def on_mount(self) -> None:
        self._update_display()

    def _update_display(self) -> None:
        lines: list[Text] = [Text("Tools", style="bold #e0af68 underline")]
        for name, info in self.tools.items():
            status = info.get("status", "running")
            detail = info.get("detail", "")
            color = {
                "completed": "#9ece6a",
                "error": "#f7768e",
                "running": "#7aa2f7",
            }.get(status, "#a9b1d6")
            lines.append(Text(f"● {name}", style=f"bold {color}"))
            if detail:
                lines.append(Text(f"   {detail}", style="#565f89"))
        self.update(Text("\n").join(lines) if len(lines) > 1 else Text("No active tools"))

    def add_tool(self, name: str) -> None:
        """Register a tool as running."""
        self.tools[name] = {"status": "running", "detail": ""}
        self.refresh()

    def update_progress(self, name: str, detail: str) -> None:
        """Update a tool's progress detail."""
        if name in self.tools:
            self.tools[name]["detail"] = detail
            self.refresh()

    def complete_tool(self, name: str) -> None:
        """Mark a tool as completed."""
        if name in self.tools:
            self.tools[name]["status"] = "completed"
            self.refresh()
