# ARCHITECTURE TECHNIQUE - METEO PROJET v2.0

## 1. Architecture Globale

```
┌──────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                        │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │              Angular 17+ (Standalone Components)           │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐ │  │
│  │  │Dashboard │ │ Projects │ │ Météo    │ │ AI Module    │ │  │
│  │  │Module    │ │ Module   │ │ Module   │ │ Projections  │ │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────┘ │  │
│  │  ┌──────────────────────────────────────────────────────┐ │  │
│  │  │           NgRx Signal Store (State Management)       │ │  │
│  │  └──────────────────────────────────────────────────────┘ │  │
│  └────────────────────────────────────────────────────────────┘  │
│                              │ HTTP/REST                         │
│                              ▼                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    API GATEWAY LAYER                       │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐ │  │
│  │  │JWT Auth  │ │Rate Limit│ │CORS      │ │Request Log   │ │  │
│  │  │Filter    │ │Filter    │ │Filter    │ │Filter        │ │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────┘ │  │
│  └────────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                   APPLICATION LAYER                        │  │
│  │                  (Spring Boot 3.2+)                        │  │
│  │  ┌──────────────────────────────────────────────────────┐ │  │
│  │  │              REST Controllers (/api/v1)              │ │  │
│  │  └──────────────────────────────────────────────────────┘ │  │
│  │  ┌──────────────────────────────────────────────────────┐ │  │
│  │  │    Service Layer (Business Logic + Validation)       │ │  │
│  │  └──────────────────────────────────────────────────────┘ │  │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────────────────┐│  │
│  │  │Météo Engine│ │CQD Engine  │ │   AI Projection Engine ││  │
│  │  │(Rule-Based)│ │(Calculator)│ │  (Multi-Layer Engine)  ││  │
│  │  └────────────┘ └────────────┘ └────────────────────────┘│  │
│  │  ┌──────────────────────────────────────────────────────┐ │  │
│  │  │         Repository Layer (Spring Data JPA)           │ │  │
│  │  └──────────────────────────────────────────────────────┘ │  │
│  └────────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    DATA LAYER                              │  │
│  │  ┌──────────────┐    ┌──────────────┐                     │  │
│  │  │ PostgreSQL   │    │    Redis      │                     │  │
│  │  │ (Primary DB) │    │   (Cache)     │                     │  │
│  │  └──────────────┘    └──────────────┘                     │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

## 2. Structure Backend (Spring Boot)

```
com.meteoproject/
├── MeteoProjectApplication.java
│
├── config/
│   ├── SecurityConfig.java
│   ├── JwtConfig.java
│   ├── CorsConfig.java
│   ├── RedisConfig.java
│   ├── OpenApiConfig.java
│   ├── AuditConfig.java
│   └── AsyncConfig.java
│
├── security/
│   ├── jwt/
│   │   ├── JwtTokenProvider.java
│   │   ├── JwtAuthenticationFilter.java
│   │   ├── JwtAuthenticationEntryPoint.java
│   │   └── JwtTokenRefreshService.java
│   ├── rbac/
│   │   ├── ProjectRoleEvaluator.java
│   │   ├── RequiresProjectRole.java          // Custom annotation
│   │   └── ProjectRoleAspect.java            // AOP for role checking
│   └── UserPrincipal.java
│
├── domain/                                    // JPA Entities
│   ├── user/
│   │   ├── User.java
│   │   ├── UserProjectRole.java
│   │   └── enums/
│   │       └── Role.java
│   ├── project/
│   │   ├── Project.java
│   │   └── enums/
│   │       ├── ProjectType.java
│   │       ├── ProjectStatus.java
│   │       ├── Criticality.java
│   │       └── Visibility.java
│   ├── plan/
│   │   ├── Module.java
│   │   ├── Action.java
│   │   ├── ActionDependency.java
│   │   └── enums/
│   │       ├── ActionStatus.java
│   │       ├── BlockingType.java
│   │       └── DependencyType.java
│   ├── indicator/
│   │   ├── IndicatorLibrary.java
│   │   ├── ProjectIndicator.java
│   │   ├── IndicatorValueHistory.java
│   │   └── enums/
│   │       ├── IndicatorCategory.java
│   │       ├── IndicatorState.java
│   │       ├── Unit.java
│   │       └── Frequency.java
│   ├── corrective/
│   │   ├── CorrectiveAction.java
│   │   └── enums/
│   │       └── Priority.java
│   ├── meteo/
│   │   ├── MeteoHistory.java
│   │   └── enums/
│   │       └── MeteoState.java
│   ├── cqd/
│   │   ├── CQDHistory.java
│   │   └── enums/
│   │       ├── CQDState.java
│   │       └── Trend.java
│   ├── projection/
│   │   ├── Projection.java
│   │   └── enums/
│   │       └── ConfidenceLevel.java
│   ├── risk/
│   │   ├── Risk.java
│   │   └── enums/
│   │       ├── RiskCategory.java
│   │       └── RiskStatus.java
│   └── audit/
│       └── AuditLog.java
│
├── repository/
│   ├── UserRepository.java
│   ├── UserProjectRoleRepository.java
│   ├── ProjectRepository.java
│   ├── ModuleRepository.java
│   ├── ActionRepository.java
│   ├── ActionDependencyRepository.java
│   ├── IndicatorLibraryRepository.java
│   ├── ProjectIndicatorRepository.java
│   ├── IndicatorValueHistoryRepository.java
│   ├── CorrectiveActionRepository.java
│   ├── MeteoHistoryRepository.java
│   ├── CQDHistoryRepository.java
│   ├── ProjectionRepository.java
│   ├── RiskRepository.java
│   └── AuditLogRepository.java
│
├── service/
│   ├── auth/
│   │   ├── AuthService.java
│   │   └── AuthServiceImpl.java
│   ├── user/
│   │   ├── UserService.java
│   │   └── UserServiceImpl.java
│   ├── project/
│   │   ├── ProjectService.java
│   │   └── ProjectServiceImpl.java
│   ├── plan/
│   │   ├── ModuleService.java
│   │   ├── ActionService.java
│   │   ├── ActionDependencyService.java
│   │   └── CriticalPathService.java
│   ├── indicator/
│   │   ├── IndicatorLibraryService.java
│   │   ├── ProjectIndicatorService.java
│   │   └── IndicatorScoringService.java
│   ├── corrective/
│   │   └── CorrectiveActionService.java
│   ├── meteo/
│   │   ├── MeteoCalculationService.java       // Core météo engine
│   │   ├── ForcingRuleEngine.java             // R20-R24
│   │   ├── MeteoAggregationService.java       // Module/Project aggregation
│   │   └── MeteoHistoryService.java
│   ├── cqd/
│   │   ├── CQDCalculationService.java
│   │   └── CQDHistoryService.java
│   ├── ai/                                    // AI MODULE
│   │   ├── ProjectionService.java             // Orchestrator
│   │   ├── engine/
│   │   │   ├── TrendAnalyzer.java             // Layer 1: Trend analysis
│   │   │   ├── PlanSimulator.java             // Layer 2: Plan simulation
│   │   │   ├── ActionPlanEvaluator.java       // Layer 3: Action plan eval
│   │   │   ├── RiskIntegrator.java            // Layer 4: Risk integration
│   │   │   ├── CapacityAnalyzer.java          // Layer 5: Capacity analysis
│   │   │   └── ProjectionCompositor.java      // Final composition
│   │   ├── scoring/
│   │   │   ├── ConfidenceCalculator.java
│   │   │   └── ScenarioGenerator.java
│   │   ├── explanation/
│   │   │   ├── ExplanationEngine.java
│   │   │   └── RecommendationEngine.java
│   │   └── synthetic/
│   │       └── SyntheticDataGenerator.java    // Test data for AI
│   ├── risk/
│   │   └── RiskService.java
│   ├── export/
│   │   ├── PdfExportService.java
│   │   └── ExcelExportService.java
│   └── audit/
│       └── AuditService.java
│
├── controller/
│   ├── AuthController.java                    // /api/v1/auth
│   ├── UserController.java                    // /api/v1/users
│   ├── ProjectController.java                 // /api/v1/projects
│   ├── ModuleController.java                  // /api/v1/projects/{id}/modules
│   ├── ActionController.java                  // /api/v1/projects/{id}/actions
│   ├── IndicatorLibraryController.java        // /api/v1/indicators/library
│   ├── ProjectIndicatorController.java        // /api/v1/projects/{id}/indicators
│   ├── CorrectiveActionController.java        // /api/v1/projects/{id}/corrective-actions
│   ├── MeteoController.java                   // /api/v1/projects/{id}/meteo
│   ├── CQDController.java                     // /api/v1/projects/{id}/cqd
│   ├── ProjectionController.java              // /api/v1/projects/{id}/projections
│   ├── RiskController.java                    // /api/v1/projects/{id}/risks
│   ├── DashboardController.java               // /api/v1/dashboard
│   └── ExportController.java                  // /api/v1/exports
│
├── dto/
│   ├── request/
│   │   ├── LoginRequest.java
│   │   ├── CreateProjectRequest.java
│   │   ├── CreateActionRequest.java
│   │   ├── RecordIndicatorValueRequest.java
│   │   ├── CreateCorrectiveActionRequest.java
│   │   ├── CreateRiskRequest.java
│   │   └── ProjectionRequest.java
│   ├── response/
│   │   ├── AuthResponse.java
│   │   ├── ProjectResponse.java
│   │   ├── ProjectDetailResponse.java
│   │   ├── ActionResponse.java
│   │   ├── MeteoResponse.java
│   │   ├── CQDResponse.java
│   │   ├── ProjectionResponse.java
│   │   ├── DashboardResponse.java
│   │   └── PageResponse.java
│   └── mapper/
│       ├── ProjectMapper.java
│       ├── ActionMapper.java
│       ├── IndicatorMapper.java
│       └── ProjectionMapper.java
│
├── exception/
│   ├── GlobalExceptionHandler.java
│   ├── ResourceNotFoundException.java
│   ├── BusinessRuleViolationException.java
│   ├── UnauthorizedException.java
│   └── ErrorResponse.java
│
├── validation/
│   ├── ProjectValidator.java
│   ├── ActionValidator.java
│   ├── IndicatorValidator.java
│   └── CircularDependencyValidator.java
│
└── util/
    ├── DateUtils.java
    └── ScoreUtils.java
