import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { CorrectiveActionService } from '../../core/services/corrective-action.service';

@Component({
  selector: 'app-action-plan',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingSpinnerComponent, ConfirmDialogComponent],
  template: `
    <div class="actions-page">
      <div class="page-header">
        <h2>Actions Correctives</h2>
        <button class="btn-primary" (click)="showForm.set(true)">+ Nouvelle Action</button>
      </div>

      <!-- Filter bar -->
      <div class="filter-bar">
        @for (f of filters; track f.value) {
          <button class="filter-btn" [class.active]="activeFilter() === f.value"
                  (click)="activeFilter.set(f.value)">
            {{ f.label }}
          </button>
        }
      </div>

      @if (loading()) {
        <app-loading-spinner />
      } @else {
        <div class="actions-list">
          @for (action of filteredActions(); track action.id) {
            <div class="action-card" [class]="'priority-' + action.priority.toLowerCase()">
              <div class="action-header">
                <span class="priority-badge" [class]="'p-' + action.priority.toLowerCase()">{{ action.priority }}</span>
                <span class="status-chip" [class]="'s-' + action.status.toLowerCase()">{{ action.status }}</span>
              </div>
              <h3 class="action-title">{{ action.title }}</h3>
              <p class="action-desc">{{ action.description }}</p>
              <div class="action-meta">
                <span>👤 {{ action.responsibleName ?? 'Non assigné' }}</span>
                <span>📅 {{ action.deadline ?? '—' }}</span>
                @if (action.expectedImpact) {
                  <span>🎯 {{ action.expectedImpact }}</span>
                }
              </div>
              <div class="action-footer">
                <button class="btn-status" (click)="updateStatus(action)">Mettre à jour</button>
              </div>
            </div>
          } @empty {
            <div class="empty-state">
              <p>✅ Aucune action corrective ouverte</p>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .actions-page { max-width: 1000px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .page-header h2 { font-size: 22px; font-weight: 700; margin: 0; }
    .btn-primary { padding: 8px 18px; background: #FF6B00; color: #fff; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; }
    .filter-bar { display: flex; gap: 8px; margin-bottom: 20px; }
    .filter-btn { padding: 6px 16px; border: 1px solid #e5e7eb; background: #fff; border-radius: 20px; font-size: 13px; cursor: pointer; color: #6b7280; transition: all 0.2s; }
    .filter-btn.active { background: #1a1a2e; color: #fff; border-color: #1a1a2e; }
    .actions-list { display: flex; flex-direction: column; gap: 14px; }
    .action-card { background: #fff; border-radius: 12px; padding: 20px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); border-left: 4px solid #e5e7eb; }
    .priority-critical { border-left-color: #ef4444; } .priority-high { border-left-color: #f59e0b; }
    .priority-medium { border-left-color: #3b82f6; } .priority-low { border-left-color: #10b981; }
    .action-header { display: flex; gap: 8px; margin-bottom: 10px; }
    .priority-badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 6px; text-transform: uppercase; }
    .p-critical { background: #fee2e2; color: #dc2626; } .p-high { background: #fef3c7; color: #d97706; }
    .p-medium { background: #dbeafe; color: #2563eb; } .p-low { background: #d1fae5; color: #059669; }
    .status-chip { font-size: 11px; padding: 2px 8px; border-radius: 6px; }
    .s-open { background: #f3f4f6; color: #6b7280; } .s-in_progress { background: #eff6ff; color: #2563eb; }
    .s-completed { background: #d1fae5; color: #059669; }
    .action-title { font-size: 15px; font-weight: 600; margin: 0 0 6px; }
    .action-desc { font-size: 13px; color: #6b7280; margin: 0 0 12px; line-height: 1.5; }
    .action-meta { display: flex; gap: 16px; font-size: 12px; color: #9ca3af; margin-bottom: 12px; flex-wrap: wrap; }
    .action-footer { border-top: 1px solid #f3f4f6; padding-top: 10px; }
    .btn-status { padding: 6px 14px; background: #f3f4f6; border: none; border-radius: 7px; font-size: 12px; font-weight: 600; cursor: pointer; color: #374151; }
    .btn-status:hover { background: #e5e7eb; }
    .empty-state { text-align: center; padding: 48px; color: #9ca3af; }
  `]
})
export class ActionPlanComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly correctiveService = inject(CorrectiveActionService);

  loading = signal(false);
  actions = signal<any[]>([]);
  activeFilter = signal('ALL');
  showForm = signal(false);

  filters = [
    { value: 'ALL', label: 'Toutes' },
    { value: 'OPEN', label: 'Ouvertes' },
    { value: 'IN_PROGRESS', label: 'En cours' },
    { value: 'COMPLETED', label: 'Terminées' },
  ];

  filteredActions = () => {
    const f = this.activeFilter();
    return f === 'ALL' ? this.actions() : this.actions().filter(a => a.status === f);
  };

  updateStatus(action: any): void {
    console.log('Update', action.id);
  }

  ngOnInit(): void {
    const pid = this.route.parent?.snapshot.paramMap.get('id') ?? '';
    if (pid) {
      this.loading.set(true);
      this.correctiveService.getProjectActions(pid).subscribe({
        next: (data) => { this.actions.set(data); this.loading.set(false); },
        error: () => this.loading.set(false)
      });
    }
  }
}
