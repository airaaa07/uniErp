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
DB_HOST=192.168.XX.XX       # Database server IP (use 127.0.0.1 for local docker DB)
DB_PORT=5432
DB_USER=user
DB_PASSWORD=password
DB_NAME=universe            # Target database name
DB_SSLMODE=disable

JWT_SECRET=JWTSecretKey
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

Inside the database system, user roles are assigned the following IDs (based on seed order). These IDs are used in backend middleware checks (e.g. `role_id IN (1, 2)` for admin guards):

| Role ID | Role Name | Scope & Access |
| :---: | :--- | :--- |
| `1` | "Super Admin" | Full system access — all CRUD, settings, roles, audit |
| `2` | "University Admin" | University-level — creates colleges, assigns counsellors, manages users |
| `3` | "Manager" | General management viewer |
| `4` | "Designer" | Access to the Designer Studio portal to build/edit forms |
| `5` | "Viewer" | Read-only access to portal data |
| `6` | "Counsellor" | Reviews inquiry leads, recommends college + stream, triggers payment step |
| `7` | "Admission Officer" | Verifies marksheets, enters scholarship %, approves admission |
| `8` | "Registrar" | Matriculates approved candidates, generates Enrollment IDs |
| `9` | "College Admin" | Scoped to one college — manages users within their `college_id` |
| `10` | "Finance Controller" | Audits fee payments, verifies Razorpay/bank UTR references |
| `11` | "Student" | Self-service dashboard — docs, payment, application status |

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
    college_id            BIGINT,                     -- For College Admin scoped access
    is_active             BOOLEAN DEFAULT TRUE,
    force_password_change BOOLEAN DEFAULT FALSE,        -- TRUE for auto-generated student accounts
    created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

---

## 6. System Architecture

```
┌──────────────────────────────────────────────────────────┐
│                        Browser (React)                     │
│                                                            │
│   ┌─────────────────────┐   ┌──────────────────────────┐  │
│   │   ERP Portal        │   │   Designer Portal        │  │
│   │  (React + MUI)      │   │   (React + MUI)          │  │
│   │  Port 5173 → /erp   │   │   Port 5173 → /designer  │  │
│   └────────┬────────────┘   └────────────┬─────────────┘  │
└────────────┼──────────────────────────── ┼ ───────────────┘
             │  REST API over HTTP          │
             ▼                             ▼
┌────────────────────────────────────────────────────────────┐
│              Go Backend (Gin Framework) — Port 8080         │
│                                                            │
│   /api/erp/*          ERP routes (student, counsellor…)   │
│   /api/designer/*     Designer admin routes               │
│   /api/erp/public/*   Public unauthenticated routes       │
│                                                            │
│   ┌──────────────────────────────────────────────────┐    │
│   │  Middleware: JWT Auth ▸ RBAC ▸ College Scoping   │    │
│   └──────────────────────────────────────────────────┘    │
└────────────────────────┬───────────────────────────────────┘
                         │ sqlx / lib/pq
                         ▼
┌────────────────────────────────────────────────────────────┐
│           PostgreSQL 15  —  Database: universe              │
│                                                            │
│  users, roles, permissions, records, modules, fields,      │
│  module_columns, sessions, audit_logs, app_settings        │
└────────────────────────────────────────────────────────────┘
```

---

## 7. Technology Stack

### Backend
| Layer | Technology |
| :--- | :--- |
| Language | Go 1.24 |
| Framework | Gin v1.9.1 |
| Database Driver | `lib/pq` + `sqlx` |
| Auth | JWT (`golang-jwt/jwt/v5`) |
| Password Hashing | bcrypt (`golang.org/x/crypto`) |
| UUID Generation | `google/uuid` |
| Config | `godotenv` |

### Frontend
| Layer | Technology |
| :--- | :--- |
| Framework | React 18 + Vite |
| UI Library | Material UI (MUI) v5 |
| Routing | React Router DOM v6 |
| HTTP Client | Axios (via `api.ts` service layer) |
| Payment | Razorpay Checkout SDK (CDN) |
| State | React Context API (`AuthContext`) |

