import React from "react";
import { AppFrame } from "./components/layout/AppFrame";
import { useThemeStore } from "./stores/themeStore";

export default function App() {
  const initTheme = useThemeStore((s) => s.initTheme);
  React.useEffect(() => {
    initTheme();
  }, [initTheme]);

  return <AppFrame />;
}
