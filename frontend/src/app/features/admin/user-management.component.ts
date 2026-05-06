import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, UserDetail } from '../../core/services/admin.service';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingSpinnerComponent, ConfirmDialogComponent],
  template: `
    <div class="admin-page">
      <div class="page-header">
        <h1>Gestion des Utilisateurs</h1>
        <button class="btn-primary" (click)="showCreate.set(true)">+ Nouvel Utilisateur</button>
      </div>

      <!-- Search + filter -->
      <div class="filter-bar">
        <input type="text" placeholder="Rechercher..." class="search-input"
               [(ngModel)]="searchQuery" (ngModelChange)="loadUsers()" />
        <select class="filter-select" [(ngModel)]="activeFilter" (ngModelChange)="loadUsers()">
          <option value="all">Tous</option>
          <option value="active">Actifs</option>
          <option value="inactive">Désactivés</option>
        </select>
      </div>

      @if (loading()) {
        <app-loading-spinner />
      } @else {
        <div class="users-table-wrap">
          <table class="users-table">
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th>Email</th>
                <th>Rôle</th>
                <th>Dernière connexion</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (user of users(); track user.id) {
                <tr [class.inactive-row]="!user.active">
                  <td class="user-cell">
                    <div class="user-avatar">{{ user.firstName.charAt(0) }}{{ user.lastName.charAt(0) }}</div>
                    <div>
                      <p class="user-name">{{ user.firstName }} {{ user.lastName }}</p>
                    </div>
                  </td>
                  <td class="email-cell">{{ user.email }}</td>
                  <td><span class="role-badge" [class]="'role-' + user.defaultRole.toLowerCase()">{{ user.defaultRole }}</span></td>
                  <td class="date-cell">{{ user.lastLoginAt ? (user.lastLoginAt | date:'dd/MM/yy HH:mm') : '—' }}</td>
                  <td>
                    <span class="status-pill" [class]="user.active ? 'active' : 'inactive'">
                      {{ user.active ? 'Actif' : 'Inactif' }}
                    </span>
                  </td>
                  <td>
                    <div class="action-btns">
                      <button class="btn-icon" title="Modifier">✏️</button>
                      <button class="btn-icon" (click)="toggleUser(user)" [title]="user.active ? 'Désactiver' : 'Activer'">
                        {{ user.active ? '🔒' : '🔓' }}
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="6" class="empty-cell">Aucun utilisateur trouvé</td></tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="pagination">
          <button class="page-btn" [disabled]="currentPage() === 0" (click)="prevPage()">←</button>
          <span class="page-info">Page {{ currentPage() + 1 }} / {{ totalPages() }}</span>
          <button class="page-btn" [disabled]="currentPage() >= totalPages() - 1" (click)="nextPage()">→</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .admin-page { max-width: 1100px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .page-header h1 { font-size: 24px; font-weight: 700; margin: 0; }
    .btn-primary { padding: 9px 20px; background: #FF6B00; color: #fff; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; }
    .filter-bar { display: flex; gap: 12px; margin-bottom: 20px; }
    .search-input { flex: 1; padding: 9px 14px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 14px; }
    .filter-select { padding: 9px 12px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 14px; background: #fff; }
    .users-table-wrap { background: #fff; border-radius: 14px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); overflow: hidden; }
    .users-table { width: 100%; border-collapse: collapse; }
    .users-table th { text-align: left; font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; padding: 14px 16px; border-bottom: 1px solid #f3f4f6; letter-spacing: 0.05em; }
    .users-table td { padding: 14px 16px; font-size: 14px; border-bottom: 1px solid #f9f9f9; }
    .inactive-row { opacity: 0.55; }
    .user-cell { display: flex; align-items: center; gap: 10px; }
    .user-avatar { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #FF6B00, #ff9500); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; flex-shrink: 0; }
    .user-name { font-weight: 600; margin: 0; }
    .email-cell { color: #6b7280; font-size: 13px; }
    .date-cell { color: #9ca3af; font-size: 12px; }
    .role-badge { font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 8px; text-transform: uppercase; }
    .role-admin { background: #1a1a2e; color: #fff; }
    .role-director { background: #7c3aed; color: #fff; }
    .role-chef { background: #2563eb; color: #fff; }
    .role-member { background: #059669; color: #fff; }
    .role-observer { background: #6b7280; color: #fff; }
    .status-pill { font-size: 12px; padding: 3px 10px; border-radius: 12px; font-weight: 600; }
    .active { background: #d1fae5; color: #065f46; }
    .inactive { background: #f3f4f6; color: #9ca3af; }
    .action-btns { display: flex; gap: 6px; }
    .btn-icon { width: 30px; height: 30px; border: 1px solid #e5e7eb; border-radius: 6px; background: #fff; cursor: pointer; font-size: 14px; display: flex; align-items: center; justify-content: center; }
    .btn-icon:hover { background: #f3f4f6; }
    .empty-cell { text-align: center; color: #9ca3af; padding: 36px !important; }
    .pagination { display: flex; align-items: center; justify-content: center; gap: 16px; padding: 16px; }
    .page-btn { padding: 6px 14px; border: 1px solid #e5e7eb; border-radius: 7px; background: #fff; cursor: pointer; font-size: 14px; }
    .page-btn:disabled { opacity: 0.4; cursor: default; }
    .page-info { font-size: 13px; color: #6b7280; }
  `]
})
export class UserManagementComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly notification = inject(NotificationService);

  loading = signal(false);
  users = signal<UserDetail[]>([]);
  currentPage = signal(0);
  totalPages = signal(1);
  searchQuery = '';
  activeFilter = 'all';
  showCreate = signal(false);

  ngOnInit(): void { this.loadUsers(); }

  loadUsers(): void {
    this.loading.set(true);
    const active = this.activeFilter === 'active' ? true : this.activeFilter === 'inactive' ? false : undefined;
    this.adminService.getUsers({ page: this.currentPage(), size: 20, search: this.searchQuery, active }).subscribe({
      next: (page) => {
        this.users.set(page.content);
        this.totalPages.set(page.totalPages || 1);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  toggleUser(user: UserDetail): void {
    this.adminService.toggleUserStatus(user.id, !user.active).subscribe({
      next: () => {
        this.notification.success(`Utilisateur ${user.active ? 'désactivé' : 'activé'}`);
        this.loadUsers();
      }
    });
  }

  prevPage(): void { this.currentPage.update(p => Math.max(0, p - 1)); this.loadUsers(); }
  nextPage(): void { this.currentPage.update(p => p + 1); this.loadUsers(); }
}
