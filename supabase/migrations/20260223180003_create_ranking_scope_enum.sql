-- Migration: Create ranking_scope_enum type
-- Determines whether a season's ranking runs pull data from a single season
-- or aggregate across multiple seasons.

CREATE TYPE ranking_scope_enum AS ENUM ('single_season', 'cross_season');
