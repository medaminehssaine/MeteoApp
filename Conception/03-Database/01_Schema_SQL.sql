-- ============================================================
-- MÉTÉO PROJET - DATABASE SCHEMA (PostgreSQL 15+)
-- Enhanced v2.0
-- ============================================================

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE role_type AS ENUM (
    'ADMIN', 'SPONSOR', 'DIRECTOR', 'CHEF', 'MEMBER', 'OBSERVER'
);

CREATE TYPE project_type AS ENUM (
    'INFRASTRUCTURE', 'APPLICATION', 'ORGANIZATIONAL'
);

CREATE TYPE project_status AS ENUM (
    'PREPARATION', 'IN_PROGRESS', 'PAUSED', 'COMPLETED', 'CANCELLED', 'ARCHIVED'
);

CREATE TYPE criticality_type AS ENUM (
    'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
);

CREATE TYPE visibility_type AS ENUM (
    'RESTRICTED', 'EXTENDED', 'PUBLIC'
);

CREATE TYPE action_status AS ENUM (
    'NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED'
);

CREATE TYPE blocking_type AS ENUM (
    'RESOURCE', 'DEPENDENCY', 'TECHNICAL', 'DECISION'
);

CREATE TYPE dependency_type AS ENUM (
    'FINISH_TO_START', 'START_TO_START', 'FINISH_TO_FINISH', 'START_TO_FINISH'
);

CREATE TYPE indicator_category AS ENUM (
    'PROGRESS', 'BUDGET', 'RISK', 'QUALITY', 'RESOURCE'
);

CREATE TYPE indicator_unit AS ENUM (
    'PERCENTAGE', 'NUMBER', 'DHS', 'SCORE', 'DAYS', 'RATIO'
);

CREATE TYPE indicator_state AS ENUM (
    'EXCELLENT', 'GOOD', 'WARNING', 'ALERT', 'CRITICAL'
);

CREATE TYPE frequency_type AS ENUM (
    'DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY'
);

CREATE TYPE priority_type AS ENUM (
    'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
);

CREATE TYPE corrective_status AS ENUM (
    'OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'
);

CREATE TYPE meteo_state AS ENUM (
    'SOLEIL', 'NUAGE_CLAIR', 'NUAGE_CHARGE', 'ORAGE'
);

CREATE TYPE cqd_state AS ENUM (
    'ALIGNED', 'UNDER_TENSION', 'DEGRADED'
);

CREATE TYPE trend_type AS ENUM (
    'IMPROVING', 'STABLE', 'DETERIORATING'
);

CREATE TYPE confidence_level AS ENUM (
    'HIGH', 'MEDIUM', 'LOW'
);

CREATE TYPE risk_category AS ENUM (
    'TECHNICAL', 'RESOURCE', 'BUDGET', 'PLANNING', 'QUALITY', 'EXTERNAL'
);

CREATE TYPE risk_status AS ENUM (
    'IDENTIFIED', 'ANALYZING', 'MITIGATING', 'MATERIALIZED', 'CLOSED'
);

CREATE TYPE audit_action AS ENUM (
    'CREATE', 'UPDATE', 'DELETE', 'VIEW', 'CALCULATE', 'LOGIN', 'LOGOUT', 'EXPORT'
);

CREATE TYPE forcing_rule_type AS ENUM (
    'BLOCKED_ACTION', 'LATE_ACTIONS', 'BUDGET_OVERRUN', 'CRITICAL_NO_ACTION', 'NO_UPDATE'
);

-- ============================================================
-- TABLE: users
-- ============================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    default_role role_type NOT NULL DEFAULT 'MEMBER',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(active);

