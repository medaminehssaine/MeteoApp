import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="register-page">
      <section class="register-card">
        <div class="brand-row">
          <div class="brand-mark">MP</div>
          <div>
            <div class="brand-name">Meteo Projet</div>
            <div class="brand-sub">Create your workspace account</div>
          </div>
        </div>

        <div class="auth-header">
          <p class="eyebrow">Get started</p>
          <h1>Create an account</h1>
          <p>Join your organization project cockpit.</p>
        </div>

        @if (errorMessage()) {
          <div class="alert alert-error">{{ errorMessage() }}</div>
        }

        <form (ngSubmit)="onSubmit()" class="auth-form">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="firstName">First name</label>
              <input id="firstName" type="text" [(ngModel)]="firstName" name="firstName" placeholder="Jean" required autocomplete="given-name" />
            </div>

            <div class="form-group">
              <label class="form-label" for="lastName">Last name</label>
              <input id="lastName" type="text" [(ngModel)]="lastName" name="lastName" placeholder="Dupont" required autocomplete="family-name" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="email">Email address</label>
            <input id="email" type="email" [(ngModel)]="email" name="email" placeholder="you@example.com" required autocomplete="email" />
          </div>

          <div class="form-group">
            <label class="form-label" for="password">Password</label>
            <input id="password" type="password" [(ngModel)]="password" name="password" placeholder="Minimum 8 characters" required autocomplete="new-password" />
            <span class="form-hint">Use at least 8 characters with uppercase, lowercase, and a number.</span>
          </div>

          <div class="form-group">
            <label class="form-label" for="confirmPassword">Confirm password</label>
            <input id="confirmPassword" type="password" [(ngModel)]="confirmPassword" name="confirmPassword" placeholder="Repeat password" required autocomplete="new-password" />
          </div>

          <button type="submit" class="btn btn-primary btn-submit" [disabled]="isLoading()">
            @if (isLoading()) {
              <span class="spinner"></span>
              Creating account...
            } @else {
              Create account
            }
          </button>
        </form>

        <div class="auth-footer">
          <span>Already have an account?</span>
          <a routerLink="/login">Sign in</a>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .register-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      background:
        linear-gradient(135deg, rgba(255,107,0,0.12), transparent 32%),
        linear-gradient(315deg, rgba(37,99,235,0.08), transparent 36%),
        var(--bg);
    }

    .register-card {
      width: min(520px, 100%);
      background: #fff;
      border: 1px solid var(--border);
      border-radius: 18px;
      box-shadow: 0 24px 60px rgba(15,23,42,0.12);
      padding: 2rem;
    }

    .brand-row {
      display: flex;
      align-items: center;
      gap: 0.8rem;
      margin-bottom: 2rem;
    }

    .brand-mark {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--primary);
      color: #fff;
      font-weight: 900;
      box-shadow: var(--shadow-primary);
    }

    .brand-name { font-weight: 900; }
    .brand-sub { color: var(--text-secondary); font-size: 0.82rem; }

    .auth-header { margin-bottom: 1.5rem; }
    .eyebrow { margin: 0 0 0.5rem; color: var(--primary); font-size: 0.75rem; font-weight: 900; letter-spacing: 0.08em; text-transform: uppercase; }
    .auth-header h1 { font-size: 1.75rem; margin-bottom: 0.35rem; }
    .auth-header p:not(.eyebrow) { color: var(--text-secondary); margin: 0; }

    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
    }

    .form-hint {
      color: var(--text-secondary);
      font-size: 0.75rem;
    }

    .btn-submit {
      width: 100%;
      margin-top: 0.25rem;
    }

    .alert {
      margin-bottom: 1rem;
      padding: 0.8rem 0.9rem;
      border-radius: 10px;
      font-size: 0.875rem;
      font-weight: 700;
    }

    .alert-error {
      background: #fef2f2;
      color: #b91c1c;
      border: 1px solid #fecaca;
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

    @media (max-width: 560px) {
      .form-row {
        grid-template-columns: 1fr;
      }

      .register-card {
        padding: 1.5rem;
      }
    }
  `],
})
export class RegisterComponent {
  firstName = '';
  lastName = '';
  email = '';
  password = '';
  confirmPassword = '';
  isLoading = signal(false);
  errorMessage = signal('');

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  onSubmit(): void {
    if (!this.firstName || !this.lastName || !this.email || !this.password) {
      this.errorMessage.set('Please fill in all fields.');
      return;
    }

    if (this.password.length < 8) {
      this.errorMessage.set('Password must contain at least 8 characters.');
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage.set('Passwords do not match.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService
      .register({
        firstName: this.firstName,
        lastName: this.lastName,
        email: this.email,
        password: this.password,
      })
      .subscribe({
        next: () => this.router.navigate(['/app/dashboard']),
        error: (err) => {
          this.isLoading.set(false);
          if (err.status === 409) {
            this.errorMessage.set('An account with this email address already exists.');
          } else if (err.status === 0) {
            this.errorMessage.set('Cannot reach the backend.');
          } else {
            this.errorMessage.set(err.error?.message || 'Something went wrong.');
          }
        },
      });
  }
}
