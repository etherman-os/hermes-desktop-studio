export type SemanticSlot =
  | "profiles"
  | "sessions"
  | "chat"
  | "kanban"
  | "artifacts"
  | "tools"
  | "memory"
  | "logs"
  | "activity"
  | "inspector"
  | "command_palette"
  | "settings"
  | "theme_gallery";

export interface ThemeMeta {
  id: string;
  name: string;
  version: string;
  author: string;
  description?: string;
  extends?: string;
  keywords?: string[];
}

export interface ThemeCompat {
  studio_api: string;
  adapter_api: string;
  min_hermes?: string;
}

export interface ThemePalette {
  bg?: string;
  bg_alt?: string;
  surface?: string;
  surface_alt?: string;
  panel?: string;
  panel_alt?: string;
  border?: string;
  border_subtle?: string;
  text?: string;
  text_secondary?: string;
  text_muted?: string;
  accent?: string;
  accent_alt?: string;
  accent_subtle?: string;
  ok?: string;
  warn?: string;
  danger?: string;
  info?: string;
  kanban_todo?: string;
  kanban_doing?: string;
  kanban_done?: string;
  kanban_blocked?: string;
  status_bg?: string;
}

export interface ThemeTypography {
  font_family?: string;
  font_family_mono?: string;
  font_size_base?: string;
  font_size_sm?: string;
  font_size_lg?: string;
  font_size_xl?: string;
  line_height?: string;
  font_weight_normal?: string;
  font_weight_medium?: string;
  font_weight_bold?: string;
}

export interface ThemeBorders {
  style?: "thin" | "thick" | "rounded" | "blocky" | "none";
  radius_sm?: string;
  radius_md?: string;
  radius_lg?: string;
  width?: string;
  horizontal?: string;
  vertical?: string;
  corner_tl?: string;
  corner_tr?: string;
  corner_bl?: string;
  corner_br?: string;
  separator?: string;
}

export interface ThemeIcons {
  profile?: string;
  session?: string;
  memory?: string;
  tools?: string;
  kanban?: string;
  logs?: string;
  command?: string;
  automation?: string;
  agent?: string;
  approval?: string;
  search?: string;
  settings?: string;
  send?: string;
  stop?: string;
  success?: string;
  warning?: string;
  error?: string;
  info?: string;
  artifacts?: string;
  activity?: string;
  inspector?: string;
  theme_gallery?: string;
}

export interface ThemeLabels {
  profiles?: string;
  sessions?: string;
  chat?: string;
  kanban?: string;
  artifacts?: string;
  tools?: string;
  memory?: string;
  logs?: string;
  activity?: string;
  inspector?: string;
  command_palette?: string;
  settings?: string;
  theme_gallery?: string;
  composer?: string;
  automation?: string;
  send?: string;
  stop?: string;
  resume?: string;
  approve?: string;
  deny?: string;
  search?: string;
}

export interface ThemeEmptyStates {
  sessions?: string;
  chat?: string;
  kanban?: string;
  artifacts?: string;
  tools?: string;
  memory?: string;
  logs?: string;
  activity?: string;
  inspector?: string;
  search?: string;
}

export interface ThemeOnboarding {
  welcome_title?: string;
  welcome_message?: string;
  first_run_hint?: string;
  theme_hint?: string;
  shortcut_hint?: string;
}

export interface ThemeMessageStyles {
  assistant?: "bubble" | "block-bubble" | "compact-card" | "terminal-block";
  user?: "bubble" | "block-bubble" | "compact-card" | "terminal-block";
  tool?: "chip-stream" | "card" | "inline" | "collapsed";
  diff?: "file-card" | "inline" | "modal";
  assistant_prefix?: string;
  user_prefix?: string;
  tool_prefix?: string;
  approval_prefix?: string;
}

export interface ThemePanels {
  show_status_bar?: boolean;
  show_right_inspector?: boolean;
  show_bottom_activity?: boolean;
  collapsible_left_sidebar?: boolean;
  collapsible_right_sidebar?: boolean;
  collapsible_bottom_panel?: boolean;
}

export interface ThemeKanban {
  card_density?: "compact" | "comfortable" | "spacious";
  show_assignee_avatar?: boolean;
  show_priority_badge?: boolean;
  show_workspace_chip?: boolean;
  card_border_radius?: string;
  column_header_style?: "default" | "minimal" | "accent" | "filled";
}

export interface ThemeCardStyles {
  border_radius?: string;
  padding?: string;
  shadow?: string;
  hover_effect?: "none" | "lift" | "highlight" | "glow";
}

export interface ThemeDensity {
  mode?: "compact" | "comfortable" | "spacious";
  spacing_xs?: string;
  spacing_sm?: string;
  spacing_md?: string;
  spacing_lg?: string;
  spacing_xl?: string;
}

export interface ThemeAccessibility {
  reduced_motion?: boolean;
  high_contrast?: boolean;
  font_scale?: number;
  focus_ring_style?: "solid" | "dashed" | "glow" | "none";
}

export interface ThemeAssets {
  banner?: string;
  preview?: string;
  hero_image?: string;
  favicon?: string;
  font_url?: string;
}

export interface ThemePack {
  meta: ThemeMeta;
  compat?: ThemeCompat;
  palette?: ThemePalette;
  typography?: ThemeTypography;
  borders?: ThemeBorders;
  icons?: ThemeIcons;
  labels?: ThemeLabels;
  empty_states?: ThemeEmptyStates;
  onboarding?: ThemeOnboarding;
  message_styles?: ThemeMessageStyles;
  panels?: ThemePanels;
  kanban?: ThemeKanban;
  card_styles?: ThemeCardStyles;
  density?: ThemeDensity;
  accessibility?: ThemeAccessibility;
  assets?: ThemeAssets;
}

export interface ThemeInfo {
  id: string;
  name: string;
  version: string;
  author: string;
  description?: string;
  extends?: string;
}
