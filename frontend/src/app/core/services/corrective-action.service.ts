import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type CorrectiveStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'CANCELLED';
export type CorrectivePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface CorrectiveAction {
  id: string;
  title: string;
  description: string;
  priority: CorrectivePriority;
  status: CorrectiveStatus;
  responsibleId?: string;
  responsibleName?: string;
  deadline?: string;
  resolvedAt?: string;
  expectedImpact?: string;
  createdAt: string;
}

export interface CreateCorrectiveRequest {
  title: string;
  description: string;
  priority: CorrectivePriority;
  responsibleId?: string;
  deadline?: string;
  expectedImpact?: string;
}

export interface UpdateCorrectiveRequest {
  status?: CorrectiveStatus;
  deadline?: string;
  expectedImpact?: string;
}

@Injectable({ providedIn: 'root' })
export class CorrectiveActionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/corrective-actions`;

  getProjectActions(projectId: string, status?: CorrectiveStatus): Observable<CorrectiveAction[]> {
    const params = status ? `?status=${status}` : '';
    return this.http.get<CorrectiveAction[]>(`${this.baseUrl}/projects/${projectId}${params}`);
  }

  getOverdueActions(projectId: string): Observable<CorrectiveAction[]> {
    return this.http.get<CorrectiveAction[]>(`${this.baseUrl}/projects/${projectId}/overdue`);
  }

  getMyActions(): Observable<CorrectiveAction[]> {
    return this.http.get<CorrectiveAction[]>(`${this.baseUrl}/my`);
  }

  createAction(projectId: string, req: CreateCorrectiveRequest): Observable<CorrectiveAction> {
    return this.http.post<CorrectiveAction>(`${this.baseUrl}/projects/${projectId}`, req);
  }

  updateAction(actionId: string, req: UpdateCorrectiveRequest): Observable<CorrectiveAction> {
    return this.http.put<CorrectiveAction>(`${this.baseUrl}/${actionId}`, req);
  }

  getAction(actionId: string): Observable<CorrectiveAction> {
    return this.http.get<CorrectiveAction>(`${this.baseUrl}/${actionId}`);
  }
}
