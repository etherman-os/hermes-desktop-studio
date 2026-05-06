"""Settings screen."""

from __future__ import annotations

from textual.app import ComposeResult
from textual.containers import Container
from textual.screen import Screen
from textual.widgets import Button, Input, Label, Static


class SettingsScreen(Screen):
    """Simple placeholder settings form."""

    BINDINGS = [
        ("escape", "close", "Close"),
        ("ctrl+s", "close", "Close"),
    ]

    DEFAULT_CSS = """
    SettingsScreen {
        align: center middle;
    }
    .settings-container {
        width: 60;
        height: auto;
        background: #1a1b26;
        border: solid #7aa2f7;
        padding: 1 2;
    }
    """

    def compose(self) -> ComposeResult:
        with Container(classes="settings-container"):
            yield Label("Settings", classes="title")
            yield Label("Profile")
            yield Input(placeholder="default", id="profile")
            yield Label("Model")
            yield Input(placeholder="gpt-4", id="model")
            yield Label("Theme")
            yield Input(placeholder="default-dark", id="theme")
            yield Button("Save", id="save")
            yield Button("Close", id="close")

    def on_button_pressed(self, event: Button.Pressed) -> None:
        """Handle button presses."""
        if event.button.id in ("save", "close"):
            self.dismiss()

    def action_close(self) -> None:
        self.dismiss()
