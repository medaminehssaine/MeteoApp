import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'app',
    loadComponent: () =>
      import('./features/layout/layout.component').then((m) => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      // ── Projects ─────────────────────────────────────────────
      {
        path: 'projects',
        loadComponent: () =>
          import('./features/projects/project-list.component').then((m) => m.ProjectListComponent),
      },
      {
        path: 'projects/:id',
        loadComponent: () =>
          import('./features/projects/project-detail.component').then((m) => m.ProjectDetailComponent),
        children: [
          {
            path: 'plan',
            loadComponent: () =>
              import('./features/plan/plan-overview.component').then((m) => m.PlanOverviewComponent),
          },
          {
            path: 'indicators',
            loadComponent: () =>
              import('./features/indicators/indicator-dashboard.component').then((m) => m.IndicatorDashboardComponent),
          },
          {
            path: 'meteo',
            loadComponent: () =>
              import('./features/meteo/meteo.component').then((m) => m.MeteoComponent),
          },
          {
            path: 'cqd',
            loadComponent: () =>
              import('./features/cqd/cqd.component').then((m) => m.CqdDashboardComponent),
          },
          {
            path: 'projections',
            loadComponent: () =>
              import('./features/projections/projection-dashboard.component').then((m) => m.ProjectionDashboardComponent),
          },
          {
            path: 'risks',
            loadComponent: () =>
              import('./features/risks/risk-matrix.component').then((m) => m.RiskMatrixComponent),
          },
          {
            path: 'corrective-actions',
            loadComponent: () =>
              import('./features/corrective-actions/action-plan.component').then((m) => m.ActionPlanComponent),
          },
          {
            path: 'ai',
            loadComponent: () =>
              import('./features/ai/ai-assistant.component').then((m) => m.AiAssistantComponent),
          },
          {
            path: '',
            redirectTo: 'meteo',
            pathMatch: 'full',
          },
        ],
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/auth/profile.component').then((m) => m.ProfileComponent),
      },
      // ── AI Assistant ────────────────────────────────────────────
      {
        path: 'ai',
        loadComponent: () =>
          import('./features/ai/ai-assistant.component').then((m) => m.AiAssistantComponent),
      },
      // ── Admin ─────────────────────────────────────────────────
      {
        path: 'admin/users',
        loadComponent: () =>
          import('./features/admin/user-management.component').then((m) => m.UserManagementComponent),
        canActivate: [adminGuard],
      },
      {
        path: 'admin/audit',
        loadComponent: () =>
          import('./features/admin/audit-log.component').then((m) => m.AuditLogComponent),
        canActivate: [adminGuard],
      },
    ],
  },
  {
    path: '**',
    redirectTo: '/login',
  },
];
