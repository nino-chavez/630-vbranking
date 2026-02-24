-- RPC function for atomic replace of tournament_results.
-- Deletes all tournament_results for the given season + age_group,
-- then inserts all rows from the provided JSONB array.
-- Runs in a single transaction (PostgreSQL function bodies are inherently transactional).

CREATE OR REPLACE FUNCTION import_replace_tournament_results(
  p_season_id UUID,
  p_age_group TEXT,
  p_rows JSONB
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  -- Delete existing tournament_results for this season + age_group combination
  DELETE FROM tournament_results
  WHERE tournament_id IN (
    SELECT id FROM tournaments WHERE season_id = p_season_id
  )
  AND team_id IN (
    SELECT id FROM teams WHERE age_group = p_age_group::age_group_enum
  );

  -- Insert all new rows from the JSONB array
  INSERT INTO tournament_results (team_id, tournament_id, division, finish_position, field_size)
  SELECT
    (row_data->>'team_id')::UUID,
    (row_data->>'tournament_id')::UUID,
    row_data->>'division',
    (row_data->>'finish_position')::INTEGER,
    (row_data->>'field_size')::INTEGER
  FROM jsonb_array_elements(p_rows) AS row_data;
END;
$$;

-- RPC function for atomic replace of ranking_results.
-- Deletes all ranking_results for the given ranking_run_id,
-- then inserts all rows from the provided JSONB array.

CREATE OR REPLACE FUNCTION import_replace_ranking_results(
  p_ranking_run_id UUID,
  p_rows JSONB
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  -- Delete existing ranking_results for this ranking run
  DELETE FROM ranking_results
  WHERE ranking_run_id = p_ranking_run_id;

  -- Insert all new rows from the JSONB array
  INSERT INTO ranking_results (
    ranking_run_id, team_id,
    algo1_rating, algo1_rank, algo2_rating, algo2_rank,
    algo3_rating, algo3_rank, algo4_rating, algo4_rank,
    algo5_rating, algo5_rank, agg_rating, agg_rank
  )
  SELECT
    (row_data->>'ranking_run_id')::UUID,
    (row_data->>'team_id')::UUID,
    (row_data->>'algo1_rating')::DOUBLE PRECISION,
    (row_data->>'algo1_rank')::INTEGER,
    (row_data->>'algo2_rating')::DOUBLE PRECISION,
    (row_data->>'algo2_rank')::INTEGER,
    (row_data->>'algo3_rating')::DOUBLE PRECISION,
    (row_data->>'algo3_rank')::INTEGER,
    (row_data->>'algo4_rating')::DOUBLE PRECISION,
    (row_data->>'algo4_rank')::INTEGER,
    (row_data->>'algo5_rating')::DOUBLE PRECISION,
    (row_data->>'algo5_rank')::INTEGER,
    (row_data->>'agg_rating')::DOUBLE PRECISION,
    (row_data->>'agg_rank')::INTEGER
  FROM jsonb_array_elements(p_rows) AS row_data;
END;
$$;
