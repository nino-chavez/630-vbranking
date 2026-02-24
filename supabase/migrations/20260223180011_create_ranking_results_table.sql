-- Migration: Create ranking_results table
-- Per-team algorithm outputs tied to a ranking run snapshot.
-- Columns algo1 through algo5 store individual algorithm ratings/ranks:
--   algo1 = Colley Matrix
--   algo2 = Elo-2200
--   algo3 = Elo-2400
--   algo4 = Elo-2500
--   algo5 = Elo-2700
-- agg_rating/agg_rank store the unified 0-100 scale aggregate.

CREATE TABLE ranking_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ranking_run_id UUID NOT NULL REFERENCES ranking_runs(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE RESTRICT,
    algo1_rating NUMERIC,
    algo1_rank INTEGER,
    algo2_rating NUMERIC,
    algo2_rank INTEGER,
    algo3_rating NUMERIC,
    algo3_rank INTEGER,
    algo4_rating NUMERIC,
    algo4_rank INTEGER,
    algo5_rating NUMERIC,
    algo5_rank INTEGER,
    agg_rating NUMERIC,
    agg_rank INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_ranking_results_run_team UNIQUE (ranking_run_id, team_id)
);

CREATE INDEX idx_ranking_results_ranking_run_id ON ranking_results(ranking_run_id);
CREATE INDEX idx_ranking_results_team_id ON ranking_results(team_id);

CREATE TRIGGER trg_ranking_results_updated_at
    BEFORE UPDATE ON ranking_results
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
