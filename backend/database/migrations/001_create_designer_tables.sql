-- ─────────────────────────────────────────────────────────────
-- MODULES TABLE
-- ─────────────────────────────────────────────────────────────
CREATE TABLE modules (
    module_id UUID PRIMARY KEY,
    module_key VARCHAR(100) UNIQUE NOT NULL,       -- e.g. "student_inquiry", "course_master"
    module_name VARCHAR(200) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- FIELDS TABLE
-- ─────────────────────────────────────────────────────────────
CREATE TABLE fields (
    field_id SERIAL PRIMARY KEY,                    -- integer, auto generated
    module_key VARCHAR(100) NOT NULL,              -- links to modules.module_key
    label VARCHAR(128) NOT NULL,                   -- display name
    field_key VARCHAR(64) NOT NULL UNIQUE,         -- unique column name
    field_type VARCHAR(64) NOT NULL,               -- text/number/date/select/textarea
    field_group_id INTEGER,                        -- references module_id (not enforced FK here)
    field_group_name VARCHAR(200),                 -- table name / module name
    help_tooltip VARCHAR(200),
    default_value VARCHAR(64),
    min_value VARCHAR(50),
    max_value VARCHAR(50),
    system_field BOOLEAN DEFAULT FALSE,            -- default fields cannot be deleted/altered
    is_visible BOOLEAN DEFAULT TRUE,
    is_mandatory BOOLEAN DEFAULT FALSE,
    is_pii BOOLEAN DEFAULT FALSE,
    is_audited BOOLEAN DEFAULT FALSE,
    is_searchable BOOLEAN DEFAULT TRUE,
    is_exportable BOOLEAN DEFAULT TRUE,
    sort_order SMALLINT DEFAULT 99,
    created_by INTEGER,                             -- FK -> admin_users.user_id
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- TRIGGER: auto-update updated_at
-- ─────────────────────────────────────────────────────────────
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

-- ─────────────────────────────────────────────────────────────
-- RECORDS TABLE
-- ─────────────────────────────────────────────────────────────
CREATE TABLE records (
    record_id UUID PRIMARY KEY,
    module_key VARCHAR(100) NOT NULL,              -- links to modules.module_key
    data JSONB NOT NULL,                            -- dynamic form submission storage
    created_by BIGINT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- MODULE COLUMNS TABLE
-- ─────────────────────────────────────────────────────────────
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

    CONSTRAINT fk_module_columns_module
        FOREIGN KEY (module_id)
        REFERENCES modules (module_id)
        ON DELETE CASCADE
);