### Infrastructure
| Concern | Tool |
| :--- | :--- |
| Database | PostgreSQL 15 |
| Containerization | Docker + Docker Compose |
| Process Manager | `run.sh` (host mode) / Docker Compose (docker mode) |
| Logging | `nohup` → `backend.log` / `frontend.log` |

---

## 8. Complete Folder Structure

```
uni/
├── run.sh                        # Start/stop/status management script
├── docker-compose.yml            # Full-stack Docker orchestration
├── credentials.md                # Test login credentials & workflow guide
├── README.md                     # This file
├── backend.log                   # Backend runtime log (gitignored)
├── frontend.log                  # Frontend runtime log (gitignored)
│
├── backend/
│   ├── .env                      # Active environment variables (gitignored)
│   ├── .env.example              # Template for .env
│   ├── Dockerfile                # Backend Docker image definition
│   ├── go.mod / go.sum           # Go module dependencies
│   │
│   ├── server/
│   │   └── main.go               # Entry point — sets up Gin router & all routes
│   │
│   ├── config/
│   │   └── config.go             # Reads and validates environment config
│   │
│   ├── database/
│   │   ├── database.go           # PostgreSQL connection factory (sqlx)
│   │   ├── seed.go               # Seeds default roles, permissions, and admin user
│   │   └── migrations/
│   │       ├── 001_create_designer_tables.sql   # Core tables: modules, fields, records, module_columns
│   │       ├── 002_seed_data_model.sql          # Seed all form fields and modules for the ERP
│   │       ├── 003_scratch_seed_fields.sql      # Additional field definitions
│   │       └── 004_add_college_id_to_users.sql  # Adds college_id FK to users table
│   │
│   ├── models/
│   │   ├── user.go               # User, UserCreate, UserUpdate, UserResponse structs
│   │   ├── auth.go               # LoginRequest, TokenResponse structs
│   │   ├── role.go               # Role struct
│   │   ├── permission.go         # Permission struct
│   │   ├── session.go            # Session struct
│   │   ├── audit_log.go          # AuditLog struct
│   │   ├── app_setting.go        # AppSetting struct
│   │   └── designer.go           # Module, Field, Record, ModuleColumn structs
│   │
│   ├── middleware/
│   │   ├── auth.go               # JWT validation middleware (AuthRequired)
│   │   ├── rbac.go               # Permission-based access control
│   │   ├── roles.go              # Role guards: RequireUniversityAdminRole, RequireCollegeAdminRole
│   │   ├── erp_admin.go          # RequireERPAdminRole guard
│   │   └── designer.go           # RequireDesignerRole guard
│   │
│   ├── handlers/
│   │   ├── erp/
│   │   │   ├── auth_handler.go       # Login, Logout, Refresh, GetCurrentUser, ChangePassword
│   │   │   ├── user_handler.go       # Full CRUD for users + role assignment + college-scoped ops
│   │   │   ├── role_handler.go       # CRUD for roles & permission assignment
│   │   │   ├── record_handler.go     # CRUD for dynamic records + public unauthenticated creation
│   │   │   ├── audit_handler.go      # Read audit logs
│   │   │   └── settings_handler.go   # App settings management
│   │   └── designer/
│   │       ├── auth_handler.go       # Designer-specific auth
│   │       └── designer_handler.go   # Module/field/column/layout designer APIs
│   │
│   ├── services/
│   │   ├── erp/
│   │   │   ├── auth_service.go       # Login, token issue, password change, force_password_change
│   │   │   ├── user_service.go       # User CRUD, role management, college-scoped queries
│   │   │   ├── role_service.go       # Role & permission CRUD
│   │   │   ├── record_service.go     # Record CRUD + PublicCreateRecord (auto-creates student user)
│   │   │   ├── audit_service.go      # Audit log management
│   │   │   └── settings_service.go   # App settings management
│   │   └── designer/
│   │       ├── auth_service.go       # Designer auth (separate token namespace)
│   │       └── designer_service.go   # Module, field, column, form layout logic
│   │
│   └── utils/
│       └── password.go           # bcrypt HashPassword / CheckPasswordHash helpers
│
└── frontend/
    ├── .env / .env.example       # VITE_API_BASE_URL, VITE_API_BACKEND_URL
    ├── Dockerfile                # Frontend Docker image
    ├── package.json              # npm dependencies
    ├── vite.config.ts            # Vite dev server config with API proxy
    │
    └── src/
        ├── main.tsx              # React entry point
        ├── App.tsx               # Root router — mounts Designer and ERP portals
        ├── index.css             # Global styles
        │
        └── apps/
            ├── PortalSelector.tsx     # Landing page — choose ERP or Designer portal
            │
            ├── erp/                   # ─── STUDENT-FACING ERP PORTAL ───
            │   ├── contexts/
            │   │   └── AuthContext.tsx         # ERP JWT state management (login/logout/user)
            │   ├── components/
            │   │   ├── DashboardLayout.tsx     # Side nav, header, role-based menus,
            │   │   │                           # force-password-change dialog
            │   │   ├── DynamicFormRenderer.tsx # Renders any module form from JSON schema
            │   │   └── ProtectedRoute.tsx      # Redirect to /erp/login if not authenticated
            │   ├── services/
            │   │   └── api.ts                  # Axios client with auto JWT headers
            │   ├── types/
            │   │   └── index.ts                # TypeScript interfaces (User, Module, Field…)
            │   └── pages/
            │       ├── Login.tsx               # ERP login page
            │       ├── Register.tsx            # Public student inquiry/registration form
            │       ├── admin/
            │       │   ├── AdminDashboard.tsx      # Super/Uni Admin home
            │       │   ├── Users.tsx               # Full user management (CRUD + roles)
            │       │   ├── ModuleRecordManager.tsx # Browse records of any module
            │       │   └── Inquiries.tsx           # Shortcut to inquiry records
            │       ├── student/
            │       │   └── StudentDashboard.tsx    # Student self-service: docs, payments, status
            │       ├── counsellor/
            │       │   └── CounsellorDashboard.tsx # Counsellor inquiry pipeline
            │       ├── finance/
            │       │   └── FinanceDashboard.tsx    # Fee verification queue
            │       ├── officer/
            │       │   └── OfficerDashboard.tsx    # Credentials & scholarship approval
            │       ├── registrar/
            │       │   └── RegistrarDashboard.tsx  # Matriculation & enrollment ID generator
            │       └── college/
            │           ├── CollegeDashboard.tsx    # College admin home
            │           └── CollegeUsers.tsx        # College-scoped user management
            │
            └── designer/              # ─── INTERNAL ADMIN DESIGNER PORTAL ───
                ├── contexts/AuthContext.tsx
                ├── components/
                │   ├── DashboardLayout.tsx
                │   └── ProtectedRoute.tsx
                └── pages/
                    ├── Login.tsx
                    ├── Register.tsx
                    ├── RoleRedirect.tsx
                    ├── Users.tsx
                    ├── Roles.tsx
                    ├── AuditLogs.tsx
                    ├── Settings.tsx
                    ├── ModuleDesigner.tsx      # Create/edit data modules
                    ├── FieldDesigner.tsx       # Add/configure form fields
                    ├── ColumnDesigner.tsx      # DB column metadata editor
                    ├── FormLayoutDesigner.tsx  # Drag-to-reorder form layout
                    ├── FormPreview.tsx         # Live preview of a form
                    └── RecordViewer.tsx        # Read records for any module
```

