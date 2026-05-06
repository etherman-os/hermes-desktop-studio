# Hermes Model/Provider Config Viewer

## What Is Read

| File | Purpose | Mode |
|------|---------|------|
| `~/.hermes/config.yaml` | Provider, model, base_url, temperature, max_tokens | Read-only |
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

## What Is NOT Implemented

- Provider setup wizard
- Config editing
- .env editing
- Model switching
- Provider switching

These will be added in a future phase.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `HERMES_HOME` | `~/.hermes` | Standard Hermes home |
| `HERMES_STUDIO_HERMES_HOME` | *(none)* | Override for studio |

## Safety

- config.yaml is opened read-only
- .env is scanned for key presence only, values are never read
- All sensitive values are redacted before returning to frontend
- No config files are written
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
