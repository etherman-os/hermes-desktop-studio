export type ArtifactType =
  | "markdown"
  | "text"
  | "log_snapshot"
  | "test_result"
  | "report"
  | "html"
  | "screenshot"
  | "file_reference"
  | "json"
  | "unknown";

export interface Artifact {
  id: string;
  title: string;
  type: ArtifactType;
  description: string | null;
  file_path: string | null;
  file_name: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  run_id: string | null;
  session_id: string | null;
  kanban_card_id: string | null;
  source: string;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  has_content: boolean;
}

export interface ArtifactEvent {
  id: string;
  artifact_id: string;
  type: string;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface ArtifactDetail extends Artifact {
  content_text?: string | null;
  events?: ArtifactEvent[];
}

export interface ArtifactListResponse {
  artifacts: Artifact[];
  total: number;
}

export interface ArtifactCreateRequest {
  title: string;
  type?: ArtifactType;
  description?: string | null;
  content_text?: string | null;
  file_path?: string | null;
  mime_type?: string | null;
  size_bytes?: number | null;
  run_id?: string | null;
  session_id?: string | null;
  kanban_card_id?: string | null;
  source?: string;
}

export interface ArtifactUpdateRequest {
  title?: string;
  type?: ArtifactType;
  description?: string | null;
  content_text?: string | null;
  file_path?: string | null;
  mime_type?: string | null;
  size_bytes?: number | null;
  source?: string;
}

export interface ArtifactLinkRunRequest {
  run_id: string;
}

export interface ArtifactLinkSessionRequest {
  session_id: string;
}

export interface ArtifactLinkCardRequest {
  kanban_card_id: string;
}
