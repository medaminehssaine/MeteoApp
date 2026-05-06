import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type ActionStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED' | 'ON_HOLD';

export interface ActionResponse {
  id: string;
  title: string;
  description?: string;
  moduleId: string;
  moduleName?: string;
  status: ActionStatus;
  responsible?: string;
  responsibleName?: string;
  plannedStart: string;
  plannedEnd: string;
  actualStart?: string;
  actualEnd?: string;
  progress: number;
  isMilestone: boolean;
  weight: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateActionRequest {
  title: string;
  description?: string;
  moduleId: string;
  responsibleId?: string;
  plannedStart: string;
  plannedEnd: string;
  isMilestone?: boolean;
  weight?: number;
}

export interface UpdateActionRequest {
  title?: string;
  description?: string;
  status?: ActionStatus;
  progress?: number;
  responsibleId?: string;
  plannedEnd?: string;
}

export interface ProgressSummary {
  projectId: string;
  globalProgress: number;
  totalActions: number;
  completedActions: number;
  inProgressActions: number;
  blockedActions: number;
  moduleProgressList: { moduleId: string; moduleName: string; progress: number; weight: number }[];
}

@Injectable({ providedIn: 'root' })
export class PlanService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/plans`;

  getActionsByProject(projectId: string): Observable<ActionResponse[]> {
    return this.http.get<ActionResponse[]>(`${this.baseUrl}/projects/${projectId}/actions`);
  }

  getProgressSummary(projectId: string): Observable<ProgressSummary> {
    return this.http.get<ProgressSummary>(`${this.baseUrl}/projects/${projectId}/progress`);
  }

  getActionsByModule(moduleId: string): Observable<ActionResponse[]> {
    return this.http.get<ActionResponse[]>(`${this.baseUrl}/modules/${moduleId}/actions`);
  }

  createAction(request: CreateActionRequest): Observable<ActionResponse> {
    return this.http.post<ActionResponse>(`${this.baseUrl}/actions`, request);
  }

  updateAction(actionId: string, request: UpdateActionRequest): Observable<ActionResponse> {
    return this.http.put<ActionResponse>(`${this.baseUrl}/actions/${actionId}`, request);
  }

  deleteAction(actionId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/actions/${actionId}`);
  }
}
