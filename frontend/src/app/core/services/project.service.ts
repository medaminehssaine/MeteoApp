import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type ProjectStatus = 'PREPARATION' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' | 'CANCELLED' | 'ARCHIVED';
export type MeteoState = 'SOLEIL' | 'NUAGE_CLAIR' | 'NUAGE_CHARGE' | 'ORAGE';

export interface Project {
  id: string;
  name: string;
  code: string;
  shortDescription?: string;
  longDescription?: string;
  type: string;
  status: ProjectStatus;
  criticality: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  visibility: 'PUBLIC' | 'RESTRICTED' | 'PRIVATE';
  startDate: string;
  endDate: string;
  budgetTotal: number;
  budgetConsumed: number;
  chefName?: string;
  sponsorName?: string;
  directorName?: string;
  daysRemaining: number;
  memberCount: number;
  currentMeteoState?: MeteoState;
  currentMeteoScore?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectCreateRequest {
  name: string;
  code: string;
  shortDescription?: string;
  longDescription?: string;
  type: string;
  criticality: string;
  visibility: string;
  startDate: string;
  endDate: string;
  budgetTotal: number;
  sponsorId?: string;
  directorId?: string;
  chefId?: string;
}

export interface ProjectModule {
  id: string;
  name: string;
  status: string;
  progress: number;
  weight: number;
}

export interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  email: string;
}

export interface ProjectListParams {
  page?: number;
  size?: number;
  search?: string;
  status?: string;
  criticality?: string;
  sort?: string;
}

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/projects`;

  getProjects(params?: ProjectListParams): Observable<any> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          httpParams = httpParams.set(key, String(value));
        }
      });
    }
    return this.http.get<any>(this.baseUrl, { params: httpParams });
  }

  getProject(id: string): Observable<Project> {
    return this.http.get<Project>(`${this.baseUrl}/${id}`);
  }

  createProject(data: ProjectCreateRequest): Observable<Project> {
    return this.http.post<Project>(this.baseUrl, data);
  }

  updateProject(id: string, data: Partial<ProjectCreateRequest>): Observable<Project> {
    return this.http.put<Project>(`${this.baseUrl}/${id}`, data);
  }

  deleteProject(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  getModules(id: string): Observable<ProjectModule[]> {
    return this.http.get<ProjectModule[]>(`${this.baseUrl}/${id}/modules`);
  }

  getTeam(id: string): Observable<TeamMember[]> {
    return this.http.get<TeamMember[]>(`${this.baseUrl}/${id}/team`);
  }
}
