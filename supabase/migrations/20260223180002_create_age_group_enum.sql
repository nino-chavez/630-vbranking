-- Migration: Create age_group_enum type
-- Values represent the supported age divisions for volleyball teams.

CREATE TYPE age_group_enum AS ENUM ('15U', '16U', '17U', '18U');
