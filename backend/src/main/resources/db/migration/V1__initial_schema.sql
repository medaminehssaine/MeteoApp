-- ============================================================
-- MÉTÉO PROJET v2.0 - Initial Schema
-- ============================================================

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    default_role VARCHAR(20) NOT NULL DEFAULT 'MEMBER',
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
-- PROJECTS
-- ============================================================
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    code VARCHAR(20) NOT NULL UNIQUE,
    short_description TEXT,
    long_description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    budget_total DECIMAL(15,2) NOT NULL DEFAULT 0,
    budget_consumed DECIMAL(15,2) NOT NULL DEFAULT 0,
    type VARCHAR(30) NOT NULL DEFAULT 'APPLICATION',
    criticality VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    visibility VARCHAR(20) NOT NULL DEFAULT 'RESTRICTED',
    status VARCHAR(20) NOT NULL DEFAULT 'PREPARATION',
    sponsor_id UUID REFERENCES users(id),
    director_id UUID REFERENCES users(id),
    chef_id UUID REFERENCES users(id),
    last_update_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_project_dates CHECK (end_date > start_date),
    CONSTRAINT chk_budget CHECK (budget_total >= 0)
);

CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_director ON projects(director_id);
CREATE INDEX idx_projects_chef ON projects(chef_id);

-- ============================================================
-- USER PROJECT ROLES
-- ============================================================
CREATE TABLE user_project_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,
    assigned_at DATE NOT NULL DEFAULT CURRENT_DATE,
    removed_at DATE
);

CREATE INDEX idx_upr_user ON user_project_roles(user_id);
CREATE INDEX idx_upr_project ON user_project_roles(project_id);
CREATE INDEX idx_upr_active ON user_project_roles(removed_at) WHERE removed_at IS NULL;

-- ============================================================
-- MODULES
-- ============================================================
CREATE TABLE modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    weight DECIMAL(5,2) NOT NULL DEFAULT 0,
    responsible_id UUID REFERENCES users(id),
    start_date DATE,
    end_date DATE,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_module_name UNIQUE (project_id, name),
    CONSTRAINT chk_weight CHECK (weight >= 0 AND weight <= 100)
);

CREATE INDEX idx_modules_project ON modules(project_id);

-- ============================================================
-- ACTIONS
-- ============================================================
CREATE TABLE actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    status VARCHAR(20) NOT NULL DEFAULT 'NOT_STARTED',
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    blocking_reason TEXT,
    blocking_type VARCHAR(20),
    blocked_since DATE,
    is_milestone BOOLEAN NOT NULL DEFAULT FALSE,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_action_dates CHECK (planned_end >= planned_start)
);

CREATE INDEX idx_actions_project ON actions(project_id);
CREATE INDEX idx_actions_module ON actions(module_id);
CREATE INDEX idx_actions_status ON actions(status);
CREATE INDEX idx_actions_blocked ON actions(status, blocked_since) WHERE status = 'BLOCKED';

-- ============================================================
-- ACTION DEPENDENCIES
-- ============================================================
CREATE TABLE action_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_action_id UUID NOT NULL REFERENCES actions(id) ON DELETE CASCADE,
    target_action_id UUID NOT NULL REFERENCES actions(id) ON DELETE CASCADE,
    dependency_type VARCHAR(30) NOT NULL DEFAULT 'FINISH_TO_START',
    lag_days INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT chk_no_self CHECK (source_action_id != target_action_id),
    CONSTRAINT uq_dep UNIQUE (source_action_id, target_action_id)
);

CREATE INDEX idx_deps_source ON action_dependencies(source_action_id);
CREATE INDEX idx_deps_target ON action_dependencies(target_action_id);

-- ============================================================
-- INDICATOR LIBRARY
-- ============================================================
CREATE TABLE indicator_library (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(20) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    calculation_formula TEXT,
    is_inverted BOOLEAN NOT NULL DEFAULT FALSE,
    default_threshold_green DECIMAL(10,2) NOT NULL,
    default_threshold_orange DECIMAL(10,2) NOT NULL,
    default_threshold_red DECIMAL(10,2) NOT NULL,
    default_weight DECIMAL(5,2) NOT NULL DEFAULT 10,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PROJECT INDICATORS
-- ============================================================
CREATE TABLE project_indicators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    indicator_library_id UUID NOT NULL REFERENCES indicator_library(id),
    threshold_green DECIMAL(10,2) NOT NULL,
    threshold_orange DECIMAL(10,2) NOT NULL,
    threshold_red DECIMAL(10,2) NOT NULL,
    weight DECIMAL(5,2) NOT NULL CHECK (weight >= 0 AND weight <= 100),
    criticality VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    criticality_coefficient DECIMAL(3,1) NOT NULL DEFAULT 1.0,
    frequency VARCHAR(20) NOT NULL DEFAULT 'WEEKLY',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    current_value DECIMAL(10,2),
    current_score INTEGER,
    last_measured_at DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_project_indicator UNIQUE (project_id, indicator_library_id)
);

CREATE INDEX idx_pi_project ON project_indicators(project_id);

