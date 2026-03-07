// ==========================================
// USER & AUTH
// ==========================================

export enum UserRole {
  ADMIN = "ADMIN",
  DEVELOPER = "DEVELOPER",
  AUDITOR = "AUDITOR",
}

export interface User {
  id: string;
  email: string;
  password: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
}

// ==========================================
// PROJECT
// ==========================================

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdById: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// REQUIREMENT (OWASP ASVS)
// ==========================================

export enum Status {
  DONE = "DONE",
  IN_PROGRESS = "IN_PROGRESS",
  NOT_DONE = "NOT_DONE",
  NOT_APPLICABLE = "NOT_APPLICABLE",
}

export enum AdminDecision {
  YES = "YES", // Applicable
  NO = "NO", // Not applicable
  NA = "NA", // Not concerned
}

export interface Requirement {
  id: string;
  owaspId: string;
  area: string;
  asvsLevel: number;
  cwe?: string;
  nist?: string;
  description: string;
  createdAt: Date;
}

export interface ProjectRequirement {
  id: string;
  projectId: string;
  requirementId: string;
  adminDecision: AdminDecision;
  status: Status;
  comment?: string;
  sourceCodeReference?: string;
  toolUsed?: string;
  updatedById?: string;
  updatedAt: Date;
  createdAt: Date;
}

// ==========================================
// AUDIT
// ==========================================

export interface AuditLog {
  id: string;
  projectRequirementId: string;
  action: AuditAction;
  oldValue?: string;
  newValue?: string;
  userId: string;
  createdAt: Date;
}

export enum AuditAction {
  ADMIN_DECISION_CHANGE = "ADMIN_DECISION_CHANGE",
  STATUS_CHANGE = "STATUS_CHANGE",
  COMMENT_UPDATE = "COMMENT_UPDATE",
  SOURCE_REF_UPDATE = "SOURCE_REF_UPDATE",
  TOOL_UPDATE = "TOOL_UPDATE",
  AI_ANALYSIS = "AI_ANALYSIS",
}

// ==========================================
// AI & CHAT
// ==========================================

export enum MessageRole {
  USER = "USER",
  ASSISTANT = "ASSISTANT",
  SYSTEM = "SYSTEM",
}

export interface Conversation {
  id: string;
  userId: string;
  projectId?: string;
  title?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  requirementId?: string;
  role: MessageRole;
  content: string;
  tokensUsed?: number;
  contextData?: Record<string, any>;
  createdAt: Date;
}

export interface AIRequestLog {
  id: string;
  userId: string;
  requirementId?: string;
  prompt: string;
  response: string;
  tokensUsed: number;
  createdAt: Date;
}

// ==========================================
// API RESPONSES
// ==========================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId: string;
    duration?: number;
    pagination?: PaginationMeta;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ==========================================
// FILTERS & DTOs
// ==========================================

export interface RequirementFilters {
  projectId?: string;
  status?: Status;
  adminDecision?: AdminDecision;
  area?: string;
  level?: number;
  cwe?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface CreateProjectDTO {
  name: string;
  description?: string;
}

export interface UpdateProjectRequirementDTO {
  status?: Status;
  comment?: string;
  sourceCodeReference?: string;
  toolUsed?: string;
}

export interface AdminDecisionDTO {
  decision: AdminDecision;
}

export interface AIAnalysisRequest {
  requirementId: string;
  language?: string;
  context?: string;
  specificQuestion?: string;
}

export interface ChatRequest {
  message: string;
  conversationId?: string;
  requirementId?: string;
  language?: string;
}

// ==========================================
// STATISTICS
// ==========================================

export interface GlobalStats {
  total: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  notApplicable: number;
  complianceRate: number;
  criticalItems: number;
}

export interface AreaStats {
  area: string;
  total: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  notApplicable: number;
  complianceRate: number;
  color: string;
}

export interface LevelStats {
  level: number;
  total: number;
  completed: number;
  complianceRate: number;
}

export interface ProjectStats {
  global: GlobalStats;
  byArea: AreaStats[];
  byLevel: LevelStats[];
  byStatus: Record<Status, number>;
}
