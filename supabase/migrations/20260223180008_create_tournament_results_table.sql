-- Migration: Create tournament_results table
-- One row per team per tournament entry. Records the division,
-- finish position, and field size for ranking calculations.

CREATE TABLE tournament_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE RESTRICT,
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    division TEXT NOT NULL,
    finish_position INTEGER NOT NULL,
    field_size INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_tournament_results_team_tournament UNIQUE (team_id, tournament_id)
);

CREATE INDEX idx_tournament_results_team_id ON tournament_results(team_id);
CREATE INDEX idx_tournament_results_tournament_id ON tournament_results(tournament_id);

CREATE TRIGGER trg_tournament_results_updated_at
    BEFORE UPDATE ON tournament_results
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
