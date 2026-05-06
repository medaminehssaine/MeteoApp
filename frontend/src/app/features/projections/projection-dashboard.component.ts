import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ProjectionService, ProjectionResult, ProjectionRequest } from '../../core/services/projection.service';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';
import { ScoreGaugeComponent } from '../../shared/components/score-gauge/score-gauge.component';

@Component({
  selector: 'app-projection-dashboard',
  standalone: true,
  imports: [CommonModule, SkeletonComponent, ScoreGaugeComponent],
  template: `
    <div class="projections-page fade-in">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h2>Projections IA</h2>
          <p class="page-sub">Analyse prédictive multicouche par Monte Carlo</p>
        </div>
        <div class="horizon-selector">
          @for (h of horizons; track h.days) {
            <button class="horizon-btn" [class.active]="selectedHorizon() === h.days"
                    (click)="setHorizon(h.days)">{{ h.label }}</button>
          }
        </div>
      </div>

      @if (loading()) {
        <div class="loading-overlay">
          <div class="loading-card">
            <div class="monte-carlo-spinner">
              <div class="spinner-ring"></div>
              <div class="spinner-ring ring2"></div>
              <div class="spinner-ring ring3"></div>
            </div>
            <p class="loading-title">Simulation Monte Carlo</p>
            <p style="color:var(--text-secondary);font-size:0.875rem">
              Calcul de {{ selectedHorizon() }} itérations probabilistes...
            </p>
          </div>
        </div>
      } @else if (projection()) {
        <!-- Main Projection Card -->
        <div class="card main-projection fade-in">
          <div class="proj-main-content">
            <div class="proj-weather">
              <div class="weather-icon-xl">{{ getMeteoIcon(projection()!.nominalScenario.projectedState) }}</div>
              <div class="proj-info">
                <span class="proj-state-label">{{ getMeteoLabel(projection()!.nominalScenario.projectedState) }}</span>
                <span class="proj-horizon">Projection à J+{{ projection()!.horizonDays }}</span>
              </div>
            </div>
            <div class="proj-gauge">
              <app-score-gauge [score]="projection()!.nominalScenario.projectedScore" [size]="110" [strokeWidth]="10" />
            </div>
            <div class="proj-meta">
              <div class="confidence-block">
                <span class="conf-pct">{{ projection()!.confidence.toFixed(0) }}%</span>
                <span class="conf-label">Confiance</span>
                <span class="conf-badge" [class]="'conf-' + projection()!.confidenceLevel.toLowerCase()">
                  {{ getConfidenceLabel(projection()!.confidenceLevel) }}
                </span>
              </div>
              <button class="btn btn-primary generate-btn" (click)="generate()" [disabled]="generating()">
                {{ generating() ? '⟳ Génération...' : '✨ Recalculer' }}
              </button>
              <p class="calc-date">Calculé le {{ formatDate(projection()!.calculatedAt) }}</p>
            </div>
          </div>
        </div>

        <!-- 3 Scenarios -->
        <div class="scenarios-row">
          <div class="card scenario-card scenario-optimistic">
            <div class="scenario-header">
              <span class="scenario-label">Optimiste</span>
              <span class="scenario-prob">{{ (projection()!.optimisticScenario.probability * 100).toFixed(0) }}%</span>
            </div>
            <div class="scenario-weather">{{ getMeteoIcon(projection()!.optimisticScenario.projectedState) }}</div>
            <div class="scenario-score">{{ projection()!.optimisticScenario.projectedScore.toFixed(0) }}/100</div>
            <div class="scenario-date">{{ formatDate(projection()!.optimisticScenario.completionDate) }}</div>
          </div>
          <div class="card scenario-card scenario-nominal">
            <div class="scenario-header">
              <span class="scenario-label">Nominal</span>
              <span class="scenario-prob">{{ (projection()!.nominalScenario.probability * 100).toFixed(0) }}%</span>
            </div>
            <div class="scenario-weather">{{ getMeteoIcon(projection()!.nominalScenario.projectedState) }}</div>
            <div class="scenario-score">{{ projection()!.nominalScenario.projectedScore.toFixed(0) }}/100</div>
            <div class="scenario-date">{{ formatDate(projection()!.nominalScenario.completionDate) }}</div>
          </div>
          <div class="card scenario-card scenario-pessimistic">
            <div class="scenario-header">
              <span class="scenario-label">Pessimiste</span>
              <span class="scenario-prob">{{ (projection()!.pessimisticScenario.probability * 100).toFixed(0) }}%</span>
            </div>
            <div class="scenario-weather">{{ getMeteoIcon(projection()!.pessimisticScenario.projectedState) }}</div>
            <div class="scenario-score">{{ projection()!.pessimisticScenario.projectedScore.toFixed(0) }}/100</div>
            <div class="scenario-date">{{ formatDate(projection()!.pessimisticScenario.completionDate) }}</div>
          </div>
        </div>

        <!-- Two column: Explanations + Layers -->
        <div class="analysis-grid">
          <!-- Explanations -->
          <div class="card">
            <h3 class="section-title">📋 Facteurs Clés</h3>
            <ul class="explanations-list">
              @for (exp of projection()!.explanations; track exp) {
                <li class="explanation-item">{{ exp }}</li>
              }
            </ul>
          </div>

          <!-- Layer Breakdown -->
          <div class="card">
            <h3 class="section-title">🏗️ Décomposition par Couche</h3>
            @for (layer of getLayerList(); track layer.name) {
              <div class="layer-row">
                <div class="layer-info">
                  <span class="layer-name">{{ layer.name }}</span>
                  <span class="layer-weight">{{ (layer.weight * 100).toFixed(0) }}%</span>
                </div>
                <div class="layer-bar-container">
                  <div class="layer-bar" [style.width.%]="layer.score" [class]="getLayerClass(layer.score)"></div>
                </div>
                <span class="layer-score">{{ layer.score.toFixed(0) }}</span>
              </div>
            }
          </div>
        </div>

        <!-- Recommendations -->
        @if (projection()!.recommendations.length) {
          <div class="card">
            <h3 class="section-title">💡 Recommandations</h3>
            <div class="reco-grid">
              @for (reco of projection()!.recommendations; track reco.action) {
                <div class="reco-card" [class]="'reco-' + reco.priority.toLowerCase()">
                  <div class="reco-header">
                    <span class="reco-priority" [class]="'priority-' + reco.priority.toLowerCase()">
                      {{ reco.priority }}
                    </span>
                    <span class="reco-category">{{ reco.category }}</span>
                  </div>
                  <p class="reco-action">{{ reco.action }}</p>
                  @if (reco.expectedImpact) {
                    <p class="reco-impact">Impact attendu: {{ reco.expectedImpact }}</p>
                  }
                </div>
              }
            </div>
          </div>
        }

      } @else {
        <!-- No projection yet -->
        <div class="card no-projection">
          <div class="no-proj-content">
            <p style="font-size:3rem">🤖</p>
            <h3>Aucune projection générée</h3>
            <p style="color:var(--text-secondary)">Générez votre première projection IA pour ce projet.</p>
            <button class="btn btn-primary" style="margin-top:1rem" (click)="generate()">
              ✨ Générer la projection
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .projections-page { max-width: 1100px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
    .page-header h2 { margin: 0 0 4px; font-size: 1.5rem; }
    .page-sub { margin: 0; font-size: 0.875rem; color: var(--text-secondary); }

    .horizon-selector { display: flex; gap: 0.5rem; background: rgba(255,255,255,0.04); border: 1px solid var(--border); border-radius: 12px; padding: 4px; }
    .horizon-btn { padding: 0.375rem 0.875rem; border: none; background: transparent; color: var(--text-secondary); cursor: pointer; border-radius: 8px; font-size: 0.875rem; font-weight: 500; transition: all 0.15s; }
    .horizon-btn.active { background: var(--primary); color: white; }
    .horizon-btn:hover:not(.active) { background: rgba(255,255,255,0.06); color: var(--text-primary); }

    /* Loading Monte Carlo */
    .loading-overlay { display: flex; justify-content: center; padding: 4rem; }
    .loading-card { text-align: center; }
    .monte-carlo-spinner { position: relative; width: 80px; height: 80px; margin: 0 auto 1.5rem; }
    .spinner-ring { position: absolute; inset: 0; border-radius: 50%; border: 2px solid transparent; border-top-color: var(--primary); animation: spin 1.2s linear infinite; }
    .ring2 { inset: 8px; border-top-color: #7DD3FC; animation-duration: 0.9s; animation-direction: reverse; }
    .ring3 { inset: 16px; border-top-color: #FCD34D; animation-duration: 0.7s; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .loading-title { font-size: 1.125rem; font-weight: 600; margin: 0 0 8px; }

    /* Main Projection Card */
    .main-projection { padding: 2rem; margin-bottom: 1.5rem; }
    .proj-main-content { display: flex; align-items: center; gap: 2.5rem; flex-wrap: wrap; }
    .proj-weather { display: flex; align-items: center; gap: 1rem; }
    .weather-icon-xl { font-size: 5rem; line-height: 1; }
    .proj-info { display: flex; flex-direction: column; gap: 4px; }
    .proj-state-label { font-size: 1.5rem; font-weight: 700; color: var(--text-primary); }
    .proj-horizon { font-size: 0.875rem; color: var(--text-secondary); }
    .proj-gauge { flex-shrink: 0; }
    .proj-meta { flex: 1; min-width: 180px; display: flex; flex-direction: column; align-items: flex-end; gap: 0.75rem; }
    .confidence-block { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
    .conf-pct { font-size: 2rem; font-weight: 700; font-family: 'Outfit', sans-serif; }
    .conf-label { font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; }
    .conf-badge { padding: 3px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; }
    .conf-very_high { background: rgba(16,185,129,0.15); color: #34D399; }
    .conf-high { background: rgba(59,130,246,0.15); color: #60A5FA; }
    .conf-medium { background: rgba(245,158,11,0.15); color: #FBBF24; }
    .conf-low { background: rgba(239,68,68,0.15); color: #F87171; }
    .generate-btn { padding: 0.625rem 1.5rem; }
    .calc-date { font-size: 0.75rem; color: var(--text-secondary); margin: 0; }

    /* Scenarios */
    .scenarios-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
    .scenario-card { padding: 1.25rem; text-align: center; border-top: 3px solid var(--border); }
    .scenario-optimistic { border-top-color: #10B981; }
    .scenario-nominal { border-top-color: #7DD3FC; }
    .scenario-pessimistic { border-top-color: #F87171; }
    .scenario-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
    .scenario-label { font-weight: 600; font-size: 0.875rem; }
    .scenario-prob { font-size: 0.75rem; color: var(--text-secondary); background: rgba(255,255,255,0.06); padding: 2px 8px; border-radius: 10px; }
    .scenario-weather { font-size: 2.5rem; margin: 0.5rem 0; }
    .scenario-score { font-size: 1.5rem; font-weight: 700; font-family: 'Outfit', sans-serif; }
    .scenario-date { font-size: 0.8125rem; color: var(--text-secondary); margin-top: 4px; }

    /* Analysis grid */
    .analysis-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem; }
    .section-title { margin: 0 0 1rem; font-size: 0.9375rem; font-weight: 600; }
    .explanations-list { margin: 0; padding-left: 1.25rem; display: flex; flex-direction: column; gap: 8px; }
    .explanation-item { font-size: 0.875rem; color: var(--text-secondary); line-height: 1.5; }

    .layer-row { display: flex; align-items: center; gap: 1rem; margin-bottom: 0.75rem; }
    .layer-info { display: flex; justify-content: space-between; min-width: 120px; font-size: 0.8125rem; }
    .layer-name { color: var(--text-secondary); }
    .layer-weight { color: var(--text-primary); font-weight: 500; }
    .layer-bar-container { flex: 1; height: 8px; background: rgba(255,255,255,0.06); border-radius: 4px; overflow: hidden; }
    .layer-bar { height: 100%; border-radius: 4px; transition: width 0.6s ease; background: var(--primary); }
    .layer-bar-good { background: #10B981 !important; }
    .layer-bar-warn { background: #F59E0B !important; }
    .layer-bar-bad  { background: #EF4444 !important; }
    .layer-score { font-size: 0.8125rem; font-weight: 600; min-width: 28px; text-align: right; }

    /* Recommendations */
    .reco-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1rem; }
    .reco-card { padding: 1rem; border-radius: 10px; background: rgba(255,255,255,0.03); border: 1px solid var(--border); }
    .reco-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
    .reco-priority { font-size: 0.75rem; font-weight: 700; padding: 2px 8px; border-radius: 10px; }
    .priority-critical { background: rgba(239,68,68,0.2); color: #F87171; }
    .priority-high { background: rgba(249,115,22,0.2); color: #FB923C; }
    .priority-medium { background: rgba(245,158,11,0.2); color: #FBBF24; }
    .priority-low { background: rgba(16,185,129,0.2); color: #34D399; }
    .reco-category { font-size: 0.75rem; color: var(--text-secondary); }
    .reco-action { font-size: 0.875rem; font-weight: 500; margin: 0 0 0.5rem; line-height: 1.4; }
    .reco-impact { font-size: 0.8125rem; color: var(--success); margin: 0; }

    .no-projection { padding: 4rem; }
    .no-proj-content { text-align: center; }
    .no-proj-content h3 { margin: 0.5rem 0; }

    @media (max-width: 900px) { .analysis-grid { grid-template-columns: 1fr; } }
    @media (max-width: 600px) { .scenarios-row { grid-template-columns: 1fr; } }
  `]
})
export class ProjectionDashboardComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly projectionService = inject(ProjectionService);

  loading = signal(false);
  generating = signal(false);
  projection = signal<ProjectionResult | null>(null);
  selectedHorizon = signal(30);
  projectId = '';

  horizons = [
    { days: 7, label: 'J+7' },
    { days: 14, label: 'J+14' },
    { days: 30, label: 'J+30' },
    { days: 60, label: 'J+60' },
    { days: 90, label: 'J+90' },
  ];

  ngOnInit(): void {
    this.projectId = this.route.parent?.snapshot.paramMap.get('id') ?? '';
    if (this.projectId) this.loadLatest();
  }

  private loadLatest(): void {
    this.loading.set(true);
    this.projectionService.getLatestProjection(this.projectId).subscribe({
      next: (p) => { this.projection.set(p); this.loading.set(false); },
      error: (err: any) => this.loading.set(false)
    });
  }

  setHorizon(days: number): void {
    this.selectedHorizon.set(days);
    this.generate();
  }

  generate(): void {
    this.loading.set(true);
    const req: ProjectionRequest = { horizonDays: this.selectedHorizon() };
    this.projectionService.generateProjection(this.projectId, req).subscribe({
      next: (p) => { this.projection.set(p); this.loading.set(false); },
      error: (err: any) => this.loading.set(false)
    });
  }

  getLayerList(): { name: string; weight: number; score: number }[] {
    const lb = this.projection()?.layerBreakdown;
    if (!lb) return [];
    return [
      { name: 'Tendance', weight: lb.trend?.weight ?? 0, score: lb.trend?.score ?? 0 },
      { name: 'Simulation', weight: lb.simulation?.weight ?? 0, score: lb.simulation?.score ?? 0 },
      { name: "Plan d'actions", weight: lb.actionPlan?.weight ?? 0, score: lb.actionPlan?.score ?? 0 },
      { name: 'Risques', weight: lb.risk?.weight ?? 0, score: lb.risk?.score ?? 0 },
      { name: 'Capacité', weight: lb.capacity?.weight ?? 0, score: lb.capacity?.score ?? 0 },
    ];
  }

  getLayerClass(score: number): string {
    if (score >= 70) return 'layer-bar-good';
    if (score >= 40) return 'layer-bar-warn';
    return 'layer-bar-bad';
  }

  getConfidenceLabel(level: string): string {
    const map: Record<string, string> = { VERY_HIGH: 'Très haute', HIGH: 'Haute', MEDIUM: 'Moyenne', LOW: 'Basse' };
    return map[level] ?? level;
  }

  getMeteoIcon(state?: string): string {
    const map: Record<string, string> = { SOLEIL: '☀️', NUAGE_CLAIR: '🌤️', NUAGE_CHARGE: '☁️', ORAGE: '⛈️' };
    return map[state ?? ''] ?? '❓';
  }

  getMeteoLabel(state?: string): string {
    const map: Record<string, string> = { SOLEIL: 'Soleil', NUAGE_CLAIR: 'Nuage Clair', NUAGE_CHARGE: 'Nuage Chargé', ORAGE: 'Orage' };
    return map[state ?? ''] ?? state ?? '—';
  }

  formatDate(date?: string): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