---

## 9. Two Portals: Designer vs ERP

The application exposes **two completely separate portals** at the same origin, each with its own authentication context, theme, and role system.

| Feature | Designer Portal (`/designer`) | ERP Portal (`/erp`) |
| :--- | :--- | :--- |
| **Purpose** | Internal technical admin — design forms, manage modules, view audit logs | Operational — students, counsellors, finance, registrar |
| **Audience** | System administrators / developers | University staff and students |
| **Auth Namespace** | `/api/designer/auth/*` | `/api/erp/auth/*` |
| **JWT Token Storage** | `localStorage` (designer token) | `localStorage` (erp token) |
| **Theme** | Light blue (MUI default) | Dark indigo / modern |
| **Role Required** | "Super Admin" or "University Admin" | Role-specific dashboards |
| **Entry Point** | `http://localhost:5173/designer/login` | `http://localhost:5173/erp/login` |

> 💡 The root URL `http://localhost:5173/` shows a **Portal Selector** landing page where users choose which portal to enter.

---

## 10. Dashboard Routing (by Role)

| Role | Dashboard Route |
| :--- | :--- |
| "Super Admin" | `/erp/admin/dashboard` |
| "University Admin" | `/erp/admin/dashboard` |
| "Manager" | `/erp/admin/dashboard` |
| "Designer" | `/designer/dashboard` |
| "Viewer" | `/erp/admin/dashboard` |
| "Counsellor" | `/erp/counsellor/dashboard` |
| "Admission Officer" | `/erp/officer/dashboard` |
| "Registrar" | `/erp/registrar/dashboard` |
| "College Admin" | `/erp/college/dashboard` |
| "Finance Controller" | `/erp/finance/dashboard` |
| "Student" | `/erp/student/dashboard` |

