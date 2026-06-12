-- 1. USERS
CREATE TABLE users (
    user_id BIGSERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    password_hash TEXT NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. ROLES
CREATE TABLE roles (
    role_id BIGSERIAL PRIMARY KEY,
    role_name VARCHAR(100) UNIQUE NOT NULL
);

-- 3. PERMISSIONS (required before role_permissions)
CREATE TABLE permissions (
    permission_id BIGSERIAL PRIMARY KEY,
    permission_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT
);

-- 4. USER_ROLES
CREATE TABLE user_roles (
    user_id BIGINT REFERENCES users(user_id),
    role_id BIGINT REFERENCES roles(role_id),
    PRIMARY KEY(user_id, role_id)
);

-- 5. ROLE_PERMISSIONS
CREATE TABLE role_permissions (
    role_id BIGINT NOT NULL,

    permission_id BIGINT NOT NULL,

    PRIMARY KEY(role_id, permission_id),

    CONSTRAINT fk_rp_role
        FOREIGN KEY(role_id)
        REFERENCES roles(role_id),

    CONSTRAINT fk_rp_permission
        FOREIGN KEY(permission_id)
        REFERENCES permissions(permission_id)
);

-- 6. SESSIONS
CREATE TABLE sessions (
    session_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    refresh_token TEXT NOT NULL,
    ip_address VARCHAR(100),
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP,

    CONSTRAINT fk_sessions_user
        FOREIGN KEY(user_id)
        REFERENCES users(user_id)
);

-- 7. AUDIT_LOGS
CREATE TABLE audit_logs (
    audit_id BIGSERIAL PRIMARY KEY,

    user_id BIGINT,

    action_type VARCHAR(50) NOT NULL,

    entity_name VARCHAR(100) NOT NULL,

    record_id VARCHAR(100),

    old_value JSONB,

    new_value JSONB,

    ip_address VARCHAR(100),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_audit_user
        FOREIGN KEY(user_id)
        REFERENCES users(user_id)
);

-- 8. APP_SETTINGS
CREATE TABLE app_settings (
    setting_id BIGSERIAL PRIMARY KEY,

    setting_key VARCHAR(200) UNIQUE NOT NULL,

    setting_value TEXT,

    description TEXT,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);