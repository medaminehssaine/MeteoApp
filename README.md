# Météo Projet

**Zero-subjectivity project health tracking platform with AI-powered projections.**

No more gut feelings. The PM enters facts → the system calculates the weather → AI predicts the trajectory.

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────┐
│  Angular 17 SPA │────▶│  Spring Boot 3.2  │────▶│ PostgreSQL 16│
│  White + Orange  │     │  REST API (JWT)   │     │  + Flyway     │
└─────────────────┘     └──────────────────┘     └──────────────┘
                              │
                    ┌─────────┴──────────┐
                    │  AI Projection Engine │
                    │  5-Layer Compositor   │
                    └─────────┬──────────┘
                              │
                    ┌─────────┴──────────┐
                    │  Ollama (Local LLM)  │
                    │  Mistral 7B · Free   │
                    └──────────────────────┘
```

## Core Concepts

| Concept | Description |
|---------|-------------|
| **Meteo Score** | 0-100 score → ☀️ SOLEIL (85+), 🌤️ NUAGE_CLAIR (70-84), ☁️ NUAGE_CHARGE (50-69), ⛈️ ORAGE (0-49) |
| **CQD Triptych** | Cost / Quality / Delay each rated ALIGNED / UNDER_TENSION / DEGRADED |
| **Forcing Rules** | 5 rules that auto-force ORAGE regardless of score |
| **AI Engine** | 5-Layer scoring + Local LLM (Ollama/Mistral) for NL explanations |

## Quick Start

```bash
# Clone and run
docker-compose up -d

# Access
Frontend:  http://localhost
Backend:   http://localhost:8080
Swagger:   http://localhost:8080/swagger-ui.html
```

Set `GROQ_API_KEY` to enable AI narrative enrichment. Without it, the deterministic scoring engine still works.

Admin credentials are seeded for local development; keep them in private setup notes and rotate them before any shared demo.

### Local Development (without Docker)

```bash
# 1. Backend
cd backend && ./mvnw spring-boot:run

# 2. Frontend
cd frontend && npm install && ng serve
```

## Backend Stack

- Java 17 + Spring Boot 3.2.5
- Spring Security + JWT (access 1h, refresh 7d)
- PostgreSQL 16 + Flyway migrations
- 11 REST controllers, 50+ endpoints
- 6 RBAC roles (ADMIN, SPONSOR, DIRECTOR, CHEF, MEMBER, OBSERVER)
- 20 default indicators across 5 categories

## AI Engine - 5 Layers

1. **TrendAnalyzer** - Weighted Moving Average + Linear Regression on historical scores
2. **PlanSimulator** - Monte Carlo simulation (100 iterations) of action plan execution
3. **ActionPlanEvaluator** - Evaluates plan health: completion rate, blocking ratio, feasibility
4. **RiskIntegrator** - Risk exposure scoring with mitigation coverage analysis
5. **CapacityAnalyzer** - Team workload distribution and resource availability

**Output**: 3 scenarios (Nominal/Optimistic/Pessimistic) with confidence level and actionable recommendations.

## Frontend

- Angular 17+ standalone components
- Signal-based state management
- White + Orange (#FF6B00) design system
- Weather-themed data visualization
- Responsive layout with sidebar navigation

## Project Structure

```
MeteoApp/
├── backend/
│   └── src/main/java/com/meteoproject/
│       ├── config/          # Security, JWT, OpenAPI, MeteoProperties
│       ├── controller/      # 11 REST controllers
│       ├── domain/          # JPA entities + enums
│       ├── dto/             # Request/Response DTOs
│       ├── exception/       # Global error handling
│       ├── repository/      # Spring Data JPA repos
│       ├── security/        # JWT filter + provider
│       └── service/         # Business logic + AI engine
├── frontend/
│   └── src/app/
│       ├── core/            # Services, guards, interceptors
│       ├── features/        # Auth, Dashboard, Projects, Meteo, CQD, etc.
│       └── shared/          # Shared components
├── Conception/              # 17 design documents
├── AI-Training-Guide/       # Synthetic data + tuning guide
└── docker-compose.yml
```

## API Endpoints

| Module | Endpoints | Description |
|--------|-----------|-------------|
| Auth | 5 | Login, register, refresh, logout, change password |
| Users | 6 | Profile, list, activate/deactivate |
| Projects | 11 | CRUD, modules, team management |
| Plan | 9 | Actions, dependencies, progress |
| Indicators | 6 | Library, assign, update values, scoring |
| Meteo | 3 | Calculate, current, history |
| CQD | 3 | Calculate, current, history |
| Projections | 3 | Generate, latest, history |
| Risks | 6 | CRUD, summary |
| Corrective | 6 | CRUD, my actions, overdue |
| Audit | 3 | Logs by user/entity |

## License

Proprietary - All rights reserved.
