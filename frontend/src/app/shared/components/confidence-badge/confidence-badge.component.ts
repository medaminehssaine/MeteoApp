import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

@Component({
  selector: 'app-confidence-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="conf-badge" [class]="'conf-' + level()">
      <span class="conf-icon">{{ icon() }}</span>
      <div class="conf-info">
        <span class="conf-level">Confiance {{ levelLabel() }}</span>
        <div class="conf-bar">
          <div class="conf-fill" [style.width]="percentage() + '%'"></div>
        </div>
        <span class="conf-pct">{{ percentage() | number:'1.0-0' }}%</span>
      </div>
    </div>
  `,
  styles: [`
    .conf-badge {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 8px 14px;
      border-radius: 10px;
      min-width: 180px;
    }
    .conf-icon { font-size: 24px; }
    .conf-info { display: flex; flex-direction: column; gap: 4px; flex: 1; }
    .conf-level { font-size: 12px; font-weight: 600; }
    .conf-bar { height: 4px; border-radius: 2px; background: rgba(0,0,0,0.15); }
    .conf-fill { height: 100%; border-radius: 2px; transition: width 0.4s ease; }
    .conf-pct { font-size: 11px; opacity: 0.7; }

    .conf-HIGH { background: #d1fae5; color: #065f46; }
    .conf-HIGH .conf-fill { background: #10b981; }
    .conf-MEDIUM { background: #fef3c7; color: #92400e; }
    .conf-MEDIUM .conf-fill { background: #f59e0b; }
    .conf-LOW { background: #fee2e2; color: #7f1d1d; }
    .conf-LOW .conf-fill { background: #ef4444; }
  `]
})
export class ConfidenceBadgeComponent {
  level = input.required<ConfidenceLevel>();
  percentage = input<number>(0);

  icon = computed(() => ({ HIGH: '🎯', MEDIUM: '🔮', LOW: '⚠️' }[this.level()] ?? '🔮'));

  levelLabel = computed(() => ({
    HIGH: 'Élevée', MEDIUM: 'Moyenne', LOW: 'Faible'
  }[this.level()] ?? ''));
}
