export const mockProfiles = [
  { name: "coder", path: "/home/user/.hermes-profiles/coder", isActive: true },
  { name: "research", path: "/home/user/.hermes-profiles/research", isActive: false },
  { name: "writer", path: "/home/user/.hermes-profiles/writer", isActive: false },
];

export const mockSessions = [
  { id: "s-1", title: "Map src directory structure", createdAt: "2026-05-06T10:00:00Z", updatedAt: "2026-05-06T10:05:00Z", messageCount: 12, profile: "coder" },
  { id: "s-2", title: "Review API endpoint contracts", createdAt: "2026-05-06T09:00:00Z", updatedAt: "2026-05-06T09:30:00Z", messageCount: 24, profile: "coder" },
  { id: "s-3", title: "Theme loader bug investigation", createdAt: "2026-05-05T14:00:00Z", updatedAt: "2026-05-05T15:20:00Z", messageCount: 18, profile: "coder" },
  { id: "s-4", title: "Write unit tests for adapter", createdAt: "2026-05-05T11:00:00Z", updatedAt: "2026-05-05T12:00:00Z", messageCount: 8, profile: "coder" },
  { id: "s-5", title: "Research paper on local-first architecture", createdAt: "2026-05-04T09:00:00Z", updatedAt: "2026-05-04T11:00:00Z", messageCount: 32, profile: "research" },
];

export const mockMessages = [
  { role: "user" as const, content: "Can you map the src directory structure and give me a summary?" },
  { role: "assistant" as const, content: "I'll explore the src directory structure for you.\n\n```\nsrc/\n  main.tsx          — Entry point\n  App.tsx            — Root component\n  components/\n    layout/          — App frame, sidebar, panels\n    chat/            — Chat surface and composer\n    kanban/          — Kanban board\n    command-palette/ — Ctrl+K palette\n    theme-switcher/  — Theme gallery\n  stores/            — Zustand state stores\n  fixtures/          — Mock data and theme fixtures\n  styles/            — CSS variables and main stylesheet\n```\n\nThe structure follows a clean separation between layout, features, state, and styling." },
  { role: "user" as const, content: "What about the store structure?" },
  { role: "assistant" as const, content: "There are 5 Zustand stores:\n\n1. **themeStore** — Active theme, palette, labels, icons\n2. **layoutStore** — Panel visibility, active tabs, sidebar state\n3. **sessionStore** — Sessions list, active session\n4. **runStore** — Active run, streaming state, events\n5. **uiStore** — Command palette, modals, generic UI state\n\nEach store is independent and can be tested in isolation." },
];

export const mockToolEvents = [
  { tool: "file_tree", status: "completed" as const, duration: "1.2s" },
  { tool: "code_search", status: "completed" as const, duration: "0.8s" },
];

export const mockKanbanCards = [
  { id: "k-1", title: "Fix theme loader inheritance", description: "Deep merge not working for nested palette keys", status: "Doing", priority: "high" as const, source: "session s-3" },
  { id: "k-2", title: "Add SSE mock streaming", description: "Create fake adapter endpoint for dev mode", status: "Ready", priority: "high" as const, source: "roadmap" },
  { id: "k-3", title: "Implement command palette", description: "Ctrl+K with fuzzy search", status: "Done", priority: "medium" as const, source: "roadmap" },
  { id: "k-4", title: "Write shared-types package", description: "TS types for events, theme, layout, plugin", status: "Done", priority: "medium" as const, source: "roadmap" },
  { id: "k-5", title: "Session browser with search", description: "FTS5 integration with state.db", status: "Inbox", priority: "medium" as const, source: "roadmap" },
  { id: "k-6", title: "Kanban drag-and-drop", description: "Allow reordering cards between columns", status: "Inbox", priority: "low" as const, source: "roadmap" },
  { id: "k-7", title: "Review event normalizer", description: "Check run.failed synthesis logic", status: "Ready", priority: "medium" as const, source: "session s-4" },
  { id: "k-8", title: "Approval modal UX", description: "Design approval/deny flow for dangerous tools", status: "Blocked", priority: "high" as const, source: "roadmap" },
];

export const mockMemory = [
  { key: "project.layout", value: "monorepo with pnpm workspace" },
  { key: "project.stack", value: "Tauri v2 + React + TypeScript + Vite" },
  { key: "adapter.port", value: "39191" },
  { key: "theme.format", value: "TOML with extends inheritance" },
];

export const mockModel = {
  name: "claude-sonnet-4-20250514",
  provider: "Anthropic",
  contextWindow: "200k",
};

export const mockLogs = [
  { timestamp: "10:05:32", level: "info", message: "Adapter started on 127.0.0.1:39191" },
  { timestamp: "10:05:33", level: "info", message: "Bootstrap endpoint registered" },
  { timestamp: "10:05:33", level: "info", message: "Theme loader initialized: 2 themes found" },
  { timestamp: "10:05:34", level: "info", message: "Hermes health check: OK (v0.12.0)" },
  { timestamp: "10:06:01", level: "info", message: "Run started: run_abc123" },
  { timestamp: "10:06:02", level: "info", message: "Tool started: file_tree" },
  { timestamp: "10:06:03", level: "info", message: "Tool completed: file_tree (1.2s)" },
  { timestamp: "10:06:15", level: "info", message: "Run completed: run_abc123" },
  { timestamp: "10:08:00", level: "warn", message: "Theme minecraft-overworld: missing accessibility.font_scale" },
  { timestamp: "10:10:45", level: "info", message: "Session s-2 resumed" },
  { timestamp: "10:11:00", level: "error", message: "Failed to connect to Hermes API: connection refused" },
  { timestamp: "10:11:01", level: "info", message: "Retry attempt 1/3..." },
];

export const mockActivity = [
  { id: "a-1", type: "run.completed", message: "Map src directory structure", time: "2 min ago" },
  { id: "a-2", type: "tool.completed", message: "file_tree completed (1.2s)", time: "2 min ago" },
  { id: "a-3", type: "session.created", message: "New session: Review API endpoint contracts", time: "1 hour ago" },
  { id: "a-4", type: "theme.activated", message: "Theme activated: default-dark", time: "3 hours ago" },
];
