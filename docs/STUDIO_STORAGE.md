# Studio Storage

Hermes Desktop Studio owns a local SQLite database named `studio.db`.

This database is for Studio-only state such as preferences, workflow metadata, and future local-only features. It is not Hermes Agent state, and it must never replace or mutate Hermes `state.db`.

## Location

Storage path priority:

1. `HERMES_STUDIO_HOME` if set
2. Platform user data directory for `hermes-desktop-studio`
3. Linux fallback: `~/.local/share/hermes-desktop-studio/`

The database file is:

```text
<studio data dir>/studio.db
```

For advanced local testing, `HERMES_STUDIO_DB_PATH` may point directly to a file named `studio.db`. The adapter rejects paths that point at Hermes `state.db`, including `~/.hermes/state.db`.

## Schema

Initial tables:

- `migrations(version integer primary key, name text not null, applied_at text not null)`
- `studio_meta(key text primary key, value text not null, updated_at text not null)`

The first migration initializes these tables and writes metadata such as `schema_version`, `initialized_at`, and `storage_owner`.

Migrations are idempotent. Reopening `studio.db` does not duplicate migration records.

## Safety Rules

- Do not write to Hermes `state.db`.
- Do not store secrets, tokens, API keys, auth headers, or passwords.
- Keep Hermes runtime data and Studio-owned data separate.
- Use migrations for schema changes.
- Treat paths exposed by health/bootstrap as diagnostics. The frontend should not display full paths unless the user is troubleshooting.

## Health and Bootstrap

`GET /studio/health`, root `GET /health`, and `GET /studio/bootstrap` include:

```json
{
  "storage": {
    "available": true,
    "schema_version": 1,
    "data_dir": "/home/user/.local/share/hermes-desktop-studio",
    "db_path": "/home/user/.local/share/hermes-desktop-studio/studio.db",
    "last_error": null
  }
}
```

If the database is corrupt or cannot be opened, `storage.available` is `false` and `storage.last_error` contains the diagnostic message. The adapter should continue to serve read-only Hermes data where possible.

## Future Kanban Use

Phase 6 Kanban persistence should build on this storage foundation after the base schema, migration policy, and health reporting remain stable. Kanban tables should be added in their own migration and should remain Studio-owned unless Hermes exposes an official workflow persistence API later.

## Troubleshooting

- Set `HERMES_STUDIO_HOME=/tmp/hermes-studio-test` to test with an isolated data directory.
- Delete only Studio-owned `studio.db` if you need to reset local Studio state.
- Do not delete or edit `~/.hermes/state.db` for Studio troubleshooting.
- If `storage.available` is false, check file permissions and whether `studio.db` contains valid SQLite data.
