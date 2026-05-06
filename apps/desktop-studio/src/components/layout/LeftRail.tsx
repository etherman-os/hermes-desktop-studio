import { useLayoutStore } from "../../stores/layoutStore";
import { useThemeStore } from "../../stores/themeStore";

const RAIL_ITEMS = [
  { id: "profiles", slot: "profiles" as const },
  { id: "sessions", slot: "sessions" as const },
  { id: "chat", slot: "chat" as const },
  { id: "kanban", slot: "kanban" as const },
  { id: "search", slot: "search" as const },
  { id: "theme_gallery", slot: "theme_gallery" as const },
  { id: "settings", slot: "settings" as const },
];

export function LeftRail() {
  const setSidebar = useLayoutStore((s) => s.setSidebarSection);
  const setActiveTab = useLayoutStore((s) => s.setActiveTab);
  const sidebarSection = useLayoutStore((s) => s.sidebarSection);
  const icon = useThemeStore((s) => s.icon);

  function handleClick(id: string) {
    if (id === "chat") {
      setActiveTab("chat");
      setSidebar("sessions");
    } else if (id === "kanban") {
      setActiveTab("kanban");
      setSidebar("sessions");
    } else {
      setSidebar(id);
    }
  }

  return (
    <div className="rail">
      {RAIL_ITEMS.map((item) => (
        <button
          key={item.id}
          className={`rail-icon ${sidebarSection === item.id ? "active" : ""}`}
          onClick={() => handleClick(item.id)}
          title={item.id}
        >
          {icon(item.slot)}
        </button>
      ))}
    </div>
  );
}
