"""Tests for theme repository — TOML theme pack discovery, validation, inheritance."""

from __future__ import annotations

from pathlib import Path

import pytest

from hermes_adapter.theme_repository import ThemeRepository, _deep_merge, _validate_theme


class TestDeepMerge:
    def test_simple_merge(self) -> None:
        base = {"a": 1, "b": 2}
        override = {"b": 3, "c": 4}
        result = _deep_merge(base, override)
        assert result == {"a": 1, "b": 3, "c": 4}

    def test_nested_merge(self) -> None:
        base = {"palette": {"bg": "#000", "text": "#fff"}}
        override = {"palette": {"bg": "#111"}}
        result = _deep_merge(base, override)
        assert result["palette"]["bg"] == "#111"
        assert result["palette"]["text"] == "#fff"

    def test_override_wins(self) -> None:
        base = {"x": "old"}
        override = {"x": "new"}
        result = _deep_merge(base, override)
        assert result["x"] == "new"


class TestValidateTheme:
    def test_valid_theme(self) -> None:
        data = {"meta": {"id": "test", "name": "Test", "version": "1.0.0", "author": "me"}}
        warnings = _validate_theme(data, Path("test.toml"))
        assert len(warnings) == 0

    def test_missing_meta(self) -> None:
        data = {"palette": {"bg": "#000"}}
        warnings = _validate_theme(data, Path("test.toml"))
        assert any("missing [meta]" in w for w in warnings)

    def test_missing_required_fields(self) -> None:
        data = {"meta": {"id": "test"}}
        warnings = _validate_theme(data, Path("test.toml"))
        assert any("name" in w for w in warnings)
        assert any("version" in w for w in warnings)

    def test_invalid_id_format(self) -> None:
        data = {"meta": {"id": "Invalid ID!", "name": "Test", "version": "1.0.0", "author": "me"}}
        warnings = _validate_theme(data, Path("test.toml"))
        assert any("invalid meta.id" in w for w in warnings)


class TestThemeRepositoryWithFixtures:
    """Test with the actual built-in theme TOML files."""

    def test_discovers_builtin_themes(self) -> None:
        repo = ThemeRepository()
        themes = repo.list_themes()
        ids = [t["id"] for t in themes]
        assert "default-dark" in ids
        assert "minecraft-overworld" in ids

    def test_default_theme_is_valid(self) -> None:
        repo = ThemeRepository()
        themes = repo.list_themes()
        default = next(t for t in themes if t["id"] == "default-dark")
        assert default["valid"] is True

    def test_active_theme_is_default_dark(self) -> None:
        repo = ThemeRepository()
        assert repo.get_active_theme_id() == "default-dark"

    def test_get_theme(self) -> None:
        repo = ThemeRepository()
        theme = repo.get_theme("default-dark")
        assert theme is not None
        assert theme["meta"]["id"] == "default-dark"

    def test_get_normalized_theme(self) -> None:
        repo = ThemeRepository()
        normalized = repo.get_normalized_theme("default-dark")
        assert "meta" in normalized
        assert "palette" in normalized
        assert "icons" in normalized
        assert "labels" in normalized

    def test_minecraft_extends_default_dark(self) -> None:
        repo = ThemeRepository()
        minecraft = repo.get_theme("minecraft-overworld")
        assert minecraft is not None
        # Should have inherited from default-dark
        assert minecraft["meta"]["extends"] == "default-dark"
        # Should have its own palette
        assert minecraft["palette"]["bg"] == "#1a1d14"
        # Should have inherited borders from default-dark if not overridden
        assert "borders" in minecraft

    def test_activate_theme(self) -> None:
        repo = ThemeRepository()
        repo.activate_theme("minecraft-overworld")
        assert repo.get_active_theme_id() == "minecraft-overworld"
        # Reset
        repo.activate_theme("default-dark")

    def test_activate_missing_theme_raises(self) -> None:
        repo = ThemeRepository()
        with pytest.raises(ValueError):
            repo.activate_theme("nonexistent-theme")

    def test_get_active_theme(self) -> None:
        repo = ThemeRepository()
        active = repo.get_active_theme()
        assert active is not None
        assert active["meta"]["id"] == "default-dark"

    def test_theme_info_shape(self) -> None:
        repo = ThemeRepository()
        info = repo.get_theme_info("default-dark")
        assert "id" in info
        assert "name" in info
        assert "version" in info
        assert "author" in info
        assert "source" in info
        assert "valid" in info

    def test_all_themes_have_semantic_labels(self) -> None:
        """All built-in themes should have labels for core semantic slots."""
        repo = ThemeRepository()
        core_slots = ["profiles", "sessions", "chat", "tools", "memory", "logs"]
        for theme_info in repo.list_themes():
            theme = repo.get_theme(theme_info["id"])
            if theme:
                labels = theme.get("labels", {})
                for slot in core_slots:
                    assert slot in labels, f"Theme '{theme_info['id']}' missing label for '{slot}'"

    def test_reload(self) -> None:
        repo = ThemeRepository()
        count_before = len(repo.list_themes())
        repo.reload()
        count_after = len(repo.list_themes())
        assert count_after == count_before  # Should find same themes

    def test_theme_source_metadata(self) -> None:
        repo = ThemeRepository()
        for theme in repo.list_themes():
            assert theme["source"] in ("built-in", "user")
