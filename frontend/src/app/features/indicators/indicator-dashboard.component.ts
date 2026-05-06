import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IndicatorService, ProjectIndicatorResponse } from '../../core/services/indicator.service';
import { NotificationService } from '../../core/services/notification.service';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';
import { ScoreGaugeComponent } from '../../shared/components/score-gauge/score-gauge.component';

@Component({
  selector: 'app-indicator-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, SkeletonComponent, ScoreGaugeComponent],
  template: `
    <div class="indicators-page fade-in">
      <!-- Header with global score -->
      <div class="page-header">
        <div>
          <h2>Indicateurs</h2>
          <p class="page-sub">Suivi des KPI du projet</p>
        </div>
        <div class="header-right">
          @if (globalScore() !== null) {
            <div class="global-score-card">
              <app-score-gauge [score]="globalScore()!" [size]="80" [strokeWidth]="7" />
              <div class="score-info">
                <span class="score-num">{{ globalScore() }}/100</span>
                <span class="score-label">Score Global</span>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Category tabs -->
      <div class="category-tabs">
        @for (cat of categories; track cat.value) {
          <button class="tab-btn" [class.active]="activeCategory() === cat.value"
                  (click)="activeCategory.set(cat.value)">
            {{ cat.label }}
            <span class="tab-count">{{ countByCategory(cat.value) }}</span>
          </button>
        }
      </div>

      <!-- Loading Skeletons -->
      @if (loading()) {
        <div class="indicators-grid">
          @for (i of [1,2,3,4,5,6]; track i) {
            <div class="card ind-card">
              <app-skeleton height="14px" width="40%" />
              <app-skeleton height="20px" width="70%" style="margin-top:8px" />
              <app-skeleton height="60px" style="margin-top:12px" />
            </div>
          }
        </div>
      } @else if (filteredIndicators().length === 0) {
        <div class="empty-state">
          <p style="font-size:2.5rem">📊</p>
          <p>Aucun indicateur pour cette catégorie.</p>
          <p style="font-size:0.875rem;color:var(--text-secondary)">Assignez des indicateurs depuis la bibliothèque.</p>
        </div>
      } @else {
        <div class="indicators-grid">
          @for (ind of filteredIndicators(); track ind.id) {
            <div class="card ind-card" [class]="'state-' + (ind.state ?? 'unknown').toLowerCase()">
              <!-- Top row -->
              <div class="ind-top">
                <span class="ind-code">{{ ind.indicatorCode }}</span>
                <div class="ind-state-dot" [class]="'dot-' + (ind.state ?? 'unknown').toLowerCase()"></div>
              </div>

              <h3 class="ind-name">{{ ind.indicatorName }}</h3>

              <!-- Score gauge + details -->
              <div class="ind-body">
                <app-score-gauge [score]="ind.score ?? 0" [size]="72" [strokeWidth]="6" />
                <div class="ind-details">
                  <div class="detail-row">
                    <span class="detail-label">Valeur actuelle</span>
                    <span class="detail-val">{{ ind.currentValue ?? '—' }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Seuils V/O/R</span>
                    <span class="detail-val thresholds">
                      <span style="color:#10B981">{{ ind.thresholdGreen }}</span>/
                      <span style="color:#F59E0B">{{ ind.thresholdOrange }}</span>/
                      <span style="color:#EF4444">{{ ind.thresholdRed }}</span>
                    </span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Fréquence</span>
                    <span class="detail-val">{{ ind.frequency }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Poids</span>
                    <span class="detail-val">{{ ind.weight }}%</span>
                  </div>
                </div>
              </div>

              <!-- Footer -->
              <div class="ind-footer">
                <span class="last-update">
                  {{ ind.lastUpdatedAt ? 'MàJ: ' + formatDate(ind.lastUpdatedAt) : 'Jamais mis à jour' }}
                </span>
                @if (editingId() === ind.id) {
                  <div class="value-entry">
                    <input type="number" class="value-input" [(ngModel)]="newValue"
                           placeholder="Nouvelle valeur" (keyup.enter)="submitValue(ind)" />
                    <button class="btn btn-primary btn-xs" (click)="submitValue(ind)" [disabled]="savingId() === ind.id">
                      {{ savingId() === ind.id ? '...' : '✓' }}
                    </button>
                    <button class="btn btn-secondary btn-xs" (click)="editingId.set(null)">✕</button>
                  </div>
                } @else {
                  <button class="btn btn-primary btn-xs" (click)="startEdit(ind.id)">Saisir</button>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .indicators-page { max-width: 1200px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
    .page-header h2 { margin: 0 0 4px; font-size: 1.5rem; }
    .page-sub { margin: 0; font-size: 0.875rem; color: var(--text-secondary); }
    .header-right { display: flex; align-items: center; gap: 1rem; }
    .global-score-card { display: flex; align-items: center; gap: 1rem; padding: 0.875rem 1.25rem; background: rgba(255,255,255,0.04); border: 1px solid var(--border); border-radius: 14px; }
    .score-info { display: flex; flex-direction: column; gap: 2px; }
    .score-num { font-size: 1.25rem; font-weight: 700; font-family: 'Outfit', sans-serif; }
    .score-label { font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; }

    .category-tabs { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
    .tab-btn { padding: 0.5rem 1rem; background: rgba(255,255,255,0.04); border: 1px solid var(--border); border-radius: 20px; color: var(--text-secondary); font-size: 0.8125rem; font-weight: 500; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.15s; }
    .tab-btn:hover { border-color: var(--primary); color: var(--primary); }
    .tab-btn.active { background: rgba(255,107,0,0.15); border-color: var(--primary); color: var(--primary); font-weight: 600; }
    .tab-count { background: rgba(255,255,255,0.08); padding: 1px 6px; border-radius: 10px; font-size: 0.75rem; }

    .indicators-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.25rem; }

    .ind-card { padding: 1.25rem; border-left: 4px solid var(--border); display: flex; flex-direction: column; gap: 0.75rem; transition: transform 0.2s; }
    .ind-card:hover { transform: translateY(-2px); }
    .state-green  { border-left-color: #10B981; }
    .state-yellow { border-left-color: #F59E0B; }
    .state-orange { border-left-color: #F97316; }
    .state-red    { border-left-color: #EF4444; }
    .state-unknown { border-left-color: var(--border); }

    .ind-top { display: flex; justify-content: space-between; align-items: center; }
    .ind-code { font-size: 0.75rem; font-weight: 700; color: var(--text-secondary); background: rgba(255,255,255,0.05); padding: 2px 8px; border-radius: 6px; font-family: monospace; }
    .ind-state-dot { width: 10px; height: 10px; border-radius: 50%; }
    .dot-green  { background: #10B981; box-shadow: 0 0 6px #10B981; }
    .dot-yellow { background: #F59E0B; box-shadow: 0 0 6px #F59E0B; }
    .dot-orange { background: #F97316; box-shadow: 0 0 6px #F97316; }
    .dot-red    { background: #EF4444; box-shadow: 0 0 6px #EF4444; }
    .dot-unknown { background: var(--border); }

    .ind-name { margin: 0; font-size: 0.9375rem; font-weight: 600; line-height: 1.3; }
    .ind-body { display: flex; gap: 1rem; align-items: center; }
    .ind-details { flex: 1; display: flex; flex-direction: column; gap: 5px; }
    .detail-row { display: flex; justify-content: space-between; align-items: center; font-size: 0.8125rem; }
    .detail-label { color: var(--text-secondary); }
    .detail-val { font-weight: 600; color: var(--text-primary); }
    .thresholds { display: flex; gap: 3px; }

    .ind-footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 0.75rem; flex-wrap: wrap; gap: 8px; }
    .last-update { font-size: 0.75rem; color: var(--text-secondary); }
    .value-entry { display: flex; gap: 6px; align-items: center; }
    .value-input { padding: 4px 8px; background: rgba(255,255,255,0.05); border: 1px solid var(--border); border-radius: 6px; color: var(--text-primary); font-size: 0.8125rem; width: 110px; }
    .value-input:focus { outline: none; border-color: var(--primary); }
    .btn-xs { padding: 4px 10px; font-size: 0.75rem; }

    .empty-state { text-align: center; padding: 4rem; color: var(--text-secondary); grid-column: 1/-1; }
  `]
})
export class IndicatorDashboardComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly indicatorService = inject(IndicatorService);
  private readonly notif = inject(NotificationService);

  loading = signal(true);
  indicators = signal<ProjectIndicatorResponse[]>([]);
  globalScore = signal<number | null>(null);
  activeCategory = signal('ALL');
  editingId = signal<string | null>(null);
  savingId = signal<string | null>(null);
  newValue = 0;

  categories = [
    { value: 'ALL', label: 'Tous' },
    { value: 'PROGRESS', label: 'Avancement' },
    { value: 'BUDGET', label: 'Budget' },
    { value: 'QUALITY', label: 'Qualité' },
    { value: 'RISK', label: 'Risques' },
    { value: 'RESOURCE', label: 'Ressources' },
  ];

  filteredIndicators = computed(() => {
    const cat = this.activeCategory();
    return cat === 'ALL' ? this.indicators() : this.indicators().filter(i => i.category === cat);
  });

  countByCategory(cat: string): number {
    return cat === 'ALL' ? this.indicators().length : this.indicators().filter(i => i.category === cat).length;
  }

  ngOnInit(): void {
    const projectId = this.route.parent?.snapshot.paramMap.get('id') ?? '';
    if (projectId) {
      this.loading.set(true);
      this.indicatorService.getProjectIndicators(projectId).subscribe({
        next: (list) => { this.indicators.set(list); this.loading.set(false); },
        error: (err: any) => this.loading.set(false)
      });
      this.indicatorService.getScoreSummary(projectId).subscribe({
        next: (summary) => this.globalScore.set(Math.round(summary.globalScore)),
        error: (err: any) => {}
      });
    }
  }

  startEdit(id: string): void { this.editingId.set(id); this.newValue = 0; }

  submitValue(ind: ProjectIndicatorResponse): void {
    this.savingId.set(ind.id);
    this.indicatorService.updateValue(ind.id, this.newValue).subscribe({
      next: (updated) => {
        this.indicators.update(list => list.map(i => i.id === ind.id ? updated : i));
        this.editingId.set(null);
        this.savingId.set(null);
        this.notif.success('Valeur enregistrée');
      },
      error: (err: any) => {
        this.savingId.set(null);
        this.notif.error('Erreur lors de la mise à jour');
      }
    });
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  }
}
