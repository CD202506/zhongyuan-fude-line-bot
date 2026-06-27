-- Web Admin database-backed MVP schema draft.
-- This migration contains no production data and no secrets.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS web_admin_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_key TEXT NOT NULL,
    title TEXT NOT NULL,
    summary TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'active',
    record_date DATE,
    due_date DATE,
    responsible TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL DEFAULT '',
    fields_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    tags_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    archived_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by TEXT NOT NULL DEFAULT '',
    updated_by TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_web_admin_records_module_key
    ON web_admin_records (module_key);

CREATE INDEX IF NOT EXISTS idx_web_admin_records_status
    ON web_admin_records (status);

CREATE INDEX IF NOT EXISTS idx_web_admin_records_is_archived
    ON web_admin_records (is_archived);

CREATE INDEX IF NOT EXISTS idx_web_admin_records_record_date
    ON web_admin_records (record_date);

CREATE INDEX IF NOT EXISTS idx_web_admin_records_fields_json
    ON web_admin_records USING GIN (fields_json);

CREATE INDEX IF NOT EXISTS idx_web_admin_records_tags_json
    ON web_admin_records USING GIN (tags_json);

CREATE TABLE IF NOT EXISTS web_admin_audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id UUID REFERENCES web_admin_records(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    actor_role TEXT NOT NULL,
    actor_name TEXT NOT NULL DEFAULT '',
    before_json JSONB,
    after_json JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_web_admin_audit_events_record_id
    ON web_admin_audit_events (record_id);

CREATE INDEX IF NOT EXISTS idx_web_admin_audit_events_action
    ON web_admin_audit_events (action);

CREATE TABLE IF NOT EXISTS web_admin_test_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    display_name TEXT NOT NULL,
    role TEXT NOT NULL,
    access_code_hash TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_web_admin_test_users_role
    ON web_admin_test_users (role);

CREATE INDEX IF NOT EXISTS idx_web_admin_test_users_is_active
    ON web_admin_test_users (is_active);