-- ============================================================
-- TABLE: projects
-- ============================================================
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    code VARCHAR(20) NOT NULL UNIQUE,
    short_description TEXT,
    long_description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    budget_total DECIMAL(15, 2) NOT NULL DEFAULT 0,
    budget_consumed DECIMAL(15, 2) NOT NULL DEFAULT 0,
    type project_type NOT NULL DEFAULT 'APPLICATION',
    criticality criticality_type NOT NULL DEFAULT 'MEDIUM',
    visibility visibility_type NOT NULL DEFAULT 'RESTRICTED',
    status project_status NOT NULL DEFAULT 'PREPARATION',
    sponsor_id UUID REFERENCES users(id),
    director_id UUID REFERENCES users(id),
    chef_id UUID REFERENCES users(id),
    last_update_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_project_dates CHECK (end_date > start_date),
    CONSTRAINT chk_project_budget CHECK (budget_total >= 0),
    CONSTRAINT chk_project_budget_consumed CHECK (budget_consumed >= 0)
);

CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_sponsor ON projects(sponsor_id);
CREATE INDEX idx_projects_director ON projects(director_id);
CREATE INDEX idx_projects_chef ON projects(chef_id);

-- ============================================================
-- TABLE: user_project_roles
-- ============================================================
CREATE TABLE user_project_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    role role_type NOT NULL,
    assigned_at DATE NOT NULL DEFAULT CURRENT_DATE,
    removed_at DATE,

    CONSTRAINT uq_active_user_project_role UNIQUE (user_id, project_id, role, removed_at)
);

CREATE INDEX idx_upr_user ON user_project_roles(user_id);
CREATE INDEX idx_upr_project ON user_project_roles(project_id);
CREATE INDEX idx_upr_active ON user_project_roles(removed_at) WHERE removed_at IS NULL;

-- ============================================================
-- TABLE: modules
-- ============================================================
CREATE TABLE modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    weight DECIMAL(5, 2) NOT NULL DEFAULT 0 CHECK (weight >= 0 AND weight <= 100),
    responsible_id UUID REFERENCES users(id),
    start_date DATE,
    end_date DATE,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_module_name_project UNIQUE (project_id, name)
);

CREATE INDEX idx_modules_project ON modules(project_id);

-- ============================================================
-- TABLE: actions
-- ============================================================
CREATE TABLE actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    duration_days INTEGER NOT NULL CHECK (duration_days > 0),
    planned_start DATE NOT NULL,
    actual_start DATE,
    planned_end DATE NOT NULL,
    actual_end DATE,
    responsible_id UUID REFERENCES users(id),
    status action_status NOT NULL DEFAULT 'NOT_STARTED',
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    blocking_reason TEXT,
    blocking_type blocking_type,
    blocked_since DATE,
    is_milestone BOOLEAN NOT NULL DEFAULT FALSE,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_action_dates CHECK (planned_end >= planned_start),
    CONSTRAINT chk_blocked_reason CHECK (
        (status = 'BLOCKED' AND blocking_reason IS NOT NULL AND blocking_type IS NOT NULL)
        OR status != 'BLOCKED'
    )
);

CREATE INDEX idx_actions_project ON actions(project_id);
CREATE INDEX idx_actions_module ON actions(module_id);
CREATE INDEX idx_actions_status ON actions(status);
CREATE INDEX idx_actions_responsible ON actions(responsible_id);
CREATE INDEX idx_actions_blocked ON actions(status, blocked_since) WHERE status = 'BLOCKED';

-- ============================================================
-- TABLE: action_dependencies
-- ============================================================
CREATE TABLE action_dependencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_action_id UUID NOT NULL REFERENCES actions(id) ON DELETE CASCADE,
    target_action_id UUID NOT NULL REFERENCES actions(id) ON DELETE CASCADE,
    dependency_type dependency_type NOT NULL DEFAULT 'FINISH_TO_START',
    lag_days INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT chk_no_self_dependency CHECK (source_action_id != target_action_id),
    CONSTRAINT uq_action_dependency UNIQUE (source_action_id, target_action_id)
);

CREATE INDEX idx_deps_source ON action_dependencies(source_action_id);
CREATE INDEX idx_deps_target ON action_dependencies(target_action_id);