```

## 3. Structure Frontend (Angular)

```
src/
├── app/
│   ├── app.component.ts
│   ├── app.config.ts
│   ├── app.routes.ts
│   │
│   ├── core/
│   │   ├── auth/
│   │   │   ├── services/
│   │   │   │   ├── auth.service.ts
│   │   │   │   └── token.service.ts
│   │   │   ├── guards/
│   │   │   │   ├── auth.guard.ts
│   │   │   │   └── role.guard.ts
│   │   │   ├── interceptors/
│   │   │   │   ├── jwt.interceptor.ts
│   │   │   │   └── error.interceptor.ts
│   │   │   └── models/
│   │   │       ├── user.model.ts
│   │   │       └── auth-response.model.ts
│   │   ├── services/
│   │   │   ├── api.service.ts                 // Base HTTP service
│   │   │   ├── notification.service.ts
│   │   │   └── loading.service.ts
│   │   └── models/
│   │       ├── api-response.model.ts
│   │       └── pagination.model.ts
│   │
│   ├── shared/
│   │   ├── components/
│   │   │   ├── meteo-icon/                    // ☀️🌤️☁️⛈️ component
│   │   │   │   └── meteo-icon.component.ts
│   │   │   ├── cqd-badge/                     // CQD state badge
│   │   │   │   └── cqd-badge.component.ts
│   │   │   ├── trend-arrow/                   // ↑→↓ trend indicator
│   │   │   │   └── trend-arrow.component.ts
│   │   │   ├── score-gauge/                   // Circular score gauge
│   │   │   │   └── score-gauge.component.ts
│   │   │   ├── confidence-badge/              // AI confidence level
│   │   │   │   └── confidence-badge.component.ts
│   │   │   ├── data-table/                    // Generic sortable table
│   │   │   │   └── data-table.component.ts
│   │   │   ├── confirm-dialog/
│   │   │   │   └── confirm-dialog.component.ts
│   │   │   └── loading-spinner/
│   │   │       └── loading-spinner.component.ts
│   │   ├── pipes/
│   │   │   ├── meteo-label.pipe.ts
│   │   │   ├── cqd-label.pipe.ts
│   │   │   └── relative-date.pipe.ts
│   │   └── directives/
│   │       ├── has-role.directive.ts
│   │       └── tooltip.directive.ts
│   │
│   ├── features/
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   │   └── login.component.ts
│   │   │   ├── reset-password/
│   │   │   │   └── reset-password.component.ts
│   │   │   └── profile/
│   │   │       └── profile.component.ts
│   │   │
│   │   ├── dashboard/
│   │   │   ├── dashboard.component.ts         // Main dashboard
│   │   │   ├── components/
│   │   │   │   ├── project-overview-card/
│   │   │   │   ├── meteo-summary/
│   │   │   │   ├── cqd-overview/
│   │   │   │   ├── alerts-panel/
│   │   │   │   └── kpi-cards/
│   │   │   ├── store/
│   │   │   │   └── dashboard.store.ts
│   │   │   └── services/
│   │   │       └── dashboard.service.ts
│   │   │
│   │   ├── projects/
│   │   │   ├── project-list/
│   │   │   │   └── project-list.component.ts
│   │   │   ├── project-detail/
│   │   │   │   └── project-detail.component.ts
│   │   │   ├── project-form/
│   │   │   │   └── project-form.component.ts
│   │   │   ├── store/
│   │   │   │   └── project.store.ts
│   │   │   └── services/
│   │   │       └── project.service.ts
│   │   │
│   │   ├── plan/
│   │   │   ├── plan-overview/
│   │   │   │   └── plan-overview.component.ts
│   │   │   ├── gantt-chart/
│   │   │   │   └── gantt-chart.component.ts
│   │   │   ├── action-form/
│   │   │   │   └── action-form.component.ts
│   │   │   ├── critical-path/
│   │   │   │   └── critical-path.component.ts
│   │   │   ├── store/
│   │   │   │   └── plan.store.ts
│   │   │   └── services/
│   │   │       └── plan.service.ts
│   │   │
│   │   ├── indicators/
│   │   │   ├── indicator-dashboard/
│   │   │   │   └── indicator-dashboard.component.ts
│   │   │   ├── indicator-form/
│   │   │   │   └── indicator-form.component.ts
│   │   │   ├── indicator-history/
│   │   │   │   └── indicator-history.component.ts
│   │   │   ├── store/
│   │   │   │   └── indicator.store.ts
│   │   │   └── services/
│   │   │       └── indicator.service.ts
│   │   │
│   │   ├── meteo/
│   │   │   ├── meteo-dashboard/
│   │   │   │   └── meteo-dashboard.component.ts
│   │   │   ├── meteo-history/
│   │   │   │   └── meteo-history.component.ts
│   │   │   ├── meteo-detail/
│   │   │   │   └── meteo-detail.component.ts
│   │   │   ├── components/
│   │   │   │   ├── weather-card/
│   │   │   │   ├── score-breakdown/
│   │   │   │   ├── forcing-rules-panel/
│   │   │   │   └── meteo-timeline/
│   │   │   ├── store/
│   │   │   │   └── meteo.store.ts
│   │   │   └── services/
│   │   │       └── meteo.service.ts
│   │   │
│   │   ├── cqd/
│   │   │   ├── cqd-dashboard/
│   │   │   │   └── cqd-dashboard.component.ts
│   │   │   ├── components/
│   │   │   │   ├── cqd-triptych/              // 3-panel C/Q/D view
│   │   │   │   ├── cqd-radar-chart/
│   │   │   │   └── cqd-trend-chart/
│   │   │   ├── store/
│   │   │   │   └── cqd.store.ts
│   │   │   └── services/
│   │   │       └── cqd.service.ts
│   │   │
│   │   ├── projections/                       // AI MODULE UI
│   │   │   ├── projection-dashboard/
│   │   │   │   └── projection-dashboard.component.ts
│   │   │   ├── components/
│   │   │   │   ├── projection-card/           // Single projection view
│   │   │   │   ├── scenario-comparison/       // 3-scenario comparison
│   │   │   │   ├── confidence-meter/          // Visual confidence
│   │   │   │   ├── recommendation-panel/      // AI recommendations
│   │   │   │   ├── factor-impact-chart/       // Key factors radar
│   │   │   │   ├── trajectory-chart/          // Projected trajectory
│   │   │   │   └── explanation-panel/         // AI explanation
│   │   │   ├── store/
│   │   │   │   └── projection.store.ts
│   │   │   └── services/
│   │   │       └── projection.service.ts
│   │   │
│   │   ├── risks/
│   │   │   ├── risk-matrix/
│   │   │   │   └── risk-matrix.component.ts   // Probability x Impact
│   │   │   ├── risk-form/
│   │   │   │   └── risk-form.component.ts
│   │   │   ├── store/
│   │   │   │   └── risk.store.ts
│   │   │   └── services/
│   │   │       └── risk.service.ts
│   │   │
│   │   ├── corrective-actions/
│   │   │   ├── action-plan/
│   │   │   │   └── action-plan.component.ts
│   │   │   ├── action-form/
│   │   │   │   └── corrective-action-form.component.ts
│   │   │   └── services/
│   │   │       └── corrective-action.service.ts
│   │   │
│   │   └── admin/
│   │       ├── user-management/
│   │       │   └── user-management.component.ts
│   │       ├── audit-log/
│   │       │   └── audit-log.component.ts
│   │       └── services/
│   │           └── admin.service.ts
│   │
│   └── layout/
│       ├── main-layout/
│       │   └── main-layout.component.ts
│       ├── sidebar/
│       │   └── sidebar.component.ts
│       ├── header/
│       │   └── header.component.ts
│       └── footer/
│           └── footer.component.ts
│
├── assets/
│   ├── icons/
│   │   ├── meteo-soleil.svg
│   │   ├── meteo-nuage-clair.svg
│   │   ├── meteo-nuage-charge.svg
│   │   └── meteo-orage.svg
│   ├── i18n/
│   │   ├── fr.json
│   │   └── en.json
│   └── styles/
│       ├── _variables.scss
│       ├── _meteo-theme.scss
│       └── _mixins.scss
│
└── environments/
    ├── environment.ts
    └── environment.prod.ts
