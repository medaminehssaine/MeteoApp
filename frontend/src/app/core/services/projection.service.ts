import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type ScenarioType = 'NOMINAL' | 'OPTIMISTIC' | 'PESSIMISTIC';

export interface ScenarioResult {
  name: string;
  probability: number;
  projectedState: string;
  projectedScore: number;
  projectedProgress: number;
  completionDate: string;
  budgetAtCompletion: number;
}

export interface LayerScore {
  layerName: string;
  weight: number;
  score: number;
  confidence: number;
  explanation: string;
}

export interface LayerBreakdown {
  trend: LayerScore;
  simulation: LayerScore;
  actionPlan: LayerScore;
  risk: LayerScore;
  capacity: LayerScore;
  compositeScore: number;
}

export interface RecommendationItem {
  category: string;
  priority: string;
  action: string;
  expectedImpact: string;
}

export interface ProjectionResult {
  id: string;
  projectId: string;
  horizonDays: number;
  calculatedAt: string;
  nominalScenario: ScenarioResult;
  optimisticScenario: ScenarioResult;
  pessimisticScenario: ScenarioResult;
  confidence: number;
  confidenceLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  layerBreakdown: LayerBreakdown;
  explanations: string[];
  recommendations: RecommendationItem[];
}

export interface ProjectionRequest {
  horizonDays: number;
}

@Injectable({ providedIn: 'root' })
export class ProjectionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/projections`;

  generateProjection(projectId: string, request: ProjectionRequest): Observable<ProjectionResult> {
    return this.http.post<ProjectionResult>(`${this.baseUrl}/projects/${projectId}`, request);
  }

  getLatestProjection(projectId: string): Observable<ProjectionResult> {
    return this.http.get<ProjectionResult>(`${this.baseUrl}/projects/${projectId}/latest`);
  }

  getProjectionHistory(projectId: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/projects/${projectId}/history`);
  }
}
