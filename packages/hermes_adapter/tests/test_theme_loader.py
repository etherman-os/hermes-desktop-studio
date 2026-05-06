"""Tests for ThemeManager discovery, loading, and inheritance."""

from pathlib import Path

import pytest

from hermes_adapter.theme_loader import ThemeManager, ThemeNotFoundError


class TestThemeManager:
    def test_load_default_dark(self, project_themes_dir: Path) -> None:
        mgr = ThemeManager(project_themes_dir)
        theme = mgr.load_theme("default-dark")

        assert theme["meta"]["id"] == "default-dark"
        assert theme["palette"]["bg"] == "#0f1117"
        assert theme["icons"]["profile"] == "👤"
        assert theme["labels"]["profiles"] == "Profiles"

    def test_minecraft_extends_default_dark(self, project_themes_dir: Path) -> None:
        mgr = ThemeManager(project_themes_dir)
        theme = mgr.load_theme("minecraft-overworld")

        # Child metadata wins
        assert theme["meta"]["id"] == "minecraft-overworld"
        assert theme["meta"]["extends"] == "default-dark"

        # Palette: all fields overridden by Minecraft child
        assert theme["palette"]["bg"] == "#1a1d14"
        assert theme["palette"]["accent"] == "#7cb342"
        assert theme["palette"]["surface"] == "#2f3b1f"
        assert theme["palette"]["text"] == "#eef6d2"

        # Icons: all overridden by Minecraft child
        assert theme["icons"]["profile"] == "🌍"
        assert theme["icons"]["tools"] == "⛏"
        assert theme["icons"]["memory"] == "🧰"

        # Borders: fully overridden blocky style
        assert theme["borders"]["style"] == "blocky"
        assert theme["borders"]["horizontal"] == "█"

        # Labels: Turkish translations from child
        assert theme["labels"]["profiles"] == "Dünyalar"
        assert theme["labels"]["sessions"] == "Ender Chest"

    def test_theme_inheritance_merge(self, tmp_path: Path) -> None:
        """Verify deep-merge behaviour with a minimal parent/child pair."""
        themes_dir = tmp_path / "themes"
        themes_dir.mkdir()

        parent_dir = themes_dir / "parent"
        parent_dir.mkdir()
        (parent_dir / "theme.toml").write_text("""
[meta]
id = "parent"
name = "Parent"

[palette]
bg = "#000000"
surface = "#111111"
accent = "#222222"

[icons]
profile = "A"
session = "B"
""")

        child_dir = themes_dir / "child"
        child_dir.mkdir()
        (child_dir / "theme.toml").write_text("""
[meta]
id = "child"
extends = "parent"
name = "Child"

[palette]
bg = "#ffffff"
accent = "#eeeeee"

[icons]
profile = "Z"
""")

        mgr = ThemeManager(themes_dir)
        theme = mgr.load_theme("child")

        # Child overrides
        assert theme["palette"]["bg"] == "#ffffff"
        assert theme["palette"]["accent"] == "#eeeeee"
        assert theme["icons"]["profile"] == "Z"

        # Parent inherits
        assert theme["palette"]["surface"] == "#111111"
        assert theme["icons"]["session"] == "B"

    def test_list_themes(self, project_themes_dir: Path) -> None:
        mgr = ThemeManager(project_themes_dir)
        themes = mgr.list_themes()
        ids = {t["id"] for t in themes}

        assert "default-dark" in ids
        assert "minecraft-overworld" in ids

        mc = next(t for t in themes if t["id"] == "minecraft-overworld")
        assert mc["extends"] == "default-dark"

    def test_invalid_theme_raises(self, project_themes_dir: Path) -> None:
        mgr = ThemeManager(project_themes_dir)
        with pytest.raises(ThemeNotFoundError):
            mgr.load_theme("nonexistent-theme")

    def test_empty_themes_dir(self, tmp_path: Path) -> None:
        mgr = ThemeManager(tmp_path)
        assert mgr.list_themes() == []
