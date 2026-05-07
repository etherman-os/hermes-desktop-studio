import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ContextSnapshot } from "../api/studioClient";
import * as api from "../api/studioClient";
import { useContextStore } from "./contextStore";

vi.mock("../api/studioClient", async () => {
  const actual = await vi.importActual<typeof import("../api/studioClient")>("../api/studioClient");
  return {
    ...actual,
    getCurrentContext: vi.fn(),
    getCurrentWorkspaceContext: vi.fn(),
    getRunContext: vi.fn(),
    getSessionContext: vi.fn(),
  };
});

const snapshot: ContextSnapshot = {
  id: "ctx_1",
  scope: "current",
  active_profile: { name: "coder" },
  model: { provider: "anthropic", model: "claude-sonnet-4-20250514" },
  runtime: { backend_status: { backend_mode: "mock" } },
  storage: { available: true },
  workspace: { available: true, path: "/work/repo", name: "repo" },
  session: null,
  run: null,
  memory: { available: false, items: [], warnings: ["Memory unavailable"] },
  skills: { available: false, items: [], warnings: ["Skills unavailable"] },
  context_files: {
    items: [
      {
        name: "AGENTS.md",
        path: "/work/repo/AGENTS.md",
        available: true,
        preview: "Use focused changes.",
      },
    ],
    warnings: [],
  },
  related: { artifacts: [], kanban_cards: [], approvals: [], sessions: [], runs: [] },
  warnings: [],
};

function resetStore() {
  useContextStore.setState({
    snapshot: null,
    selectedScope: "current",
    selectedRunId: null,
    selectedSessionId: null,
    loading: false,
    error: null,
    lastLoadedAt: null,
  });
}

describe("contextStore", () => {
  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
  });

  it("loads the current context for a workspace", async () => {
    vi.mocked(api.getCurrentContext).mockResolvedValue(snapshot);

    await useContextStore.getState().loadCurrentContext("/work/repo");

    expect(api.getCurrentContext).toHaveBeenCalledWith("/work/repo");
    expect(useContextStore.getState().snapshot?.workspace.name).toBe("repo");
    expect(useContextStore.getState().selectedScope).toBe("current");
    expect(useContextStore.getState().error).toBeNull();
  });

  it("loads run-scoped context", async () => {
    vi.mocked(api.getRunContext).mockResolvedValue({
      ...snapshot,
      scope: "run",
      run: {
        id: "run-1",
        session_id: "s-1",
        status: "completed",
        title: "Run",
        prompt_preview: "Run",
        started_at: "2026-05-07T00:00:00Z",
        completed_at: null,
        duration_ms: null,
        backend: "mock",
        model: "mock-model",
        error: null,
        workspace_path: "/work/repo",
      },
    });

    await useContextStore.getState().loadRunContext("run-1");

    expect(api.getRunContext).toHaveBeenCalledWith("run-1");
    expect(useContextStore.getState().selectedScope).toBe("run");
    expect(useContextStore.getState().selectedRunId).toBe("run-1");
    expect(useContextStore.getState().snapshot?.run?.id).toBe("run-1");
  });

  it("loads session-scoped context", async () => {
    vi.mocked(api.getSessionContext).mockResolvedValue({
      ...snapshot,
      scope: "session",
      session: { id: "s-1", title: "Session" },
    });

    await useContextStore.getState().loadSessionContext("s-1");

    expect(api.getSessionContext).toHaveBeenCalledWith("s-1");
    expect(useContextStore.getState().selectedScope).toBe("session");
    expect(useContextStore.getState().selectedSessionId).toBe("s-1");
    expect(useContextStore.getState().snapshot?.session?.id).toBe("s-1");
  });

  it("refreshes the selected run context", async () => {
    vi.mocked(api.getRunContext).mockResolvedValue({ ...snapshot, scope: "run" });
    useContextStore.setState({ selectedScope: "run", selectedRunId: "run-1" });

    await useContextStore.getState().refresh("/ignored");

    expect(api.getRunContext).toHaveBeenCalledWith("run-1");
  });

  it("sets an error when context is unavailable", async () => {
    vi.mocked(api.getCurrentContext).mockRejectedValue(new Error("Adapter auth token is unavailable"));

    await useContextStore.getState().loadCurrentContext();

    expect(useContextStore.getState().error).toBe("Adapter auth token is unavailable");
    expect(useContextStore.getState().snapshot).toBeNull();
  });
});
