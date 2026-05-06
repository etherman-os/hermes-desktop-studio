import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

async function loadClient() {
  vi.resetModules();
  return import("./studioClient");
}

function jsonResponse(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("studioClient auth bootstrap", () => {
  it("uses an explicit dev env token for protected requests", async () => {
    vi.stubEnv("VITE_HERMES_STUDIO_ADAPTER_TOKEN", "dev-token");
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ adapter_version: "0.1.0" }));
    vi.stubGlobal("fetch", fetchMock);

    const api = await loadClient();
    const auth = await api.initializeAdapterAuth();
    await api.getBootstrap();

    expect(auth).toEqual({ authenticated: true, source: "env" });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:39191/studio/bootstrap",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer dev-token" }),
      }),
    );
  });

  it("uses the Tauri token bridge when browser dev env is absent", async () => {
    const tauri = await import("@tauri-apps/api/core");
    vi.mocked(tauri.invoke).mockResolvedValue("tauri-token");
    vi.stubGlobal("window", { __TAURI_INTERNALS__: {} });

    const api = await loadClient();
    const auth = await api.initializeAdapterAuth();

    expect(auth).toEqual({ authenticated: true, source: "tauri" });
    expect(tauri.invoke).toHaveBeenCalledWith("get_adapter_auth_token");
  });

  it("does not call protected endpoints without a token", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const api = await loadClient();

    await expect(api.getBootstrap()).rejects.toThrow("Adapter auth token is unavailable");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("studioClient protocol surface", () => {
  it("uses /studio/health without falling back to root /health", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        status: "healthy",
        adapter_version: "0.1.0",
        hermes_connected: false,
        backend_mode: "mock",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const api = await loadClient();
    await api.checkAdapterHealthDetailed();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe("http://127.0.0.1:39191/studio/health");
  });

  it("parses the standard error envelope", async () => {
    const api = await loadClient();
    const message = api.adapterErrorMessage(
      {
        error: {
          code: "auth_missing",
          message: "Missing Authorization header",
          retryable: false,
          source: "adapter",
        },
      },
      401,
    );

    expect(message).toBe("Missing Authorization header");
  });
});
