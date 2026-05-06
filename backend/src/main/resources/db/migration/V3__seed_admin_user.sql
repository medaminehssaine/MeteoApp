-- =============================================
-- V3: Seed default admin user
-- Local bootstrap only. Rotate this account before any shared demo.
-- =============================================

INSERT INTO users (id, email, password_hash, first_name, last_name, default_role, active, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'admin@meteoproject.com',
    '$2a$12$8eG/rFKEqbBuQFJlDPJv8uGHHViqE8OjEbAvTn.JU3u7HXzmv6.O6',
    'Admin',
    'Système',
    'ADMIN',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO NOTHING;
