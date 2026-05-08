# Hermes Model/Provider Integration

## What Is Read

| File | Purpose | Mode |
|------|---------|------|
| `~/.hermes/config.yaml` | Provider, model, base_url, temperature, max_tokens | Read through repository; written only through official `hermes config set` |
| `~/.hermes/.env` | API key presence detection | Read-only, values redacted |

## What Is Shown

- Provider name (e.g., "openrouter", "anthropic", "openai")
- Model name (e.g., "nous/hermes-3-llama-3.1-70b")
- Base URL (redacted if contains secrets)
- API key configured: Yes/No (never the actual key)
- API key source (.env, config.yaml)
- Temperature (if configured)
- Context window (if configured)
- Available models (from Hermes /v1/models if reachable)
- Config source (config.yaml, default, unavailable)
- Warnings (missing config, parse errors)

## What Is NOT Shown

- Raw API keys
- Raw .env values
- Full .env file content
- Secrets from any source

## Safe Write Path

Studio can change model/provider config through the official local Hermes CLI:

- `hermes config set model.provider <provider>`
- `hermes config set model.default <model>`
- `hermes config set model.base_url <url>`
- `hermes config set model.temperature <number>`
- `hermes config set model.max_tokens <number>`
- `hermes config set model.context_window <number>`

The adapter does not edit YAML directly. In `local` and `auto` modes, model/provider updates use this CLI path against the installed local Hermes runtime even when the optional gateway bridge is not running.

## What Is NOT Implemented

- API key editing in Studio
- Raw `.env` editing
- Provider auth setup wizard
- Direct mutation of Hermes files without Hermes CLI

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `HERMES_HOME` | `~/.hermes` | Standard Hermes home |
| `HERMES_STUDIO_HERMES_HOME` | *(none)* | Override for studio |

## Safety

- config.yaml is opened read-only for display
- model/provider mutations are delegated to official `hermes config set`
- .env is scanned for key presence only, values are never read
- All sensitive values are redacted before returning to frontend
- Studio never writes config files directly
- Malformed YAML returns warnings, not errors

## Troubleshooting

**"No config.yaml found"**
- Check if `~/.hermes/config.yaml` exists
- Run `hermes setup` or create config manually

**"config.yaml has syntax errors"**
- Check YAML syntax: `python3 -c "import yaml; yaml.safe_load(open('~/.hermes/config.yaml'))"`
- Fix syntax errors in the file

**"API key not configured"**
- Check if `~/.hermes/.env` contains API key entries
- Run `hermes auth` or add key to .env manually

**"Provider: unknown"**
- config.yaml may be empty or missing provider field
- Check `cat ~/.hermes/config.yaml | grep provider`
