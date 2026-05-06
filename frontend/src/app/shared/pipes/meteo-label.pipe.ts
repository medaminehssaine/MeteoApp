import { Pipe, PipeTransform } from '@angular/core';
import { MeteoState } from '../components/meteo-icon/meteo-icon.component';

@Pipe({ name: 'meteoLabel', standalone: true })
export class MeteoLabelPipe implements PipeTransform {
  transform(state: MeteoState | string | null): string {
    const map: Record<string, string> = {
      SOLEIL: '☀️ Soleil',
      NUAGE_CLAIR: '🌤️ Nuage Clair',
      NUAGE_CHARGE: '☁️ Nuage Chargé',
      ORAGE: '⛈️ Orage',
    };
    return state ? (map[state] ?? state) : '—';
  }
}
