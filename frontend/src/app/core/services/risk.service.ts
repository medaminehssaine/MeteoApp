import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type RiskStatus = 'IDENTIFIED' | 'ACTIVE' | 'MITIGATED' | 'CLOSED';
export type RiskCategory = 'TECHNICAL' | 'ORGANIZATIONAL' | 'EXTERNAL' | 'FINANCIAL' | 'SCHEDULE';

export interface RiskResponse {
  id: string;
  title: string;
  description: string;
  category: RiskCategory;
  probability: number;   // 1-5
  impact: number;        // 1-5
  severity: number;      // probability * impact (1-25)
  status: RiskStatus;
  mitigationPlan?: string;
  responsibleId?: string;
  responsibleName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RiskSummary {
  totalRisks: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  mitigated: number;
}

export interface CreateRiskRequest {
  title: string;
  description: string;
  category: RiskCategory;
  probability: number;
  impact: number;
  mitigationPlan?: string;
  responsibleId?: string;
}

export interface UpdateRiskRequest {
  title?: string;
  description?: string;
  probability?: number;
  impact?: number;
  status?: RiskStatus;
  mitigationPlan?: string;
  responsibleId?: string;
}

@Injectable({ providedIn: 'root' })
export class RiskService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/risks`;

  getRisks(projectId: string, status?: RiskStatus): Observable<RiskResponse[]> {
    const params = status ? `?status=${status}` : '';
    return this.http.get<RiskResponse[]>(`${this.baseUrl}/projects/${projectId}${params}`);
  }

  getRiskSummary(projectId: string): Observable<RiskSummary> {
    return this.http.get<RiskSummary>(`${this.baseUrl}/projects/${projectId}/summary`);
  }

  createRisk(projectId: string, request: CreateRiskRequest): Observable<RiskResponse> {
    return this.http.post<RiskResponse>(`${this.baseUrl}/projects/${projectId}`, request);
  }

  updateRisk(riskId: string, request: UpdateRiskRequest): Observable<RiskResponse> {
    return this.http.put<RiskResponse>(`${this.baseUrl}/${riskId}`, request);
  }

  deleteRisk(riskId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${riskId}`);
  }
}
