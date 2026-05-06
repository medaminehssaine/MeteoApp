-- ============================================================
-- SEED: Indicator Library (20 default indicators)
-- ============================================================

INSERT INTO indicator_library (code, name, description, category, unit, is_inverted, default_threshold_green, default_threshold_orange, default_threshold_red, default_weight) VALUES
-- PROGRESS
('PRG-001', 'Avancement global', 'Pourcentage d''avancement pondéré du projet', 'PROGRESS', 'PERCENTAGE', FALSE, 90, 75, 50, 30),
('PRG-002', 'Respect des jalons', 'Pourcentage de jalons respectés', 'PROGRESS', 'PERCENTAGE', FALSE, 95, 80, 60, 25),
('PRG-003', 'Taux actions terminées', 'Ratio actions terminées / total', 'PROGRESS', 'PERCENTAGE', FALSE, 85, 70, 50, 20),
('PRG-004', 'Vélocité équipe', 'Score de vélocité', 'PROGRESS', 'SCORE', FALSE, 80, 60, 40, 15),
('PRG-005', 'Taux actions bloquées', 'Pourcentage d''actions bloquées', 'PROGRESS', 'PERCENTAGE', TRUE, 5, 15, 30, 10),
-- BUDGET
('BDG-001', 'Écart budgétaire', 'Écart entre budget consommé et prévu', 'BUDGET', 'PERCENTAGE', TRUE, 5, 15, 30, 35),
('BDG-002', 'Taux de consommation', 'Budget consommé vs budget total', 'BUDGET', 'PERCENTAGE', TRUE, 95, 110, 130, 30),
('BDG-003', 'Projection fin de projet', 'Écart budgétaire projeté', 'BUDGET', 'DHS', TRUE, 5, 15, 30, 20),
('BDG-004', 'ROI prévisionnel', 'Retour sur investissement projeté', 'BUDGET', 'PERCENTAGE', FALSE, 80, 60, 40, 15),
-- RISK
('RSK-001', 'Nombre risques ouverts', 'Risques en statut ouvert', 'RISK', 'NUMBER', TRUE, 3, 7, 12, 30),
('RSK-002', 'Sévérité moyenne', 'Score moyen de sévérité', 'RISK', 'SCORE', TRUE, 30, 50, 70, 35),
('RSK-003', 'Risques matérialisés', 'Nombre de risques matérialisés', 'RISK', 'NUMBER', TRUE, 1, 3, 5, 20),
('RSK-004', 'Couverture mitigation', 'Risques avec plan de mitigation', 'RISK', 'PERCENTAGE', FALSE, 80, 60, 40, 15),
-- QUALITY
('QAL-001', 'Taux de défauts', 'Livrables avec défauts', 'QUALITY', 'PERCENTAGE', TRUE, 5, 15, 30, 30),
('QAL-002', 'Couverture tests', 'Couverture de tests', 'QUALITY', 'PERCENTAGE', FALSE, 80, 60, 40, 25),
('QAL-003', 'Conformité livrables', 'Conformité aux spécifications', 'QUALITY', 'PERCENTAGE', FALSE, 90, 75, 50, 25),
('QAL-004', 'Satisfaction client', 'Score satisfaction sponsor', 'QUALITY', 'SCORE', FALSE, 80, 60, 40, 20),
-- RESOURCE
('RES-001', 'Taux d''occupation', 'Utilisation des ressources', 'RESOURCE', 'PERCENTAGE', TRUE, 85, 95, 110, 30),
('RES-002', 'Turnover équipe', 'Rotation de l''équipe', 'RESOURCE', 'PERCENTAGE', TRUE, 5, 15, 30, 25),
('RES-003', 'Disponibilité compétences', 'Compétences clés disponibles', 'RESOURCE', 'PERCENTAGE', FALSE, 90, 70, 50, 25);

-- ============================================================
-- SEED: Default admin user (password: Admin@2026)
-- ============================================================
INSERT INTO users (email, password_hash, first_name, last_name, default_role, active) VALUES
('admin@meteoproject.com', '$2a$12$LJ3m4ys3uz0MHRrkbQqLaOTEfaFVMFKzMYn5Y9B.kXjvxKnqGK/yG', 'Admin', 'System', 'ADMIN', true);
