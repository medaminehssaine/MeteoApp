import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-score-gauge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="gauge-wrap" [style.width.px]="size()" [style.height.px]="size()">
      <svg [attr.width]="size()" [attr.height]="size()" [attr.viewBox]="'0 0 ' + size() + ' ' + size()">
        <!-- Background circle -->
        <circle
          [attr.cx]="size()/2" [attr.cy]="size()/2"
          [attr.r]="radius()"
          fill="none"
          [attr.stroke]="trackColor()"
          [attr.stroke-width]="strokeWidth()"/>
        <!-- Progress arc -->
        <circle
          [attr.cx]="size()/2" [attr.cy]="size()/2"
          [attr.r]="radius()"
          fill="none"
          [attr.stroke]="progressColor()"
          [attr.stroke-width]="strokeWidth()"
          stroke-linecap="round"
          [attr.stroke-dasharray]="circumference()"
          [attr.stroke-dashoffset]="dashOffset()"
          transform="rotate(-90)"
          [attr.transform]="'rotate(-90 ' + size()/2 + ' ' + size()/2 + ')'"/>
      </svg>
      <div class="gauge-center">
        <span class="gauge-score">{{ score() }}</span>
        <span class="gauge-unit">/100</span>
      </div>
    </div>
  `,
  styles: [`
    .gauge-wrap {
      position: relative;
      display: inline-block;
    }
    .gauge-center {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .gauge-score {
      font-size: 1.4em;
      font-weight: 700;
      line-height: 1;
    }
    .gauge-unit {
      font-size: 0.7em;
      opacity: 0.5;
    }
  `]
})
export class ScoreGaugeComponent {
  score = input.required<number>();
  size = input<number>(120);
  strokeWidth = input<number>(10);

  radius = computed(() => (this.size() - this.strokeWidth()) / 2);
  circumference = computed(() => 2 * Math.PI * this.radius());
  dashOffset = computed(() => this.circumference() * (1 - this.score() / 100));

  progressColor = computed(() => {
    const s = this.score();
    if (s >= 85) return '#f59e0b'; // SOLEIL
    if (s >= 70) return '#3b82f6'; // NUAGE_CLAIR
    if (s >= 50) return '#6b7280'; // NUAGE_CHARGE
    return '#ef4444';              // ORAGE
  });

  trackColor = computed(() => '#f3f4f6');
}
