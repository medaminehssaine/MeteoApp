import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  createdAt: string;
}

export interface UserDetail {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  defaultRole: string;
  active: boolean;
  lastLoginAt: string;
  createdAt: string;
}

export interface Page<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  // ── Users ────────────────────────────────────────────────────
  getUsers(params?: { page?: number; size?: number; search?: string; active?: boolean }): Observable<Page<UserDetail>> {
    let p = new HttpParams();
    if (params?.page !== undefined) p = p.set('page', params.page);
    if (params?.size !== undefined) p = p.set('size', params.size);
    if (params?.search)             p = p.set('search', params.search);
    if (params?.active !== undefined) p = p.set('active', String(params.active));
    return this.http.get<Page<UserDetail>>(`${this.base}/users`, { params: p });
  }

  createUser(data: Partial<UserDetail> & { password: string }): Observable<UserDetail> {
    return this.http.post<UserDetail>(`${this.base}/users`, data);
  }

  updateUser(id: string, data: Partial<UserDetail>): Observable<UserDetail> {
    return this.http.put<UserDetail>(`${this.base}/users/${id}`, data);
  }

  /** Toggle active state: backend has separate POST /{id}/activate and /{id}/deactivate */
  toggleUserStatus(id: string, active: boolean): Observable<Record<string, string>> {
    const action = active ? 'activate' : 'deactivate';
    return this.http.post<Record<string, string>>(`${this.base}/users/${id}/${action}`, {});
  }

  // ── Audit Logs ───────────────────────────────────────────────
  getAuditLogs(params?: { userId?: string; action?: string; page?: number; size?: number }): Observable<Page<AuditLog>> {
    let p = new HttpParams();
    if (params?.userId) p = p.set('userId', params.userId);
    if (params?.action) p = p.set('action', params.action);
    if (params?.page !== undefined) p = p.set('page', params.page);
    if (params?.size !== undefined) p = p.set('size', params.size);
    // Backend is at /api/v1/audit (not /admin/audit-log)
    return this.http.get<Page<AuditLog>>(`${this.base}/audit`, { params: p });
  }

  getStats(): Observable<Record<string, number>> {
    return this.http.get<Record<string, number>>(`${this.base}/dashboard/stats`);
  }
}
