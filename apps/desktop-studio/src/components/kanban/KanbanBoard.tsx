import React from "react";
import type { KanbanBoard as KanbanBoardData } from "../../api/studioClient";
import * as api from "../../api/studioClient";

export function KanbanBoard() {
  const [board, setBoard] = React.useState<KanbanBoardData | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [title, setTitle] = React.useState("");

  const loadBoard = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setBoard(await api.getDefaultKanbanBoard());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Board unavailable");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadBoard();
  }, [loadBoard]);

  async function createCard() {
    const cleanTitle = title.trim();
    if (!cleanTitle) return;
    await api.createKanbanCard({ title: cleanTitle, description: "Created from Board surface", priority: "medium" });
    setTitle("");
    await loadBoard();
  }

  return (
    <div className="board-surface">
      <div className="surface-header">
        <div>
          <div className="workbench-eyebrow">Board</div>
          <h2>Run and session control surface</h2>
        </div>
        <div className="surface-actions">
          <span className="surface-badge">Studio-owned studio.db</span>
          <button className="tool-button" onClick={() => void loadBoard()}>{loading ? "Refreshing" : "Refresh"}</button>
        </div>
      </div>
      <div className="board-note">
        Board cards persist locally and can link to runs or sessions. This phase keeps movement simple and avoids drag-and-drop while the desktop shell is being corrected.
      </div>
      <div className="board-create-row">
        <input className="studio-input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Create a follow-up card in Inbox" />
        <button className="primary-button" disabled={!title.trim()} onClick={() => void createCard()}>Create Card</button>
      </div>
      {error && <div className="run-ledger-notice">{error}</div>}
      <div className="kanban-board">
        {(board?.columns ?? []).map((col) => (
          <div key={col.id} className="kanban-column">
            <div className="kanban-column-header">
              <span>{col.name}</span>
              <span className="kanban-column-count">{col.cards.length}</span>
            </div>
            <div className="kanban-column-cards">
              {col.cards.length === 0 && <div className="kanban-empty-column">No linked work in this lane</div>}
              {col.cards.map((card) => (
                <div key={card.id} className="kanban-card">
                  <div className="kanban-card-title">{card.title}</div>
                  {card.description && <div className="kanban-card-desc">{card.description}</div>}
                  <div className="kanban-card-meta">
                    <span className={`priority-badge priority-${card.priority}`}>{card.priority}</span>
                    {card.run_id && <span>Run {card.run_id}</span>}
                    {card.session_id && <span>Session {card.session_id}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {!board && !loading && !error && <div className="workbench-empty compact">Board data will appear when the adapter is available.</div>}
      </div>
    </div>
  );
}