-- ============================================================
-- TABLE: indicator_library
-- ============================================================
CREATE TABLE indicator_library (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category indicator_category NOT NULL,
    unit indicator_unit NOT NULL,
    calculation_formula TEXT,
    is_inverted BOOLEAN NOT NULL DEFAULT FALSE,
    default_threshold_green DECIMAL(10, 2) NOT NULL,
    default_threshold_orange DECIMAL(10, 2) NOT NULL,
    default_threshold_red DECIMAL(10, 2) NOT NULL,
    default_weight DECIMAL(5, 2) NOT NULL DEFAULT 10,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: project_indicators
-- ============================================================
CREATE TABLE project_indicators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    indicator_library_id UUID NOT NULL REFERENCES indicator_library(id),
    threshold_green DECIMAL(10, 2) NOT NULL,
    threshold_orange DECIMAL(10, 2) NOT NULL,
    threshold_red DECIMAL(10, 2) NOT NULL,
    weight DECIMAL(5, 2) NOT NULL CHECK (weight >= 0 AND weight <= 100),
    criticality criticality_type NOT NULL DEFAULT 'MEDIUM',
    criticality_coefficient DECIMAL(3, 1) NOT NULL DEFAULT 1.0
        CHECK (criticality_coefficient IN (0.5, 1.0, 1.5, 2.0)),
    frequency frequency_type NOT NULL DEFAULT 'WEEKLY',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    current_value DECIMAL(10, 2),
    current_score INTEGER,
    last_measured_at DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_project_indicator UNIQUE (project_id, indicator_library_id)
);

CREATE INDEX idx_pi_project ON project_indicators(project_id);
CREATE INDEX idx_pi_active ON project_indicators(is_active) WHERE is_active = TRUE;

-- ============================================================
-- TABLE: indicator_value_history
-- ============================================================
CREATE TABLE indicator_value_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_indicator_id UUID NOT NULL REFERENCES project_indicators(id) ON DELETE CASCADE,
    value DECIMAL(10, 2) NOT NULL,
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
    state indicator_state NOT NULL,
    measured_at DATE NOT NULL,
    comment TEXT,
    recorded_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ivh_indicator ON indicator_value_history(project_indicator_id);
CREATE INDEX idx_ivh_date ON indicator_value_history(measured_at DESC);
CREATE INDEX idx_ivh_indicator_date ON indicator_value_history(project_indicator_id, measured_at DESC);

-- ============================================================
-- TABLE: corrective_actions
-- ============================================================
CREATE TABLE corrective_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    indicator_id UUID REFERENCES project_indicators(id),
    blocked_action_id UUID REFERENCES actions(id),
    risk_id UUID,  -- FK added after risk table creation
    title VARCHAR(500) NOT NULL,
    description TEXT,
    priority priority_type NOT NULL DEFAULT 'MEDIUM',
    responsible_id UUID REFERENCES users(id),
    deadline DATE NOT NULL,
    status corrective_status NOT NULL DEFAULT 'OPEN',
    expected_impact TEXT,
    actual_impact TEXT,
    completed_at DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ca_project ON corrective_actions(project_id);
CREATE INDEX idx_ca_indicator ON corrective_actions(indicator_id);
CREATE INDEX idx_ca_status ON corrective_actions(status);
CREATE INDEX idx_ca_open ON corrective_actions(project_id, status) WHERE status IN ('OPEN', 'IN_PROGRESS');

-- ============================================================
-- TABLE: meteo_history
-- ============================================================
CREATE TABLE meteo_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    calculation_date DATE NOT NULL,
    meteo_state meteo_state NOT NULL,
    calculated_score DECIMAL(5, 2) NOT NULL CHECK (calculated_score >= 0 AND calculated_score <= 100),
    raw_score DECIMAL(5, 2),
    was_forced BOOLEAN NOT NULL DEFAULT FALSE,
    active_forcing_rules JSONB DEFAULT '[]',
    indicator_scores JSONB NOT NULL DEFAULT '{}',
    module_scores JSONB NOT NULL DEFAULT '{}',
    explanation TEXT,
    triggered_by VARCHAR(50) DEFAULT 'MANUAL',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_meteo_project_date UNIQUE (project_id, calculation_date)
);

