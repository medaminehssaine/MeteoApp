import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type IndicatorCategory = 'PROGRESS' | 'BUDGET' | 'RISK' | 'QUALITY' | 'RESOURCE';
export type IndicatorState = 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';

export interface ProjectIndicatorResponse {
  id: string;
  indicatorCode: string;
  indicatorName: string;
  category: IndicatorCategory;
  currentValue: number | null;
  thresholdGreen: number;
  thresholdOrange: number;
  thresholdRed: number;
  score: number | null;
  state: IndicatorState | null;
  weight: number;
  criticality: string;
  frequency: string;
  lastUpdatedAt: string | null;
}

export interface IndicatorScoreSummary {
  globalScore: number;
  categoryScores: Record<string, number>;
  indicatorCount: number;
  criticalCount: number;
}

export interface IndicatorLibraryItem {
  id: string;
  code: string;
  name: string;
  category: IndicatorCategory;
  description: string;
  unit: string;
  defaultWeight: number;
}

export interface AssignIndicatorRequest {
  indicatorId: string;
  weight?: number;
  thresholdGreen?: number;
  thresholdOrange?: number;
  thresholdRed?: number;
}

@Injectable({ providedIn: 'root' })
export class IndicatorService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/indicators`;

  getProjectIndicators(projectId: string): Observable<ProjectIndicatorResponse[]> {
    return this.http.get<ProjectIndicatorResponse[]>(`${this.baseUrl}/projects/${projectId}`);
  }

  getScoreSummary(projectId: string): Observable<IndicatorScoreSummary> {
    return this.http.get<IndicatorScoreSummary>(`${this.baseUrl}/projects/${projectId}/score`);
  }

  getLibrary(): Observable<IndicatorLibraryItem[]> {
    return this.http.get<IndicatorLibraryItem[]>(`${this.baseUrl}/library`);
  }

  assignIndicator(projectId: string, request: AssignIndicatorRequest): Observable<ProjectIndicatorResponse> {
    return this.http.post<ProjectIndicatorResponse>(`${this.baseUrl}/projects/${projectId}`, request);
  }

  updateValue(indicatorId: string, value: number): Observable<ProjectIndicatorResponse> {
    return this.http.put<ProjectIndicatorResponse>(`${this.baseUrl}/${indicatorId}/value`, { value });
  }
}
