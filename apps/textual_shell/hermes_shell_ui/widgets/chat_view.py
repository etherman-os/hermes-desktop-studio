"""Chat view widget for rendering conversation."""

from __future__ import annotations

from textual.app import RenderableType
from textual.containers import ScrollableContainer
from textual.widgets import Static

from rich.markdown import Markdown
from rich.text import Text


class ChatView(ScrollableContainer):
    """A scrollable chat view that renders user and assistant messages."""

    DEFAULT_CSS = """
    ChatView {
        width: 100%;
        height: 1fr;
        background: #1a1b26;
        border: none;
        padding: 0 1;
    }
    """

    def __init__(self, *args, **kwargs) -> None:
        self._lines: list[RenderableType] = []
        super().__init__(*args, **kwargs)

    def compose(self):
        yield Static(id="chat-content")

    def _refresh_content(self) -> None:
        content = self.query_one("#chat-content", Static)
        renderable: RenderableType = Text("\n").join(
            [Text.assemble(line) for line in self._lines]
        ) if self._lines else Text("")
        content.update(renderable)
        self.scroll_end(animate=False)

    def add_user_message(self, text: str) -> None:
        """Add a user message bubble."""
        header = Text("You", style="bold #73daca")
        body = Text(text, style="#c0caf5")
        self._lines.append(Text.assemble(header, "\n", body, "\n"))
        self._refresh_content()

    def add_assistant_delta(self, text: str) -> None:
        """Append a delta to the current assistant message."""
        if not self._lines:
            self._lines.append(Text("", style="#c0caf5"))
        last = self._lines[-1]
        if isinstance(last, Text):
            # If the last line doesn't start with Assistant header, prepend it
            if "Assistant" not in last.plain:
                header = Text("Assistant", style="bold #7aa2f7")
                self._lines[-1] = Text.assemble(header, "\n", Text(text, style="#c0caf5"))
            else:
                last.append_text(Text(text, style="#c0caf5"))
        self._refresh_content()

    def add_tool_call(self, name: str, status: str) -> None:
        """Add a tool call line."""
        header = Text(f"Tool: {name}", style="bold #e0af68")
        state = Text(f" [{status}]", style="#9ece6a" if status == "completed" else "#7aa2f7")
        self._lines.append(Text.assemble(header, state, "\n"))
        self._refresh_content()

    def finalize_assistant(self) -> None:
        """Finalize the current assistant message (no-op for plain text mode)."""
        # In a markdown mode we would re-render; for now just ensure a newline gap.
        if self._lines:
            self._lines.append(Text(""))
            self._refresh_content()

    def clear(self) -> None:
        """Clear all messages."""
        self._lines.clear()
        self._refresh_content()
