import React from "react";
import { AppFrame } from "./components/layout/AppFrame";
import { PreviewCanvas } from "./components/preview/PreviewCanvas";
import { useThemeStore } from "./stores/themeStore";

function isPreviewWindow(): boolean {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("preview") === "true") return true;
    // @ts-expect-error Tauri injected flag
    if (window.__PREVIEW_INITIAL_URL !== undefined) return true;
  } catch {
    // Not in a Tauri context or URL parsing failed
  }
  return false;
}

const MIN_SPLASH_MS = 500;

export default function App() {
  const initTheme = useThemeStore((s) => s.initTheme);
  const [isPreview] = React.useState(() => isPreviewWindow());
  const [splashVisible, setSplashVisible] = React.useState(true);
  const [splashFading, setSplashFading] = React.useState(false);

  React.useEffect(() => {
    initTheme();
  }, [initTheme]);

  React.useEffect(() => {
    const start = Date.now();
    const timer = setTimeout(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, MIN_SPLASH_MS - elapsed);
      setTimeout(() => {
        setSplashFading(true);
        setTimeout(() => setSplashVisible(false), 300);
      }, remaining);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  if (isPreview) return <PreviewCanvas />;

  return (
    <>
      {splashVisible && (
        <div
          className="splash-screen"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--app-bg, #1a1a2e)",
            color: "var(--app-text, #e0e0e0)",
            opacity: splashFading ? 0 : 1,
            transition: "opacity 300ms ease-out",
            pointerEvents: splashFading ? "none" : "auto",
          }}
        >
          <div style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "1rem" }}>
            Hermes Desktop Studio
          </div>
          <div className="splash-spinner" style={{
            width: 24,
            height: 24,
            border: "3px solid var(--app-border, #333)",
            borderTopColor: "var(--app-accent, #6366f1)",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}
      <AppFrame />
    </>
  );
}
