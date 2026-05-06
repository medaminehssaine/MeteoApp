import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification } from '../../../core/services/notification.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      @for (toast of notif.notifications(); track toast.id) {
        <div class="toast" [class]="'toast-' + toast.type" (click)="notif.dismiss(toast.id)">
          <span class="toast-icon">{{ icons[toast.type] }}</span>
          <span class="toast-msg">{{ toast.message }}</span>
          <button class="toast-close" (click)="notif.dismiss(toast.id)">×</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 380px;
    }
    .toast {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 16px;
      border-radius: 10px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      cursor: pointer;
      animation: slideIn 0.25s cubic-bezier(0.4,0,0.2,1);
      font-size: 14px;
      font-weight: 500;
    }
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to   { transform: translateX(0);    opacity: 1; }
    }
    .toast-success { background: #ecfdf5; color: #065f46; border-left: 4px solid #10b981; }
    .toast-error   { background: #fef2f2; color: #7f1d1d; border-left: 4px solid #ef4444; }
    .toast-warning { background: #fffbeb; color: #78350f; border-left: 4px solid #f59e0b; }
    .toast-info    { background: #eff6ff; color: #1e3a8a; border-left: 4px solid #3b82f6; }
    .toast-icon { font-size: 18px; }
    .toast-msg { flex: 1; line-height: 1.4; }
    .toast-close {
      background: none; border: none; cursor: pointer;
      font-size: 18px; opacity: 0.6; padding: 0; line-height: 1;
    }
    .toast-close:hover { opacity: 1; }
  `]
})
export class ToastContainerComponent {
  readonly notif = inject(NotificationService);
  readonly icons: Record<string, string> = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
  };
}
