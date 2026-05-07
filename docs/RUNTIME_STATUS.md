# Runtime Status

Hermes Desktop Studio must make the active runtime obvious.

The desktop frontend talks only to `/studio/*`. The adapter can run in three modes:

| Mode | Behavior |
| --- | --- |
| `mock` | Uses `MockBackend`. Useful for UI development, but not real Hermes work. |
| `hermes` | Requires a reachable Hermes API server. Shows errors when Hermes is unavailable. |
| `auto` | Tries Hermes first and falls back to MockBackend if Hermes is unreachable. |

## Real Hermes Development

Start the Hermes API server:

```bash
API_SERVER_ENABLED=true hermes gateway --accept-hooks run
```

Start the Studio adapter in Hermes mode:

```bash
HERMES_STUDIO_BACKEND=hermes HERMES_API_BASE_URL=http://127.0.0.1:8642 pnpm run dev:adapter
```

Open the real desktop runtime:

```bash
pnpm run tauri dev
```

## UI Expectations

Runtime status appears in the top bar, right inspector, Settings sidebar, and Adapter Diagnostics bottom panel. It should show adapter/auth/storage state, backend mode, active backend, Hermes reachability, Hermes URL, active profile, and model/provider.

Mock mode must be labeled as mock. Auto fallback must show the fallback reason. Hermes mode must not silently look connected when Hermes is unreachable.
