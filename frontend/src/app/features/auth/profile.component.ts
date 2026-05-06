import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="profile-page">
      <div class="page-header">
        <div class="avatar-big">{{ initials() }}</div>
        <div>
          <h1>{{ user()?.firstName }} {{ user()?.lastName }}</h1>
          <p class="user-role">{{ user()?.role }}</p>
          <p class="user-email">{{ user()?.email }}</p>
        </div>
      </div>

      <div class="profile-grid">
        <!-- Info card -->
        <div class="card">
          <h2>Informations personnelles</h2>
          <form [formGroup]="infoForm" (ngSubmit)="saveInfo()">
            <div class="form-row">
              <div class="form-group">
                <label>Prénom</label>
                <input type="text" formControlName="firstName" class="input" />
              </div>
              <div class="form-group">
                <label>Nom</label>
                <input type="text" formControlName="lastName" class="input" />
              </div>
            </div>
            <div class="form-group">
              <label>Email</label>
              <input type="email" formControlName="email" class="input" />
            </div>
            <div class="form-group">
              <label>Téléphone</label>
              <input type="tel" formControlName="phone" class="input" placeholder="+212 6XX XXX XXX" />
            </div>
            <button type="submit" class="btn-primary" [disabled]="infoForm.invalid || saving()">
              {{ saving() ? 'Enregistrement...' : 'Enregistrer' }}
            </button>
          </form>
        </div>

        <!-- Password card -->
        <div class="card">
          <h2>Changer le mot de passe</h2>
          <form [formGroup]="pwdForm" (ngSubmit)="changePassword()">
            <div class="form-group">
              <label>Mot de passe actuel</label>
              <input type="password" formControlName="current" class="input" />
            </div>
            <div class="form-group">
              <label>Nouveau mot de passe</label>
              <input type="password" formControlName="newPwd" class="input" />
              <p class="hint">8 caractères minimum, avec majuscule et chiffre</p>
            </div>
            <div class="form-group">
              <label>Confirmer le nouveau mot de passe</label>
              <input type="password" formControlName="confirm" class="input" />
              @if (pwdForm.get('confirm')?.value && pwdForm.get('newPwd')?.value !== pwdForm.get('confirm')?.value) {
                <p class="error-hint">Les mots de passe ne correspondent pas</p>
              }
            </div>
            <button type="submit" class="btn-primary" [disabled]="pwdForm.invalid || changingPwd()">
              {{ changingPwd() ? 'Modification...' : 'Modifier' }}
            </button>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .profile-page { max-width: 900px; }
    .page-header { display: flex; align-items: center; gap: 24px; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 1px solid #f3f4f6; }
    .avatar-big { width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #FF6B00, #ff9500); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 700; flex-shrink: 0; }
    .page-header h1 { font-size: 24px; font-weight: 700; margin: 0 0 4px; }
    .user-role { font-size: 13px; background: #1a1a2e; color: #fff; padding: 2px 10px; border-radius: 8px; display: inline-block; margin: 4px 0; }
    .user-email { font-size: 14px; color: #9ca3af; margin: 4px 0 0; }
    .profile-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    .card { background: #fff; border-radius: 14px; padding: 28px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
    .card h2 { font-size: 16px; font-weight: 700; margin: 0 0 20px; color: #1a1a2e; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .form-group { margin-bottom: 16px; }
    .form-group label { display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px; }
    .input { width: 100%; padding: 10px 12px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 14px; box-sizing: border-box; transition: border 0.2s; }
    .input:focus { outline: none; border-color: #FF6B00; box-shadow: 0 0 0 3px rgba(255,107,0,0.1); }
    .hint { font-size: 12px; color: #9ca3af; margin: 4px 0 0; }
    .error-hint { font-size: 12px; color: #ef4444; margin: 4px 0 0; }
    .btn-primary { padding: 10px 24px; background: #FF6B00; color: #fff; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
    .btn-primary:hover:not(:disabled) { background: #e65e00; }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    @media (max-width: 768px) { .profile-grid { grid-template-columns: 1fr; } .form-row { grid-template-columns: 1fr; } }
  `]
})
export class ProfileComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly notification = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  user = () => this.auth.user();
  saving = signal(false);
  changingPwd = signal(false);

  initials = () => {
    const u = this.user();
    return u ? `${u.firstName.charAt(0)}${u.lastName.charAt(0)}`.toUpperCase() : '?';
  };

  infoForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
  });

  pwdForm = this.fb.group({
    current: ['', Validators.required],
    newPwd: ['', [Validators.required, Validators.minLength(8)]],
    confirm: ['', Validators.required],
  });

  ngOnInit(): void {
    const u = this.user();
    if (u) {
      this.infoForm.patchValue({
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
      });
    }
  }

  saveInfo(): void {
    if (this.infoForm.invalid) return;
    this.saving.set(true);
    // TODO: wire to UserService.updateProfile()
    setTimeout(() => {
      this.notification.success('Profil mis à jour');
      this.saving.set(false);
    }, 500);
  }

  changePassword(): void {
    const { newPwd, confirm } = this.pwdForm.value;
    if (newPwd !== confirm) { this.notification.error('Les mots de passe ne correspondent pas'); return; }
    this.changingPwd.set(true);
    // TODO: wire to AuthService.changePassword()
    setTimeout(() => {
      this.notification.success('Mot de passe modifié avec succès');
      this.pwdForm.reset();
      this.changingPwd.set(false);
    }, 500);
  }
}