---

## 11. Complete Student Admission Workflow

The entire lifecycle from first inquiry to enrollment:

```
          ┌──────────────────────────────────────┐
          │  APPLICANT (Public / No Login)        │
          │  Visits: /erp/register                │
          └───────────────────┬──────────────────┘
                              │  Submits inquiry form
                              │  (Name, Mobile, DOB, Course, College)
                              ▼
          ┌──────────────────────────────────────────┐
          │  BACKEND: PublicCreateRecord()            │
          │  ✔ Saves record → inquiry_master          │
          │  ✔ Sets inquiry_status = "Open"           │
          │  ✔ Auto-creates users row:                │
          │     username = mobile_no                  │
          │     password = DDMMYYYY (from DOB)        │
          │     force_password_change = TRUE          │
          │  ✔ Assigns "Student" role (ID 11)         │
          └───────────────────┬──────────────────────┘
                              │
              ┌───────────────▼───────────────┐
              │  STATUS: Open                  │
              │  Student logs in at /erp/login  │
              │  First login → forced password  │
              │  change dialog (cannot skip)    │
              └───────────────┬───────────────┘
                              │
              ┌───────────────▼───────────────┐
              │  COUNSELLOR (Role ID 6)        │
              │  Reviews inquiry               │
              │  Selects: College + Stream     │
              │  Clicks: "Approve & Request    │
              │           Payment"             │
              └───────────────┬───────────────┘
                              │
              ┌───────────────▼───────────────┐
              │  STATUS: Payment Pending        │
              │  Student dashboard unlocks:     │
              │    ✔ Marks entry (10th/12th %)  │
              │    ✔ Document upload (4 slots)  │
              │    ✔ Pay Online (Razorpay)      │
              │    ✔ Pay Offline (bank UTR)     │
              │  Student clicks: "Submit"       │
              └───────────────┬───────────────┘
                              │
              ┌───────────────▼───────────────┐
              │  STATUS: Submitted             │
              │  FINANCE (Role ID 10)          │
              │  Reviews fee reference         │
              │  Clicks: "Verify Fee"          │
              └───────────────┬───────────────┘
                              │
              ┌───────────────▼───────────────┐
              │  STATUS: Fee Paid              │
              │  OFFICER (Role ID 7)           │
              │  Verifies marksheets           │
              │  Enters Scholarship % (opt.)   │
              │  Clicks: "Approve Admission"   │
              └───────────────┬───────────────┘
                              │
              ┌───────────────▼───────────────┐
              │  STATUS: Approved              │
              │  REGISTRAR (Role ID 8)         │
              │  Clicks: "Matriculate & Enroll"│
              └───────────────┬───────────────┘
                              │
              ┌───────────────▼───────────────┐
              │  STATUS: Enrolled ✅            │
              │  Enrollment ID generated:      │
              │  Format: EN{YEAR}{6-digit-seq} │
              │  Example: EN2026000001         │
              └───────────────────────────────┘
```

### Inquiry Status State Machine

```
Open → Payment Pending → Submitted → Fee Paid → Approved → Enrolled
```

