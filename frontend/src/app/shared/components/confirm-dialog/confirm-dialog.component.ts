import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="overlay" (click)="onCancel()">
      <div class="dialog" (click)="$event.stopPropagation()">
        <div class="dialog-icon">{{ icon() }}</div>
        <h3 class="dialog-title">{{ title() }}</h3>
        <p class="dialog-message">{{ message() }}</p>
        <div class="dialog-actions">
          <button class="btn-cancel" (click)="onCancel()">Annuler</button>
          <button class="btn-confirm" [class]="'btn-' + variant()" (click)="onConfirm()">
            {{ confirmLabel() }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.5);
      display: flex; align-items: center; justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.15s ease;
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .dialog {
      background: #fff;
      border-radius: 16px;
      padding: 32px;
      max-width: 420px;
      width: 90%;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0,0,0,0.2);
      animation: slideUp 0.2s ease;
    }
    @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: none; opacity: 1; } }
    .dialog-icon { font-size: 48px; margin-bottom: 16px; }
    .dialog-title { font-size: 20px; font-weight: 700; margin: 0 0 8px; color: #1a1a2e; }
    .dialog-message { color: #6b7280; font-size: 14px; margin: 0 0 24px; line-height: 1.6; }
    .dialog-actions { display: flex; gap: 12px; justify-content: center; }
    .btn-cancel, .btn-confirm {
      padding: 10px 24px; border-radius: 8px; font-size: 14px;
      font-weight: 600; cursor: pointer; border: none; transition: all 0.2s;
    }
    .btn-cancel { background: #f3f4f6; color: #374151; }
    .btn-cancel:hover { background: #e5e7eb; }
    .btn-danger { background: #ef4444; color: #fff; }
    .btn-danger:hover { background: #dc2626; }
    .btn-primary { background: #FF6B00; color: #fff; }
    .btn-primary:hover { background: #e65e00; }
  `]
})
export class ConfirmDialogComponent {
  title = input<string>('Confirmer');
  message = input<string>('Êtes-vous sûr(e) ?');
  confirmLabel = input<string>('Confirmer');
  icon = input<string>('⚠️');
  variant = input<'danger' | 'primary'>('danger');

  confirmed = output<void>();
  cancelled = output<void>();

  onConfirm(): void { this.confirmed.emit(); }
  onCancel(): void { this.cancelled.emit(); }
}
