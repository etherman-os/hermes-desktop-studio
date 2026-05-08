# Real Hermes Smoke Test

Manual smoke test guide for validating Hermes Desktop Studio against a real local Hermes Agent install.

## Prerequisites

- Hermes Agent installed and working locally
- For local CLI mode, no Hermes API server is required.
- For gateway/API mode, Hermes API server runs on `http://127.0.0.1:8642`.
- Hermes Desktop Studio repo cloned and dependencies installed

## Quick Start

```bash
# Terminal 1: Start adapter in default local CLI mode
cd hermes-desktop-studio
HERMES_STUDIO_BACKEND=local pnpm run dev:adapter

# Terminal 2: Start desktop frontend through Tauri
pnpm --filter @hermes-desktop-studio/desktop-studio tauri dev

# Browser dev alternative:
VITE_HERMES_STUDIO_ADAPTER_TOKEN="$(cat ~/.hermes-local-shell/runtime/token)" pnpm run dev:desktop
```

For deterministic browser dev, start the adapter and frontend with the same explicit local token:

```bash
HERMES_STUDIO_ADAPTER_TOKEN=dev-token HERMES_STUDIO_BACKEND=hermes HERMES_API_BASE_URL=http://127.0.0.1:8642 pnpm run dev:adapter
VITE_HERMES_STUDIO_ADAPTER_TOKEN=dev-token pnpm run dev:desktop
```

For optional gateway/API mode:

```bash
API_SERVER_ENABLED=true hermes gateway --accept-hooks run
HERMES_STUDIO_BACKEND=gateway HERMES_API_BASE_URL=http://127.0.0.1:8642 pnpm run dev:adapter
```

## Verification Checklist

### Health Check

```bash
# Should show hermes_connected: true in local or gateway mode
curl http://127.0.0.1:39191/studio/health | python3 -m json.tool
```

Expected:
```json
{
  "status": "healthy",
  "adapter_version": "0.1.0",
  "hermes_connected": true,
  "backend_mode": "local"
}
```

### Desktop App

- [ ] Status bar shows local CLI or gateway backend, not Mock
- [ ] Status bar shows green "Adapter: Connected"
- [ ] No token is stored in `localStorage`
- [ ] Sending a chat prompt triggers a real Hermes run
- [ ] Local CLI mode returns the final response into chat
- [ ] Gateway mode streams `assistant.delta` and tool events when Hermes exposes them
- [ ] Stop button cancels the active run
- [ ] Unknown Hermes events do not crash the UI (shown as adapter.warning or silently ignored)

### Auto Mode Fallback

```bash
# Stop the Hermes API server (Ctrl+C in Terminal 1)
# Then restart adapter in auto mode:
HERMES_STUDIO_BACKEND=auto pnpm run dev:adapter
```

- [ ] Auto uses local CLI when local `hermes` exists
- [ ] If CLI and gateway are unavailable, status shows Studio simulation fallback

### Debug Mode

```bash
# Enable event logging (verbose, for debugging only)
HERMES_STUDIO_DEBUG_EVENTS=1 HERMES_STUDIO_BACKEND=gateway pnpm run dev:adapter
```

- [ ] Raw Hermes SSE event types are logged to stderr
- [ ] Normalized Studio event types are logged to stderr
- [ ] No API keys or tokens are printed
- [ ] Prompt content is redacted in logs

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `HERMES_STUDIO_BACKEND` | `local` | `local`, `gateway`/`hermes`, `ssh`, `mock`, or `auto` |
| `HERMES_API_BASE_URL` | `http://127.0.0.1:8642` | Hermes API server URL |
| `HERMES_API_KEY` | *(none)* | Optional API key |
| `HERMES_STUDIO_DEBUG_EVENTS` | `0` | Set to `1` to log raw/normalized events |
| `HERMES_STUDIO_ADAPTER_TOKEN` | *(generated)* | Explicit local adapter token for dev |
| `VITE_HERMES_STUDIO_ADAPTER_TOKEN` | *(none)* | Browser dev token passed to the frontend |

## Troubleshooting

### "Hermes not reachable"

- Check Hermes is running: `curl http://127.0.0.1:8642/health`
- Check the URL matches: `HERMES_API_BASE_URL` must match Hermes listen address
- Check firewall: both ports (8642 and 39191) must be on localhost

### "Auto mode shows Mock but Hermes is running"

- Adapter caches health check result. Restart the adapter.
- Check `HERMES_API_BASE_URL` is correct.

### "Events not appearing in chat"

- Enable debug mode: `HERMES_STUDIO_DEBUG_EVENTS=1`
- Check raw events are arriving from Hermes
- Check normalization is producing valid Studio events
- Check browser console for frontend errors

### "Auth token missing"

- If using Tauri, start the adapter before the app so `~/.hermes-local-shell/runtime/token` exists
- If using browser dev, set `VITE_HERMES_STUDIO_ADAPTER_TOKEN`
- Confirm protected calls return the standard `{ "error": ... }` envelope when auth is missing

### "Stop button does not work"

- Hermes Agent v0.13.0 exposes the optional API server through `hermes gateway run`; see `docs/HERMES_RUNTIME_COMPATIBILITY.md`.
- Some Hermes backends may not support the stop endpoint or may return `stopping` before cancellation completes.
- Check adapter logs for stop request errors
- The run may have already completed before stop was sent
