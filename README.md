# University ERP System

This project is a University ERP system consisting of a React-based frontend and a Go-based backend. It supports both local host execution and Docker Compose deployment.

---

## 1. Service Management (`run.sh`)

We provide a unified control script `run.sh` at the root directory to manage the application lifecycle. It automatically cleans up port conflicts (ports `5173` and `8080`) to prevent `502 Bad Gateway` issues.

| Command | Mode | Description | Logs / Output |
| :--- | :--- | :--- | :--- |
| **`bash run.sh host`** | Local Host | Shuts down any active Docker containers, releases ports, and runs the Go backend and Vite frontend in the background. | `backend.log`, `frontend.log` |
| **`bash run.sh docker`** | Docker Compose | Releases host ports and launches the entire stack (frontend, backend, database) inside Docker containers. | Printed directly to console |
| **`bash run.sh status`** | Status | Displays the status of running host processes (with PIDs) and lists active Docker containers. | Printed directly to console |
| **`bash run.sh stop`** | Shutdown | Shuts down active Docker containers and terminates host background processes running on ports `5173` and `8080`. | Console confirmation |

---

## 2. Configuration & IPs Setup

The frontend and backend use flexible configurations via environment variables to target database servers and backend APIs.

### Backend Environment Configuration (`backend/.env`)
Create or edit `backend/.env` to configure your PostgreSQL instance:
```env
DB_HOST=192.168.1.201       # Database server IP (use 127.0.0.1 for local docker DB)
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=root
DB_NAME=universe            # Target database name
DB_SSLMODE=disable

JWT_SECRET=demoSecretKey
SEED_DB=false               # Set to true on first run to auto-create default admin credentials
```

### Frontend Environment Configuration (`frontend/.env`)
Create or edit `frontend/.env` to configure your API endpoint connection:
```env
VITE_API_BASE_URL=/api
VITE_API_BACKEND_URL=http://127.0.0.1:8080  # Backend IP/port (use http://backend:8080 inside Docker)
```

---

## 3. Default Super Admin Credentials

If the database is seeded (`SEED_DB=true`), you can log in to the ERP using the default administrator account:
- **Username**: `admin`
- **Password**: `admin123`

> [!WARNING]
> Please change this default password immediately after logging in for the first time.

---

## 4. Role Metadata Reference

Inside the database system, user roles are assigned the following IDs:
- **University Admin Role ID**: `2`
- **College Admin Role ID**: `9`

---

## 5. Database Schema

The system uses the following database table schemas.

### Core ERP Tables
```sql
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

-- 3. PERMISSIONS
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
    CONSTRAINT fk_rp_role FOREIGN KEY(role_id) REFERENCES roles(role_id),
    CONSTRAINT fk_rp_permission FOREIGN KEY(permission_id) REFERENCES permissions(permission_id)
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
    CONSTRAINT fk_sessions_user FOREIGN KEY(user_id) REFERENCES users(user_id)
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
    CONSTRAINT fk_audit_user FOREIGN KEY(user_id) REFERENCES users(user_id)
);

-- 8. APP_SETTINGS
CREATE TABLE app_settings (
    setting_id BIGSERIAL PRIMARY KEY,
    setting_key VARCHAR(200) UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Designer Studio Tables
```sql
-- 1. MODULES
CREATE TABLE modules (
    module_id UUID PRIMARY KEY,
    module_key VARCHAR(100) UNIQUE NOT NULL,
    module_name VARCHAR(200) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2. FIELDS
CREATE TABLE fields (
    field_id SERIAL PRIMARY KEY,
    module_key VARCHAR(100) NOT NULL,
    label VARCHAR(128) NOT NULL,
    field_key VARCHAR(64) NOT NULL UNIQUE,
    field_type VARCHAR(64) NOT NULL,
    field_group_id INTEGER,
    field_group_name VARCHAR(200),
    help_tooltip VARCHAR(200),
    default_value VARCHAR(64),
    min_value VARCHAR(50),
    max_value VARCHAR(50),
    system_field BOOLEAN DEFAULT FALSE,
    is_visible BOOLEAN DEFAULT TRUE,
    is_mandatory BOOLEAN DEFAULT FALSE,
    is_pii BOOLEAN DEFAULT FALSE,
    is_audited BOOLEAN DEFAULT FALSE,
    is_searchable BOOLEAN DEFAULT TRUE,
    is_exportable BOOLEAN DEFAULT TRUE,
    sort_order SMALLINT DEFAULT 99,
    created_by INTEGER,
    placeholder VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- TRIGGER to auto-update updated_at for fields
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_fields_updated_at
BEFORE UPDATE ON fields
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 3. RECORDS
CREATE TABLE records (
    record_id UUID PRIMARY KEY,
    module_key VARCHAR(100) NOT NULL,
    data JSONB NOT NULL,
    created_by BIGINT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. MODULE_COLUMNS
CREATE TABLE module_columns (
    column_id BIGSERIAL PRIMARY KEY,
    module_id UUID NOT NULL,
    column_name VARCHAR(100) NOT NULL,
    db_data_type VARCHAR(50) NOT NULL,
    db_length INTEGER,
    db_precision INTEGER,
    db_scale INTEGER,
    is_nullable BOOLEAN DEFAULT TRUE,
    is_unique BOOLEAN DEFAULT FALSE,
    is_primary_key BOOLEAN DEFAULT FALSE,
    is_auto_increment BOOLEAN DEFAULT FALSE,
    default_value TEXT,
    check_constraint TEXT,
    foreign_module_id UUID,
    foreign_column_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_module_columns_module FOREIGN KEY(module_id) REFERENCES modules(module_id) ON DELETE CASCADE
);
```
