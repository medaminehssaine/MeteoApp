# FRONTEND ANGULAR - SPÉCIFICATIONS DÉTAILLÉES

## 1. Configuration Projet

### 1.1 Création
```bash
ng new meteo-project --standalone --routing --style=scss --ssr=false
ng add @angular/material
npm install @ngrx/signals chart.js ng2-charts ngx-translate @ngx-translate/http-loader
```

### 1.2 Structure tsconfig.json paths
```json
{
  "compilerOptions": {
    "paths": {
      "@core/*": ["src/app/core/*"],
      "@shared/*": ["src/app/shared/*"],
      "@features/*": ["src/app/features/*"],
      "@env": ["src/environments/environment"]
    }
  }
}
```

### 1.3 Environment
```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api/v1',
  tokenRefreshThreshold: 300, // 5 min before expiry
  cacheTimeout: {
    meteo: 300000,    // 5 min
    dashboard: 120000  // 2 min
  }
};
```

## 2. Routes

```typescript
// app.routes.ts
export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('@features/auth/login/login.component') },
  { path: 'reset-password', loadComponent: () => import('@features/auth/reset-password/reset-password.component') },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('@features/dashboard/dashboard.component')
      },
      {
        path: 'projects',
        children: [
          { path: '', loadComponent: () => import('@features/projects/project-list/project-list.component') },
          { path: 'new', loadComponent: () => import('@features/projects/project-form/project-form.component'), canActivate: [roleGuard], data: { roles: ['DIRECTOR'] } },
          {
            path: ':id',
            loadComponent: () => import('@features/projects/project-detail/project-detail.component'),
            children: [
              { path: '', redirectTo: 'overview', pathMatch: 'full' },
              { path: 'overview', loadComponent: () => import('@features/projects/project-overview/project-overview.component') },
              { path: 'plan', loadComponent: () => import('@features/plan/plan-overview/plan-overview.component') },
              { path: 'gantt', loadComponent: () => import('@features/plan/gantt-chart/gantt-chart.component') },
              { path: 'indicators', loadComponent: () => import('@features/indicators/indicator-dashboard/indicator-dashboard.component') },
              { path: 'meteo', loadComponent: () => import('@features/meteo/meteo-dashboard/meteo-dashboard.component') },
              { path: 'cqd', loadComponent: () => import('@features/cqd/cqd-dashboard/cqd-dashboard.component') },
              { path: 'projections', loadComponent: () => import('@features/projections/projection-dashboard/projection-dashboard.component') },
              { path: 'risks', loadComponent: () => import('@features/risks/risk-matrix/risk-matrix.component') },
              { path: 'actions', loadComponent: () => import('@features/corrective-actions/action-plan/action-plan.component') },
            ]
          }
        ]
      },
      {
        path: 'admin',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
        children: [
          { path: 'users', loadComponent: () => import('@features/admin/user-management/user-management.component') },
          { path: 'audit', loadComponent: () => import('@features/admin/audit-log/audit-log.component') },
        ]
      },
      { path: 'profile', loadComponent: () => import('@features/auth/profile/profile.component') }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
```

## 3. Core Services

### 3.1 AuthService

```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenService = inject(TokenService);
  private readonly router = inject(Router);

  private currentUser = signal<User | null>(null);
  readonly user = this.currentUser.asReadonly();
  readonly isAuthenticated = computed(() => !!this.currentUser());

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(
        tap(response => {
          this.tokenService.setTokens(response.accessToken, response.refreshToken);
          this.currentUser.set(response.user);
        })
      );
  }

  logout(): void {
    const refreshToken = this.tokenService.getRefreshToken();
    if (refreshToken) {
      this.http.post(`${environment.apiUrl}/auth/logout`, { refreshToken }).subscribe();
    }
    this.tokenService.clearTokens();
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  refreshToken(): Observable<string> {
    const refreshToken = this.tokenService.getRefreshToken();
    return this.http.post<{ accessToken: string }>(`${environment.apiUrl}/auth/refresh`, { refreshToken })
      .pipe(
        map(response => {
          this.tokenService.setAccessToken(response.accessToken);
          return response.accessToken;
        })
      );
  }
}
```