```

## 4. Flux de Données Principal

```
[User Browser]
    │
    ▼ HTTP Request + JWT
[Angular HttpClient + JwtInterceptor]
    │
    ▼ POST /api/v1/projects/{id}/indicators/{indId}/values
[Spring Security Filter Chain]
    │  ├─ JwtAuthenticationFilter → validate token
    │  ├─ ProjectRoleAspect → check CHEF role on project
    │  └─ RateLimitFilter → check rate
    ▼
[IndicatorController.recordValue()]
    │
    ▼ DTO validation (Jakarta @Valid)
[ProjectIndicatorService.recordValue()]
    │  ├─ Validate value against business rules (R1-R5)
    │  ├─ Calculate score (R11)
    │  ├─ Save to IndicatorValueHistory
    │  └─ Trigger async recalculation
    ▼
[MeteoCalculationService.recalculate(projectId)]  ← @Async
    │  ├─ Load all active ProjectIndicators
    │  ├─ Apply weighting with criticality (R12)
    │  ├─ Aggregate by module (R13)
    │  ├─ Aggregate project score (R14)
    │  ├─ Convert to MeteoState
    │  ├─ Apply forcing rules (R20-R24)
    │  ├─ Generate explanation
    │  └─ Save MeteoHistory
    ▼
[CQDCalculationService.recalculate(projectId)]  ← @Async
    │  ├─ Calculate cost variance
    │  ├─ Calculate quality score
    │  ├─ Calculate delay variance
    │  ├─ Determine states
    │  ├─ Calculate trends
    │  └─ Save CQDHistory
    ▼
