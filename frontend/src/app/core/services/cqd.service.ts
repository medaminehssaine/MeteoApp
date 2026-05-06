import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type AxisState = 'ALIGNED' | 'UNDER_TENSION' | 'DEGRADED';
export type TrendDirection = 'UP' | 'STABLE' | 'DOWN';

export interface CqdAxis {
  axis: 'COST' | 'QUALITY' | 'DELAY';
  state: AxisState;
  score: number;
  trend: TrendDirection;
  details: string;
}

export interface CqdResult {
  id: string;
  projectId: string;
  axes: CqdAxis[];
  globalScore: number;
  calculatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class CqdService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/cqd`;

  calculateCqd(projectId: string): Observable<CqdResult> {
    return this.http.post<CqdResult>(`${this.baseUrl}/projects/${projectId}/calculate`, {});
  }

  getCurrentCqd(projectId: string): Observable<CqdResult> {
    return this.http.get<CqdResult>(`${this.baseUrl}/projects/${projectId}/current`);
  }

  getCqdHistory(projectId: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/projects/${projectId}/history`);
  }
}
