-- Migration: Create tournament_weights table
-- Stores configurable per-tournament-per-season importance weights and tiers.
-- The committee adjusts these without code changes.

CREATE TABLE tournament_weights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
    weight NUMERIC NOT NULL,
    tier INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_tournament_weights_tournament_season UNIQUE (tournament_id, season_id)
);

CREATE INDEX idx_tournament_weights_tournament_id ON tournament_weights(tournament_id);
CREATE INDEX idx_tournament_weights_season_id ON tournament_weights(season_id);

CREATE TRIGGER trg_tournament_weights_updated_at
    BEFORE UPDATE ON tournament_weights
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