---

## 12. Authentication System

### How it Works

1. **Login** — `POST /api/erp/auth/login` with `{ username, password }`. Returns a **JWT access token** (24 h) and a **refresh token** (7 days).
2. **Token Storage** — Stored in `localStorage`. `AuthContext.tsx` hydrates user state from the token on page load.
3. **Protected Routes** — The backend `AuthRequired()` middleware validates `Authorization: Bearer <token>`. Expired/invalid tokens return `401`.
4. **Role Guards** — After JWT validation, role-specific middleware checks the user's role in the DB:
   - `RequireERPAdminRole` — "Super Admin" or "University Admin" (role IDs 1, 2)
   - `RequireCollegeAdminRole` — "College Admin" (role ID 9) with `college_id` set
   - `RequireDesignerRole` — "Super Admin" or "University Admin" on Designer routes

### Student Auto-Registration Flow

When a student submits the public form at `/erp/register`:

```go
// backend/services/erp/record_service.go → PublicCreateRecord()
username = mobile_no            // e.g. "9876543210"
password = DDMMYYYY             // e.g. "15052002" for 2002-05-15
force_password_change = TRUE    // blocked on first login
```

### Force Password Change Dialog

- Triggered when `user.force_password_change === true` from `AuthContext`
- Renders a **blocking** MUI Dialog (`disableEscapeKeyDown` — cannot be dismissed)
- Calls `POST /api/erp/auth/change-password` with old and new passwords
- On success, sets `force_password_change = false` in DB and dismisses the dialog

---

## 13. API Route Reference

### Public Routes (No Auth Required)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Health check |
| `POST` | `/api/erp/auth/login` | ERP Login |
| `POST` | `/api/erp/auth/logout` | ERP Logout |
| `POST` | `/api/erp/auth/refresh` | Refresh JWT token |
| `GET` | `/api/erp/public/modules/:key/layout` | Get form layout (whitelisted modules only) |
| `GET` | `/api/erp/public/modules/:key/records` | Get records (whitelisted modules only) |
| `POST` | `/api/erp/public/records` | **Submit inquiry form** (creates student login) |
| `POST` | `/api/designer/auth/login` | Designer portal login |

**Publicly allowed modules** (server-side whitelist — `403` if not in list):
`inquiry_master`, `course_master`, `stream_master`, `counsellor_master`, `institute_master`, `fee_master`, `registration`, `enrollment`, `inquiry_status`

### Protected ERP Routes (JWT Required)

| Method | Endpoint | Access |
| :--- | :--- | :--- |
| `GET` | `/api/erp/auth/me` | Any logged-in user |
| `POST` | `/api/erp/auth/change-password` | Any logged-in user |
| `POST/GET/PUT/DELETE` | `/api/erp/records/*` | Any ERP user |
| `GET` | `/api/erp/modules/:key/layout` | Any ERP user |
| `POST/GET/PUT/DELETE` | `/api/erp/users/*` | ERP Admin only (role IDs 1, 2) |
| `GET/POST/DELETE` | `/api/erp/users/:id/roles` | ERP Admin only |
| `GET/POST/PUT/PATCH` | `/api/erp/college/users/*` | "College Admin" only (role ID 9) |

### Designer Routes (JWT + Designer Role)

Full CRUD for: `modules`, `fields`, `module-columns`, `roles`, `permissions`, `settings`, `audit` logs.

---

## 14. Test Credentials

> Full credential list with step-by-step workflow is in **[credentials.md](./credentials.md)**

### Quick Reference

| Role | Username | Password | Dashboard |
| :--- | :--- | :--- | :--- |
| "Super Admin" | `admin` | `admin123` | `/erp/admin/dashboard` |
| "University Admin" | `univadmin` | `admin123` | `/erp/admin/dashboard` |
| "Manager" | `manager` | `admin123` | `/erp/admin/dashboard` |
| "Designer" | `designer` | `admin123` | `/designer/dashboard` |
| "Viewer" | `viewer` | `admin123` | `/erp/admin/dashboard` |
| "Counsellor" | `counsellor` | `admin123` | `/erp/counsellor/dashboard` |
| "Admission Officer" | `officer` | `admin123` | `/erp/officer/dashboard` |
| "Registrar" | `registrar` | `admin123` | `/erp/registrar/dashboard` |
| "College Admin" | `collegeadmin` | `admin123` | `/erp/college/dashboard` |
| "Finance Controller" | `finance` | `admin123` | `/erp/finance/dashboard` |
| "Student" | `9988776655` | `student123` | `/erp/student/dashboard` |

