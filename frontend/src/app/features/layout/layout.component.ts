import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/services/auth.service';
import { ToastContainerComponent } from '../../shared/components/toast-container/toast-container.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet, ToastContainerComponent],
  template: `
    <div class="layout">
      <aside class="sidebar">
        <div class="brand">
          <div class="brand-mark">MP</div>
          <div class="brand-copy">
            <span class="brand-name">Meteo Projet</span>
            <span class="brand-sub">Project health cockpit</span>
          </div>
        </div>

        <nav class="nav-links" aria-label="Navigation principale">
          <a routerLink="/app/dashboard" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">DB</span>
            <span>Dashboard</span>
          </a>
          <a routerLink="/app/projects" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">PR</span>
            <span>Projets</span>
          </a>
          <a routerLink="/app/ai" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">AI</span>
            <span>Assistant IA</span>
          </a>

          @if (isAdmin()) {
            <div class="nav-section-title">Administration</div>
            <a routerLink="/app/admin/users" routerLinkActive="active" class="nav-item">
              <span class="nav-icon">US</span>
              <span>Utilisateurs</span>
            </a>
            <a routerLink="/app/admin/audit" routerLinkActive="active" class="nav-item">
              <span class="nav-icon">LG</span>
              <span>Journal d'audit</span>
            </a>
          }
        </nav>

        <div class="sidebar-bottom">
          <a routerLink="/app/profile" class="user-info-link">
            <div class="user-avatar-small">{{ userInitials() }}</div>
            <div class="user-details">
              <span class="user-name">{{ userName() }}</span>
              <span class="user-role">{{ userRoleLabel() }}</span>
            </div>
          </a>
          <button class="logout-btn" type="button" (click)="logout()">
            <span class="logout-icon">OUT</span>
            <span>Deconnexion</span>
          </button>
        </div>
      </aside>

      <div class="main-area">
        <header class="top-header">
          <div>
            <div class="eyebrow">Workspace</div>
            <h1 class="page-title">{{ pageTitle() }}</h1>
          </div>
          <div class="header-actions">
            <a routerLink="/app/projects" class="header-button">Nouveau projet</a>
            <a routerLink="/app/profile" class="user-avatar-chip" aria-label="Profil">
              {{ userInitials() }}
            </a>
          </div>
        </header>

        <main class="content">
          <router-outlet />
        </main>
      </div>
    </div>

    <app-toast-container />
  `,
  styles: [`
    :host { display: block; min-height: 100vh; }
    .layout { min-height: 100vh; display: flex; background: var(--bg); }

    .sidebar {
      width: 280px;
      min-width: 280px;
      background: #111827;
      color: #f9fafb;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      border-right: 1px solid rgba(255,255,255,0.08);
      position: sticky;
      top: 0;
      height: 100vh;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1.25rem 1.25rem 1rem;
      border-bottom: 1px solid rgba(255,255,255,0.08);
    }

    .brand-mark {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--primary);
      color: #fff;
      font-weight: 900;
      letter-spacing: 0;
      box-shadow: 0 16px 30px rgba(255,107,0,0.28);
      flex-shrink: 0;
    }

    .brand-copy { display: flex; flex-direction: column; min-width: 0; }
    .brand-name { font-size: 1rem; font-weight: 800; color: #fff; }
    .brand-sub { font-size: 0.72rem; color: #9ca3af; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .nav-links {
      padding: 1rem 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      flex: 1;
    }

    .nav-section-title {
      margin: 1rem 0.75rem 0.35rem;
      color: #9ca3af;
      font-size: 0.68rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.7rem 0.75rem;
      color: #d1d5db;
      border-radius: 10px;
      font-size: 0.9rem;
      font-weight: 700;
      transition: background var(--transition), color var(--transition), transform var(--transition);
    }

    .nav-item:hover {
      color: #fff;
      background: rgba(255,255,255,0.08);
      transform: translateX(2px);
    }

    .nav-item.active {
      color: #fff;
      background: linear-gradient(135deg, var(--primary), var(--primary-dark));
      box-shadow: 0 12px 22px rgba(255,107,0,0.18);
    }

    .nav-icon {
      width: 30px;
      height: 30px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      background: rgba(255,255,255,0.08);
      color: inherit;
      font-size: 0.68rem;
      font-weight: 900;
      flex-shrink: 0;
    }

    .sidebar-bottom {
      padding: 1rem;
      border-top: 1px solid rgba(255,255,255,0.08);
    }

    .user-info-link {
      display: flex;
      align-items: center;
      gap: 0.7rem;
      padding: 0.75rem;
      border-radius: 12px;
      color: #fff;
      background: rgba(255,255,255,0.06);
      margin-bottom: 0.75rem;
    }

    .user-info-link:hover { background: rgba(255,255,255,0.1); color: #fff; }

    .user-avatar-small,
    .user-avatar-chip {
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: #fff7ed;
      color: var(--primary-dark);
      font-weight: 900;
      flex-shrink: 0;
    }

    .user-avatar-small { width: 38px; height: 38px; }
    .user-avatar-chip { width: 40px; height: 40px; border: 1px solid #fed7aa; }

    .user-details { display: flex; flex-direction: column; min-width: 0; }
    .user-name { color: #fff; font-size: 0.86rem; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .user-role { color: #9ca3af; font-size: 0.74rem; }

    .logout-btn {
      width: 100%;
      min-height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 10px;
      background: transparent;
      color: #d1d5db;
      font-size: 0.85rem;
      font-weight: 800;
      cursor: pointer;
    }

    .logout-btn:hover { background: rgba(220,38,38,0.12); color: #fecaca; border-color: rgba(248,113,113,0.35); }
    .logout-icon { font-size: 0.65rem; font-weight: 900; }

    .main-area {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
    }

    .top-header {
      min-height: 74px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 1rem 2rem;
      background: rgba(255,255,255,0.86);
      backdrop-filter: blur(14px);
      border-bottom: 1px solid var(--border);
      position: sticky;
      top: 0;
      z-index: 20;
    }

    .eyebrow {
      color: var(--text-secondary);
      font-size: 0.72rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 0.15rem;
    }

    .page-title {
      font-size: 1.2rem;
      font-weight: 800;
      color: var(--text-primary);
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .header-button {
      min-height: 40px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 10px;
      padding: 0 0.95rem;
      background: var(--primary);
      color: #fff;
      font-size: 0.85rem;
      font-weight: 800;
      box-shadow: var(--shadow-primary);
    }

    .header-button:hover { color: #fff; background: var(--primary-dark); }

    .content {
      flex: 1;
      width: min(100%, 1500px);
      margin: 0 auto;
      padding: 1.75rem 2rem 2.5rem;
    }

    @media (max-width: 1024px) {
      .sidebar { width: 86px; min-width: 86px; }
      .brand { justify-content: center; padding-inline: 0.75rem; }
      .brand-copy, .nav-item span:last-child, .user-details, .logout-btn span:last-child { display: none; }
      .nav-item { justify-content: center; padding-inline: 0.5rem; }
      .sidebar-bottom { padding-inline: 0.75rem; }
      .user-info-link { justify-content: center; }
    }

    @media (max-width: 768px) {
      .layout { display: block; }
      .sidebar { position: relative; width: 100%; min-width: 0; height: auto; }
      .brand-copy, .nav-item span:last-child, .user-details, .logout-btn span:last-child { display: flex; }
      .nav-links { flex-direction: row; overflow-x: auto; padding: 0.75rem; }
      .nav-section-title, .sidebar-bottom { display: none; }
      .nav-item { min-width: max-content; justify-content: flex-start; }
      .top-header { position: relative; padding: 1rem; }
      .content { padding: 1rem; }
      .header-button { display: none; }
    }
  `],
})
export class LayoutComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  isAdmin = computed(() => this.auth.user()?.role === 'ADMIN');

  pageTitle = computed(() => {
    const url = this.currentUrl();
    if (url.includes('/admin/users')) return 'Utilisateurs';
    if (url.includes('/admin/audit')) return 'Journal d audit';
    if (url.includes('/projects')) return 'Projets';
    if (url.includes('/ai')) return 'Assistant IA';
    if (url.includes('/profile')) return 'Profil';
    return 'Dashboard';
  });

  userName = computed(() => {
    const user = this.auth.user();
    return user ? `${user.firstName} ${user.lastName}` : 'Utilisateur';
  });

  userRoleLabel = computed(() => this.auth.user()?.role ?? '');

  userInitials = computed(() => {
    const user = this.auth.user();
    return user ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase() : '?';
  });

  logout(): void {
    this.auth.logout().subscribe({ complete: () => this.router.navigate(['/login']) });
  }
}
