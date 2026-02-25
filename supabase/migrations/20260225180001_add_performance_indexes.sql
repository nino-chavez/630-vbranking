-- Add missing index on teams.age_group (used in every ranking run)
CREATE INDEX IF NOT EXISTS idx_teams_age_group ON teams(age_group);

-- Add composite index on tournament_results for .in() queries filtering both columns
CREATE INDEX IF NOT EXISTS idx_tournament_results_tournament_team ON tournament_results(tournament_id, team_id);
