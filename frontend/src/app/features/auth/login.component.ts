import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <section class="auth-panel">
        <div class="brand-row">
          <div class="brand-mark">MP</div>
          <div>
            <div class="brand-name">Meteo Projet</div>
            <div class="brand-sub">Objective project health cockpit</div>
          </div>
        </div>

        <div class="hero-copy">
          <p class="eyebrow">Decision platform</p>
          <h1>Turn project facts into clear executive decisions.</h1>
          <p>
            Track progress, CQD, risks, and corrective actions in one modern workspace built for project reviews.
          </p>
        </div>

        <div class="proof-grid">
          <div>
            <span class="proof-value">0-100</span>
            <span class="proof-label">Meteo score</span>
          </div>
          <div>
            <span class="proof-value">CQD</span>
            <span class="proof-label">Cost Quality Delay</span>
          </div>
          <div>
            <span class="proof-value">AI</span>
            <span class="proof-label">Projection assist</span>
          </div>
        </div>
      </section>

      <section class="auth-card">
        <div class="auth-header">
          <p class="eyebrow">Welcome back</p>
          <h2>Sign in</h2>
          <p>Use your project workspace account.</p>
        </div>

        @if (errorMessage()) {
          <div class="error-banner fade-in">
            {{ errorMessage() }}
          </div>
        }

        <form (ngSubmit)="onSubmit()" class="auth-form">
          <div class="form-group">
            <label class="form-label" for="email">Email address</label>
            <input
              id="email"
              type="email"
              class="form-control"
              [(ngModel)]="email"
              name="email"
              placeholder="you@example.com"
              required
              autocomplete="email"
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="password">Password</label>
            <div class="password-field">
              <input
                id="password"
                [type]="showPassword() ? 'text' : 'password'"
                class="form-control"
                [(ngModel)]="password"
                name="password"
                placeholder="Your password"
                required
                autocomplete="current-password"
              />
              <button type="button" class="toggle-pw" (click)="togglePasswordVisibility()">
                {{ showPassword() ? 'Hide' : 'Show' }}
              </button>
            </div>
          </div>

          <button type="submit" class="btn btn-primary btn-submit" [disabled]="isLoading()">
            @if (isLoading()) {
              <span class="spinner"></span>
              Signing in...
            } @else {
              Sign in
            }
          </button>
        </form>

        <div class="auth-footer">
          <span>No account yet?</span>
          <a routerLink="/register">Create one</a>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: 100vh;
      display: grid;
      grid-template-columns: minmax(360px, 1.1fr) minmax(360px, 0.9fr);
      background:
        linear-gradient(135deg, rgba(255,107,0,0.1), transparent 34%),
        var(--bg);
    }

    .auth-panel {
      min-height: 100vh;
      padding: 3rem;
      background: #111827;
      color: #fff;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      overflow: hidden;
    }

    .auth-panel::after {
      content: "";
      position: absolute;
      inset: auto -20% -30% 10%;
      height: 360px;
      background: radial-gradient(circle, rgba(255,107,0,0.22), transparent 62%);
      pointer-events: none;
    }

    .brand-row {
      display: flex;
      align-items: center;
      gap: 0.8rem;
      position: relative;
      z-index: 1;
    }

    .brand-mark {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--primary);
      font-weight: 900;
      box-shadow: 0 18px 36px rgba(255,107,0,0.28);
    }

    .brand-name { font-weight: 900; }
    .brand-sub { color: #9ca3af; font-size: 0.82rem; }

    .hero-copy {
      max-width: 640px;
      position: relative;
      z-index: 1;
    }

    .eyebrow {
      margin: 0 0 0.75rem;
      color: var(--primary);
      font-size: 0.75rem;
      font-weight: 900;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .hero-copy h1 {
      color: #fff;
      font-size: clamp(2.4rem, 5vw, 4.6rem);
      line-height: 0.98;
      max-width: 780px;
      margin-bottom: 1.25rem;
    }

    .hero-copy p {
      color: #d1d5db;
      font-size: 1.05rem;
      max-width: 560px;
      margin: 0;
    }

    .proof-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.75rem;
      position: relative;
      z-index: 1;
    }

    .proof-grid > div {
      padding: 1rem;
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 14px;
      background: rgba(255,255,255,0.06);
    }

    .proof-value {
      display: block;
      color: #fff;
      font-size: 1.4rem;
      font-weight: 900;
    }

    .proof-label {
      color: #9ca3af;
      font-size: 0.78rem;
      font-weight: 700;
    }

    .auth-card {
      width: min(440px, calc(100% - 2rem));
      align-self: center;
      justify-self: center;
      background: #fff;
      border: 1px solid var(--border);
      border-radius: 18px;
      box-shadow: 0 24px 60px rgba(15,23,42,0.12);
      padding: 2rem;
    }

    .auth-header { margin-bottom: 1.5rem; }
    .auth-header h2 { font-size: 1.75rem; margin-bottom: 0.35rem; }
    .auth-header p:not(.eyebrow) { margin: 0; color: var(--text-secondary); }

    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
    }

    .password-field {
      position: relative;
    }

    .password-field .form-control {
      padding-right: 4.25rem;
    }

    .toggle-pw {
      position: absolute;
      right: 0.45rem;
      top: 50%;
      transform: translateY(-50%);
      min-height: 30px;
      padding: 0 0.65rem;
      border: 1px solid var(--border);
      border-radius: 8px;
      background: var(--surface-muted);
      color: var(--text-secondary);
      font-size: 0.75rem;
      font-weight: 800;
      cursor: pointer;
    }

    .btn-submit {
      width: 100%;
      margin-top: 0.25rem;
    }

    .error-banner {
      margin-bottom: 1rem;
      padding: 0.8rem 0.9rem;
      border-radius: 10px;
      background: #fef2f2;
      color: #b91c1c;
      border: 1px solid #fecaca;
      font-size: 0.875rem;
      font-weight: 700;
    }

    .auth-footer {
      display: flex;
      justify-content: center;
      gap: 0.4rem;
      margin-top: 1.25rem;
      color: var(--text-secondary);
      font-size: 0.9rem;
    }

    .auth-footer a {
      font-weight: 800;
    }

    @media (max-width: 900px) {
      .auth-page {
        grid-template-columns: 1fr;
      }

      .auth-panel {
        min-height: auto;
        padding: 2rem;
        gap: 2rem;
      }

      .hero-copy h1 {
        font-size: 2.4rem;
      }

      .auth-card {
        margin: 2rem auto;
      }
    }

    @media (max-width: 560px) {
      .proof-grid {
        grid-template-columns: 1fr;
      }
    }
  `],
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  email = '';
  password = '';
  isLoading = signal(false);
  errorMessage = signal('');
  showPassword = signal(false);

  togglePasswordVisibility(): void {
    this.showPassword.update((visible) => !visible);
  }

  onSubmit(): void {
    if (!this.email || !this.password) {
      this.errorMessage.set('Please fill in all fields.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService.login(this.email, this.password).subscribe({
      next: () => this.router.navigate(['/app/dashboard']),
      error: (err) => {
        this.isLoading.set(false);
        if (err.status === 401) {
          this.errorMessage.set('Email or password is incorrect.');
        } else if (err.status === 0) {
          this.errorMessage.set('Cannot reach the backend. Please make sure the server is running.');
        } else {
          this.errorMessage.set(err.error?.message || 'Something went wrong.');
        }
      },
    });
  }
}
