import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export type Trend = 'IMPROVING' | 'STABLE' | 'DETERIORATING';

@Component({
  selector: 'app-trend-arrow',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="trend-arrow" [class]="'trend-' + trend()" [title]="label()">
      {{ arrow() }}
      @if (showLabel()) { <span class="trend-label">{{ label() }}</span> }
    </span>
  `,
  styles: [`
    .trend-arrow {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 18px;
      font-weight: 700;
    }
    .trend-label { font-size: 12px; font-weight: 500; }
    .trend-IMPROVING { color: #10b981; }
    .trend-STABLE { color: #6b7280; }
    .trend-DETERIORATING { color: #ef4444; }
  `]
})
export class TrendArrowComponent {
  trend = input.required<Trend>();
  showLabel = input<boolean>(false);

  arrow = computed(() => {
    const map: Record<Trend, string> = {
      IMPROVING: '↑',
      STABLE: '→',
      DETERIORATING: '↓'
    };
    return map[this.trend()] ?? '→';
  });

  label = computed(() => {
    const map: Record<Trend, string> = {
      IMPROVING: 'En amélioration',
      STABLE: 'Stable',
      DETERIORATING: 'En dégradation'
    };
    return map[this.trend()] ?? '';
  });
}