[Cache invalidation → Redis]
    │
    ▼ WebSocket notification (optional)
[Angular Dashboard auto-refreshes]
```

## 5. Sécurité - Flux JWT

```
┌─────────────┐                          ┌─────────────┐
│   Angular    │                          │ Spring Boot │
│   Client     │                          │   Server    │
└──────┬──────┘                          └──────┬──────┘
       │                                        │
       │  POST /api/v1/auth/login               │
       │  {email, password}                     │
       ├───────────────────────────────────────►│
       │                                        │  Validate credentials
       │                                        │  Generate JWT (1h)
       │                                        │  Generate Refresh (7d)
       │  {accessToken, refreshToken, user}     │
       │◄───────────────────────────────────────┤
       │                                        │
       │  Store tokens in memory (NOT localStorage) 
       │                                        │
       │  GET /api/v1/projects                  │
       │  Authorization: Bearer <accessToken>   │
       ├───────────────────────────────────────►│
       │                                        │  JwtAuthFilter validates
       │                                        │  Extract userId, roles
       │  {data: [...]}                         │
       │◄───────────────────────────────────────┤
       │                                        │
       │  ... Token expires ...                 │
       │                                        │
       │  POST /api/v1/auth/refresh             │
       │  {refreshToken}                        │
       ├───────────────────────────────────────►│
       │                                        │  Validate refresh token
       │                                        │  Issue new access token
       │  {accessToken}                         │
       │◄───────────────────────────────────────┤
