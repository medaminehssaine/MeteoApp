import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export type CQDState = 'ALIGNED' | 'UNDER_TENSION' | 'DEGRADED';

@Component({
  selector: 'app-cqd-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="cqd-badge" [class]="'cqd-' + state()">
      <span class="dot"></span>
      @if (label()) { <span class="badge-label">{{ label() }} — </span> }
      {{ stateLabel() }}
    </span>
  `,
  styles: [`
    .cqd-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.02em;
    }
    .dot {
      width: 7px; height: 7px;
      border-radius: 50%;
    }
    .badge-label { opacity: 0.7; }
    .cqd-ALIGNED { background: #d1fae5; color: #065f46; }
    .cqd-ALIGNED .dot { background: #10b981; }
    .cqd-UNDER_TENSION { background: #fef3c7; color: #92400e; }
    .cqd-UNDER_TENSION .dot { background: #f59e0b; }
    .cqd-DEGRADED { background: #fee2e2; color: #7f1d1d; }
    .cqd-DEGRADED .dot { background: #ef4444; }
  `]
})
export class CqdBadgeComponent {
  state = input.required<CQDState>();
  label = input<string>('');

  stateLabel = computed(() => {
    const map: Record<CQDState, string> = {
      ALIGNED: 'Aligné',
      UNDER_TENSION: 'Sous Tension',
      DEGRADED: 'Dégradé'
    };
    return map[this.state()] ?? this.state();
  });
}
