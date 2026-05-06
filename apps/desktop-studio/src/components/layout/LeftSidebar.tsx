import { useLayoutStore } from "../../stores/layoutStore";
import { useThemeStore } from "../../stores/themeStore";
import { useSessionStore } from "../../stores/sessionStore";
import { useProfileStore } from "../../stores/profileStore";
import { useAdapterStore } from "../../stores/adapterStore";

export function LeftSidebar() {
  const section = useLayoutStore((s) => s.sidebarSection);
  const label = useThemeStore((s) => s.label);
  const icon = useThemeStore((s) => s.icon);

  return (
    <div className="sidebar">
      <div className="sidebar-header">{label(section)}</div>
      <div className="sidebar-content">
        {section === "sessions" && <SessionsList />}
        {section === "profiles" && <ProfilesList />}
        {section === "search" && <SearchSection />}
        {section === "theme_gallery" && <ThemeGallerySection />}
        {section === "settings" && <SettingsSection />}
        {!["sessions", "profiles", "search", "theme_gallery", "settings"].includes(section) && (
          <div className="empty-state">
            <div className="empty-state-icon">{icon(section)}</div>
            <div className="empty-state-text">{label(section)}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function SessionsList() {
  const sessions = useSessionStore((s) => s.sessions);
  const activeId = useSessionStore((s) => s.activeSessionId);
  const setActive = useSessionStore((s) => s.setActiveSession);
  const sessionSource = useSessionStore((s) => s.sessionSource);
  const loaded = useSessionStore((s) => s.loaded);

  return (
    <>
      {loaded && sessions.length === 0 && (
        <div style={{ padding: "var(--app-spacing-md)", color: "var(--app-text-muted)", fontSize: "var(--app-font-size-sm)", textAlign: "center" }}>
          No sessions found
        </div>
      )}
      {sessions.map((s) => (
        <button
          key={s.id}
          className={`sidebar-item ${activeId === s.id ? "active" : ""}`}
          onClick={() => setActive(s.id)}
          title={`${s.title}\n${s.messageCount} messages`}
        >
          <span>💬</span>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
            {s.title}
          </span>
          {s.messageCount > 0 && (
            <span style={{ fontSize: "10px", color: "var(--app-text-muted)", flexShrink: 0 }}>
              {s.messageCount}
            </span>
          )}
        </button>
      ))}
    </>
  );
}

function ProfilesList() {
  const profiles = useProfileStore((s) => s.profiles);
  const activeProfile = useProfileStore((s) => s.activeProfile);
  const profileCount = useProfileStore((s) => s.profileCount);
  const loaded = useProfileStore((s) => s.loaded);
  const activateError = useProfileStore((s) => s.activateError);
  const activateProfile = useProfileStore((s) => s.activateProfile);

  if (!loaded) {
    return <div style={{ padding: "var(--app-spacing-md)", color: "var(--app-text-muted)", textAlign: "center" }}>Loading...</div>;
  }

  if (profiles.length === 0) {
    return (
      <div style={{ padding: "var(--app-spacing-md)", color: "var(--app-text-muted)", fontSize: "var(--app-font-size-sm)", textAlign: "center" }}>
        No profiles found
      </div>
    );
  }

  return (
    <>
      <div style={{ padding: "var(--app-spacing-xs) var(--app-spacing-sm)", fontSize: "10px", color: "var(--app-text-muted)" }}>
        {profileCount} profile{profileCount !== 1 ? "s" : ""}
      </div>
      {activateError && (
        <div style={{ padding: "var(--app-spacing-xs) var(--app-spacing-sm)", fontSize: "11px", color: "var(--app-warn)", background: "rgba(210,153,34,0.1)", borderRadius: "var(--app-radius-sm)", margin: "0 var(--app-spacing-xs)" }}>
          {activateError}
        </div>
      )}
      {profiles.map((p) => (
        <button
          key={p.id}
          className={`sidebar-item ${p.name === activeProfile?.name ? "active" : ""}`}
          onClick={() => {
            if (p.name !== activeProfile?.name) {
              activateProfile(p.name);
            }
          }}
        >
          <span>{p.name === activeProfile?.name ? "●" : "○"}</span>
          <span>{p.name}</span>
        </button>
      ))}
    </>
  );
}

function SearchSection() {
  return (
    <div style={{ padding: "var(--app-spacing-sm)" }}>
      <input
        className="composer-input"
        placeholder="Search sessions..."
        style={{ width: "100%" }}
      />
    </div>
  );
}

function ThemeGallerySection() {
  const themes = useThemeStore((s) => s.themes);
  const adapterThemes = useThemeStore((s) => s.adapterThemes);
  const activeThemeId = useThemeStore((s) => s.activeThemeId);
  const activateTheme = useThemeStore((s) => s.activateTheme);
  const reloadThemes = useThemeStore((s) => s.reloadThemes);
  const loading = useThemeStore((s) => s.loading);
  const error = useThemeStore((s) => s.error);
  const adapterLoaded = useThemeStore((s) => s.adapterLoaded);
  const connected = useAdapterStore((s) => s.connected);

  // Use adapter themes if available, otherwise local
  const themeList = adapterThemes.length > 0
    ? adapterThemes.map((at) => ({
        id: at.id,
        name: at.name,
        description: at.description || "",
        author: at.author || "",
        version: at.version || "",
        source: (at as { source?: string }).source ?? "built-in",
        valid: (at as { valid?: boolean }).valid ?? true,
        warnings: (at as { warnings?: string[] }).warnings ?? [],
        accent: themes[at.id]?.palette?.accent ?? "#58a6ff",
      }))
    : Object.values(themes).map((t) => ({
        id: t.meta.id,
        name: t.meta.name,
        description: t.meta.description ?? "",
        author: t.meta.author ?? "",
        version: t.meta.version ?? "",
        source: "local-fallback",
        valid: true,
        warnings: [] as string[],
        accent: t.palette?.accent ?? "#58a6ff",
      }));

  return (
    <div className="theme-switcher-panel">
      {/* Header with reload */}
      <div style={{ padding: "var(--app-spacing-xs) var(--app-spacing-sm)", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--app-border-subtle)" }}>
        <span style={{ fontSize: "10px", color: "var(--app-text-muted)" }}>
          {themeList.length} theme{themeList.length !== 1 ? "s" : ""}
          {adapterLoaded && adapterThemes.length > 0 ? " (adapter)" : " (local)"}
        </span>
        <button
          onClick={() => reloadThemes()}
          disabled={loading}
          style={{ background: "transparent", border: "none", color: loading ? "var(--app-text-muted)" : "var(--app-accent)", cursor: loading ? "default" : "pointer", fontSize: "11px", padding: "2px 6px" }}
          title="Reload themes from disk"
        >
          {loading ? "..." : "↻ Reload"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: "var(--app-spacing-xs) var(--app-spacing-sm)", fontSize: "11px", color: "var(--app-danger)", background: "rgba(248,81,73,0.1)" }}>
          {error}
        </div>
      )}

      {/* Theme list */}
      {themeList.map((t) => (
        <button
          key={t.id}
          className={`theme-card ${activeThemeId === t.id ? "active" : ""}`}
          onClick={() => activateTheme(t.id)}
          style={{ opacity: t.valid ? 1 : 0.7 }}
        >
          <div
            className="theme-swatch"
            style={{ background: t.accent }}
          />
          <div className="theme-card-info">
            <div className="theme-card-name">
              {t.name}
              {!t.valid && <span style={{ color: "var(--app-warn)", marginLeft: 4, fontSize: "10px" }}>⚠</span>}
              {activeThemeId === t.id && <span style={{ color: "var(--app-ok)", marginLeft: 4, fontSize: "10px" }}>●</span>}
            </div>
            <div className="theme-card-desc">{t.description}</div>
            <div style={{ display: "flex", gap: "var(--app-spacing-sm)", fontSize: "10px", color: "var(--app-text-muted)", marginTop: 2 }}>
              {t.author && <span>{t.author}</span>}
              {t.version && <span>v{t.version}</span>}
              <span>{t.source}</span>
            </div>
            {t.warnings.length > 0 && (
              <div style={{ fontSize: "10px", color: "var(--app-warn)", marginTop: 2 }}>
                {t.warnings[0]}
              </div>
            )}
          </div>
        </button>
      ))}

      {/* Empty state */}
      {themeList.length === 0 && !loading && (
        <div style={{ padding: "var(--app-spacing-md)", color: "var(--app-text-muted)", textAlign: "center", fontSize: "var(--app-font-size-sm)" }}>
          No themes found
        </div>
      )}
    </div>
  );
}

function SettingsSection() {
  const label = useThemeStore((s) => s.label);
  return (
    <div style={{ padding: "var(--app-spacing-sm)", color: "var(--app-text-muted)" }}>
      <p>{label("settings")} — placeholder</p>
    </div>
  );
}
