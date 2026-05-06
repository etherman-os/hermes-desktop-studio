export type PluginType =
  | "theme-pack"
  | "layout-pack"
  | "panel-pack"
  | "command-pack"
  | "kanban-pack";

export type PluginStatus = "active" | "experimental" | "deprecated" | "future";

export interface PluginPackageInfo {
  id: string;
  name: string;
  version: string;
  author: string;
  license?: string;
  repository?: string;
  description?: string;
}

export interface PluginCompat {
  studio_api: string;
  adapter_api?: string;
  min_hermes?: string;
}

export interface PluginFeatures {
  custom_layout?: boolean;
  custom_icons?: boolean;
  custom_labels?: boolean;
  custom_colors?: boolean;
  custom_typography?: boolean;
  kanban_overrides?: boolean;
  accessibility_profile?: boolean;
  custom_commands?: boolean;
  custom_panels?: boolean;
}

export interface PluginDistribution {
  archive?: string;
  sha256?: string;
  signature?: string;
  registry_url?: string;
}

export interface PluginEntryPoints {
  theme_file?: string;
  layout_file?: string;
  preview_file?: string;
  panel_module?: string;
  command_module?: string;
}

export interface PluginManifest {
  package: PluginPackageInfo;
  type: PluginType;
  compat: PluginCompat;
  features?: PluginFeatures;
  distribution?: PluginDistribution;
  status?: PluginStatus;
  entry_points?: PluginEntryPoints;
}

export const MVP_PLUGIN_TYPES: PluginType[] = ["theme-pack", "layout-pack"];

export const FUTURE_PLUGIN_TYPES: PluginType[] = [
  "panel-pack",
  "command-pack",
  "kanban-pack",
];
