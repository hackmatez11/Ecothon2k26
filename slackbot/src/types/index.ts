// Government Interdepartment Citizen Complaint Resolution System — Types

export type Department =
  | 'Environment'
  | 'WaterSupply'
  | 'Roads'
  | 'HealthSanitation'
  | 'Supervisor';

export type ComplaintStatus =
  | 'received'
  | 'triaged'
  | 'in_progress'
  | 'blocked_on_docs'
  | 'resolved'
  | 'closed';

export type ComplaintPriority = 'low' | 'medium' | 'high' | 'urgent';

export type DocRequestStatus = 'pending' | 'fulfilled' | 'rejected';

// ─── MCP Tool Interfaces ─────────────────────────────────────────────────────

export interface MCPTool {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
  handler: (params: any) => Promise<any>;
}

export interface MCPContext {
  ragContext?: string;
  conversationHistory?: string[];
  metadata?: Record<string, any>;
}

export interface ToolCall {
  tool: string;
  parameters: Record<string, any>;
}

// ─── Agent Interfaces ─────────────────────────────────────────────────────────

export interface AgentMessage {
  to: string;
  intent: string;
  payload: Record<string, any>;
  from?: string;
}

export interface ReasoningStep {
  thought: string;
  action: 'tool_call' | 'respond' | 'delegate' | 'wait';
  tool?: string;
  toolInput?: Record<string, any>;
  observation?: string;
}

export interface AgentConfig {
  name: string;
  identity: string;
  systemPrompt: string;
  tools: string[];
  enableRAG: boolean;
  enableMemory: boolean;
}

// ─── RAG / Memory ─────────────────────────────────────────────────────────────

export interface RAGContext {
  relevantMemories: MemoryResult[];
  contextString: string;
  sources: string[];
}

export interface MemoryResult {
  id: string;
  content: string;
  similarity: number;
  source: string;
  sourceId?: string;
  metadata?: Record<string, any>;
}

export interface EmbeddingRequest {
  text: string;
  source: string;
  sourceId?: string;
  metadata?: Record<string, any>;
}

// ─── Complaint Domain ─────────────────────────────────────────────────────────

export interface ComplaintContext {
  complaintId: string;
  citizenName: string;
  category: string;
  description: string;
  location: string;
  priority: ComplaintPriority;
  assignedDept?: Department;
  slackUserId?: string;
  channelId?: string;
  threadTs?: string;
}

// Config-driven dependency: what a dept needs from another dept
export interface DeptDependency {
  fromDept: Department;   // who needs it
  toDept: Department;     // who must provide
  documentNeeded: string; // e.g. "river pollution data", "NOC", "pipeline map"
  deadlineDays: number;   // days from complaint submission
}

// Map of complaint category → list of cross-dept dependencies
export type ComplaintDependencyMap = Record<string, DeptDependency[]>;

// ─── Slack ─────────────────────────────────────────────────────────────────────

export interface SlackContext {
  userId: string;
  channelId: string;
  threadTs?: string;
  text: string;
}

// ─── Security ─────────────────────────────────────────────────────────────────

export interface SecurityContext {
  officerId?: string;
  department?: Department;
  roles: string[];
  permissions: string[];
}
