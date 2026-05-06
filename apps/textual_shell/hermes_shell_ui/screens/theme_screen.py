"""Theme picker screen."""

from __future__ import annotations

from textual.app import ComposeResult
from textual.containers import Container
from textual.screen import Screen
from textual.widgets import Button, Label, ListItem, ListView, Static


class ThemeScreen(Screen):
    """Screen to list and select installed themes."""

    BINDINGS = [
        ("escape", "close", "Close"),
    ]

    DEFAULT_CSS = """
    ThemeScreen {
        align: center middle;
    }
    .theme-container {
        width: 60;
        height: auto;
        background: #1a1b26;
        border: solid #7aa2f7;
        padding: 1 2;
    }
    """

    def __init__(self) -> None:
        self._themes: list[dict] = []
        super().__init__()

    def compose(self) -> ComposeResult:
        with Container(classes="theme-container"):
            yield Label("Select Theme", classes="title")
            yield ListView(id="theme-list")
            yield Button("Close", id="close")

    async def on_mount(self) -> None:
        app = self.app
        if hasattr(app, "fetch_themes"):
            try:
                # Assume app has a cached list or we fetch from adapter
                themes = await app.fetch_themes()
                self._themes = themes
                list_view = self.query_one("#theme-list", ListView)
                for theme in themes:
                    name = theme.get("name", "unknown")
                    list_view.append(ListItem(Label(name), name=name))
            except Exception:
                pass

    def on_list_view_selected(self, event: ListView.Selected) -> None:
        """Apply selected theme."""
        item = event.item
        theme_id = getattr(item, "name", None) or str(item)
        app = self.app
        if hasattr(app, "apply_theme"):
            app.apply_theme(theme_id)
        self.dismiss()

    def on_button_pressed(self, event: Button.Pressed) -> None:
        if event.button.id == "close":
            self.dismiss()

    def action_close(self) -> None:
        self.dismiss()
