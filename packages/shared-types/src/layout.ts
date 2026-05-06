export type LayoutKind = "desktop-studio" | "compact" | "focus" | "kanban-centric";
export type LayoutDensity = "compact" | "comfortable" | "spacious";
export type ModalPosition = "centered" | "bottom-sheet" | "side-drawer" | "dropdown" | "top-bar" | "spotlight" | "sheet" | "tab";

export interface LayoutMeta {
  id: string;
  name: string;
  version: string;
  author: string;
  description?: string;
  extends?: string;
}

export interface LayoutCompat {
  studio_api: string;
  adapter_api?: string;
}

export interface LeftPanelConfig {
  width?: number;
  min_width?: number;
  max_width?: number;
  collapsible?: boolean;
  default_collapsed?: boolean;
  sections?: Array<
    "profiles" | "sessions" | "search" | "artifacts" | "theme_gallery" | "settings"
  >;
}

export interface CenterPanelConfig {
  tabs?: Array<"chat" | "kanban" | "artifacts" | "inspector">;
  default_tab?: string;
}

export interface RightPanelConfig {
  width?: number;
  min_width?: number;
  max_width?: number;
  collapsible?: boolean;
  default_collapsed?: boolean;
  sections?: Array<
    "model" | "tools" | "memory" | "inspector" | "artifacts" | "activity"
  >;
}

export interface BottomPanelConfig {
  height?: number;
  min_height?: number;
  max_height?: number;
  collapsible?: boolean;
  default_collapsed?: boolean;
  sections?: Array<"activity" | "logs" | "terminal">;
}

export interface ModalConfig {
  approval?: "centered" | "bottom-sheet" | "side-drawer";
  session_picker?: "centered" | "side-drawer" | "dropdown";
  theme_editor?: "centered" | "side-drawer" | "sheet";
  command_palette?: "spotlight" | "centered" | "top-bar";
  settings?: "side-drawer" | "tab" | "centered";
}

export interface ChatLayoutConfig {
  message_width?: number;
  show_timestamp?: boolean;
  show_tool_context?: boolean;
  show_avatars?: boolean;
  show_token_count?: boolean;
  code_highlighting?: boolean;
}

export interface KanbanLayoutConfig {
  columns?: string[];
  swimlanes?: Array<"assignee" | "priority" | "workspace" | "none">;
  default_sort?: "updated_desc" | "updated_asc" | "priority" | "created_desc";
  show_quick_actions?: boolean;
  card_preview_lines?: number;
}

export interface ShortcutHints {
  command_palette?: string;
  send?: string;
  chat_tab?: string;
  kanban_tab?: string;
  sessions_tab?: string;
  logs_tab?: string;
  stop_run?: string;
  search?: string;
  theme_switcher?: string;
  profile_switcher?: string;
}

export interface ResponsiveConfig {
  collapse_right_below?: number;
  collapse_left_below?: number;
  collapse_bottom_below?: number;
  compact_mode_below?: number;
}

export interface LayoutPack {
  meta: LayoutMeta;
  compat?: LayoutCompat;
  layout?: {
    kind?: LayoutKind;
    density?: LayoutDensity;
    default_route?: string;
  };
  left?: LeftPanelConfig;
  center?: CenterPanelConfig;
  right?: RightPanelConfig;
  bottom?: BottomPanelConfig;
  modals?: ModalConfig;
  chat?: ChatLayoutConfig;
  kanban?: KanbanLayoutConfig;
  shortcuts?: ShortcutHints;
  responsive?: ResponsiveConfig;
}
