import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ChecklistItem {
  requirementId: string;
  owaspId: string;
  area: string;
  asvsLevel: number;
  cwe: string | null;
  description: string;
  projectRequirementId: string | null;
  status: 'DONE' | 'IN_PROGRESS' | 'NOT_DONE' | 'NOT_APPLICABLE' | null;
  adminDecision: 'YES' | 'NO' | 'NA' | null;
  comment: string | null;
  sourceCodeReference: string | null;
  toolUsed: string | null;
}

export interface ChecklistStats {
  total: number;
  done: number;
  inProgress: number;
  notDone: number;
  notApplicable: number;
  notStarted: number;
  score: number;
}

export interface ChecklistResponse {
  project: any;
  checklist: ChecklistItem[];
  stats: ChecklistStats;
}

@Injectable({ providedIn: 'root' })
export class ChecklistService {
  private apiUrl = `${environment.apiUrl}/projects`;

  constructor(private http: HttpClient) {}

  getChecklist(
    projectId: string,
    filters?: { level?: number; area?: string },
  ): Observable<ChecklistResponse> {
    let url = `${this.apiUrl}/${projectId}/checklist`;
    const params: any = {};
    if (filters?.level) params['level'] = filters.level;
    if (filters?.area) params['area'] = filters.area;

    return this.http.get<any>(url, { params }).pipe(map((res) => res.data));
  }

  initChecklist(projectId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${projectId}/checklist/init`, {});
  }

  updateStatus(
    projectId: string,
    requirementId: string,
    data: {
      status?: string;
      adminDecision?: string;
      comment?: string;
      sourceCodeReference?: string;
      toolUsed?: string;
    },
  ): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${projectId}/checklist/${requirementId}`, data);
  }
}
