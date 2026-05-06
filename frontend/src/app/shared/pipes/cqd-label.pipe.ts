import { Pipe, PipeTransform } from '@angular/core';
import { CQDState } from '../components/cqd-badge/cqd-badge.component';

@Pipe({ name: 'cqdLabel', standalone: true })
export class CqdLabelPipe implements PipeTransform {
  transform(state: CQDState | string | null): string {
    const map: Record<string, string> = {
      ALIGNED: '✅ Aligné',
      UNDER_TENSION: '⚠️ Sous Tension',
      DEGRADED: '🔴 Dégradé',
    };
    return state ? (map[state] ?? state) : '—';
  }
}
