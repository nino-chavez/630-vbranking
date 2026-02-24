-- Migration: Create teams table
-- Teams are identified by a unique combination of code and age_group.
-- The code is an opaque string from source data (not parsed or decomposed).

CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    region TEXT NOT NULL,
    age_group age_group_enum NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_teams_code_age_group UNIQUE (code, age_group)
);

CREATE TRIGGER trg_teams_updated_at
    BEFORE UPDATE ON teams
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