### 3.2 JWT Interceptor

```typescript
export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);
  const authService = inject(AuthService);

  // Skip auth endpoints
  if (req.url.includes('/auth/login') || req.url.includes('/auth/refresh')) {
    return next(req);
  }

  const token = tokenService.getAccessToken();
  if (!token) return next(req);

  // Check if token is about to expire
  if (tokenService.isTokenExpiringSoon()) {
    return authService.refreshToken().pipe(
      switchMap(newToken => {
        const cloned = req.clone({
          setHeaders: { Authorization: `Bearer ${newToken}` }
        });
        return next(cloned);
      }),
      catchError(() => {
        authService.logout();
        return EMPTY;
      })
    );
  }

  const cloned = req.clone({
    setHeaders: { Authorization: `Bearer ${token}` }
  });
  return next(cloned);
};
```

### 3.3 Error Interceptor

```typescript
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notification = inject(NotificationService);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      switch (error.status) {
        case 401:
          authService.logout();
          break;
        case 403:
          notification.error('Vous n\'avez pas les permissions nécessaires');
          break;
        case 404:
          notification.error('Ressource introuvable');
          break;
        case 400:
          const msg = error.error?.message || 'Erreur de validation';
          notification.error(msg);
          break;
        case 429:
          notification.warn('Trop de requêtes, veuillez patienter');
          break;
        default:
          notification.error('Une erreur est survenue');
      }
      return throwError(() => error);
    })
  );
};
```

## 4. NgRx Signal Store (State Management)

### 4.1 Project Store

```typescript
// features/projects/store/project.store.ts

type ProjectState = {
  projects: ProjectSummary[];
  selectedProject: ProjectDetail | null;
  loading: boolean;
  error: string | null;
  filters: ProjectFilters;
  pagination: Pagination;
};

const initialState: ProjectState = {
  projects: [],
  selectedProject: null,
  loading: false,
  error: null,
  filters: { status: 'IN_PROGRESS', search: '' },
  pagination: { page: 0, size: 20, totalElements: 0, totalPages: 0 }
};

export const ProjectStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    projectsByMeteo: computed(() => {
      const grouped = { SOLEIL: 0, NUAGE_CLAIR: 0, NUAGE_CHARGE: 0, ORAGE: 0 };
      store.projects().forEach(p => {
        if (p.currentMeteo) grouped[p.currentMeteo]++;
      });
      return grouped;
    }),
    hasProjects: computed(() => store.projects().length > 0),
  })),
  withMethods((store, projectService = inject(ProjectService)) => ({
    loadProjects: rxMethod<ProjectFilters>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap(filters =>
          projectService.getProjects(filters).pipe(
            tapResponse(
              (response) => patchState(store, {
                projects: response.content,
                pagination: { page: response.page, size: response.size,
                  totalElements: response.totalElements, totalPages: response.totalPages },
                loading: false
              }),
              (error: Error) => patchState(store, { error: error.message, loading: false })
            )
          )
        )
      )
    ),
    loadProjectDetail: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { loading: true })),
        switchMap(id =>
          projectService.getProject(id).pipe(
            tapResponse(
              (project) => patchState(store, { selectedProject: project, loading: false }),
              (error: Error) => patchState(store, { error: error.message, loading: false })
            )
          )
        )
      )
    ),
    setFilters(filters: Partial<ProjectFilters>) {
      patchState(store, { filters: { ...store.filters(), ...filters } });
    }
  }))
);
```

### 4.2 Météo Store