CREATE INDEX idx_mh_project ON meteo_history(project_id);
CREATE INDEX idx_mh_date ON meteo_history(calculation_date DESC);
CREATE INDEX idx_mh_project_date ON meteo_history(project_id, calculation_date DESC);

-- ============================================================
-- TABLE: cqd_history
-- ============================================================
CREATE TABLE cqd_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    calculation_date DATE NOT NULL,

    -- Cost
    cost_state cqd_state NOT NULL,
    cost_variance_pct DECIMAL(8, 2) NOT NULL,
    cost_budget_consumed DECIMAL(15, 2),
    cost_budget_planned DECIMAL(15, 2),
    cost_explanation TEXT,

    -- Quality
    quality_state cqd_state NOT NULL,
    quality_score INTEGER NOT NULL CHECK (quality_score >= 0 AND quality_score <= 100),
    quality_explanation TEXT,

    -- Delay
    delay_state cqd_state NOT NULL,
    delay_variance_pct DECIMAL(8, 2) NOT NULL,
    delay_planned_progress DECIMAL(5, 2),
    delay_actual_progress DECIMAL(5, 2),
    delay_explanation TEXT,

    -- Trends
    cost_trend trend_type NOT NULL DEFAULT 'STABLE',
    quality_trend trend_type NOT NULL DEFAULT 'STABLE',
    delay_trend trend_type NOT NULL DEFAULT 'STABLE',

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_cqd_project_date UNIQUE (project_id, calculation_date)
);

CREATE INDEX idx_cqd_project ON cqd_history(project_id);
CREATE INDEX idx_cqd_date ON cqd_history(calculation_date DESC);

-- ============================================================
-- TABLE: risks
-- ============================================================
CREATE TABLE risks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    category risk_category NOT NULL,
    probability INTEGER NOT NULL CHECK (probability >= 0 AND probability <= 100),
    impact INTEGER NOT NULL CHECK (impact >= 0 AND impact <= 100),
    severity INTEGER GENERATED ALWAYS AS (probability * impact / 100) STORED,
    status risk_status NOT NULL DEFAULT 'IDENTIFIED',
    mitigation_plan TEXT,
    contingency_plan TEXT,
    owner_id UUID REFERENCES users(id),
    identified_at DATE NOT NULL DEFAULT CURRENT_DATE,
    review_date DATE,
    materialized_at DATE,
    closed_at DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_risks_project ON risks(project_id);
CREATE INDEX idx_risks_status ON risks(status);
CREATE INDEX idx_risks_severity ON risks(severity DESC);

-- Add FK from corrective_actions to risks
ALTER TABLE corrective_actions
    ADD CONSTRAINT fk_ca_risk FOREIGN KEY (risk_id) REFERENCES risks(id);

-- ============================================================
-- TABLE: projections (AI)
-- ============================================================
CREATE TABLE projections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    projection_date DATE NOT NULL DEFAULT CURRENT_DATE,
    horizon_days INTEGER NOT NULL CHECK (horizon_days IN (7, 14, 21, 30, 60)),
    target_date DATE NOT NULL,

    -- Projected météo
    projected_meteo meteo_state NOT NULL,
    projected_score DECIMAL(5, 2) NOT NULL,

    -- Confidence
    confidence_level confidence_level NOT NULL,
    confidence_pct DECIMAL(5, 2) NOT NULL CHECK (confidence_pct >= 0 AND confidence_pct <= 100),

    -- AI Components scores
    trend_score DECIMAL(5, 2),
    simulation_score DECIMAL(5, 2),
    action_plan_score DECIMAL(5, 2),
    risk_score DECIMAL(5, 2),
    capacity_score DECIMAL(5, 2),

    -- Projected CQD
    projected_cost_state cqd_state,
    projected_quality_state cqd_state,
    projected_delay_state cqd_state,

    -- Details
    projected_indicators JSONB DEFAULT '{}',
    assumptions TEXT,
    key_factors JSONB DEFAULT '[]',
    scenarios JSONB DEFAULT '{}',
    recommendations JSONB DEFAULT '[]',
    explanation TEXT,

    -- Accuracy tracking (filled when target_date is reached)
    actual_meteo meteo_state,
    actual_score DECIMAL(5, 2),
    accuracy_score DECIMAL(5, 2),

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_proj_project ON projections(project_id);
CREATE INDEX idx_proj_date ON projections(projection_date DESC);
CREATE INDEX idx_proj_target ON projections(target_date);
CREATE INDEX idx_proj_accuracy ON projections(accuracy_score) WHERE accuracy_score IS NOT NULL;

