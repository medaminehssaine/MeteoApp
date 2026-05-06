import { Component, OnInit, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';
import { ProjectService, Project } from '../../core/services/project.service';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet, SkeletonComponent],
  template: `
    <div class="project-detail fade-in">
      @if (loading()) {
        <section class="detail-hero card">
          <app-skeleton height="16px" width="140px" />
          <div class="loading-title">
            <app-skeleton height="56px" width="56px" radius="14px" />
            <div class="loading-copy">
              <app-skeleton height="30px" width="50%" />
              <app-skeleton height="16px" width="34%" />
            </div>
          </div>
        </section>
      } @else if (project()) {
        <section class="detail-hero">
          <a class="back-link" routerLink="/app/projects">Back to portfolio</a>

          <div class="hero-main">
            <div class="health-mark" [class]="getMeteoClass(project()!.currentMeteoState)">
              {{ getMeteoShort(project()!.currentMeteoState) }}
            </div>
            <div class="title-stack">
              <div class="title-line">
                <h1>{{ project()!.name }}</h1>
                <span class="status-badge" [class]="'status-' + project()!.status.toLowerCase()">
                  {{ getStatusLabel(project()!.status) }}
                </span>
              </div>
              <p>{{ project()!.shortDescription || 'No executive summary has been added for this project yet.' }}</p>
              <div class="meta-chips">
                <span>{{ project()!.code }}</span>
                <span>{{ getCritLabel(project()!.criticality) }} criticality</span>
                <span>{{ formatDays(project()!.daysRemaining) }}</span>
              </div>
            </div>
          </div>

          <div class="hero-grid">
            <div class="hero-metric">
              <span class="metric-label">Owner</span>
              <strong>{{ project()!.chefName || 'Unassigned' }}</strong>
            </div>
            <div class="hero-metric">
              <span class="metric-label">Sponsor</span>
              <strong>{{ project()!.sponsorName || 'Unassigned' }}</strong>
            </div>
            <div class="hero-metric">
              <span class="metric-label">Start</span>
              <strong>{{ project()!.startDate | date:'MMM d, y' }}</strong>
            </div>
            <div class="hero-metric">
              <span class="metric-label">End</span>
              <strong>{{ project()!.endDate | date:'MMM d, y' }}</strong>
            </div>
            <div class="hero-metric">
              <span class="metric-label">Team</span>
              <strong>{{ project()!.memberCount || 0 }} members</strong>
            </div>
            <div class="hero-metric">
              <span class="metric-label">Budget</span>
              <strong>{{ project()!.budgetTotal ? (project()!.budgetTotal | number:'1.0-0') + ' MAD' : 'Not set' }}</strong>
            </div>
          </div>

          @if (project()!.budgetTotal > 0) {
            <div class="budget-strip">
              <div class="budget-head">
                <span>Budget consumed</span>
                <strong [class.text-danger]="getBudgetPct() > 100">{{ getBudgetPct() }}%</strong>
              </div>
              <div class="progress-bar">
                <div class="progress-fill"
                     [style.width.%]="getBudgetBarWidth()"
                     [class.budget-warn]="getBudgetPct() > 80"
                     [class.budget-danger]="getBudgetPct() > 100">
                </div>
              </div>
            </div>
          }
        </section>

        <nav class="tab-nav" aria-label="Project sections">
          @for (tab of tabs; track tab.path) {
            <a class="tab-link"
               [routerLink]="['/app/projects', project()!.id, tab.path]"
               routerLinkActive="active">
              <span class="tab-icon">{{ tab.icon }}</span>
              {{ tab.label }}
            </a>
          }
        </nav>

        <section class="tab-content">
          <router-outlet />
        </section>
      } @else {
        <div class="error-state card">
          <h3>Project not found</h3>
          <p>The requested project could not be loaded.</p>
          <button class="btn btn-secondary" routerLink="/app/projects">Back to portfolio</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .project-detail { max-width: 1240px; padding-bottom: 2rem; }
    .detail-hero {
      padding: 1.35rem;
      margin-bottom: 1rem;
      border: 1px solid var(--border);
      border-radius: 18px;
      background:
        linear-gradient(180deg, #ffffff, #fbfcff),
        radial-gradient(circle at top right, rgba(245,112,43,0.12), transparent 42%);
      box-shadow: 0 16px 38px rgba(17, 24, 39, 0.07);
    }
    .back-link {
      display: inline-flex;
      color: var(--text-secondary);
      text-decoration: none;
      font-size: 0.82rem;
      font-weight: 800;
      margin-bottom: 1rem;
    }
    .back-link:hover { color: var(--primary); }
    .hero-main { display: flex; gap: 1rem; align-items: flex-start; margin-bottom: 1.2rem; }
    .health-mark {
      width: 64px;
      height: 64px;
      display: grid;
      place-items: center;
      border-radius: 18px;
      font-weight: 900;
      letter-spacing: 0.04em;
      flex: 0 0 auto;
      border: 1px solid var(--border);
    }
    .title-stack { min-width: 0; flex: 1; }
    .title-line { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
    .title-line h1 { margin: 0; font-size: 1.85rem; line-height: 1.16; color: var(--text-primary); }
    .title-stack p { margin: 0.55rem 0 0; color: var(--text-secondary); line-height: 1.6; max-width: 860px; }
    .meta-chips { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.85rem; }
    .meta-chips span {
      padding: 0.34rem 0.62rem;
      border: 1px solid var(--border);
      border-radius: 999px;
      background: #fff;
      color: var(--text-secondary);
      font-size: 0.78rem;
      font-weight: 800;
    }
    .hero-grid {
      display: grid;
      grid-template-columns: repeat(6, minmax(0, 1fr));
      gap: 0.7rem;
      margin-top: 1rem;
    }
    .hero-metric {
      min-width: 0;
      padding: 0.85rem;
      border: 1px solid var(--border);
      border-radius: 14px;
      background: #fff;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .metric-label {
      color: var(--text-secondary);
      font-size: 0.68rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-weight: 850;
    }
    .hero-metric strong {
      color: var(--text-primary);
      font-size: 0.88rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .budget-strip { margin-top: 1rem; }
    .budget-head { display: flex; justify-content: space-between; gap: 1rem; color: var(--text-secondary); font-size: 0.82rem; font-weight: 800; margin-bottom: 0.45rem; }
    .budget-head strong { color: var(--text-primary); }
    .progress-bar { height: 9px; background: #eef2f7; border-radius: 999px; overflow: hidden; }
    .progress-fill { height: 100%; background: linear-gradient(90deg, #16a34a, #65a30d); border-radius: inherit; transition: width 0.4s ease; }
    .budget-warn { background: linear-gradient(90deg, #f59e0b, #f97316) !important; }
    .budget-danger { background: linear-gradient(90deg, #dc2626, #f97316) !important; }
    .text-danger { color: var(--danger) !important; }

    .tab-nav {
      position: sticky;
      top: 74px;
      z-index: 8;
      display: flex;
      gap: 0.25rem;
      padding: 0.35rem;
      margin-bottom: 1rem;
      border: 1px solid var(--border);
      border-radius: 16px;
      background: rgba(255,255,255,0.86);
      backdrop-filter: blur(18px);
      overflow-x: auto;
      box-shadow: 0 12px 26px rgba(17, 24, 39, 0.06);
    }
    .tab-link {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.62rem 0.86rem;
      border-radius: 12px;
      color: var(--text-secondary);
      text-decoration: none;
      font-size: 0.82rem;
      font-weight: 850;
      white-space: nowrap;
      transition: background 0.15s ease, color 0.15s ease;
    }
    .tab-link:hover { background: var(--bg); color: var(--text-primary); }
    .tab-link.active { background: #111827; color: #fff; }
    .tab-icon {
      width: 22px;
      height: 22px;
      display: grid;
      place-items: center;
      border-radius: 7px;
      background: rgba(245,112,43,0.12);
      color: var(--primary);
      font-size: 0.68rem;
    }
    .tab-link.active .tab-icon { background: rgba(255,255,255,0.14); color: #fff; }
    .tab-content { min-height: 300px; }
    .error-state { text-align: center; padding: 3rem 1.5rem; color: var(--text-secondary); }
    .error-state h3 { margin: 0 0 0.4rem; color: var(--text-primary); }
    .error-state p { margin: 0 0 1rem; }
    .loading-title { margin-top: 1.5rem; display: flex; gap: 1rem; align-items: center; }
    .loading-copy { flex: 1; display: flex; flex-direction: column; gap: 0.6rem; }

    @media (max-width: 1100px) {
      .hero-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    }
    @media (max-width: 760px) {
      .hero-main { flex-direction: column; }
      .title-line h1 { font-size: 1.45rem; }
      .hero-grid { grid-template-columns: 1fr 1fr; }
      .tab-nav { top: 62px; }
    }
    @media (max-width: 520px) {
      .hero-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class ProjectDetailComponent implements OnInit {
  private readonly projectService = inject(ProjectService);

  id = input.required<string>();

  project = signal<Project | null>(null);
  loading = signal(true);

  tabs = [
    { path: 'plan', label: 'Plan', icon: 'PL' },
    { path: 'indicators', label: 'Indicators', icon: 'IN' },
    { path: 'meteo', label: 'Health', icon: 'HE' },
    { path: 'cqd', label: 'CQD', icon: 'CQ' },
    { path: 'projections', label: 'AI projections', icon: 'AI' },
    { path: 'risks', label: 'Risks', icon: 'RI' },
    { path: 'corrective-actions', label: 'Actions', icon: 'AC' },
    { path: 'ai', label: 'Assistant', icon: 'AS' },
  ];

  ngOnInit(): void {
    this.loading.set(true);
    this.projectService.getProject(this.id()).subscribe({
      next: (project) => { this.project.set(project); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  getBudgetPct(): number {
    const p = this.project();
    if (!p || !p.budgetTotal) return 0;
    return Math.min(Math.round((p.budgetConsumed / p.budgetTotal) * 100), 999);
  }

  getBudgetBarWidth(): number {
    return Math.min(this.getBudgetPct(), 100);
  }

  formatDays(days?: number | null): string {
    if (days == null) return 'No date';
    return days >= 0 ? `${days} days left` : 'Overdue';
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      PREPARATION: 'Planning', IN_PROGRESS: 'In progress', PAUSED: 'Paused',
      COMPLETED: 'Completed', CANCELLED: 'Cancelled', ARCHIVED: 'Archived'
    };
    return map[status] ?? status;
  }

  getCritLabel(crit: string): string {
    const map: Record<string, string> = { LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High', CRITICAL: 'Critical' };
    return map[crit] ?? crit;
  }

  getMeteoShort(state?: string | null): string {
    const map: Record<string, string> = { SOLEIL: 'OK', NUAGE_CLAIR: 'WA', NUAGE_CHARGE: 'RK', ORAGE: 'CR' };
    return state ? (map[state] ?? 'NA') : 'NA';
  }

  getMeteoClass(meteo?: string | null): string {
    const map: Record<string, string> = { SOLEIL: 'meteo-badge-soleil', NUAGE_CLAIR: 'meteo-badge-nuage-clair', NUAGE_CHARGE: 'meteo-badge-nuage-charge', ORAGE: 'meteo-badge-orage' };
    return map[meteo ?? ''] ?? 'meteo-badge-nuage-clair';
  }
}