```typescript
// features/meteo/store/meteo.store.ts

type MeteoState = {
  currentMeteo: MeteoResponse | null;
  meteoHistory: MeteoHistoryEntry[];
  loading: boolean;
};

export const MeteoStore = signalStore(
  withState<MeteoState>({
    currentMeteo: null,
    meteoHistory: [],
    loading: false
  }),
  withComputed((store) => ({
    meteoState: computed(() => store.currentMeteo()?.meteoState ?? null),
    score: computed(() => store.currentMeteo()?.calculatedScore ?? 0),
    wasForced: computed(() => store.currentMeteo()?.wasForced ?? false),
    forcingRules: computed(() => store.currentMeteo()?.activeForcingRules ?? []),
    indicatorBreakdown: computed(() => {
      const scores = store.currentMeteo()?.indicatorScores ?? {};
      return Object.entries(scores).map(([code, data]) => ({
        code, ...data
      }));
    }),
  })),
  withMethods((store, meteoService = inject(MeteoService)) => ({
    loadCurrentMeteo: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { loading: true })),
        switchMap(projectId =>
          meteoService.getCurrentMeteo(projectId).pipe(
            tapResponse(
              (meteo) => patchState(store, { currentMeteo: meteo, loading: false }),
              (error: Error) => patchState(store, { loading: false })
            )
          )
        )
      )
    ),
    loadHistory: rxMethod<{ projectId: string; from?: string; to?: string }>(
      pipe(
        switchMap(params =>
          meteoService.getHistory(params.projectId, params.from, params.to).pipe(
            tapResponse(
              (history) => patchState(store, { meteoHistory: history }),
              () => {}
            )
          )
        )
      )
    )
  }))
);
```

## 5. Key Components

### 5.1 Meteo Icon Component