-- ============================================================
-- TABLE: notification_preferences
-- ============================================================
CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notify_meteo_change BOOLEAN DEFAULT TRUE,
    notify_blocking BOOLEAN DEFAULT TRUE,
    notify_deadline BOOLEAN DEFAULT TRUE,
    notify_orage BOOLEAN DEFAULT TRUE,
    email_digest_frequency frequency_type DEFAULT 'DAILY',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_notif_user UNIQUE (user_id)
);

-- ============================================================
-- TABLE: audit_log
-- ============================================================
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    project_id UUID REFERENCES projects(id),
    action audit_action NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    description TEXT,
    ip_address INET,
    user_agent VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_project ON audit_log(project_id);
CREATE INDEX idx_audit_date ON audit_log(created_at DESC);
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);

-- ============================================================
-- TABLE: refresh_tokens
-- ============================================================
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rt_user ON refresh_tokens(user_id);
CREATE INDEX idx_rt_token ON refresh_tokens(token);
CREATE INDEX idx_rt_expires ON refresh_tokens(expires_at) WHERE revoked = FALSE;

-- ============================================================
-- VIEWS
-- ============================================================

-- Vue: Dernier état météo par projet
CREATE VIEW v_latest_meteo AS
SELECT DISTINCT ON (project_id)
    project_id,
    calculation_date,
    meteo_state,
    calculated_score,
    was_forced,
    explanation
FROM meteo_history
ORDER BY project_id, calculation_date DESC;

-- Vue: Dernier CQD par projet
CREATE VIEW v_latest_cqd AS
SELECT DISTINCT ON (project_id)
    project_id,
    calculation_date,
    cost_state, cost_variance_pct, cost_trend,
    quality_state, quality_score, quality_trend,
    delay_state, delay_variance_pct, delay_trend
FROM cqd_history
ORDER BY project_id, calculation_date DESC;

-- Vue: Résumé projet (dashboard)
CREATE VIEW v_project_summary AS
SELECT
    p.id,
    p.name,
    p.code,
    p.status,
    p.criticality,
    p.start_date,
    p.end_date,
    p.budget_total,
    p.budget_consumed,
    m.meteo_state AS current_meteo,
    m.calculated_score AS current_score,
    c.cost_state,
    c.quality_state,
    c.delay_state,
    (SELECT COUNT(*) FROM actions a WHERE a.project_id = p.id AND a.status = 'BLOCKED') AS blocked_actions,
    (SELECT COUNT(*) FROM actions a WHERE a.project_id = p.id AND a.status != 'COMPLETED' AND a.planned_end < CURRENT_DATE) AS late_actions,
    (SELECT COUNT(*) FROM risks r WHERE r.project_id = p.id AND r.status NOT IN ('CLOSED', 'MATERIALIZED')) AS open_risks
FROM projects p
LEFT JOIN v_latest_meteo m ON m.project_id = p.id
LEFT JOIN v_latest_cqd c ON c.project_id = p.id
WHERE p.status NOT IN ('ARCHIVED', 'CANCELLED');

-- ============================================================
-- SEED: Indicator Library
-- ============================================================

