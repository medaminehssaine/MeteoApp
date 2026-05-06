import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export type MeteoState = 'SOLEIL' | 'NUAGE_CLAIR' | 'NUAGE_CHARGE' | 'ORAGE';

@Component({
  selector: 'app-meteo-icon',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="meteo-wrap" [class]="'meteo-' + state()">
      <span class="meteo-emoji">{{ emoji() }}</span>
      @if (showLabel()) {
        <span class="meteo-label">{{ label() }}</span>
      }
      @if (showScore()) {
        <span class="meteo-score">{{ score() }}/100</span>
      }
    </div>
  `,
  styles: [`
    .meteo-wrap {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-family: inherit;
    }
    .meteo-emoji {
      font-size: var(--meteo-size, 32px);
      line-height: 1;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15));
    }
    .meteo-label { font-weight: 600; font-size: 0.9em; }
    .meteo-score { font-size: 0.8em; opacity: 0.7; }
    .meteo-SOLEIL .meteo-label { color: #d97706; }
    .meteo-NUAGE_CLAIR .meteo-label { color: #2563eb; }
    .meteo-NUAGE_CHARGE .meteo-label { color: #6b7280; }
    .meteo-ORAGE .meteo-label { color: #dc2626; }
  `]
})
export class MeteoIconComponent {
  state = input.required<MeteoState>();
  score = input<number>(0);
  size = input<number>(32);
  showLabel = input<boolean>(true);
  showScore = input<boolean>(false);

  emoji = computed(() => {
    const map: Record<MeteoState, string> = {
      SOLEIL: '☀️',
      NUAGE_CLAIR: '🌤️',
      NUAGE_CHARGE: '☁️',
      ORAGE: '⛈️'
    };
    return map[this.state()] ?? '☀️';
  });

  label = computed(() => {
    const map: Record<MeteoState, string> = {
      SOLEIL: 'Soleil',
      NUAGE_CLAIR: 'Nuage Clair',
      NUAGE_CHARGE: 'Nuage Chargé',
      ORAGE: 'Orage'
    };
    return map[this.state()] ?? '';
  });

  sizeStyle = computed(() => `${this.size()}px`);
}
