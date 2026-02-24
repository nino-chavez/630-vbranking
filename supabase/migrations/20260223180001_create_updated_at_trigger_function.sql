-- Migration: Create reusable updated_at trigger function
-- This function is attached as a BEFORE UPDATE trigger on every table
-- to automatically set updated_at = now() on row modification.

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
