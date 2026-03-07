import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdById: string;
}

// ✅ Wrapper de réponse backend: { success, data }
type ApiResponse<T> = {
  success: boolean;
  data: T;
  error?: any;
};

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private baseUrl = `${environment.apiUrl}/projects`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Project[]> {
    return this.http
      .get<ApiResponse<Project[]>>(this.baseUrl, {
        headers: { 'Cache-Control': 'no-cache' },
      })
      .pipe(map((res) => res.data ?? []));
  }

  getById(id: string): Observable<Project> {
    return this.http
      .get<ApiResponse<Project>>(`${this.baseUrl}/${id}`, {
        headers: { 'Cache-Control': 'no-cache' },
      })
      .pipe(map((res) => res.data));
  }

  create(data: { name: string; description?: string }): Observable<Project> {
    return this.http.post<ApiResponse<Project>>(this.baseUrl, data).pipe(map((res) => res.data));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<ApiResponse<null>>(`${this.baseUrl}/${id}`).pipe(map(() => void 0));
  }

  update(id: string, data: { name: string; description?: string }): Observable<Project> {
    return this.http
      .put<ApiResponse<Project>>(`${this.baseUrl}/${id}`, data)
      .pipe(map((res) => res.data));
  }
}
