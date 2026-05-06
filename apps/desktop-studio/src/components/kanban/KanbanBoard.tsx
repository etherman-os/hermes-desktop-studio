import { mockKanbanCards } from "../../fixtures/mockData";

const COLUMNS = ["Inbox", "Ready", "Doing", "Blocked", "Done"] as const;

const COLUMN_COLORS: Record<string, string> = {
  Inbox: "var(--kanban-todo)",
  Ready: "var(--app-info)",
  Doing: "var(--kanban-doing)",
  Blocked: "var(--kanban-blocked)",
  Done: "var(--kanban-done)",
};

export function KanbanBoard() {
  return (
    <div className="kanban-board">
      {COLUMNS.map((col) => {
        const cards = mockKanbanCards.filter((c) => c.status === col);
        return (
          <div key={col} className="kanban-column">
            <div className="kanban-column-header">
              <span style={{ display: "flex", alignItems: "center", gap: "var(--app-spacing-xs)" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: COLUMN_COLORS[col] }} />
                {col}
              </span>
              <span className="kanban-column-count">{cards.length}</span>
            </div>
            <div className="kanban-column-cards">
              {cards.map((card) => (
                <div key={card.id} className="kanban-card">
                  <div className="kanban-card-title">{card.title}</div>
                  <div className="kanban-card-desc">{card.description}</div>
                  <div className="kanban-card-meta">
                    <span className={`priority-badge priority-${card.priority}`}>{card.priority}</span>
                    <span style={{ color: "var(--app-text-muted)" }}>{card.source}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