INSERT INTO indicator_library (code, name, description, category, unit, is_inverted, default_threshold_green, default_threshold_orange, default_threshold_red, default_weight) VALUES
-- PROGRESS
('PRG-001', 'Avancement global', 'Pourcentage d''avancement pondéré du projet', 'PROGRESS', 'PERCENTAGE', FALSE, 90, 75, 50, 30),
('PRG-002', 'Respect des jalons', 'Pourcentage de jalons respectés', 'PROGRESS', 'PERCENTAGE', FALSE, 95, 80, 60, 25),
('PRG-003', 'Taux actions terminées', 'Ratio actions terminées / total', 'PROGRESS', 'PERCENTAGE', FALSE, 85, 70, 50, 20),
('PRG-004', 'Vélocité équipe', 'Score de vélocité de l''équipe', 'PROGRESS', 'SCORE', FALSE, 80, 60, 40, 15),
('PRG-005', 'Taux actions bloquées', 'Pourcentage d''actions bloquées', 'PROGRESS', 'PERCENTAGE', TRUE, 5, 15, 30, 10),
-- BUDGET
('BDG-001', 'Écart budgétaire', 'Écart entre budget consommé et prévu', 'BUDGET', 'PERCENTAGE', TRUE, 5, 15, 30, 35),
('BDG-002', 'Taux de consommation', 'Budget consommé vs budget total', 'BUDGET', 'PERCENTAGE', TRUE, 95, 110, 130, 30),
('BDG-003', 'Projection fin de projet', 'Écart budgétaire projeté à la fin', 'BUDGET', 'DHS', TRUE, 5, 15, 30, 20),
('BDG-004', 'ROI prévisionnel', 'Retour sur investissement projeté', 'BUDGET', 'PERCENTAGE', FALSE, 80, 60, 40, 15),
-- RISK
('RSK-001', 'Nombre risques ouverts', 'Risques en statut ouvert', 'RISK', 'NUMBER', TRUE, 3, 7, 12, 30),
('RSK-002', 'Sévérité moyenne', 'Score moyen de sévérité des risques', 'RISK', 'SCORE', TRUE, 30, 50, 70, 35),
('RSK-003', 'Risques matérialisés', 'Nombre de risques matérialisés', 'RISK', 'NUMBER', TRUE, 1, 3, 5, 20),
('RSK-004', 'Couverture mitigation', 'Pourcentage de risques avec plan de mitigation', 'RISK', 'PERCENTAGE', FALSE, 80, 60, 40, 15),
-- QUALITY
('QAL-001', 'Taux de défauts', 'Pourcentage de livrables avec défauts', 'QUALITY', 'PERCENTAGE', TRUE, 5, 15, 30, 30),
('QAL-002', 'Couverture tests', 'Pourcentage de couverture de tests', 'QUALITY', 'PERCENTAGE', FALSE, 80, 60, 40, 25),
('QAL-003', 'Conformité livrables', 'Taux de conformité aux spécifications', 'QUALITY', 'PERCENTAGE', FALSE, 90, 75, 50, 25),
('QAL-004', 'Satisfaction client', 'Score de satisfaction du sponsor/client', 'QUALITY', 'SCORE', FALSE, 80, 60, 40, 20),
-- RESOURCE
('RES-001', 'Taux d''occupation', 'Utilisation des ressources', 'RESOURCE', 'PERCENTAGE', TRUE, 85, 95, 110, 30),
('RES-002', 'Turnover équipe', 'Taux de rotation de l''équipe', 'RESOURCE', 'PERCENTAGE', TRUE, 5, 15, 30, 25),
('RES-003', 'Disponibilité compétences', 'Pourcentage compétences clés disponibles', 'RESOURCE', 'PERCENTAGE', FALSE, 90, 70, 50, 25),
('RES-004', 'Charge vs capacité', 'Ratio charge de travail / capacité', 'RESOURCE', 'RATIO', TRUE, 1.0, 1.2, 1.5, 20);

-- ============================================================
-- FLYWAY BASELINE
-- ============================================================
-- This file should be saved as: V1__initial_schema.sql
-- Subsequent migrations: V2__xxx.sql, V3__xxx.sql, etc.
