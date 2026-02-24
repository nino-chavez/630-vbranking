-- Enable Row-Level Security on all tables.
-- Defence-in-depth: the app uses supabaseServer (service_role) which bypasses RLS.
-- These policies protect against direct anon-key abuse via the REST API.

-- Enable RLS on all 9 tables
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_weights ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE ranking_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ranking_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE ranking_overrides ENABLE ROW LEVEL SECURITY;

-- Authenticated users: read all tables
CREATE POLICY "authenticated_select" ON seasons FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_select" ON teams FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_select" ON tournaments FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_select" ON tournament_weights FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_select" ON tournament_results FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_select" ON matches FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_select" ON ranking_runs FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_select" ON ranking_results FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_select" ON ranking_overrides FOR SELECT TO authenticated USING (true);

-- Authenticated users: write to tables the app mutates
CREATE POLICY "authenticated_insert" ON teams FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated_update" ON teams FOR UPDATE TO authenticated USING (true);
CREATE POLICY "authenticated_insert" ON tournaments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated_insert" ON tournament_results FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated_delete" ON tournament_results FOR DELETE TO authenticated USING (true);
CREATE POLICY "authenticated_insert" ON matches FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated_insert" ON ranking_runs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated_update" ON ranking_runs FOR UPDATE TO authenticated USING (true);
CREATE POLICY "authenticated_insert" ON ranking_results FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated_delete" ON ranking_results FOR DELETE TO authenticated USING (true);
CREATE POLICY "authenticated_insert" ON tournament_weights FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated_update" ON tournament_weights FOR UPDATE TO authenticated USING (true);
CREATE POLICY "authenticated_insert" ON ranking_overrides FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated_update" ON ranking_overrides FOR UPDATE TO authenticated USING (true);
CREATE POLICY "authenticated_delete" ON ranking_overrides FOR DELETE TO authenticated USING (true);
