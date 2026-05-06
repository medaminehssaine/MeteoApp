import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ProjectService, Project } from '../../core/services/project.service';
import { CreateProjectDialogComponent } from './create-project-dialog.component';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, CreateProjectDialogComponent, SkeletonComponent],
  template: `
    <div class="project-list-page fade-in">
      <section class="portfolio-header">
        <div>
          <p class="eyebrow">Portfolio</p>
          <h1>Project cockpit</h1>
          <p class="page-subtitle">{{ totalCount() }} projects tracked across delivery, budget, and risk.</p>
        </div>
        <button class="btn btn-primary" type="button" (click)="showCreateDialog.set(true)">New project</button>
      </section>

      <section class="summary-strip">
        <div class="summary-item">
          <span class="summary-value">{{ totalCount() }}</span>
          <span class="summary-label">Total</span>
        </div>
        <div class="summary-item">
          <span class="summary-value">{{ activeCount() }}</span>
          <span class="summary-label">Active</span>
        </div>
        <div class="summary-item">
          <span class="summary-value">{{ riskCount() }}</span>
          <span class="summary-label">At risk</span>
        </div>
        <div class="summary-item">
          <span class="summary-value">{{ overdueCount() }}</span>
          <span class="summary-label">Overdue</span>
        </div>
      </section>

      <section class="filter-bar">
        <div class="search-wrapper">
          <span class="search-icon">/</span>
          <input
            type="text"
            placeholder="Search by name, code, owner..."
            class="search-input"
            [ngModel]="searchQuery()"
            (ngModelChange)="searchQuery.set($event); applyFilters()"
          />
        </div>
        <select class="filter-select" [ngModel]="statusFilter()" (ngModelChange)="statusFilter.set($event); applyFilters()">
          <option value="">All statuses</option>
          <option value="PREPARATION">Planning</option>
          <option value="IN_PROGRESS">In progress</option>
          <option value="PAUSED">Paused</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <select class="filter-select" [ngModel]="criticalityFilter()" (ngModelChange)="criticalityFilter.set($event); applyFilters()">
          <option value="">All criticality</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="CRITICAL">Critical</option>
        </select>
        <div class="view-toggle" aria-label="View mode">
          <button type="button" class="toggle-btn" [class.active]="viewMode() === 'grid'" (click)="viewMode.set('grid')" aria-label="Grid view">Grid</button>
          <button type="button" class="toggle-btn" [class.active]="viewMode() === 'list'" (click)="viewMode.set('list')" aria-label="List view">List</button>
        </div>
      </section>

      @if (loading()) {
        <div class="projects-grid">
          @for (i of [1,2,3,4,5,6]; track i) {
            <div class="card project-card">
              <app-skeleton height="18px" width="54%" />
              <app-skeleton height="14px" width="80%" style="margin-top:10px" />
              <app-skeleton height="8px" style="margin-top:18px" />
              <div class="skeleton-row">
                <app-skeleton height="24px" width="86px" radius="20px" />
                <app-skeleton height="24px" width="86px" radius="20px" />
              </div>
            </div>
          }
        </div>
      } @else if (viewMode() === 'grid') {
        @if (projects().length === 0) {
          <div class="empty-state card">
            <h3>No matching projects</h3>
            <p>Adjust filters or create the first project for the MVP demo.</p>
            <button class="btn btn-primary" type="button" (click)="showCreateDialog.set(true)">Create project</button>
          </div>
        } @else {
          <div class="projects-grid">
            @for (project of projects(); track project.id) {
              <article class="card project-card" [class]="'crit-border-' + project.criticality.toLowerCase()" (click)="navigateToProject(project.id)">
                <div class="card-top">
                  <span class="meteo-badge" [class]="getMeteoClass(project.currentMeteoState)">
                    {{ getMeteoLabel(project.currentMeteoState) }}
                  </span>
                  <span class="code-badge">{{ project.code }}</span>
                </div>

                <div class="project-main">
                  <h2>{{ project.name }}</h2>
                  <p>{{ project.shortDescription || 'No summary added yet.' }}</p>
                </div>

                <div class="badges-row">
                  <span class="status-badge" [class]="'status-' + project.status.toLowerCase()">
                    {{ getStatusLabel(project.status) }}
                  </span>
                  <span class="crit-badge" [class]="'crit-text-' + project.criticality.toLowerCase()">
                    {{ getCritLabel(project.criticality) }} criticality
                  </span>
                </div>

                <div class="budget-section">
                  <div class="budget-labels">
                    <span>Budget used</span>
                    <strong>{{ getBudgetPct(project) }}%</strong>
                  </div>
                  <div class="budget-bar">
                    <div class="budget-fill" [style.width.%]="getBudgetBarWidth(project)"
                         [class.budget-warn]="getBudgetPct(project) > 80"
                         [class.budget-danger]="getBudgetPct(project) > 100">
                    </div>
                  </div>
                </div>

                <div class="card-footer">
                  <span>{{ project.chefName || 'Unassigned' }}</span>
                  <span class="days-badge" [class.days-overdue]="(project.daysRemaining || 0) < 0">
                    {{ formatDays(project.daysRemaining) }}
                  </span>
                </div>
              </article>
            }
          </div>
        }
      } @else {
        <div class="card table-card">
          <table class="projects-table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Status</th>
                <th>Criticality</th>
                <th>Health</th>
                <th>Budget</th>
                <th>Owner</th>
                <th>Timeline</th>
              </tr>
            </thead>
            <tbody>
              @for (project of projects(); track project.id) {
                <tr class="project-row" (click)="navigateToProject(project.id)">
                  <td>
                    <div class="project-name-cell">
                      <span class="proj-name">{{ project.name }}</span>
                      <span class="proj-code">{{ project.code }}</span>
                    </div>
                  </td>
                  <td><span class="status-badge" [class]="'status-' + project.status.toLowerCase()">{{ getStatusLabel(project.status) }}</span></td>
                  <td><span class="crit-badge" [class]="'crit-text-' + project.criticality.toLowerCase()">{{ getCritLabel(project.criticality) }}</span></td>
                  <td><span class="meteo-badge" [class]="getMeteoClass(project.currentMeteoState)">{{ getMeteoLabel(project.currentMeteoState) }}</span></td>
                  <td>{{ getBudgetPct(project) }}%</td>
                  <td>{{ project.chefName || 'Unassigned' }}</td>
                  <td><span class="days-badge" [class.days-overdue]="project.daysRemaining < 0">{{ formatDays(project.daysRemaining) }}</span></td>
                </tr>
              } @empty {
                <tr><td colspan="7" class="empty-row">No project matches these filters.</td></tr>
              }
            </tbody>
          </table>
        </div>
      }

      @if (!loading() && totalPages() > 1) {
        <div class="pagination">
          <button class="btn btn-secondary btn-sm" type="button" [disabled]="currentPage() === 0" (click)="changePage(currentPage() - 1)">Previous</button>
          <span class="page-info">Page {{ currentPage() + 1 }} of {{ totalPages() }}</span>
          <button class="btn btn-secondary btn-sm" type="button" [disabled]="currentPage() >= totalPages() - 1" (click)="changePage(currentPage() + 1)">Next</button>
        </div>
      }
    </div>

    @if (showCreateDialog()) {
      <app-create-project-dialog (close)="onDialogClose($event)" />
    }
  `,
  styles: [`
    .project-list-page { padding: 0.25rem 0 2rem; }
    .portfolio-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 1rem;
      margin-bottom: 1rem;
      padding: 1.35rem;
      border: 1px solid var(--border);
      border-radius: 18px;
      background: #fff;
      box-shadow: 0 12px 30px rgba(17, 24, 39, 0.06);
    }
    .eyebrow {
      margin: 0 0 0.35rem;
      font-size: 0.72rem;
      font-weight: 850;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--primary);
    }
    .portfolio-header h1 { margin: 0; font-size: 1.9rem; color: var(--text-primary); }
    .page-subtitle { margin: 0.45rem 0 0; color: var(--text-secondary); }

    .summary-strip {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 0.85rem;
      margin-bottom: 1rem;
    }
    .summary-item {
      padding: 1rem;
      border: 1px solid var(--border);
      border-radius: 16px;
      background: #fff;
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }
    .summary-value { font-size: 1.45rem; font-weight: 850; color: var(--text-primary); }
    .summary-label { font-size: 0.74rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.07em; }

    .filter-bar {
      display: grid;
      grid-template-columns: minmax(260px, 1fr) 180px 180px auto;
      gap: 0.75rem;
      align-items: center;
      margin-bottom: 1rem;
      padding: 0.8rem;
      border: 1px solid var(--border);
      border-radius: 16px;
      background: rgba(255,255,255,0.72);
      backdrop-filter: blur(16px);
    }
    .search-wrapper { position: relative; min-width: 0; }
    .search-icon { position: absolute; left: 13px; top: 50%; transform: translateY(-50%); color: var(--text-secondary); font-weight: 900; }
    .search-input { width: 100%; padding-left: 2.15rem; box-sizing: border-box; }
    .filter-select { width: 100%; }
    .view-toggle { display: flex; padding: 0.2rem; border: 1px solid var(--border); border-radius: 12px; background: #fff; }
    .toggle-btn {
      border: 0;
      background: transparent;
      color: var(--text-secondary);
      padding: 0.52rem 0.72rem;
      border-radius: 9px;
      cursor: pointer;
      font-weight: 800;
      font-size: 0.8rem;
    }
    .toggle-btn.active { background: #111827; color: #fff; }

    .projects-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(310px, 1fr)); gap: 1rem; }
    .project-card {
      cursor: pointer;
      padding: 1.05rem;
      display: flex;
      flex-direction: column;
      gap: 0.9rem;
      min-height: 256px;
      border-left: 4px solid transparent;
      transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
    }
    .project-card:hover { transform: translateY(-3px); box-shadow: 0 18px 42px rgba(17,24,39,0.1); }
    .crit-border-low { border-left-color: #16a34a; }
    .crit-border-medium { border-left-color: #f59e0b; }
    .crit-border-high { border-left-color: #f97316; }
    .crit-border-critical { border-left-color: #ef4444; }

    .card-top, .budget-labels, .card-footer { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; }
    .code-badge {
      padding: 0.22rem 0.55rem;
      border-radius: 999px;
      background: var(--bg);
      color: var(--text-secondary);
      font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
      font-size: 0.74rem;
      font-weight: 800;
    }
    .project-main { min-height: 76px; }
    .project-main h2 { margin: 0; font-size: 1.05rem; line-height: 1.35; color: var(--text-primary); }
    .project-main p {
      margin: 0.42rem 0 0;
      color: var(--text-secondary);
      line-height: 1.55;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .badges-row { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
    .crit-badge { font-size: 0.76rem; font-weight: 800; }
    .crit-text-low { color: #15803d; }
    .crit-text-medium { color: #b45309; }
    .crit-text-high { color: #c2410c; }
    .crit-text-critical { color: #b91c1c; }
    .budget-section { display: flex; flex-direction: column; gap: 0.42rem; }
    .budget-labels { color: var(--text-secondary); font-size: 0.78rem; }
    .budget-labels strong { color: var(--text-primary); }
    .budget-bar { height: 8px; background: #eef2f7; border-radius: 999px; overflow: hidden; }
    .budget-fill { height: 100%; border-radius: inherit; background: linear-gradient(90deg, #16a34a, #65a30d); transition: width 0.35s ease; }
    .budget-warn { background: linear-gradient(90deg, #f59e0b, #f97316) !important; }
    .budget-danger { background: linear-gradient(90deg, #dc2626, #f97316) !important; }
    .card-footer { padding-top: 0.75rem; border-top: 1px solid var(--border); color: var(--text-secondary); font-size: 0.83rem; }
    .days-badge { font-weight: 850; color: var(--text-primary); }
    .days-overdue { color: var(--danger) !important; }

    .project-row { cursor: pointer; }
    .project-name-cell { display: flex; flex-direction: column; gap: 0.15rem; }
    .proj-name { color: var(--text-primary); font-weight: 800; }
    .proj-code { color: var(--text-secondary); font-size: 0.74rem; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; }
    .table-card { overflow: hidden; padding: 0; }
    .empty-row { text-align: center; padding: 2rem; color: var(--text-secondary); }
    .empty-state { text-align: center; padding: 3rem 1.5rem; color: var(--text-secondary); }
    .empty-state h3 { margin: 0 0 0.4rem; color: var(--text-primary); }
    .empty-state p { margin: 0 0 1rem; }
    .skeleton-row { display: flex; gap: 8px; margin-top: 14px; }

    .pagination { display: flex; justify-content: center; align-items: center; gap: 1rem; margin-top: 1.25rem; }
    .page-info { color: var(--text-secondary); font-size: 0.86rem; font-weight: 700; }

    @media (max-width: 980px) {
      .filter-bar { grid-template-columns: 1fr 1fr; }
      .view-toggle { justify-content: stretch; }
      .toggle-btn { flex: 1; }
      .summary-strip { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 680px) {
      .portfolio-header { align-items: flex-start; flex-direction: column; }
      .portfolio-header h1 { font-size: 1.55rem; }
      .filter-bar, .summary-strip { grid-template-columns: 1fr; }
      .projects-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class ProjectListComponent implements OnInit {
  private readonly projectService = inject(ProjectService);
  private readonly router = inject(Router);

  loading = signal(true);
  allProjects = signal<Project[]>([]);
  projects = signal<Project[]>([]);
  viewMode = signal<'grid' | 'list'>('grid');
  showCreateDialog = signal(false);
  searchQuery = signal('');
  statusFilter = signal('');
  criticalityFilter = signal('');
  currentPage = signal(0);
  totalPages = signal(1);
  totalCount = signal(0);

  activeCount = computed(() => this.projects().filter(project => project.status === 'IN_PROGRESS').length);
  riskCount = computed(() => this.projects().filter(project =>
    project.currentMeteoState === 'NUAGE_CHARGE' || project.currentMeteoState === 'ORAGE' ||
    project.criticality === 'HIGH' || project.criticality === 'CRITICAL'
  ).length);
  overdueCount = computed(() => this.projects().filter(project => (project.daysRemaining || 0) < 0).length);

  ngOnInit(): void { this.loadProjects(); }

  loadProjects(): void {
    this.loading.set(true);
    const params: any = { page: this.currentPage(), size: 20 };
    if (this.statusFilter()) params.status = this.statusFilter();
    if (this.searchQuery()) params.search = this.searchQuery();
    if (this.criticalityFilter()) params.criticality = this.criticalityFilter();

    this.projectService.getProjects(params).subscribe({
      next: (res: any) => {
        const list: Project[] = res?.content ?? (Array.isArray(res) ? res : []);
        this.allProjects.set(list);
        this.projects.set(list);
        this.totalCount.set(res?.totalElements ?? list.length);
        this.totalPages.set(res?.totalPages ?? 1);
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); }
    });
  }

  applyFilters(): void { this.currentPage.set(0); this.loadProjects(); }
  changePage(page: number): void { this.currentPage.set(page); this.loadProjects(); }
  navigateToProject(id: string): void { this.router.navigate(['/app/projects', id]); }

  onDialogClose(created: boolean): void {
    this.showCreateDialog.set(false);
    if (created) this.loadProjects();
  }

  getBudgetPct(p: Project): number {
    if (!p.budgetTotal || p.budgetTotal === 0) return 0;
    return Math.round((p.budgetConsumed / p.budgetTotal) * 100);
  }

  getBudgetBarWidth(p: Project): number {
    return Math.min(this.getBudgetPct(p), 100);
  }

  formatDays(days?: number | null): string {
    if (days == null) return 'No date';
    return days >= 0 ? `${days} days` : 'Overdue';
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = { PREPARATION: 'Planning', IN_PROGRESS: 'In progress', PAUSED: 'Paused', COMPLETED: 'Completed', CANCELLED: 'Cancelled', ARCHIVED: 'Archived' };
    return map[status] ?? status;
  }

  getCritLabel(crit: string): string {
    const map: Record<string, string> = { LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High', CRITICAL: 'Critical' };
    return map[crit] ?? crit;
  }

  getMeteoClass(meteo?: string | null): string {
    const map: Record<string, string> = { SOLEIL: 'meteo-badge-soleil', NUAGE_CLAIR: 'meteo-badge-nuage-clair', NUAGE_CHARGE: 'meteo-badge-nuage-charge', ORAGE: 'meteo-badge-orage' };
    return map[meteo ?? ''] ?? '';
  }

  getMeteoLabel(meteo?: string | null): string {
    const map: Record<string, string> = { SOLEIL: 'Healthy', NUAGE_CLAIR: 'Watch', NUAGE_CHARGE: 'At risk', ORAGE: 'Critical' };
    return map[meteo ?? ''] ?? 'Unknown';
  }
}