```typescript
@Component({
  selector: 'app-meteo-icon',
  standalone: true,
  template: `
    <div class="meteo-icon" [ngClass]="'meteo-' + state()">
      <img [src]="iconPath()" [alt]="label()" [width]="size()" [height]="size()" />
      @if (showLabel()) {
        <span class="meteo-label">{{ label() }}</span>
      }
      @if (showScore()) {
        <span class="meteo-score">{{ score() }}/100</span>
      }
    </div>
  `,
  styles: [`
    .meteo-icon { display: inline-flex; align-items: center; gap: 8px; }
    .meteo-SOLEIL { color: #f59e0b; }
    .meteo-NUAGE_CLAIR { color: #3b82f6; }
    .meteo-NUAGE_CHARGE { color: #6b7280; }
    .meteo-ORAGE { color: #ef4444; }
    .meteo-label { font-weight: 500; }
    .meteo-score { font-size: 0.875rem; color: #6b7280; }
  `]
})
export class MeteoIconComponent {
  state = input.required<MeteoState>();
  score = input<number>(0);
  size = input<number>(32);
  showLabel = input<boolean>(true);
  showScore = input<boolean>(false);

  iconPath = computed(() => `assets/icons/meteo-${this.state().toLowerCase().replace('_', '-')}.svg`);

  label = computed(() => {
    const labels: Record<MeteoState, string> = {
      'SOLEIL': 'Soleil',
      'NUAGE_CLAIR': 'Nuage Clair',
      'NUAGE_CHARGE': 'Nuage Chargé',
      'ORAGE': 'Orage'
    };
    return labels[this.state()];
  });
}
```

### 5.2 CQD Triptych Component

```typescript
@Component({
  selector: 'app-cqd-triptych',
  standalone: true,
  imports: [CommonModule, TrendArrowComponent, CqdBadgeComponent],
  template: `
    <div class="cqd-triptych">
      @for (dimension of dimensions(); track dimension.key) {
        <div class="cqd-card" [ngClass]="'cqd-' + dimension.state">
          <div class="cqd-header">
            <span class="cqd-icon">{{ dimension.icon }}</span>
            <h3>{{ dimension.label }}</h3>
          </div>
          <div class="cqd-body">
            <app-cqd-badge [state]="dimension.state" />
            <div class="cqd-metric">
              <span class="value">{{ dimension.value }}</span>
              <span class="unit">{{ dimension.unit }}</span>
            </div>
            <app-trend-arrow [trend]="dimension.trend" />
          </div>
          <p class="cqd-explanation">{{ dimension.explanation }}</p>
        </div>
      }
    </div>
  `
})
export class CqdTriptychComponent {
  cqd = input.required<CQDResponse>();

  dimensions = computed(() => [
    {
      key: 'cost', icon: '💰', label: 'Coût',
      state: this.cqd().cost.state,
      value: this.cqd().cost.variancePct.toFixed(1) + '%',
      unit: 'écart', trend: this.cqd().cost.trend,
      explanation: this.cqd().cost.explanation
    },
    {
      key: 'quality', icon: '✅', label: 'Qualité',
      state: this.cqd().quality.state,
      value: this.cqd().quality.score + '/100',
      unit: 'score', trend: this.cqd().quality.trend,
      explanation: this.cqd().quality.explanation
    },
    {
      key: 'delay', icon: '⏱️', label: 'Délai',
      state: this.cqd().delay.state,
      value: this.cqd().delay.variancePct.toFixed(1) + '%',
      unit: 'écart', trend: this.cqd().delay.trend,
      explanation: this.cqd().delay.explanation
    }
  ]);
}
```

### 5.3 Projection Dashboard Component

```typescript
@Component({
  selector: 'app-projection-dashboard',
  standalone: true,
  imports: [
    CommonModule, MeteoIconComponent, ConfidenceBadgeComponent,
    ScenarioComparisonComponent, RecommendationPanelComponent,
    ExplanationPanelComponent, FactorImpactChartComponent,
    TrajectoryChartComponent, BaseChartDirective
  ],
  template: `
    <div class="projection-dashboard">
      <!-- Horizon Selector -->
      <div class="horizon-tabs">
        @for (h of horizons; track h) {
          <button [class.active]="selectedHorizon() === h"
                  (click)="selectHorizon(h)">
            J+{{ h }}
          </button>
        }
      </div>

      @if (store.loading()) {
        <app-loading-spinner />
      } @else if (store.projection(); as proj) {
        <!-- Main Projection Card -->
        <div class="projection-summary">
          <div class="projected-meteo">
            <span class="label">Météo projetée à J+{{ proj.horizonDays }}</span>
            <app-meteo-icon [state]="proj.projectedMeteo"
                            [score]="proj.projectedScore"
                            [showScore]="true" [size]="64" />
          </div>
          <app-confidence-badge [level]="proj.confidence.level"
                                [percentage]="proj.confidence.percentage" />
        </div>

        <!-- Component Scores Radar -->
        <div class="component-scores">
          <h3>Scores par composante</h3>
          <app-factor-impact-chart [components]="proj.componentScores" />
        </div>

        <!-- 3 Scenarios -->
        <app-scenario-comparison [scenarios]="proj.scenarios" />

        <!-- Key Factors -->
        <div class="key-factors">
          <h3>Facteurs clés</h3>
          @for (factor of proj.keyFactors; track factor.factor) {
            <div class="factor" [class]="'impact-' + factor.impact.toLowerCase()">
              <span class="factor-weight">{{ factor.weight }}</span>
              <span class="factor-name">{{ factor.factor }}</span>
              <span class="factor-details">{{ factor.details }}</span>
            </div>
          }
        </div>

        <!-- Recommendations -->
        <app-recommendation-panel [recommendations]="proj.recommendations" />

        <!-- AI Explanation -->
        <app-explanation-panel [explanation]="proj.explanation" />

        <!-- Projected CQD -->
        <div class="projected-cqd">
          <h3>CQD projeté</h3>
          <div class="cqd-chips">
            <app-cqd-badge label="Coût" [state]="proj.projectedCQD.cost" />
            <app-cqd-badge label="Qualité" [state]="proj.projectedCQD.quality" />
            <app-cqd-badge label="Délai" [state]="proj.projectedCQD.delay" />
          </div>
        </div>
      }
    </div>
  `
})
export class ProjectionDashboardComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  readonly store = inject(ProjectionStore);

  horizons = [7, 14, 21, 30, 60];
  selectedHorizon = signal(14);

  ngOnInit() {
    const projectId = this.route.parent!.snapshot.paramMap.get('id')!;
    this.store.loadProjection({ projectId, horizon: this.selectedHorizon() });
  }

  selectHorizon(horizon: number) {
    this.selectedHorizon.set(horizon);
    const projectId = this.route.parent!.snapshot.paramMap.get('id')!;
    this.store.loadProjection({ projectId, horizon });
  }
}
```

### 5.4 Scenario Comparison Component

```typescript
@Component({
  selector: 'app-scenario-comparison',
  standalone: true,
  imports: [CommonModule, MeteoIconComponent],
  template: `
    <div class="scenarios">
      <h3>Scénarios</h3>
      <div class="scenario-cards">
        @for (scenario of scenarioList(); track scenario.type) {
          <div class="scenario-card" [ngClass]="'scenario-' + scenario.type.toLowerCase()">
            <div class="scenario-header">
              <h4>{{ scenario.label }}</h4>
              <span class="probability">{{ (scenario.probability * 100).toFixed(0) }}%</span>
            </div>
            <app-meteo-icon [state]="scenario.meteo" [score]="scenario.score"
                            [showScore]="true" [size]="48" />
            <div class="assumptions">
              <span class="assumptions-title">Hypothèses:</span>
              <ul>
                @for (a of scenario.assumptions; track a) {
                  <li>{{ a }}</li>
                }
              </ul>
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class ScenarioComparisonComponent {
  scenarios = input.required<Scenarios>();

  scenarioList = computed(() => [
    { ...this.scenarios().optimistic, type: 'OPTIMISTIC', label: 'Optimiste' },
    { ...this.scenarios().nominal, type: 'NOMINAL', label: 'Nominal' },
    { ...this.scenarios().pessimistic, type: 'PESSIMISTIC', label: 'Pessimiste' }
  ]);
}
```

### 5.5 HasRole Directive

```typescript
@Directive({
  selector: '[appHasRole]',
  standalone: true
})
export class HasRoleDirective implements OnInit {
  private readonly templateRef = inject(TemplateRef<any>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly authService = inject(AuthService);

  appHasRole = input.required<Role | Role[]>();
  appHasRoleProject = input<string>();

  private hasView = false;

  ngOnInit() {
    effect(() => {
      const user = this.authService.user();
      const roles = Array.isArray(this.appHasRole()) ? this.appHasRole() : [this.appHasRole()];
      const hasRole = user && this.checkRole(user, roles as Role[]);

      if (hasRole && !this.hasView) {
        this.viewContainer.createEmbeddedView(this.templateRef);
        this.hasView = true;
      } else if (!hasRole && this.hasView) {
        this.viewContainer.clear();
        this.hasView = false;
      }
    });
  }

  private checkRole(user: User, roles: Role[]): boolean {
    if (user.defaultRole === 'ADMIN') return true;
    return roles.includes(user.defaultRole as Role);
  }
}
```

## 6. TypeScript Models

```typescript
// core/models/

export type MeteoState = 'SOLEIL' | 'NUAGE_CLAIR' | 'NUAGE_CHARGE' | 'ORAGE';
export type CQDState = 'ALIGNED' | 'UNDER_TENSION' | 'DEGRADED';
export type Trend = 'IMPROVING' | 'STABLE' | 'DETERIORATING';
export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';
export type Role = 'ADMIN' | 'SPONSOR' | 'DIRECTOR' | 'CHEF' | 'MEMBER' | 'OBSERVER';
export type ActionStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
export type ProjectStatus = 'PREPARATION' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' | 'CANCELLED' | 'ARCHIVED';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ProjectSummary {
  id: string;
  name: string;
  code: string;
  status: ProjectStatus;
  type: string;
  criticality: string;
  startDate: string;
  endDate: string;
  budgetTotal: number;
  budgetConsumed: number;
  currentMeteo: MeteoState | null;
  currentScore: number;
  costState: CQDState;
  qualityState: CQDState;
  delayState: CQDState;
  progress: number;
  blockedActions: number;
  openRisks: number;
  daysRemaining: number;
}

export interface MeteoResponse {
  meteoState: MeteoState;
  calculatedScore: number;
  rawScore: number;
  wasForced: boolean;
  activeForcingRules: ForcingRule[];
  calculationDate: string;
  indicatorScores: Record<string, IndicatorScore>;
  moduleScores: Record<string, ModuleScore>;
  explanation: string;
}

export interface ProjectionResponse {
  projectionDate: string;
  horizonDays: number;
  targetDate: string;
  projectedMeteo: MeteoState;
  projectedScore: number;
  confidence: { level: ConfidenceLevel; percentage: number };
  componentScores: Record<string, { score: number; confidence: number; weight: number }>;
  projectedCQD: { cost: CQDState; quality: CQDState; delay: CQDState };
  scenarios: Scenarios;
  keyFactors: KeyFactor[];
  recommendations: Recommendation[];
  explanation: string;
}

export interface Scenarios {
  nominal: Scenario;
  optimistic: Scenario;
  pessimistic: Scenario;
}

export interface Scenario {
  score: number;
  meteo: MeteoState;
  probability: number;
  assumptions: string[];
}

export interface Recommendation {
  priority: Priority;
  category: string;
  title: string;
  description: string;
  expectedImpact: string;
  effort: string;
}

export interface Page<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
```

## 7. Styling Theme

```scss
// _variables.scss

// Météo colors
$meteo-soleil: #f59e0b;
$meteo-soleil-bg: #fffbeb;
$meteo-nuage-clair: #3b82f6;
$meteo-nuage-clair-bg: #eff6ff;
$meteo-nuage-charge: #6b7280;
$meteo-nuage-charge-bg: #f3f4f6;
$meteo-orage: #ef4444;
$meteo-orage-bg: #fef2f2;

// CQD colors
$cqd-aligned: #10b981;
$cqd-aligned-bg: #ecfdf5;
$cqd-tension: #f59e0b;
$cqd-tension-bg: #fffbeb;
$cqd-degraded: #ef4444;
$cqd-degraded-bg: #fef2f2;

// Trend colors
$trend-improving: #10b981;
$trend-stable: #6b7280;
$trend-deteriorating: #ef4444;

// Confidence colors
$confidence-high: #10b981;
$confidence-medium: #f59e0b;
$confidence-low: #ef4444;

// Priority colors
$priority-low: #6b7280;
$priority-medium: #3b82f6;
$priority-high: #f59e0b;
$priority-critical: #ef4444;

// Layout
$sidebar-width: 260px;
$header-height: 64px;
$content-max-width: 1440px;

// Breakpoints
$breakpoint-sm: 640px;
$breakpoint-md: 768px;
$breakpoint-lg: 1024px;
$breakpoint-xl: 1280px;
```

## 8. Charts Configuration

### 8.1 Météo Timeline Chart
```typescript
// Line chart showing météo score evolution over time
meteoTimelineConfig: ChartConfiguration = {
  type: 'line',
  data: {
    labels: [], // dates
    datasets: [{
      label: 'Score Météo',
      data: [], // scores
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fill: true,
      tension: 0.3
    }]
  },
  options: {
    responsive: true,
    plugins: {
      annotation: {
        annotations: {
          soleilLine: { type: 'line', yMin: 85, yMax: 85, borderColor: '#f59e0b', borderDash: [5] },
          nuageLine: { type: 'line', yMin: 70, yMax: 70, borderColor: '#3b82f6', borderDash: [5] },
          chargeLine: { type: 'line', yMin: 50, yMax: 50, borderColor: '#6b7280', borderDash: [5] }
        }
      }
    },
    scales: { y: { min: 0, max: 100 } }
  }
};
```

### 8.2 Component Scores Radar
```typescript
// Radar chart for AI projection component scores
componentRadarConfig: ChartConfiguration = {
  type: 'radar',
  data: {
    labels: ['Tendances', 'Simulation', 'Plan Action', 'Risques', 'Capacité'],
    datasets: [{
      label: 'Score',
      data: [72.5, 68.3, 55.0, 62.0, 72.0],
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.2)'
    }]
  },
  options: {
    scales: {
      r: { min: 0, max: 100, ticks: { stepSize: 20 } }
    }
  }
};
```
