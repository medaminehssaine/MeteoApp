import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { PlanService, ActionResponse, ProgressSummary } from '../../core/services/plan.service';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';

@Component({
  selector: 'app-plan-overview',
  standalone: true,
  imports: [CommonModule, SkeletonComponent],
  template: `
    <div class="plan-page fade-in">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h2>Plan d'Actions</h2>
          <p class="page-sub">Suivi de l'avancement des actions projet</p>
        </div>
      </div>

      <!-- Progress Summary -->
      @if (progress()) {
        <div class="progress-banner card">
          <div class="global-progress">
            <div class="global-pct">{{ progress()!.globalProgress.toFixed(0) }}%</div>
            <div class="global-info">
              <span class="global-label">Avancement Global</span>
              <div class="global-bar">
                <div class="global-fill" [style.width.%]="progress()!.globalProgress"></div>
              </div>
            </div>
          </div>
          <div class="progress-stats">
            <div class="pstat">
              <span class="pstat-num total">{{ progress()!.totalActions }}</span>
              <span class="pstat-label">Total</span>
            </div>
            <div class="pstat">
              <span class="pstat-num done">{{ progress()!.completedActions }}</span>
              <span class="pstat-label">Terminées</span>
            </div>
            <div class="pstat">
              <span class="pstat-num inprog">{{ progress()!.inProgressActions }}</span>
              <span class="pstat-label">En cours</span>
            </div>
            <div class="pstat">
              <span class="pstat-num blocked">{{ progress()!.blockedActions }}</span>
              <span class="pstat-label">Bloquées</span>
            </div>
          </div>
        </div>
      }

      <!-- Module Progress List -->
      @if (progress()?.moduleProgressList?.length) {
        <div class="module-progress-row">
          @for (mod of progress()!.moduleProgressList; track mod.moduleId) {
            <div class="mod-progress-card card">
              <span class="mod-name">{{ mod.moduleName }}</span>
              <div class="mod-bar-row">
                <div class="mod-bar"><div class="mod-fill" [style.width.%]="mod.progress"></div></div>
                <span class="mod-pct">{{ mod.progress.toFixed(0) }}%</span>
              </div>
              <span class="mod-weight">Poids: {{ mod.weight }}%</span>
            </div>
          }
        </div>
      }

      <!-- Loading -->
      @if (loading()) {
        <div style="display:flex;flex-direction:column;gap:12px;margin-top:1rem">
          @for (i of [1,2,3]; track i) { <app-skeleton height="80px" /> }
        </div>
      } @else if (groupedActions().length === 0) {
        <div class="empty-state">
          <p style="font-size:2.5rem">📋</p>
          <h3>Aucune action définie</h3>
          <p style="color:var(--text-secondary)">Créez des modules et des actions depuis la gestion du projet.</p>
        </div>
      } @else {
        <div class="modules-list">
          @for (group of groupedActions(); track group.moduleId) {
            <div class="module-section">
              <!-- Module header accordion -->
              <div class="module-header" (click)="toggleModule(group.moduleId)">
                <div class="module-title-row">
                  <span class="module-icon">📦</span>
                  <h3 class="module-name">{{ group.moduleName }}</h3>
                  <span class="action-count">{{ group.actions.length }} action(s)</span>
                </div>
                <div class="module-right">
                  <div class="module-mini-bar">
                    <div class="module-mini-fill" [style.width.%]="getModuleProgress(group.actions)"></div>
                  </div>
                  <span class="module-pct">{{ getModuleProgress(group.actions).toFixed(0) }}%</span>
                  <span class="collapse-icon">{{ expandedModules().has(group.moduleId) ? '▼' : '▶' }}</span>
                </div>
              </div>

              <!-- Actions list -->
              @if (expandedModules().has(group.moduleId)) {
                <div class="actions-list fade-in">
                  @for (action of group.actions; track action.id) {
                    <div class="action-card" [class]="'action-' + action.status.toLowerCase()">
                      <div class="action-left">
                        <div class="action-status-dot" [class]="'dot-' + action.status.toLowerCase()"></div>
                        <div class="action-info">
                          <div class="action-title-row">
                            @if (action.isMilestone) { <span class="milestone-badge">🏁</span> }
                            <span class="action-title">{{ action.title }}</span>
                          </div>
                          <div class="action-dates">
                            {{ formatDate(action.plannedStart) }} → {{ formatDate(action.plannedEnd) }}
                            @if (action.responsibleName) { · {{ action.responsibleName }} }
                          </div>
                        </div>
                      </div>
                      <div class="action-right">
                        <div class="progress-row">
                          <div class="action-progress-bar">
                            <div class="action-progress-fill" [style.width.%]="action.progress"></div>
                          </div>
                          <span class="action-pct">{{ action.progress }}%</span>
                        </div>
                        <span class="action-status-badge" [class]="'status-badge action-status-' + action.status.toLowerCase()">
                          {{ getActionStatusLabel(action.status) }}
                        </span>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .plan-page { max-width: 1000px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
    .page-header h2 { margin: 0 0 4px; font-size: 1.5rem; }
    .page-sub { margin: 0; font-size: 0.875rem; color: var(--text-secondary); }

    .progress-banner { padding: 1.5rem; display: flex; align-items: center; gap: 2rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
    .global-progress { display: flex; align-items: center; gap: 1rem; flex: 1; min-width: 200px; }
    .global-pct { font-size: 2.5rem; font-weight: 700; font-family: 'Outfit', sans-serif; color: var(--primary); }
    .global-info { flex: 1; display: flex; flex-direction: column; gap: 8px; }
    .global-label { font-size: 0.875rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; }
    .global-bar { height: 10px; background: rgba(255,255,255,0.08); border-radius: 5px; overflow: hidden; }
    .global-fill { height: 100%; background: linear-gradient(90deg, var(--primary), #FF8C40); border-radius: 5px; transition: width 0.8s ease; }
    .progress-stats { display: flex; gap: 1.5rem; }
    .pstat { display: flex; flex-direction: column; align-items: center; gap: 2px; }
    .pstat-num { font-size: 1.5rem; font-weight: 700; font-family: 'Outfit', sans-serif; }
    .total { color: var(--text-primary); }
    .done { color: #10B981; }
    .inprog { color: #F59E0B; }
    .blocked { color: #EF4444; }
    .pstat-label { font-size: 0.75rem; color: var(--text-secondary); }

    .module-progress-row { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
    .mod-progress-card { padding: 1rem; display: flex; flex-direction: column; gap: 8px; }
    .mod-name { font-size: 0.875rem; font-weight: 600; }
    .mod-bar-row { display: flex; align-items: center; gap: 8px; }
    .mod-bar { flex: 1; height: 6px; background: rgba(255,255,255,0.06); border-radius: 3px; overflow: hidden; }
    .mod-fill { height: 100%; background: var(--primary); border-radius: 3px; transition: width 0.6s ease; }
    .mod-pct { font-size: 0.8125rem; font-weight: 600; }
    .mod-weight { font-size: 0.75rem; color: var(--text-secondary); }

    .modules-list { display: flex; flex-direction: column; gap: 1rem; }
    .module-section { background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px; overflow: hidden; }
    .module-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.25rem; cursor: pointer; transition: background 0.15s; }
    .module-header:hover { background: rgba(255,255,255,0.03); }
    .module-title-row { display: flex; align-items: center; gap: 10px; }
    .module-icon { font-size: 1.25rem; }
    .module-name { margin: 0; font-size: 1rem; font-weight: 600; }
    .action-count { font-size: 0.75rem; color: var(--text-secondary); background: rgba(255,255,255,0.06); padding: 2px 8px; border-radius: 10px; }
    .module-right { display: flex; align-items: center; gap: 12px; }
    .module-mini-bar { width: 80px; height: 6px; background: rgba(255,255,255,0.06); border-radius: 3px; overflow: hidden; }
    .module-mini-fill { height: 100%; background: var(--primary); border-radius: 3px; }
    .module-pct { font-size: 0.8125rem; font-weight: 600; color: var(--text-primary); min-width: 36px; }
    .collapse-icon { font-size: 0.75rem; color: var(--text-secondary); }

    .actions-list { border-top: 1px solid var(--border); display: flex; flex-direction: column; gap: 0; }
    .action-card { display: flex; justify-content: space-between; align-items: center; padding: 0.875rem 1.25rem; border-bottom: 1px solid rgba(255,255,255,0.04); gap: 1rem; transition: background 0.15s; }
    .action-card:last-child { border-bottom: none; }
    .action-card:hover { background: rgba(255,255,255,0.02); }
    .action-left { display: flex; align-items: center; gap: 0.875rem; flex: 1; min-width: 0; }
    .action-status-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .dot-not_started { background: var(--text-secondary); }
    .dot-in_progress { background: #F59E0B; box-shadow: 0 0 6px #F59E0B; }
    .dot-completed { background: #10B981; box-shadow: 0 0 6px #10B981; }
    .dot-blocked { background: #EF4444; box-shadow: 0 0 6px #EF4444; }
    .dot-on_hold { background: #94A3B8; }
    .action-info { flex: 1; min-width: 0; }
    .action-title-row { display: flex; align-items: center; gap: 6px; }
    .milestone-badge { font-size: 0.875rem; }
    .action-title { font-size: 0.875rem; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .action-dates { font-size: 0.75rem; color: var(--text-secondary); margin-top: 2px; }
    .action-right { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; flex-shrink: 0; }
    .progress-row { display: flex; align-items: center; gap: 8px; }
    .action-progress-bar { width: 80px; height: 6px; background: rgba(255,255,255,0.06); border-radius: 3px; overflow: hidden; }
    .action-progress-fill { height: 100%; background: var(--primary); border-radius: 3px; }
    .action-pct { font-size: 0.75rem; font-weight: 600; min-width: 28px; text-align: right; }
    .action-status-not_started { background: rgba(148,163,184,0.15); color: #94A3B8; }
    .action-status-in_progress { background: rgba(245,158,11,0.15); color: #FBBF24; }
    .action-status-completed { background: rgba(16,185,129,0.15); color: #34D399; }
    .action-status-blocked { background: rgba(239,68,68,0.15); color: #F87171; }
    .action-status-on_hold { background: rgba(148,163,184,0.1); color: #94A3B8; }

    .empty-state { text-align: center; padding: 4rem; color: var(--text-secondary); }
    .empty-state h3 { margin: 0.5rem 0; color: var(--text-primary); }
  `]
})
export class PlanOverviewComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly planService = inject(PlanService);

  loading = signal(true);
  actions = signal<ActionResponse[]>([]);
  progress = signal<ProgressSummary | null>(null);
  expandedModules = signal<Set<string>>(new Set());

  groupedActions = computed(() => {
    const map = new Map<string, { moduleId: string; moduleName: string; actions: ActionResponse[] }>();
    for (const action of this.actions()) {
      const key = action.moduleId;
      if (!map.has(key)) map.set(key, { moduleId: key, moduleName: action.moduleName ?? 'Module', actions: [] });
      map.get(key)!.actions.push(action);
    }
    return Array.from(map.values());
  });

  ngOnInit(): void {
    const projectId = this.route.parent?.snapshot.paramMap.get('id') ?? '';
    if (!projectId) return;
    this.loading.set(true);
    this.planService.getActionsByProject(projectId).subscribe({
      next: (list) => {
        this.actions.set(list);
        // Auto-expand first module
        const groups = this.groupedActions();
        if (groups[0]) this.expandedModules.set(new Set([groups[0].moduleId]));
        this.loading.set(false);
      },
      error: (err: any) => this.loading.set(false)
    });
    this.planService.getProgressSummary(projectId).subscribe({
      next: (p) => this.progress.set(p),
      error: (err: any) => {}
    });
  }

  toggleModule(id: string): void {
    this.expandedModules.update(set => {
      const next = new Set(set);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  getModuleProgress(actions: ActionResponse[]): number {
    if (!actions.length) return 0;
    return actions.reduce((s, a) => s + a.progress, 0) / actions.length;
  }

  getActionStatusLabel(status: string): string {
    const map: Record<string, string> = { NOT_STARTED: 'À démarrer', IN_PROGRESS: 'En cours', COMPLETED: 'Terminé', BLOCKED: 'Bloqué', ON_HOLD: 'En attente' };
    return map[status] ?? status;
  }

  formatDate(date?: string): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  }
}