-- ============================================================
-- INDICATOR VALUE HISTORY
-- ============================================================
CREATE TABLE indicator_value_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_indicator_id UUID NOT NULL REFERENCES project_indicators(id) ON DELETE CASCADE,
    value DECIMAL(10,2) NOT NULL,
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
    state VARCHAR(20) NOT NULL,
    measured_at DATE NOT NULL,
    comment TEXT,
    recorded_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ivh_indicator ON indicator_value_history(project_indicator_id);
CREATE INDEX idx_ivh_date ON indicator_value_history(measured_at DESC);

-- ============================================================
-- RISKS
-- ============================================================
CREATE TABLE risks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    category VARCHAR(20) NOT NULL,
    probability INTEGER NOT NULL CHECK (probability >= 0 AND probability <= 100),
    impact INTEGER NOT NULL CHECK (impact >= 0 AND impact <= 100),
    severity INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'IDENTIFIED',
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

-- ============================================================
-- CORRECTIVE ACTIONS
-- ============================================================
CREATE TABLE corrective_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    indicator_id UUID REFERENCES project_indicators(id),
    blocked_action_id UUID REFERENCES actions(id),
    risk_id UUID REFERENCES risks(id),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    responsible_id UUID REFERENCES users(id),
    deadline DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    expected_impact TEXT,
    actual_impact TEXT,
    completed_at DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ca_project ON corrective_actions(project_id);
CREATE INDEX idx_ca_status ON corrective_actions(status);

-- ============================================================
-- METEO HISTORY
-- ============================================================
CREATE TABLE meteo_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    calculation_date DATE NOT NULL,
    meteo_state VARCHAR(20) NOT NULL,
    calculated_score DECIMAL(5,2) NOT NULL,
    raw_score DECIMAL(5,2),
    was_forced BOOLEAN NOT NULL DEFAULT FALSE,
    active_forcing_rules JSONB DEFAULT '[]',
    indicator_scores JSONB DEFAULT '{}',
    module_scores JSONB DEFAULT '{}',
    explanation TEXT,
    triggered_by VARCHAR(50) DEFAULT 'MANUAL',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mh_project ON meteo_history(project_id);
CREATE INDEX idx_mh_date ON meteo_history(project_id, calculation_date DESC);

-- ============================================================
-- CQD HISTORY
-- ============================================================
CREATE TABLE cqd_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    calculation_date DATE NOT NULL,
    cost_state VARCHAR(20) NOT NULL,
    cost_variance_pct DECIMAL(8,2) NOT NULL,
    cost_budget_consumed DECIMAL(15,2),
    cost_budget_planned DECIMAL(15,2),
    cost_explanation TEXT,
    quality_state VARCHAR(20) NOT NULL,
    quality_score INTEGER NOT NULL,
    quality_explanation TEXT,
    delay_state VARCHAR(20) NOT NULL,
    delay_variance_pct DECIMAL(8,2) NOT NULL,
    delay_planned_progress DECIMAL(5,2),
    delay_actual_progress DECIMAL(5,2),
    delay_explanation TEXT,
    cost_trend VARCHAR(20) NOT NULL DEFAULT 'STABLE',
    quality_trend VARCHAR(20) NOT NULL DEFAULT 'STABLE',
    delay_trend VARCHAR(20) NOT NULL DEFAULT 'STABLE',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cqd_project ON cqd_history(project_id);
CREATE INDEX idx_cqd_date ON cqd_history(project_id, calculation_date DESC);

-- ============================================================
-- PROJECTIONS (AI)
-- ============================================================
CREATE TABLE projections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    projection_date DATE NOT NULL DEFAULT CURRENT_DATE,
    horizon_days INTEGER NOT NULL,
    target_date DATE NOT NULL,
    projected_meteo VARCHAR(20) NOT NULL,
    projected_score DECIMAL(5,2) NOT NULL,
    confidence_level VARCHAR(10) NOT NULL,
    confidence_pct DECIMAL(5,2) NOT NULL,
    trend_score DECIMAL(5,2),
    simulation_score DECIMAL(5,2),
    action_plan_score DECIMAL(5,2),
    risk_score DECIMAL(5,2),
    capacity_score DECIMAL(5,2),
    projected_cost_state VARCHAR(20),
    projected_quality_state VARCHAR(20),
    projected_delay_state VARCHAR(20),
    projected_indicators JSONB DEFAULT '{}',
    assumptions TEXT,
    key_factors JSONB DEFAULT '[]',
    scenarios JSONB DEFAULT '{}',
    recommendations JSONB DEFAULT '[]',
    explanation TEXT,
    actual_meteo VARCHAR(20),
    actual_score DECIMAL(5,2),
    accuracy_score DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_proj_project ON projections(project_id);
CREATE INDEX idx_proj_date ON projections(projection_date DESC);

-- ============================================================
-- REFRESH TOKENS
-- ============================================================
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rt_user ON refresh_tokens(user_id);
CREATE INDEX idx_rt_token ON refresh_tokens(token);

-- ============================================================
-- AUDIT LOG
-- ============================================================
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    project_id UUID REFERENCES projects(id),
    action VARCHAR(20) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    description TEXT,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_project ON audit_log(project_id);
CREATE INDEX idx_audit_date ON audit_log(created_at DESC);
