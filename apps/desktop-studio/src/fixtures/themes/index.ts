/**
 * LOCAL FALLBACK THEME FIXTURES
 *
 * These are fallback themes used ONLY when the adapter is unavailable.
 * The real source of truth is the adapter theme repository (TOML theme packs).
 * When the adapter is connected, adapter-loaded themes override these.
 *
 * Do NOT add concept-specific logic here.
 * All themes are generic concept packs using semantic slots.
 */

import type { ThemePack } from "@hermes-studio/shared-types";
import type { SemanticSlot } from "@hermes-studio/shared-types";
import { defaultDark } from "./default-dark";
import { minecraftOverworld } from "./minecraft-overworld";
import { exampleMinions } from "./example-minions";
import { exampleLotr } from "./example-lotr";
import { minimalLight } from "./minimal-light";

export const ALL_THEMES: Record<string, ThemePack> = {
  "default-dark": defaultDark,
  "minecraft-overworld": minecraftOverworld,
  "example-minions": exampleMinions,
  "example-lotr": exampleLotr,
  "minimal-light": minimalLight,
};

export const SLOT_ICONS: Record<SemanticSlot, string> = {
  profiles: defaultDark.icons?.profile ?? "👤",
  sessions: defaultDark.icons?.session ?? "💬",
  chat: "🗨️",
  kanban: defaultDark.icons?.kanban ?? "📋",
  artifacts: "📦",
  tools: defaultDark.icons?.tools ?? "🔧",
  memory: defaultDark.icons?.memory ?? "🧠",
  logs: defaultDark.icons?.logs ?? "📜",
  activity: "⚡",
  inspector: "🔍",
  command_palette: "⌘",
  settings: "⚙️",
  theme_gallery: "🎨",
};
