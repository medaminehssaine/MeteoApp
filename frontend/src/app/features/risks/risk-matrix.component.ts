import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { RiskService, RiskResponse, RiskSummary, CreateRiskRequest } from '../../core/services/risk.service';
import { NotificationService } from '../../core/services/notification.service';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';

@Component({
  selector: 'app-risk-matrix',
  standalone: true,
  imports: [CommonModule, FormsModule, SkeletonComponent],
  template: `
    <div class="risks-page fade-in">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h2>Matrice des Risques</h2>
          <p class="page-sub">Identification et suivi des risques projet</p>
        </div>
        <button class="btn btn-primary" (click)="showForm.set(!showForm())">
          {{ showForm() ? '✕ Fermer' : '＋ Nouveau Risque' }}
        </button>
      </div>

      <!-- Summary Cards -->
      @if (summary()) {
        <div class="summary-row">
          <div class="summary-card card critical-card">
            <span class="sum-num">{{ summary()!.critical }}</span>
            <span class="sum-label">Critiques (≥15)</span>
          </div>
          <div class="summary-card card high-card">
            <span class="sum-num">{{ summary()!.high }}</span>
            <span class="sum-label">Hauts (10–14)</span>
          </div>
          <div class="summary-card card medium-card">
            <span class="sum-num">{{ summary()!.medium }}</span>
            <span class="sum-label">Moyens (5–9)</span>
          </div>
          <div class="summary-card card low-card">
            <span class="sum-num">{{ summary()!.low }}</span>
            <span class="sum-label">Faibles (<5)</span>
          </div>
          <div class="summary-card card">
            <span class="sum-num">{{ summary()!.mitigated }}</span>
            <span class="sum-label">Atténués</span>
          </div>
        </div>
      }

      <!-- Add Risk Form -->
      @if (showForm()) {
        <div class="card add-form fade-in">
          <h3 style="margin:0 0 1rem;font-size:1rem">Nouveau Risque</h3>
          <div class="form-grid">
            <div class="form-group">
              <label>Titre *</label>
              <input type="text" class="form-input" [(ngModel)]="newRisk.title" placeholder="Description du risque" />
            </div>
            <div class="form-group">
              <label>Catégorie</label>
              <select class="form-input" [(ngModel)]="newRisk.category">
                <option value="TECHNICAL">Technique</option>
                <option value="ORGANIZATIONAL">Organisationnel</option>
                <option value="EXTERNAL">Externe</option>
                <option value="FINANCIAL">Financier</option>
                <option value="SCHEDULE">Planning</option>
              </select>
            </div>
            <div class="form-group">
              <label>Probabilité: {{ newRisk.probability }}/5</label>
              <input type="range" min="1" max="5" [(ngModel)]="newRisk.probability" class="range-input" />
              <div class="range-labels"><span>Rare</span><span>Certain</span></div>
            </div>
            <div class="form-group">
              <label>Impact: {{ newRisk.impact }}/5</label>
              <input type="range" min="1" max="5" [(ngModel)]="newRisk.impact" class="range-input" />
              <div class="range-labels"><span>Faible</span><span>Critique</span></div>
            </div>
            <div class="form-group" style="grid-column:1/-1">
              <label>Description</label>
              <textarea class="form-input" [(ngModel)]="newRisk.description" rows="2" placeholder="Description détaillée..."></textarea>
            </div>
            <div class="form-group" style="grid-column:1/-1">
              <label>Plan d'atténuation</label>
              <textarea class="form-input" [(ngModel)]="newRisk.mitigationPlan" rows="2" placeholder="Actions pour réduire ce risque..."></textarea>
            </div>
          </div>
          <div class="severity-preview">
            Sévérité calculée: <strong [class]="getSeverityClass(newRisk.probability * newRisk.impact)">
              {{ newRisk.probability * newRisk.impact }} / 25 — {{ getSeverityLabel(newRisk.probability * newRisk.impact) }}
            </strong>
          </div>
          <div class="form-actions">
            <button class="btn btn-secondary" (click)="showForm.set(false)">Annuler</button>
            <button class="btn btn-primary" (click)="createRisk()" [disabled]="submitting() || !newRisk.title">
              {{ submitting() ? 'Création...' : 'Créer le risque' }}
            </button>
          </div>
        </div>
      }

      <!-- 5x5 Matrix -->
      <div class="card matrix-card">
        <h3 class="section-title">Matrice Probabilité × Impact</h3>
        <div class="matrix-wrapper">
          <div class="matrix-y-label">Probabilité →</div>
          <div class="matrix-grid">
            <!-- Column headers (Impact: 1–5) -->
            <div class="matrix-corner"></div>
            @for (i of [1,2,3,4,5]; track i) {
              <div class="matrix-col-header">Impact {{ i }}</div>
            }
            <!-- Rows (probability 5 at top → 1 at bottom) -->
            @for (p of [5,4,3,2,1]; track p) {
              <div class="matrix-row-header">Prob. {{ p }}</div>
              @for (im of [1,2,3,4,5]; track im) {
                <div class="matrix-cell" [class]="getCellClass(p * im)" (click)="filterBySeverity(p, im)">
                  @for (risk of getRisksAt(p, im); track risk.id) {
                    <div class="risk-dot" [title]="risk.title">{{ getRiskInitials(risk.title) }}</div>
                  }
                </div>
              }
            }
          </div>
        </div>
      </div>

      <!-- Risk List Table -->
      <div class="card" style="overflow:hidden">
        <div class="card-header-row">
          <h3 class="section-title" style="margin:0">Liste des Risques</h3>
          <select class="filter-select" [(ngModel)]="statusFilter" (ngModelChange)="applyFilter()">
            <option value="">Tous les statuts</option>
            <option value="IDENTIFIED">Identifié</option>
            <option value="ACTIVE">Actif</option>
            <option value="MITIGATED">Atténué</option>
            <option value="CLOSED">Fermé</option>
          </select>
        </div>
        @if (loading()) {
          <div style="padding:1rem;display:flex;flex-direction:column;gap:12px">
            @for (i of [1,2,3]; track i) { <app-skeleton height="52px" /> }
          </div>
        } @else {
          <table class="projects-table">
            <thead>
              <tr>
                <th>Risque</th>
                <th>Catégorie</th>
                <th>P × I</th>
                <th>Sévérité</th>
                <th>Statut</th>
                <th>Responsable</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (risk of filteredRisks(); track risk.id) {
                <tr>
                  <td>
                    <div>
                      <p class="risk-title">{{ risk.title }}</p>
                      @if (risk.description) { <p class="risk-desc">{{ risk.description }}</p> }
                    </div>
                  </td>
                  <td><span class="category-badge">{{ getCategoryLabel(risk.category) }}</span></td>
                  <td><span class="pxi-badge">{{ risk.probability }} × {{ risk.impact }}</span></td>
                  <td>
                    <span class="severity-badge" [class]="getSeverityClass(risk.severity)">
                      {{ risk.severity }} — {{ getSeverityLabel(risk.severity) }}
                    </span>
                  </td>
                  <td><span class="status-badge" [class]="'risk-status-' + risk.status.toLowerCase()">{{ getRiskStatusLabel(risk.status) }}</span></td>
                  <td>{{ risk.responsibleName ?? '—' }}</td>
                  <td>
                    <button class="btn btn-secondary btn-xs" (click)="deleteRisk(risk.id)">🗑</button>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="7" class="empty-state text-center" style="padding:2rem">Aucun risque trouvé.</td></tr>
              }
            </tbody>
          </table>
        }
      </div>
    </div>
  `,
  styles: [`
    .risks-page { max-width: 1100px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
    .page-header h2 { margin: 0 0 4px; font-size: 1.5rem; }
    .page-sub { margin: 0; font-size: 0.875rem; color: var(--text-secondary); }

    .summary-row { display: grid; grid-template-columns: repeat(5, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
    .summary-card { padding: 1rem 1.25rem; display: flex; flex-direction: column; gap: 4px; }
    .sum-num { font-size: 2rem; font-weight: 700; font-family: 'Outfit', sans-serif; }
    .sum-label { font-size: 0.75rem; color: var(--text-secondary); }
    .critical-card .sum-num { color: #F87171; }
    .high-card .sum-num { color: #FB923C; }
    .medium-card .sum-num { color: #FBBF24; }
    .low-card .sum-num { color: #34D399; }

    .add-form { padding: 1.5rem; margin-bottom: 1.5rem; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-group label { font-size: 0.8125rem; font-weight: 500; color: var(--text-secondary); }
    .form-input { padding: 0.5rem 0.75rem; background: rgba(255,255,255,0.04); border: 1px solid var(--border); border-radius: 8px; color: var(--text-primary); font-size: 0.875rem; width: 100%; box-sizing: border-box; }
    .form-input:focus { outline: none; border-color: var(--primary); }
    textarea.form-input { resize: vertical; }
    .range-input { width: 100%; accent-color: var(--primary); }
    .range-labels { display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-secondary); }
    .severity-preview { font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 1rem; }
    .form-actions { display: flex; justify-content: flex-end; gap: 0.75rem; }

    /* Matrix */
    .matrix-card { padding: 1.5rem; margin-bottom: 1.5rem; }
    .section-title { margin: 0 0 1rem; font-size: 0.9375rem; font-weight: 600; }
    .matrix-wrapper { display: flex; align-items: center; gap: 0.5rem; }
    .matrix-y-label { writing-mode: vertical-rl; transform: rotate(180deg); font-size: 0.75rem; color: var(--text-secondary); padding: 0.5rem 0; }
    .matrix-grid { display: grid; grid-template-columns: 60px repeat(5, 1fr); gap: 4px; flex: 1; }
    .matrix-corner { }
    .matrix-col-header, .matrix-row-header { font-size: 0.75rem; color: var(--text-secondary); display: flex; align-items: center; justify-content: center; padding: 4px; text-align: center; }
    .matrix-cell { min-height: 56px; border-radius: 8px; display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 3px; padding: 4px; cursor: pointer; transition: opacity 0.15s; }
    .matrix-cell:hover { opacity: 0.8; }
    .cell-low      { background: rgba(16,185,129,0.2); }
    .cell-medium   { background: rgba(245,158,11,0.25); }
    .cell-high     { background: rgba(249,115,22,0.3); }
    .cell-critical { background: rgba(239,68,68,0.35); }
    .risk-dot { width: 28px; height: 28px; border-radius: 50%; background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3); font-size: 0.6rem; font-weight: 700; display: flex; align-items: center; justify-content: center; color: white; cursor: pointer; }

    /* Risk list */
    .card-header-row { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.25rem; border-bottom: 1px solid var(--border); }
    .filter-select { padding: 0.375rem 0.625rem; background: rgba(255,255,255,0.04); border: 1px solid var(--border); border-radius: 8px; color: var(--text-primary); font-size: 0.8125rem; }
    .risk-title { font-size: 0.875rem; font-weight: 500; margin: 0; }
    .risk-desc { font-size: 0.75rem; color: var(--text-secondary); margin: 2px 0 0; }
    .category-badge { font-size: 0.75rem; background: rgba(255,255,255,0.06); padding: 2px 8px; border-radius: 10px; color: var(--text-secondary); }
    .pxi-badge { font-size: 0.875rem; font-weight: 600; font-family: monospace; }
    .severity-badge { font-size: 0.75rem; font-weight: 600; padding: 3px 8px; border-radius: 10px; }
    .sev-low      { background: rgba(16,185,129,0.15); color: #34D399; }
    .sev-medium   { background: rgba(245,158,11,0.15); color: #FBBF24; }
    .sev-high     { background: rgba(249,115,22,0.15); color: #FB923C; }
    .sev-critical { background: rgba(239,68,68,0.15); color: #F87171; }
    .risk-status-identified { background: rgba(148,163,184,0.15); color: #94A3B8; font-size: 0.75rem; padding: 2px 8px; border-radius: 10px; }
    .risk-status-active { background: rgba(239,68,68,0.15); color: #F87171; font-size: 0.75rem; padding: 2px 8px; border-radius: 10px; }
    .risk-status-mitigated { background: rgba(245,158,11,0.15); color: #FBBF24; font-size: 0.75rem; padding: 2px 8px; border-radius: 10px; }
    .risk-status-closed { background: rgba(16,185,129,0.15); color: #34D399; font-size: 0.75rem; padding: 2px 8px; border-radius: 10px; }
    .btn-xs { padding: 4px 10px; font-size: 0.75rem; }
    .empty-state { color: var(--text-secondary); }

    @media (max-width: 768px) { .summary-row { grid-template-columns: repeat(3, 1fr); } .form-grid { grid-template-columns: 1fr; } }
  `]
})
export class RiskMatrixComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly riskService = inject(RiskService);
  private readonly notif = inject(NotificationService);

  loading = signal(true);
  submitting = signal(false);
  showForm = signal(false);
  risks = signal<RiskResponse[]>([]);
  summary = signal<RiskSummary | null>(null);
  statusFilter = '';
  projectId = '';

  filteredRisks = computed(() => {
    const f = this.statusFilter;
    return f ? this.risks().filter(r => r.status === f) : this.risks();
  });

  newRisk: CreateRiskRequest = { title: '', description: '', category: 'TECHNICAL', probability: 1, impact: 1, mitigationPlan: '' };

  ngOnInit(): void {
    this.projectId = this.route.parent?.snapshot.paramMap.get('id') ?? '';
    if (this.projectId) this.loadData();
  }

  private loadData(): void {
    this.loading.set(true);
    this.riskService.getRisks(this.projectId).subscribe({
      next: (list) => { this.risks.set(list); this.loading.set(false); },
      error: (err: any) => this.loading.set(false)
    });
    this.riskService.getRiskSummary(this.projectId).subscribe({
      next: (s) => this.summary.set(s),
      error: (err: any) => {}
    });
  }

  applyFilter(): void { /* filteredRisks computed handles it */ }

  getRisksAt(probability: number, impact: number): RiskResponse[] {
    return this.risks().filter(r => r.probability === probability && r.impact === impact);
  }

  filterBySeverity(p: number, i: number): void { /* optional: highlight */ }

  getCellClass(severity: number): string {
    if (severity >= 15) return 'matrix-cell cell-critical';
    if (severity >= 10) return 'matrix-cell cell-high';
    if (severity >= 5)  return 'matrix-cell cell-medium';
    return 'matrix-cell cell-low';
  }

  getSeverityClass(sev: number): string {
    if (sev >= 15) return 'severity-badge sev-critical';
    if (sev >= 10) return 'severity-badge sev-high';
    if (sev >= 5)  return 'severity-badge sev-medium';
    return 'severity-badge sev-low';
  }

  getSeverityLabel(sev: number): string {
    if (sev >= 15) return 'Critique';
    if (sev >= 10) return 'Élevé';
    if (sev >= 5)  return 'Moyen';
    return 'Faible';
  }

  getCategoryLabel(c: string): string {
    const map: Record<string, string> = { TECHNICAL: 'Technique', ORGANIZATIONAL: 'Organisationnel', EXTERNAL: 'Externe', FINANCIAL: 'Financier', SCHEDULE: 'Planning' };
    return map[c] ?? c;
  }

  getRiskStatusLabel(s: string): string {
    const map: Record<string, string> = { IDENTIFIED: 'Identifié', ACTIVE: 'Actif', MITIGATED: 'Atténué', CLOSED: 'Fermé' };
    return map[s] ?? s;
  }

  getRiskInitials(title: string): string {
    return title.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }

  createRisk(): void {
    if (!this.newRisk.title) return;
    this.submitting.set(true);
    this.riskService.createRisk(this.projectId, this.newRisk).subscribe({
      next: (r) => {
        this.risks.update(list => [...list, r]);
        this.showForm.set(false);
        this.submitting.set(false);
        this.newRisk = { title: '', description: '', category: 'TECHNICAL', probability: 1, impact: 1, mitigationPlan: '' };
        this.notif.success('Risque créé');
        this.loadData(); // reload summary
      },
      error: (err: any) => { this.submitting.set(false); this.notif.error('Erreur création risque'); }
    });
  }

  deleteRisk(id: string): void {
    this.riskService.deleteRisk(id).subscribe({
      next: () => { this.risks.update(list => list.filter(r => r.id !== id)); this.notif.success('Risque supprimé'); },
      error: (err: any) => this.notif.error('Erreur suppression')
    });
  }
}
