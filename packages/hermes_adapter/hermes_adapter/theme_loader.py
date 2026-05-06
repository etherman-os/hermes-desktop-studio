"""Theme loading and inheritance for Hermes Local Shell."""

from pathlib import Path
from typing import Any

try:
    import tomllib
except ImportError:
    import tomli as tomllib  # type: ignore[no-redef]


class ThemeNotFoundError(Exception):
    """Raised when a requested theme does not exist."""


class ThemeManager:
    """Manages discovery and loading of theme packs."""

    def __init__(self, themes_dir: str | Path) -> None:
        self.themes_dir = Path(themes_dir)

    def list_themes(self) -> list[dict[str, Any]]:
        """Return metadata for every theme pack found in *themes_dir*."""
        themes: list[dict[str, Any]] = []
        if not self.themes_dir.exists():
            return themes

        for path in sorted(self.themes_dir.iterdir()):
            if not path.is_dir():
                continue
            theme_file = path / "theme.toml"
            if not theme_file.exists():
                continue
            data = self._load_toml(theme_file)
            meta = data.get("meta", {})
            themes.append(
                {
                    "id": meta.get("id", path.name),
                    "name": meta.get("name", path.name),
                    "version": meta.get("version", ""),
                    "author": meta.get("author", ""),
                    "description": meta.get("description", ""),
                    "extends": meta.get("extends"),
                }
            )
        return themes

    def load_theme(self, theme_id: str) -> dict[str, Any]:
        """Load a theme pack, recursively merging with its parent if *extends* is set."""
        theme_path = self.themes_dir / theme_id / "theme.toml"
        if not theme_path.exists():
            raise ThemeNotFoundError(f"Theme not found: {theme_id}")

        data = self._load_toml(theme_path)
        meta = data.get("meta", {})
        parent_id = meta.get("extends")

        if parent_id:
            parent = self.load_theme(parent_id)
            return self._merge(parent, data)

        return data

    @staticmethod
    def _load_toml(path: Path) -> dict[str, Any]:
        with path.open("rb") as fh:
            return tomllib.load(fh)

    @staticmethod
    def _merge(parent: dict[str, Any], child: dict[str, Any]) -> dict[str, Any]:
        """Deep-merge *child* over *parent*. Nested dicts are merged; everything else is overwritten."""
        merged: dict[str, Any] = {}
        for key in parent.keys() | child.keys():
            if key in parent and key in child:
                if isinstance(parent[key], dict) and isinstance(child[key], dict):
                    merged[key] = {**parent[key], **child[key]}
                else:
                    merged[key] = child[key]
            elif key in parent:
                merged[key] = parent[key]
            else:
                merged[key] = child[key]
        return merged
