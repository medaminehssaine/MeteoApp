import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, AuditLog } from '../../core/services/admin.service';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { RelativeDatePipe } from '../../shared/pipes/relative-date.pipe';

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingSpinnerComponent, RelativeDatePipe, DatePipe],
  template: `
    <div class="audit-page">
      <div class="page-header">
        <h1>Journal d'Audit</h1>
        <span class="log-count">{{ totalElements() }} entrées</span>
      </div>

      <!-- Filters -->
      <div class="filter-bar">
        <input type="text" placeholder="Filtrer par utilisateur..." class="search-input"
               [(ngModel)]="userFilter" (ngModelChange)="loadLogs()" />
        <select class="filter-select" [(ngModel)]="actionFilter" (ngModelChange)="loadLogs()">
          <option value="">Toutes les actions</option>
          <option value="CREATE">CREATE</option>
          <option value="UPDATE">UPDATE</option>
          <option value="DELETE">DELETE</option>
          <option value="LOGIN">LOGIN</option>
          <option value="LOGOUT">LOGOUT</option>
        </select>
      </div>

      @if (loading()) {
        <app-loading-spinner />
      } @else {
        <div class="log-table-wrap">
          <table class="log-table">
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th>Action</th>
                <th>Entité</th>
                <th>Détails</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              @for (log of logs(); track log.id) {
                <tr>
                  <td>
                    <div class="user-cell">
                      <div class="mini-avatar">{{ log.userEmail ? log.userEmail.charAt(0).toUpperCase() : '?' }}</div>
                      <span>{{ log.userEmail }}</span>
                    </div>
                  </td>
                  <td><span class="action-badge" [class]="'action-' + log.action.toLowerCase()">{{ log.action }}</span></td>
                  <td class="entity-cell">
                    <span class="entity-type">{{ log.entityType }}</span>
                    @if (log.entityId) { <span class="entity-id">{{ log.entityId.substring(0, 8) }}...</span> }
                  </td>
                  <td class="details-cell">{{ log.details }}</td>
                  <td class="date-cell" [title]="log.createdAt | date:'full'">{{ log.createdAt | relativeDate }}</td>
                </tr>
              } @empty {
                <tr><td colspan="5" class="empty-cell">Aucun log d'audit</td></tr>
              }
            </tbody>
          </table>
        </div>

        <div class="pagination">
          <button class="page-btn" [disabled]="currentPage() === 0" (click)="prevPage()">← Précédent</button>
          <span class="page-info">Page {{ currentPage() + 1 }} / {{ totalPages() }}</span>
          <button class="page-btn" [disabled]="currentPage() >= totalPages() - 1" (click)="nextPage()">Suivant →</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .audit-page { max-width: 1200px; }
    .page-header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
    .page-header h1 { font-size: 24px; font-weight: 700; margin: 0; }
    .log-count { font-size: 13px; color: #9ca3af; background: #f3f4f6; padding: 3px 10px; border-radius: 10px; }
    .filter-bar { display: flex; gap: 12px; margin-bottom: 20px; }
    .search-input { flex: 1; padding: 9px 14px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 14px; }
    .filter-select { padding: 9px 12px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 14px; background: #fff; min-width: 180px; }
    .log-table-wrap { background: #fff; border-radius: 14px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); overflow: hidden; }
    .log-table { width: 100%; border-collapse: collapse; }
    .log-table th { text-align: left; font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; padding: 14px 16px; border-bottom: 1px solid #f3f4f6; }
    .log-table td { padding: 12px 16px; font-size: 13px; border-bottom: 1px solid #f9f9f9; }
    .user-cell { display: flex; align-items: center; gap: 8px; }
    .mini-avatar { width: 28px; height: 28px; border-radius: 50%; background: #FF6B00; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; }
    .action-badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 6px; text-transform: uppercase; }
    .action-create { background: #d1fae5; color: #065f46; }
    .action-update { background: #dbeafe; color: #1d4ed8; }
    .action-delete { background: #fee2e2; color: #7f1d1d; }
    .action-login { background: #fef3c7; color: #92400e; }
    .entity-cell { display: flex; flex-direction: column; gap: 2px; }
    .entity-type { font-weight: 600; font-size: 12px; }
    .entity-id { color: #9ca3af; font-size: 11px; font-family: monospace; }
    .details-cell { color: #6b7280; max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .date-cell { color: #9ca3af; font-size: 12px; white-space: nowrap; }
    .empty-cell { text-align: center; color: #9ca3af; padding: 36px !important; }
    .pagination { display: flex; align-items: center; justify-content: center; gap: 16px; padding: 16px; }
    .page-btn { padding: 7px 18px; border: 1px solid #e5e7eb; border-radius: 8px; background: #fff; cursor: pointer; font-size: 13px; font-weight: 500; }
    .page-btn:disabled { opacity: 0.4; cursor: default; }
    .page-info { font-size: 13px; color: #6b7280; }
  `]
})
export class AuditLogComponent implements OnInit {
  private readonly adminService = inject(AdminService);

  loading = signal(false);
  logs = signal<AuditLog[]>([]);
  currentPage = signal(0);
  totalPages = signal(1);
  totalElements = signal(0);
  userFilter = '';
  actionFilter = '';

  ngOnInit(): void { this.loadLogs(); }

  loadLogs(): void {
    this.loading.set(true);
    this.adminService.getAuditLogs({ page: this.currentPage(), size: 50, action: this.actionFilter || undefined }).subscribe({
      next: (page) => {
        this.logs.set(page.content);
        this.totalPages.set(page.totalPages || 1);
        this.totalElements.set(page.totalElements);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  prevPage(): void { this.currentPage.update(p => Math.max(0, p - 1)); this.loadLogs(); }
  nextPage(): void { this.currentPage.update(p => p + 1); this.loadLogs(); }
}
