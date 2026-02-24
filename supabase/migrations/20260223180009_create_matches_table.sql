-- Migration: Create matches table
-- Individual match records at the most granular level.
-- Head-to-head summaries are derived via queries, not stored.
-- Nullable columns (set_scores, point_differential, metadata) reserved
-- for future enhancements.

CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_a_id UUID NOT NULL REFERENCES teams(id) ON DELETE RESTRICT,
    team_b_id UUID NOT NULL REFERENCES teams(id) ON DELETE RESTRICT,
    winner_id UUID REFERENCES teams(id) ON DELETE RESTRICT,
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    set_scores JSONB,
    point_differential INTEGER,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_matches_different_teams CHECK (team_a_id != team_b_id),
    CONSTRAINT chk_matches_winner_is_participant CHECK (winner_id IS NULL OR winner_id IN (team_a_id, team_b_id))
);

CREATE INDEX idx_matches_team_a_id ON matches(team_a_id);
CREATE INDEX idx_matches_team_b_id ON matches(team_b_id);
CREATE INDEX idx_matches_tournament_id ON matches(tournament_id);

CREATE TRIGGER trg_matches_updated_at
    BEFORE UPDATE ON matches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
