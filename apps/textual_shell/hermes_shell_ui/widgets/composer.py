"""Composer widget for prompt input."""

from __future__ import annotations

from textual.widgets import Input

from hermes_shell_ui.messages import PromptSubmitted


class Composer(Input):
    """Single-line composer with history and slash-command support."""

    DEFAULT_CSS = """
    Composer {
        width: 100%;
        height: 3;
        background: #24283b;
        color: #c0caf5;
        border-top: solid #414868;
        padding: 0 1;
    }
    """

    def __init__(self, *args, **kwargs) -> None:
        self._history: list[str] = []
        self._history_index: int = -1
        kwargs.setdefault("placeholder", "Type a message... (Enter to send, / for commands)")
        super().__init__(*args, **kwargs)

    def on_key(self, event) -> None:
        """Handle up/down for history and enter to submit."""
        if event.key == "up":
            event.prevent_default()
            if self._history and self._history_index < len(self._history) - 1:
                self._history_index += 1
                self.value = self._history[self._history_index]
        elif event.key == "down":
            event.prevent_default()
            if self._history_index > 0:
                self._history_index -= 1
                self.value = self._history[self._history_index]
            elif self._history_index == 0:
                self._history_index = -1
                self.value = ""
        elif event.key == "enter":
            event.prevent_default()
            self._submit()

    def _submit(self) -> None:
        """Submit the current prompt."""
        text = self.value.strip()
        if not text:
            return
        self._history.insert(0, text)
        self._history_index = -1
        self.value = ""
        self.post_message(PromptSubmitted(text))

    def action_slash_command(self) -> None:
        """Focus composer and prepend slash if not present."""
        self.focus()
        if not self.value.startswith("/"):
            self.value = "/" + self.value
            self.cursor_position = len(self.value)