```

## 6. Stratégie de Cache (Redis)

| Clé | TTL | Invalidation |
|-----|-----|-------------|
| `meteo:project:{id}` | 5 min | On indicator update, on action update |
| `cqd:project:{id}` | 5 min | On budget update, on action update |
| `dashboard:user:{id}` | 2 min | On any project update |
| `projection:project:{id}:{horizon}` | 15 min | On indicator update |
| `project:detail:{id}` | 5 min | On project update |

## 7. API Versioning & Error Handling

### Error Response Format
```json
{
  "timestamp": "2026-04-11T10:30:00Z",
  "status": 400,
  "error": "Bad Request",
  "code": "BUSINESS_RULE_VIOLATION",
  "message": "L'avancement doit être entre 0 et 100",
  "details": {
    "field": "progress",
    "rejectedValue": 150,
    "rule": "R1"
  },
  "path": "/api/v1/projects/123/actions/456"
}
```

### HTTP Status Codes
| Code | Usage |
|------|-------|
| 200 | Success (GET, PUT) |
| 201 | Created (POST) |
| 204 | No Content (DELETE) |
| 400 | Validation error / Business rule violation |
| 401 | Not authenticated |
| 403 | Not authorized (wrong role) |
| 404 | Resource not found |
| 409 | Conflict (duplicate, circular dependency) |
| 429 | Rate limit exceeded |
| 500 | Internal server error |
