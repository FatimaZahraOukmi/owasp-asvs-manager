import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Requirement {
  id: string;
  owaspId: string;
  area: string;
  asvsLevel: number;
  cwe: string | null;
  nist: string | null;
  description: string;
  createdAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  total?: number;
}

@Injectable({
  providedIn: 'root',
})
export class RequirementService {
  private apiUrl = `${environment.apiUrl}/requirements`;

  constructor(private http: HttpClient) {}

  getAll(filters?: { level?: number; area?: string }): Observable<Requirement[]> {
    let params = new HttpParams();
    if (filters?.level) params = params.set('level', filters.level.toString());
    if (filters?.area) params = params.set('area', filters.area);

    return this.http
      .get<ApiResponse<Requirement[]>>(this.apiUrl, { params })
      .pipe(map((res) => res.data));
  }

  getById(id: string): Observable<Requirement> {
    return this.http
      .get<ApiResponse<Requirement>>(`${this.apiUrl}/${id}`)
      .pipe(map((res) => res.data));
  }
}
