# Meteo Projet MVP Scope

## Goal

Present a focused, credible project-health cockpit that proves the core promise:

Facts entered by the project team are transformed into an objective Meteo state, CQD status, risks, and recommended actions.

## Demo Story

1. A user logs in and sees a portfolio dashboard.
2. They open a project and review its Meteo score, CQD status, active risks, overdue actions, and indicators.
3. They update factual project data: progress, indicator value, risk, or corrective action.
4. The system recalculates project health and explains why the state changed.
5. They generate a projection/recommendation view for management discussion.

## MVP Modules

### Must Be Polished

- Authentication and role-aware navigation.
- Portfolio dashboard with scoped project KPIs.
- Project list and project detail shell.
- Plan actions with progress, blocked state, late state, and responsible owner.
- Indicators with scoring and last-update visibility.
- Meteo calculation with forcing rules and explanation.
- CQD calculation for cost, quality, and delay.
- Risks with severity and mitigation coverage.
- Corrective actions linked to risks, indicators, or blockers.
- Projection summary using deterministic layers first, AI text as optional enrichment.

### Must Be Honest

- Missing data must be shown as incomplete, not healthy.
- AI-extracted facts must be marked as suggestions until validated.
- Exports can be disabled or marked "coming next" unless real PDF/Excel output exists.
- Demo credentials must not be displayed in the UI.
- Secrets must come from environment variables.

### Out Of MVP

- Full Gantt editor.
- Public external API.
- Automated scheduled reports.
- Advanced AI training/fine-tuning.
- Real-time notifications.
- Multi-tenant billing or SaaS administration.
- Deep analytics on historical AI accuracy.

## Presentation Layout

### Dashboard

- Top KPI strip: active projects, projects in Orage, blocked actions, overdue actions.
- Main table: project, Meteo, CQD, progress, budget usage, deadline, risk count.
- Right rail: alerts requiring action.

### Project Detail

- Header: project name, status, criticality, owner, last update.
- Tabs: Overview, Plan, Indicators, Meteo, CQD, Risks, Corrective Actions, Projection.
- Overview: compact health summary with the next three decisions/actions.

### Design Direction

- Use a professional Angular application layout: persistent sidenav, top app bar, breadcrumbs, dense tables, clear tabs, consistent forms.
- Prefer quiet enterprise styling over a marketing-style hero.
- Keep the orange brand accent, but reduce dark glass effects and emoji-heavy controls.
- Use icons for navigation/actions, tooltips for icon-only buttons, and stable responsive dimensions.

## Definition Of Done For MVP

- `npm run build` passes in `frontend`.
- `mvnw.cmd test` passes in `backend`.
- No hardcoded production secrets.
- No fake successful exports.
- Core pages have empty, loading, and error states.
- Business rules in code match the documented rules.
- The demo flow works without manual database edits.
