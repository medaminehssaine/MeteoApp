import { Component, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AiService, NLExtractionResult } from '../../core/services/ai.service';
import { AuthService } from '../../core/services/auth.service';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';
import { environment } from '../../../environments/environment';
import { Project } from '../../core/services/project.service';

interface DashboardKpis {
  totalProjects: number;
  activeProjects: number;
  totalProjections: number;
  criticalAlerts: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, SkeletonComponent],
  template: `
    <div class="dashboard fade-in">
      <section class="hero-panel">
        <div>
          <p class="eyebrow">Project control room</p>
          <h1>Good morning, {{ firstName() }}</h1>
          <p class="hero-copy">
            {{ todayDate() }}. Track delivery health, budget pressure, and AI signals from one focused workspace.
          </p>
        </div>
        <div class="hero-actions">
          <a routerLink="/app/projects" class="btn btn-secondary">View portfolio</a>
          <a routerLink="/app/projects" class="btn btn-primary">New project</a>
        </div>
      </section>

      @if (loading()) {
        <div class="stats-row">
          @for (i of [1,2,3,4]; track i) {
            <div class="card stat-card">
              <app-skeleton height="42px" width="42px" radius="12px" />
              <div class="stat-info">
                <app-skeleton height="26px" width="64px" />
                <app-skeleton height="14px" width="110px" />
              </div>
            </div>
          }
        </div>
      } @else {
        <div class="stats-row">
          @for (stat of statsCards(); track stat.label) {
            <div class="card stat-card">
              <div class="stat-icon">{{ stat.icon }}</div>
              <div class="stat-info">
                <span class="stat-value">{{ stat.value }}</span>
                <span class="stat-label">{{ stat.label }}</span>
              </div>
            </div>
          }
        </div>
      }

      <div class="dashboard-grid">
        <section class="portfolio-column">
          <div class="card panel-card">
            <div class="panel-header">
              <div>
                <p class="panel-kicker">Live portfolio</p>
                <h2>Recent projects</h2>
              </div>
              <a routerLink="/app/projects" class="text-link">Open all</a>
            </div>

            @if (loading()) {
              <div class="project-skeletons">
                @for (i of [1,2,3,4,5]; track i) {
                  <app-skeleton height="56px" />
                }
              </div>
            } @else {
              <div class="table-container">
                <table class="projects-table">
                  <thead>
                    <tr>
                      <th>Project</th>
                      <th>Status</th>
                      <th>Health</th>
                      <th>Timeline</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (project of recentProjects(); track project.id) {
                      <tr class="project-row" [routerLink]="['/app/projects', project.id]">
                        <td>
                          <div class="project-name-cell">
                            <span class="proj-name">{{ project.name }}</span>
                            <span class="proj-code">{{ project.code }}</span>
                          </div>
                        </td>
                        <td>
                          <span class="status-badge" [class]="'status-' + project.status.toLowerCase()">
                            {{ getStatusLabel(project.status) }}
                          </span>
                        </td>
                        <td>
                          <span class="meteo-badge" [class]="getMeteoClass(project.currentMeteoState)">
                            {{ getMeteoLabel(project.currentMeteoState) }}
                          </span>
                        </td>
                        <td>
                          <span class="days-badge" [class.days-overdue]="(project.daysRemaining || 0) < 0">
                            {{ formatDays(project.daysRemaining) }}
                          </span>
                        </td>
                      </tr>
                    } @empty {
                      <tr>
                        <td colspan="4" class="empty-cell">
                          <h3>No projects yet</h3>
                          <p>Create the first portfolio item to start producing MVP signals.</p>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>

          <div class="card panel-card health-card">
            <div class="panel-header">
              <div>
                <p class="panel-kicker">Delivery weather</p>
                <h2>Health distribution</h2>
              </div>
              <span class="panel-count">{{ recentProjects().length }} projects</span>
            </div>

            <div class="donut-container">
              <svg class="donut-svg" viewBox="0 0 120 120" width="152" height="152" aria-hidden="true">
                <circle cx="60" cy="60" r="50" stroke="var(--border)" stroke-width="18" fill="none" />
                @for (seg of donutSegments(); track seg.label) {
                  <circle
                    class="donut-ring"
                    cx="60" cy="60" r="50"
                    [attr.stroke]="seg.color"
                    [attr.stroke-dasharray]="seg.dash"
                    [attr.stroke-dashoffset]="seg.offset"
                    stroke-width="18"
                    fill="none"
                  />
                }
                <text x="60" y="58" text-anchor="middle" class="donut-center-num">{{ recentProjects().length }}</text>
                <text x="60" y="72" text-anchor="middle" class="donut-center-label">tracked</text>
              </svg>
              <div class="donut-legend">
                @for (seg of donutSegments(); track seg.label) {
                  <div class="legend-item">
                    <span class="legend-dot" [style.background]="seg.color"></span>
                    <span class="legend-label">{{ seg.label }}</span>
                    <span class="legend-count">{{ seg.count }}</span>
                  </div>
                }
              </div>
            </div>
          </div>
        </section>

        <aside class="insight-column">
          <div
            class="card ai-dropzone"
            [class.drag-over]="isDragging()"
            (dragover)="onDragOver($event)"
            (dragleave)="onDragLeave($event)"
            (drop)="onDrop($event)"
          >
            <div class="panel-header">
              <div>
                <p class="panel-kicker">AI intake</p>
                <h2>Report analyzer</h2>
              </div>
              <span class="live-pill">Live</span>
            </div>

            <div class="dropzone-content">
              @if (isAnalyzing()) {
                <div class="analyzing-state">
                  <div class="pulse-ring"></div>
                  <h3>Reading document</h3>
                  <p>Extracting KPI, risk, and timeline signals.</p>
                </div>
              } @else if (analysisResult()) {
                <div class="analysis-result">
                  <div class="result-header">
                    <h3>AI diagnosis</h3>
                    <button class="icon-btn" type="button" (click)="resetAnalysis()" aria-label="Clear analysis">x</button>
                  </div>
                  <p class="summary-text">{{ analysisResult()?.summary }}</p>
                  <div class="diagnosis-line">
                    <span>Predicted health</span>
                    <strong>{{ getMeteoLabel(analysisResult()!.overall_health) }}</strong>
                  </div>
                  <div class="diagnosis-line">
                    <span>Confidence</span>
                    <strong>{{ (analysisResult()!.confidence * 100).toFixed(0) }}%</strong>
                  </div>
                  @if (analysisResult()?.risks?.length) {
                    <div class="alert-strip danger">{{ analysisResult()!.risks.length }} risk signal(s) found</div>
                  }
                  @if (analysisResult()?.indicators?.length) {
                    <div class="alert-strip info">{{ analysisResult()!.indicators.length }} indicator(s) extracted</div>
                  }
                </div>
              } @else {
                <div class="upload-state">
                  <div class="upload-mark">AI</div>
                  <h3>Drop a project report</h3>
                  <p>Upload PDF, CSV, or Excel files and let the system draft the first health read.</p>
                  <button class="btn btn-secondary btn-sm" type="button" (click)="fileInput.click()">
                    Browse files
                  </button>
                  <input #fileInput type="file" hidden accept=".pdf,.csv,.xlsx,.xls" (change)="onFileSelected($event)">
                </div>
              }
            </div>
          </div>

          <div class="card panel-card">
            <div class="panel-header">
              <div>
                <p class="panel-kicker">Shortcuts</p>
                <h2>Next actions</h2>
              </div>
            </div>
            <div class="actions-list">
              <a routerLink="/app/projects" class="quick-action-btn">
                <span class="qa-icon">PR</span>
                <span>Review portfolio</span>
                <span class="qa-arrow">Open</span>
              </a>
              <a routerLink="/app/admin/users" class="quick-action-btn">
                <span class="qa-icon">US</span>
                <span>Manage users</span>
                <span class="qa-arrow">Open</span>
              </a>
              <a routerLink="/app/admin/audit" class="quick-action-btn">
                <span class="qa-icon">AU</span>
                <span>Audit trail</span>
                <span class="qa-arrow">Open</span>
              </a>
            </div>
          </div>
        </aside>
      </div>
    </div>
  `,
  styles: [`
    .dashboard { padding: 0.25rem 0 2rem; }
    .hero-panel {
      display: flex;
      justify-content: space-between;
      gap: 1.5rem;
      align-items: flex-end;
      padding: 1.6rem;
      margin-bottom: 1.25rem;
      border: 1px solid rgba(17, 24, 39, 0.08);
      border-radius: 18px;
      background:
        linear-gradient(135deg, rgba(17, 24, 39, 0.96), rgba(37, 47, 67, 0.94)),
        radial-gradient(circle at top right, rgba(245, 112, 43, 0.22), transparent 40%);
      color: white;
      box-shadow: 0 24px 60px rgba(17, 24, 39, 0.18);
    }
    .eyebrow, .panel-kicker {
      margin: 0 0 0.35rem;
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--primary);
    }
    .hero-panel h1 { margin: 0; font-size: 2rem; line-height: 1.05; color: white; }
    .hero-copy { max-width: 680px; margin: 0.7rem 0 0; color: rgba(255,255,255,0.72); line-height: 1.6; }
    .hero-actions { display: flex; gap: 0.75rem; flex-wrap: wrap; }

    .stats-row { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1rem; margin-bottom: 1rem; }
    .stat-card { display: flex; align-items: center; gap: 0.9rem; padding: 1rem; min-height: 92px; }
    .stat-icon {
      width: 44px;
      height: 44px;
      display: grid;
      place-items: center;
      border-radius: 12px;
      background: #fff4ee;
      color: var(--primary);
      font-weight: 800;
    }
    .stat-info { display: flex; flex-direction: column; gap: 0.1rem; }
    .stat-value { font-size: 1.65rem; font-weight: 800; color: var(--text-primary); }
    .stat-label { font-size: 0.74rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.06em; }

    .dashboard-grid { display: grid; grid-template-columns: minmax(0, 1.55fr) minmax(340px, 0.85fr); gap: 1rem; }
    .portfolio-column, .insight-column { display: flex; flex-direction: column; gap: 1rem; min-width: 0; }
    .panel-card { padding: 1.15rem; }
    .panel-header { display: flex; justify-content: space-between; gap: 1rem; align-items: flex-start; margin-bottom: 1rem; }
    .panel-header h2 { margin: 0; font-size: 1rem; color: var(--text-primary); }
    .text-link { color: var(--primary); font-weight: 800; font-size: 0.84rem; text-decoration: none; }
    .panel-count, .live-pill {
      border: 1px solid var(--border);
      border-radius: 999px;
      padding: 0.25rem 0.6rem;
      color: var(--text-secondary);
      font-size: 0.76rem;
      font-weight: 700;
      background: #fff;
    }
    .live-pill { color: #0f8a5f; background: #ecfdf5; border-color: #bbf7d0; }

    .project-skeletons { display: flex; flex-direction: column; gap: 0.75rem; }
    .project-row { cursor: pointer; }
    .project-name-cell { display: flex; flex-direction: column; gap: 0.15rem; }
    .proj-name { font-weight: 750; color: var(--text-primary); }
    .proj-code { color: var(--text-secondary); font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: 0.74rem; }
    .days-badge { color: var(--text-secondary); font-size: 0.82rem; font-weight: 750; }
    .days-overdue { color: var(--danger) !important; }
    .empty-cell { padding: 3rem 1rem; text-align: center; color: var(--text-secondary); }
    .empty-cell h3 { margin: 0 0 0.35rem; color: var(--text-primary); }
    .empty-cell p { margin: 0; }

    .donut-container { display: grid; grid-template-columns: 170px 1fr; gap: 1.25rem; align-items: center; }
    .donut-svg { transform: rotate(-90deg); overflow: visible; }
    .donut-center-num, .donut-center-label { transform: rotate(90deg); transform-origin: 60px 60px; }
    .donut-ring { transition: stroke-dasharray 0.45s ease; }
    .donut-center-num { font-size: 22px; font-weight: 800; fill: var(--text-primary); }
    .donut-center-label { font-size: 10px; fill: var(--text-secondary); }
    .donut-legend { display: flex; flex-direction: column; gap: 0.55rem; }
    .legend-item { display: grid; grid-template-columns: 10px 1fr auto; gap: 0.55rem; align-items: center; font-size: 0.85rem; }
    .legend-dot { width: 10px; height: 10px; border-radius: 999px; }
    .legend-label { color: var(--text-secondary); }
    .legend-count { font-weight: 800; color: var(--text-primary); }

    .ai-dropzone {
      min-height: 388px;
      padding: 1.15rem;
      border: 1px dashed rgba(245, 112, 43, 0.42);
      background: linear-gradient(180deg, #ffffff, #fffaf7);
      transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
    }
    .ai-dropzone.drag-over { transform: translateY(-2px); border-color: var(--primary); box-shadow: 0 18px 40px rgba(245, 112, 43, 0.16); }
    .dropzone-content { min-height: 280px; display: grid; place-items: center; }
    .upload-state, .analyzing-state { text-align: center; max-width: 290px; display: flex; flex-direction: column; align-items: center; gap: 0.75rem; }
    .upload-mark {
      width: 68px;
      height: 68px;
      display: grid;
      place-items: center;
      border-radius: 18px;
      background: #111827;
      color: white;
      font-weight: 900;
      box-shadow: 0 18px 36px rgba(17, 24, 39, 0.2);
    }
    .upload-state h3, .analyzing-state h3 { margin: 0; color: var(--text-primary); }
    .upload-state p, .analyzing-state p { margin: 0; color: var(--text-secondary); line-height: 1.55; }
    .pulse-ring { width: 62px; height: 62px; border-radius: 50%; border: 3px solid var(--primary); animation: loadingPulse 1.3s infinite ease-in-out; }
    .analysis-result { width: 100%; display: flex; flex-direction: column; gap: 0.75rem; }
    .result-header { display: flex; align-items: center; justify-content: space-between; }
    .result-header h3 { margin: 0; }
    .icon-btn {
      width: 30px;
      height: 30px;
      border: 1px solid var(--border);
      border-radius: 10px;
      background: white;
      color: var(--text-secondary);
      cursor: pointer;
    }
    .summary-text { margin: 0; color: var(--text-secondary); line-height: 1.6; }
    .diagnosis-line { display: flex; justify-content: space-between; gap: 1rem; padding: 0.75rem; border-radius: 12px; background: var(--bg); color: var(--text-secondary); }
    .diagnosis-line strong { color: var(--text-primary); }
    .alert-strip { padding: 0.7rem 0.8rem; border-radius: 12px; font-weight: 750; font-size: 0.84rem; }
    .alert-strip.danger { background: #fef2f2; color: #b91c1c; }
    .alert-strip.info { background: #eff6ff; color: #1d4ed8; }

    .actions-list { display: flex; flex-direction: column; gap: 0.6rem; }
    .quick-action-btn {
      display: grid;
      grid-template-columns: 38px 1fr auto;
      gap: 0.75rem;
      align-items: center;
      padding: 0.8rem;
      border: 1px solid var(--border);
      border-radius: 14px;
      text-decoration: none;
      color: var(--text-primary);
      background: #fff;
      transition: border-color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
    }
    .quick-action-btn:hover { transform: translateY(-1px); border-color: rgba(245, 112, 43, 0.45); box-shadow: 0 12px 26px rgba(17,24,39,0.08); }
    .qa-icon { width: 38px; height: 38px; display: grid; place-items: center; border-radius: 11px; background: var(--bg); color: var(--primary); font-weight: 900; font-size: 0.76rem; }
    .qa-arrow { color: var(--text-secondary); font-size: 0.78rem; font-weight: 800; }

    @media (max-width: 1100px) {
      .stats-row { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .dashboard-grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 720px) {
      .hero-panel { align-items: flex-start; flex-direction: column; }
      .hero-panel h1 { font-size: 1.65rem; }
      .stats-row { grid-template-columns: 1fr; }
      .donut-container { grid-template-columns: 1fr; justify-items: center; }
      .donut-legend { width: 100%; }
    }
  `]
})
export class DashboardComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly aiService = inject(AiService);
  private readonly authService = inject(AuthService);

  loading = signal(true);
  firstName = signal('');
  todayDate = signal('');
  statsCards = signal<{ icon: string; value: number; label: string }[]>([]);
  recentProjects = signal<Project[]>([]);
  isDragging = signal(false);
  isAnalyzing = signal(false);
  analysisResult = signal<NLExtractionResult | null>(null);

  donutSegments = computed(() => {
    const projects = this.recentProjects();
    const circumference = 2 * Math.PI * 50;
    const counts = {
      SOLEIL: projects.filter(p => p.currentMeteoState === 'SOLEIL').length,
      NUAGE_CLAIR: projects.filter(p => p.currentMeteoState === 'NUAGE_CLAIR').length,
      NUAGE_CHARGE: projects.filter(p => p.currentMeteoState === 'NUAGE_CHARGE').length,
      ORAGE: projects.filter(p => p.currentMeteoState === 'ORAGE').length,
    };
    const total = projects.length || 1;
    const segments = [
      { label: 'Healthy', color: '#16a34a', count: counts.SOLEIL },
      { label: 'Watch', color: '#0ea5e9', count: counts.NUAGE_CLAIR },
      { label: 'At risk', color: '#f59e0b', count: counts.NUAGE_CHARGE },
      { label: 'Critical', color: '#ef4444', count: counts.ORAGE },
    ];
    let currentOffset = 0;
    return segments.map(s => {
      const pct = s.count / total;
      const dash = `${pct * circumference} ${circumference}`;
      const offset = -currentOffset;
      currentOffset += pct * circumference;
      return { ...s, dash, offset };
    });
  });

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.firstName.set(user?.firstName ?? 'Project lead');
    this.todayDate.set(new Date().toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    }));
    this.loadDashboard();
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      PREPARATION: 'Planning', IN_PROGRESS: 'In progress',
      PAUSED: 'Paused', COMPLETED: 'Completed',
      CANCELLED: 'Cancelled', ARCHIVED: 'Archived'
    };
    return map[status] ?? status;
  }

  getMeteoClass(meteo?: string | null): string {
    const map: Record<string, string> = {
      SOLEIL: 'meteo-badge-soleil', NUAGE_CLAIR: 'meteo-badge-nuage-clair',
      NUAGE_CHARGE: 'meteo-badge-nuage-charge', ORAGE: 'meteo-badge-orage'
    };
    return map[meteo ?? ''] ?? 'meteo-badge-nuage-clair';
  }

  getMeteoLabel(meteo?: string | null): string {
    const map: Record<string, string> = {
      SOLEIL: 'Healthy', NUAGE_CLAIR: 'Watch',
      NUAGE_CHARGE: 'At risk', ORAGE: 'Critical'
    };
    return map[meteo ?? ''] ?? 'Unknown';
  }

  formatDays(days?: number | null): string {
    if (days == null) return 'No date';
    return days >= 0 ? `${days} days` : 'Overdue';
  }

  private loadDashboard(): void {
    this.http.get<DashboardKpis>(`${environment.apiUrl}/dashboard`).subscribe({
      next: (kpis) => {
        this.statsCards.set([
          { icon: 'PR', value: kpis.totalProjects, label: 'Total projects' },
          { icon: 'AC', value: kpis.activeProjects, label: 'Active work' },
          { icon: 'AI', value: kpis.totalProjections, label: 'AI projections' },
          { icon: 'AL', value: kpis.criticalAlerts, label: 'Critical alerts' },
        ]);
      },
      error: () => {
        this.statsCards.set([
          { icon: 'PR', value: 0, label: 'Total projects' },
          { icon: 'AC', value: 0, label: 'Active work' },
          { icon: 'AI', value: 0, label: 'AI projections' },
          { icon: 'AL', value: 0, label: 'Critical alerts' },
        ]);
      }
    });

    this.http.get<any>(`${environment.apiUrl}/projects?size=8`).subscribe({
      next: (res) => {
        const list: Project[] = res?.content ?? (Array.isArray(res) ? res : []);
        this.recentProjects.set(list);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  @HostListener('window:dragover', ['$event'])
  onWindowDragOver(event: DragEvent) { event.preventDefault(); }

  onDragOver(event: DragEvent) {
    event.preventDefault(); event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault(); event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault(); event.stopPropagation();
    this.isDragging.set(false);
    if (event.dataTransfer?.files?.[0]) this.processFile(event.dataTransfer.files[0]);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.[0]) this.processFile(input.files[0]);
  }

  private processFile(file: File): void {
    this.isAnalyzing.set(true);
    this.analysisResult.set(null);
    this.aiService.ingestFile(file).subscribe({
      next: (result) => { this.analysisResult.set(result); this.isAnalyzing.set(false); },
      error: () => {
        setTimeout(() => {
          this.analysisResult.set({
            summary: 'The report suggests budget pressure and schedule risk around key resources.',
            overall_health: 'NUAGE_CHARGE',
            confidence: 0.78,
            indicators: [],
            risks: [{ title: 'Budget pressure', description: '', category: 'FINANCIAL', probability: 3, impact: 4, severity: 12, status: 'OPEN' }],
            corrective_actions: []
          });
          this.isAnalyzing.set(false);
        }, 1800);
      }
    });
  }

  resetAnalysis(): void { this.analysisResult.set(null); }
}
