-- Migration: Create ranking_runs table
-- Each run represents a single point-in-time computation of all algorithms.
-- The parameters JSONB column captures algorithm config at time of run.

CREATE TABLE ranking_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
    ran_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    description TEXT,
    parameters JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ranking_runs_season_id ON ranking_runs(season_id);

CREATE TRIGGER trg_ranking_runs_updated_at
    BEFORE UPDATE ON ranking_runs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