### Student Login (Auto-Generated on Registration)

- **Username:** Mobile number entered in the form (e.g. `9876543210`)
- **Password:** Date of Birth in `DDMMYYYY` format (e.g. `15052002` for 15-May-2002)
- **First Login:** Student is forced to change this password before accessing the dashboard

---

## 15. Fee Payment – Razorpay Integration

The system supports **two payment modes** for application fees:

### Online Payment (Razorpay Checkout)

The Razorpay JS SDK is loaded dynamically from CDN in `StudentDashboard.tsx`. When the student clicks **"Pay Online via Razorpay"**:

1. A Razorpay `options` object is built with the configured Key ID
2. `new window.Razorpay(options).open()` launches the native checkout modal
3. On success, the `payment_id` (e.g. `pay_XXXXXXXXXXXX`) is stored in the inquiry record
4. Status remains `Payment Pending` until Finance verifies it

**Test Card Details (Razorpay Sandbox):**
```
Card Number : 4111 1111 1111 1111
Expiry      : Any future date
CVV         : Any 3 digits
OTP         : 1234
```

### Offline Payment (Bank UTR)

Students can pay at a bank branch and enter the **UTR (Unique Transaction Reference)** number manually. The Finance Controller cross-checks this reference and marks the fee as verified.

| Environment | Key ID |
| :--- | :--- |
| Test (current) | `rzp_test_RvORW1HCWwBwoy` |
| Production | Replace in `backend/.env` |

---

## 16. Dynamic Form Engine (Designer Portal)

Administrators can build and modify data-capture forms without writing code.

```
Designer creates Module → Adds Fields → Configures Layout order
                                ↓
          ERP Portal reads form definition via API
                                ↓
             DynamicFormRenderer.tsx renders the form
                                ↓
           Submission saved as JSONB in records table
```

### Field Types Supported

| Type | Description |
| :--- | :--- |
| `text` | Single-line text input |
| `textarea` | Multi-line text area |
| `number` | Numeric input |
| `date` | Date picker |
| `select` | Dropdown — options sourced from another module (`field_group`) |
| `file` | File upload (base64 stored in JSONB) |
| `email` | Email input with validation |
| `phone` | Phone number input |

### Field Metadata Flags

| Flag | Meaning |
| :--- | :--- |
| `is_mandatory` | Required for form submission |
| `is_visible` | Field appears on the form UI |
| `is_pii` | Contains Personally Identifiable Information |
| `is_audited` | Changes logged in `audit_logs` |
| `is_searchable` | Included in server-side text search |
| `is_exportable` | Appears in data exports |
| `system_field` | Cannot be deleted or modified by designers |

---

## 🔒 Security Notes

- **JWT secrets** must be rotated for production — set a strong random `JWT_SECRET`.
- **Razorpay keys** in this repo are **test-mode only** — no real transactions are processed.
- The public `/api/erp/public/records` endpoint enforces a **server-side module whitelist** — `403 Forbidden` for any non-whitelisted module.
- `force_password_change = TRUE` ensures auto-generated student credentials cannot persist indefinitely.
- **College Admin** scoping ensures admins only see users within their own `college_id`.
- Passwords are hashed with **bcrypt** — plaintext is never stored.

---

## 📋 Quick Command Reference

```bash
./run.sh host       # Start backend + frontend on host machine
./run.sh docker     # Start everything via Docker Compose
./run.sh stop       # Stop all services
./run.sh status     # Check running services

tail -f backend.log  # Watch backend logs
tail -f frontend.log # Watch frontend logs
```

---

*For test credentials and step-by-step workflow walkthrough, see [credentials.md](./credentials.md).*