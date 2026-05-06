# MeteoApp

MeteoApp is a project health platform for tracking delivery, budget, quality, risks, and action plans.
It computes a weather-style project status from weighted indicators and forcing rules.
The stack is Spring Boot, Angular, PostgreSQL, Flyway, Docker, and OpenAPI.

## Architecture

```text
Browser
  |
  v
Angular frontend (:80 / :4200)
  |
  v
Spring Boot API (:8080)
  |        |          |
  v        v          v
PostgreSQL Flyway   OpenAPI/Actuator
```

## Quick Start

```bash
docker compose up -d
```

Open http://localhost

Default login:

```text
admin@meteoproject.com
Admin@2026!
```

API documentation: http://localhost:8080/swagger-ui.html

Health check: http://localhost:8080/actuator/health

## Development Mode

Backend:

```bash
cd backend
./mvnw spring-boot:run
```

Frontend:

```bash
cd frontend
npm install
npx ng serve
```

Open http://localhost:4200

## Environment Variables

| Variable | Default | Description |
| --- | --- | --- |
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_NAME` | `meteo_db` | PostgreSQL database |
| `DB_USERNAME` | `meteo_user` | PostgreSQL username |
| `DB_PASSWORD` | `meteo_pass_2026` | PostgreSQL password |
| `JWT_SECRET` | development secret | JWT signing key; replace in production |
| `CORS_ORIGINS` | `http://localhost:4200,http://127.0.0.1:4200,http://0.0.0.0:4200` | Allowed browser origins |
| `GROQ_URL` | `https://api.groq.com/openai/v1` | Groq-compatible API base URL |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` | AI model name |
| `GROQ_API_KEY` | empty | AI API key |

## Test Document Import

Three sample project files live in `samples/import/`:

| File | Purpose |
| --- | --- |
| `project-alpha-plan.txt` | Project scope, modules, and actions |
| `project-alpha-indicators.csv` | Indicator values to import or copy into the app |
| `project-alpha-risks.txt` | Risks and mitigation notes |

To test import:

1. Start the app and log in as the default admin.
2. Open the AI assistant or import screen.
3. Upload or paste each sample file, starting with the plan, then indicators, then risks.
4. Review the extracted data, confirm the import, and verify the project dashboard, indicators, risks, meteo calculation, and projection screens.

## Useful Checks

```bash
cd backend
./mvnw clean package -DskipTests
./mvnw test
```

```bash
cd frontend
npm install
npx ng build --configuration=production
npx ng lint
```
