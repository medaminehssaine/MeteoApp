import { Component } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  template: `
    <div class="spinner-wrap">
      <div class="spinner"></div>
    </div>
  `,
  styles: [`
    .spinner-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 48px;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #f3f4f6;
      border-top-color: #FF6B00;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class LoadingSpinnerComponent {}
