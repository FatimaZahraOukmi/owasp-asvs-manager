export enum Status {
  DONE = 'DONE',
  IN_PROGRESS = 'IN_PROGRESS',
  NOT_DONE = 'NOT_DONE',
  NOT_APPLICABLE = 'NOT_APPLICABLE',
}

export enum AdminDecision {
  YES = 'YES',
  NO = 'NO',
  NA = 'NA',
}

export interface Requirement {
  id: string;
  owaspId: string;
  area: string;
  asvsLevel: number;
  cwe?: string;
  description: string;
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
  requirement: Requirement;
}
