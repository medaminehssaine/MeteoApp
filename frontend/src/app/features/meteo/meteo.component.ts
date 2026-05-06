import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MeteoService, MeteoResult, MeteoHistoryEntry, MeteoState } from '../../core/services/meteo.service';

@Component({
  selector: 'app-meteo',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="meteo-container">
      <div class="meteo-header">
        <h2>Meteo du Projet</h2>
        <button class="btn-recalculate" (click)="recalculate()" [disabled]="loading()">
          <span class="btn-icon">&#x21bb;</span>
          {{ loading() ? 'Calcul en cours...' : 'Recalculer' }}
        </button>
      </div>

      @if (meteo()) {
        <div class="meteo-main">
          <!-- Weather Icon -->
          <div class="weather-display">
            <div class="weather-icon-wrapper" [class]="'weather-' + meteo()!.state.toLowerCase()">
              <div class="weather-glow"></div>
              <span class="weather-icon">{{ weatherEmoji() }}</span>
              <span class="weather-label">{{ weatherLabel() }}</span>
            </div>
          </div>

          <!-- Score Circle -->
          <div class="score-section">
            <div class="score-circle" [style.border-color]="scoreColor()">
              <div class="score-inner">
                <span class="score-value">{{ meteo()!.score }}</span>
                <span class="score-label">/ 100</span>
              </div>
              <svg class="score-ring" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" fill="none" stroke="#2a2a3a" stroke-width="8"/>
                <circle cx="60" cy="60" r="54" fill="none"
                  [attr.stroke]="scoreColor()"
                  stroke-width="8"
                  stroke-linecap="round"
                  [attr.stroke-dasharray]="scoreDash()"
                  stroke-dashoffset="0"
                  transform="rotate(-90 60 60)"/>
              </svg>
            </div>
          </div>

          <!-- Forced Indicator -->
          @if (meteo()!.forced) {
            <div class="forced-badge">
              <span class="forced-icon">&#x26A0;</span>
              <span class="forced-text">FORC&Eacute;</span>
              @if (meteo()!.forcingRule) {
                <span class="forced-rule">{{ meteo()!.forcingRule }}</span>
              }
            </div>
          }

          <!-- Sub-scores -->
          <div class="sub-scores">
            <div class="sub-score-item">
              <span class="sub-label">CQD</span>
              <div class="sub-bar">
                <div class="sub-fill" [style.width.%]="meteo()!.cqdScore ?? 0" [style.background]="subScoreColor(meteo()!.cqdScore ?? 0)"></div>
              </div>
              <span class="sub-value">{{ meteo()!.cqdScore ?? 0 }}%</span>
            </div>
            <div class="sub-score-item">
              <span class="sub-label">Indicateurs</span>
              <div class="sub-bar">
                <div class="sub-fill" [style.width.%]="meteo()!.indicatorScore ?? 0" [style.background]="subScoreColor(meteo()!.indicatorScore ?? 0)"></div>
              </div>
              <span class="sub-value">{{ meteo()!.indicatorScore ?? 0 }}%</span>
            </div>
            <div class="sub-score-item">
              <span class="sub-label">Risques</span>
              <div class="sub-bar">
                <div class="sub-fill" [style.width.%]="meteo()!.riskScore ?? 0" [style.background]="subScoreColor(meteo()!.riskScore ?? 0)"></div>
              </div>
              <span class="sub-value">{{ meteo()!.riskScore ?? '—' }}%</span>
            </div>
            <div class="sub-score-item">
              <span class="sub-label">Plan</span>
              <div class="sub-bar">
                <div class="sub-fill" [style.width.%]="meteo()!.planScore ?? 0" [style.background]="subScoreColor(meteo()!.planScore ?? 0)"></div>
              </div>
              <span class="sub-value">{{ meteo()!.planScore ?? '—' }}%</span>
            </div>
          </div>
        </div>
      }

      <!-- History Timeline -->
      @if (history().length > 0) {
        <div class="history-section">
          <h3>Historique</h3>
          <div class="timeline">
            @for (entry of history(); track entry.calculatedAt) {
              <div class="timeline-item">
                <div class="timeline-dot" [style.background]="stateColor(entry.state)"></div>
                <div class="timeline-content">
                  <span class="timeline-emoji">{{ stateEmoji(entry.state) }}</span>
                  <span class="timeline-score">{{ entry.score }}</span>
                  <span class="timeline-date">{{ entry.calculatedAt | date:'dd/MM/yyyy HH:mm' }}</span>
                  @if (entry.forced) {
                    <span class="timeline-forced">FORC&Eacute;</span>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }

    .meteo-container {
      padding: 24px;
      max-width: 900px;
      margin: 0 auto;
    }

    .meteo-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32px;
    }

    .meteo-header h2 {
      color: #fff;
      font-size: 24px;
      font-weight: 600;
      margin: 0;
    }

    .btn-recalculate {
      background: #FF6B00;
      color: #fff;
      border: none;
      padding: 12px 28px;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.3s ease;
    }

    .btn-recalculate:hover:not(:disabled) {
      background: #e65e00;
      transform: translateY(-1px);
      box-shadow: 0 4px 15px rgba(255, 107, 0, 0.4);
    }

    .btn-recalculate:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-icon { font-size: 18px; }

    .meteo-main {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 32px;
    }

    /* Weather Icon */
    .weather-display {
      display: flex;
      justify-content: center;
    }

    .weather-icon-wrapper {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 40px;
    }

    .weather-glow {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -55%);
      width: 140px;
      height: 140px;
      border-radius: 50%;
      filter: blur(40px);
      opacity: 0.4;
      animation: pulse-glow 3s ease-in-out infinite;
    }

    .weather-soleil .weather-glow { background: #FFD700; }
    .weather-nuage_clair .weather-glow { background: #87CEEB; }
    .weather-nuage_charge .weather-glow { background: #A0A0B0; }
    .weather-orage .weather-glow { background: #FF4444; }

    @keyframes pulse-glow {
      0%, 100% { opacity: 0.3; transform: translate(-50%, -55%) scale(1); }
      50% { opacity: 0.6; transform: translate(-50%, -55%) scale(1.15); }
    }

    .weather-icon {
      font-size: 80px;
      line-height: 1;
      position: relative;
      z-index: 1;
      animation: float 4s ease-in-out infinite;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-8px); }
    }

    .weather-label {
      font-size: 16px;
      font-weight: 600;
      color: #ccc;
      text-transform: uppercase;
      letter-spacing: 2px;
      position: relative;
      z-index: 1;
    }

    /* Score Circle */
    .score-section { position: relative; }

    .score-circle {
      position: relative;
      width: 140px;
      height: 140px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .score-ring {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }

    .score-ring circle {
      transition: stroke-dasharray 1s ease;
    }

    .score-inner {
      display: flex;
      flex-direction: column;
      align-items: center;
      z-index: 1;
    }

    .score-value {
      font-size: 42px;
      font-weight: 700;
      color: #fff;
    }

    .score-label {
      font-size: 14px;
      color: #888;
    }

    /* Forced Badge */
    .forced-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(255, 60, 60, 0.15);
      border: 1px solid #ff3c3c;
      color: #ff3c3c;
      padding: 10px 20px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 14px;
    }

    .forced-icon { font-size: 18px; }

    .forced-rule {
      color: #ff8888;
      font-weight: 400;
      margin-left: 4px;
    }

    /* Sub-scores */
    .sub-scores {
      width: 100%;
      max-width: 500px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      background: rgba(255, 255, 255, 0.04);
      border-radius: 12px;
      padding: 24px;
    }

    .sub-score-item {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .sub-label {
      width: 100px;
      font-size: 13px;
      color: #aaa;
      font-weight: 500;
    }

    .sub-bar {
      flex: 1;
      height: 8px;
      background: #2a2a3a;
      border-radius: 4px;
      overflow: hidden;
    }

    .sub-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.8s ease;
    }

    .sub-value {
      width: 45px;
      text-align: right;
      font-size: 13px;
      color: #fff;
      font-weight: 600;
    }

    /* History */
    .history-section {
      margin-top: 40px;
    }

    .history-section h3 {
      color: #fff;
      font-size: 18px;
      margin-bottom: 20px;
    }

    .timeline {
      position: relative;
      padding-left: 24px;
      border-left: 2px solid #2a2a3a;
    }

    .timeline-item {
      position: relative;
      padding: 12px 0 12px 20px;
    }

    .timeline-dot {
      position: absolute;
      left: -29px;
      top: 18px;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: 2px solid #1a1a2e;
    }

    .timeline-content {
      display: flex;
      align-items: center;
      gap: 12px;
      background: rgba(255, 255, 255, 0.04);
      padding: 12px 16px;
      border-radius: 8px;
    }

    .timeline-emoji { font-size: 20px; }

    .timeline-score {
      font-weight: 700;
      color: #fff;
      font-size: 16px;
    }

    .timeline-date {
      color: #888;
      font-size: 13px;
    }

    .timeline-forced {
      background: rgba(255, 60, 60, 0.2);
      color: #ff3c3c;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
    }
  `]
})
export class MeteoComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly meteoService = inject(MeteoService);

  meteo = signal<MeteoResult | null>(null);
  history = signal<MeteoHistoryEntry[]>([]);
  loading = signal(false);

  weatherEmoji = computed(() => {
    const state = this.meteo()?.state;
    const map: Record<MeteoState, string> = {
      SOLEIL: '\u2600\uFE0F',
      NUAGE_CLAIR: '\uD83C\uDF24\uFE0F',
      NUAGE_CHARGE: '\u2601\uFE0F',
      ORAGE: '\u26C8\uFE0F'
    };
    return state ? map[state] : '';
  });

  weatherLabel = computed(() => {
    const state = this.meteo()?.state;
    const map: Record<MeteoState, string> = {
      SOLEIL: 'Soleil',
      NUAGE_CLAIR: 'Nuage Clair',
      NUAGE_CHARGE: 'Nuage Charg\u00e9',
      ORAGE: 'Orage'
    };
    return state ? map[state] : '';
  });

  scoreColor = computed(() => {
    const score = this.meteo()?.score ?? 0;
    if (score >= 75) return '#4CAF50';
    if (score >= 50) return '#FF9800';
    if (score >= 25) return '#FF6B00';
    return '#f44336';
  });

  scoreDash = computed(() => {
    const score = this.meteo()?.score ?? 0;
    const circumference = 2 * Math.PI * 54;
    const filled = (score / 100) * circumference;
    return `${filled} ${circumference}`;
  });

  ngOnInit(): void {
    const projectId = this.route.parent?.snapshot.paramMap.get('id') ?? this.route.snapshot.paramMap.get('id') ?? '';
    if (projectId) {
      this.loadMeteo(projectId);
      this.loadHistory(projectId);
    }
  }

  subScoreColor(score: number): string {
    if (score >= 75) return '#4CAF50';
    if (score >= 50) return '#FF9800';
    if (score >= 25) return '#FF6B00';
    return '#f44336';
  }

  stateColor(state: MeteoState): string {
    const map: Record<MeteoState, string> = {
      SOLEIL: '#FFD700',
      NUAGE_CLAIR: '#87CEEB',
      NUAGE_CHARGE: '#A0A0B0',
      ORAGE: '#FF4444'
    };
    return map[state];
  }

  stateEmoji(state: MeteoState): string {
    const map: Record<MeteoState, string> = {
      SOLEIL: '\u2600\uFE0F',
      NUAGE_CLAIR: '\uD83C\uDF24\uFE0F',
      NUAGE_CHARGE: '\u2601\uFE0F',
      ORAGE: '\u26C8\uFE0F'
    };
    return map[state];
  }

  recalculate(): void {
    const projectId = this.route.parent?.snapshot.paramMap.get('id') ?? this.route.snapshot.paramMap.get('id') ?? '';
    if (!projectId) return;
    this.loading.set(true);
    this.meteoService.calculateMeteo(projectId).subscribe({
      next: (result) => {
        this.meteo.set(result);
        this.loading.set(false);
        this.loadHistory(projectId);
      },
      error: () => this.loading.set(false)
    });
  }

  private loadMeteo(projectId: string): void {
    this.meteoService.getCurrentMeteo(projectId).subscribe({
      next: (result) => this.meteo.set(result)
    });
  }

  private loadHistory(projectId: string): void {
    this.meteoService.getMeteoHistory(projectId).subscribe({
      next: (result) => this.history.set(result.entries ?? [])
    });
  }
}
