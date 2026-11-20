-- ==============================================================================
-- Migration: 0002_lock_down_rls.sql
-- Description: Replace 0001's open "public read/write" policies.
-- The anon key ships to every browser, so anon gets read-only access to public
-- data and nothing else. All writes go through /api/sync, which validates each
-- row and writes with the server-only service-role key (bypasses RLS).
-- ==============================================================================

DROP POLICY IF EXISTS "Allow public read/write for hackathon demo" ON transit_edges;
DROP POLICY IF EXISTS "Allow public read/write for hackathon demo" ON street_alerts;
DROP POLICY IF EXISTS "Allow public read/write for hackathon demo" ON ride_share_pools;
DROP POLICY IF EXISTS "Allow public read/write for hackathon demo" ON interception_logs;

-- RLS stays enabled on all four tables (set in 0001); without a policy, access is denied.
CREATE POLICY "Public read of transit edges" ON transit_edges
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Public read of street alerts" ON street_alerts
  FOR SELECT TO anon, authenticated USING (true);

-- ride_share_pools and interception_logs: no anon/authenticated policy (service role only).
-- Seeded pool rows carried placeholder member IDs; member IDs are no longer stored.
UPDATE ride_share_pools SET member_session_ids = '[]'::jsonb;
ALTER TABLE ride_share_pools ALTER COLUMN member_session_ids SET DEFAULT '[]'::jsonb;
