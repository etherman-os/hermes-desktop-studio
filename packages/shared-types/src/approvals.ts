export type ApprovalStatus =
  | "pending"
  | "approved"
  | "denied"
  | "expired"
  | "cancelled"
  | "unknown";

export type ApprovalRiskLevel = "low" | "medium" | "high" | "critical" | "unknown";

export interface Approval {
  id: string;
  run_id: string | null;
  session_id: string | null;
  tool_name: string | null;
  command: string | null;
  risk_level: ApprovalRiskLevel;
  status: ApprovalStatus;
  reason: string | null;
  decision: string | null;
  decided_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApprovalEvent {
  id: string;
  approval_id: string;
  type: string;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface ApprovalDetail extends Approval {
  request_payload: Record<string, unknown> | null;
  events: ApprovalEvent[];
}

export interface ApprovalListResponse {
  approvals: Approval[];
  total: number;
}
