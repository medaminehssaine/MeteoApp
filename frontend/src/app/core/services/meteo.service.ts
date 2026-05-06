import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type MeteoState = 'SOLEIL' | 'NUAGE_CLAIR' | 'NUAGE_CHARGE' | 'ORAGE';

export interface MeteoResult {
  projectId: string;
  state: MeteoState;
  score: number;
  forced: boolean;
  forcedBy?: string;
  forcingRule?: string;
  calculatedAt: string;
  previousState?: MeteoState;
  trend?: string;
  cqdScore?: number;
  indicatorScore?: number;
  riskScore?: number;
  planScore?: number;
}

export interface MeteoHistoryEntry {
  state: MeteoState;
  score: number;
  calculatedAt: string;
  forced: boolean;
}

@Injectable({ providedIn: 'root' })
export class MeteoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/meteo`;

  calculateMeteo(projectId: string): Observable<MeteoResult> {
    return this.http.post<MeteoResult>(`${this.baseUrl}/projects/${projectId}/calculate`, {});
  }

  getCurrentMeteo(projectId: string): Observable<MeteoResult> {
    return this.http.get<MeteoResult>(`${this.baseUrl}/projects/${projectId}/current`);
  }

  getMeteoHistory(projectId: string, page = 0, size = 20): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/projects/${projectId}/history?page=${page}&size=${size}`);
  }
}
