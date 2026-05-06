import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { CqdService, CqdResult, CqdAxis } from '../../core/services/cqd.service';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { CqdBadgeComponent } from '../../shared/components/cqd-badge/cqd-badge.component';
import { TrendArrowComponent } from '../../shared/components/trend-arrow/trend-arrow.component';

@Component({
  selector: 'app-cqd-dashboard',
  standalone: true,
  imports: [CommonModule, LoadingSpinnerComponent, CqdBadgeComponent, TrendArrowComponent],
  template: `
    <div class="cqd-page">
      <div class="page-header">
        <h2>Triptyque CQD</h2>
        <p class="subtitle">Coût · Qualité · Délai</p>
      </div>

      @if (loading()) {
        <app-loading-spinner />
      } @else if (cqd()) {
        <!-- Triptych Cards -->
        <div class="triptych">
          <!-- COÛT -->
          <div class="cqd-card" [class]="'cqd-' + cqd()!.cost.state">
            <div class="card-icon">💰</div>
            <h3>Coût</h3>
            <app-cqd-badge [state]="cqd()!.cost.state" />
            <div class="metric-big">
              {{ cqd()!.cost.variancePct | number:'1.1-1' }}<span class="metric-unit">% écart</span>
            </div>
            <div class="metric-row">
              <span>Consommé</span>
              <span class="metric-val">{{ cqd()!.cost.budgetConsumed | number:'1.0-0' }} DHS</span>
            </div>
            <div class="metric-row">
              <span>Prévu</span>
              <span class="metric-val">{{ cqd()!.cost.budgetPlanned | number:'1.0-0' }} DHS</span>
            </div>
            <div class="trend-row">
              <app-trend-arrow [trend]="cqd()!.cost.trend" [showLabel]="true" />
            </div>
            <p class="explanation">{{ cqd()!.cost.explanation }}</p>
          </div>

          <!-- QUALITÉ -->
          <div class="cqd-card" [class]="'cqd-' + cqd()!.quality.state">
            <div class="card-icon">✅</div>
            <h3>Qualité</h3>
            <app-cqd-badge [state]="cqd()!.quality.state" />
            <div class="metric-big">
              {{ cqd()!.quality.score }}<span class="metric-unit">/100</span>
            </div>
            <div class="quality-bar">
              <div class="quality-fill" [style.width.%]="cqd()!.quality.score"></div>
            </div>
            <div class="trend-row">
              <app-trend-arrow [trend]="cqd()!.quality.trend" [showLabel]="true" />
            </div>
            <p class="explanation">{{ cqd()!.quality.explanation }}</p>
          </div>

          <!-- DÉLAI -->
          <div class="cqd-card" [class]="'cqd-' + cqd()!.delay.state">
            <div class="card-icon">⏱️</div>
            <h3>Délai</h3>
            <app-cqd-badge [state]="cqd()!.delay.state" />
            <div class="metric-big">
              {{ cqd()!.delay.variancePct | number:'1.1-1' }}<span class="metric-unit">% écart</span>
            </div>
            <div class="metric-row">
              <span>Avancement réel</span>
              <span class="metric-val">{{ cqd()!.delay.actualProgress | number:'1.1-1' }}%</span>
            </div>
            <div class="metric-row">
              <span>Avancement prévu</span>
              <span class="metric-val">{{ cqd()!.delay.plannedProgress | number:'1.1-1' }}%</span>
            </div>
            <div class="trend-row">
              <app-trend-arrow [trend]="cqd()!.delay.trend" [showLabel]="true" />
            </div>
            <p class="explanation">{{ cqd()!.delay.explanation }}</p>
          </div>
        </div>

        <!-- Overall status -->
        <div class="overall-card">
          <span class="overall-label">Calcul effectué le</span>
          <span class="overall-date">{{ cqd()!.calculationDate | date:'dd/MM/yyyy' }}</span>
        </div>
      } @else {
        <div class="empty-state">
          <p>📊 Aucune donnée CQD disponible</p>
          <p class="empty-sub">Les données CQD sont calculées automatiquement à chaque mise à jour</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .cqd-page { max-width: 1100px; }
    .page-header { margin-bottom: 28px; }
    .page-header h2 { font-size: 22px; font-weight: 700; margin: 0 0 4px; }
    .subtitle { font-size: 14px; color: #9ca3af; margin: 0; }
    .triptych { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 20px; }
    .cqd-card { background: #fff; border-radius: 16px; padding: 24px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); border-top: 4px solid #e5e7eb; }
    .cqd-ALIGNED { border-top-color: #10b981; }
    .cqd-UNDER_TENSION { border-top-color: #f59e0b; }
    .cqd-DEGRADED { border-top-color: #ef4444; }
    .card-icon { font-size: 32px; margin-bottom: 10px; }
    h3 { font-size: 18px; font-weight: 700; margin: 0 0 14px; color: #1a1a2e; }
    .metric-big { font-size: 36px; font-weight: 800; color: #1a1a2e; margin: 16px 0; line-height: 1; }
    .metric-unit { font-size: 16px; font-weight: 400; color: #9ca3af; }
    .metric-row { display: flex; justify-content: space-between; font-size: 13px; color: #6b7280; margin-bottom: 6px; }
    .metric-val { font-weight: 600; color: #374151; }
    .quality-bar { height: 8px; background: #f3f4f6; border-radius: 4px; margin: 12px 0; overflow: hidden; }
    .quality-fill { height: 100%; background: linear-gradient(to right, #ef4444, #f59e0b, #10b981); border-radius: 4px; transition: width 0.4s ease; }
    .trend-row { margin: 14px 0 10px; }
    .explanation { font-size: 12px; color: #6b7280; line-height: 1.5; margin: 12px 0 0; padding-top: 12px; border-top: 1px solid #f3f4f6; }
    .overall-card { background: #fff; border-radius: 10px; padding: 14px 20px; display: flex; gap: 12px; align-items: center; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .overall-label { font-size: 13px; color: #9ca3af; }
    .overall-date { font-size: 13px; font-weight: 600; color: #374151; }
    .empty-state { text-align: center; padding: 60px; color: #9ca3af; }
    .empty-sub { font-size: 13px; margin-top: 8px; }
    @media (max-width: 900px) { .triptych { grid-template-columns: 1fr; } }
  `]
})
export class CqdDashboardComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly cqdService = inject(CqdService);

  loading = signal(false);
  cqd = signal<any>(null);

  /** Map flat CqdResult (axes array) to the shape the template expects */
  private mapCqd(result: CqdResult): any {
    const ax = (axis: string): CqdAxis => result.axes.find(a => a.axis === axis) ?? { axis, state: 'ALIGNED', score: 0, trend: 'STABLE', details: '' } as any;
    const cost = ax('COST');
    const quality = ax('QUALITY');
    const delay = ax('DELAY');
    return {
      cost: { state: cost.state, trend: this.mapTrend(cost.trend), variancePct: 100 - cost.score, budgetConsumed: 0, budgetPlanned: 0, explanation: cost.details },
      quality: { state: quality.state, trend: this.mapTrend(quality.trend), score: quality.score, explanation: quality.details },
      delay: { state: delay.state, trend: this.mapTrend(delay.trend), variancePct: 100 - delay.score, actualProgress: 0, plannedProgress: 0, explanation: delay.details },
      calculationDate: result.calculatedAt,
    };
  }
  private mapTrend(t: string): string { return t === 'UP' ? 'IMPROVING' : t === 'DOWN' ? 'DETERIORATING' : 'STABLE'; }

  ngOnInit(): void {
    const pid = this.route.parent?.snapshot.paramMap.get('id') ?? '';
    if (pid) {
      this.loading.set(true);
      this.cqdService.getCurrentCqd(pid).subscribe({
        next: (data) => { this.cqd.set(this.mapCqd(data)); this.loading.set(false); },
        error: () => this.loading.set(false)
      });
    }
  }
}
