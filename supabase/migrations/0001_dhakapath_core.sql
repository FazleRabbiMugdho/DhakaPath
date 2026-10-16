-- ==============================================================================
-- Migration: 0001_dhakapath_core.sql
-- Description: Core Schema, RLS Policies & Seed Data for DhakaPath (INIF 2026)
-- Track: Smart City | Zero-Bloat Anonymous Public RLS Architecture
-- ==============================================================================

-- 1. Transit Edges Table
CREATE TABLE IF NOT EXISTS transit_edges (
  edge_id TEXT PRIMARY KEY,
  origin_hub_id TEXT NOT NULL,
  dest_hub_id TEXT NOT NULL,
  mode TEXT NOT NULL,
  route_name TEXT NOT NULL,
  distance_km FLOAT8 NOT NULL,
  base_fare_bdt INT4 NOT NULL,
  base_duration_ms INT4 NOT NULL,
  student_half_fare_eligible BOOLEAN NOT NULL DEFAULT false,
  boarding_landmark TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Street Alerts Table
CREATE TABLE IF NOT EXISTS street_alerts (
  alert_id TEXT PRIMARY KEY,
  edge_id TEXT NOT NULL,
  hub_id TEXT NOT NULL,
  incident_type TEXT NOT NULL,
  status TEXT NOT NULL,
  validation_status TEXT NOT NULL,
  severity_alpha FLOAT8 NOT NULL,
  confidence_pct FLOAT8 NOT NULL,
  half_life_remaining_ms INT4 NOT NULL,
  created_timestamp_ms INT8 NOT NULL,
  votes JSONB NOT NULL DEFAULT '[]'::jsonb
);

-- 3. Ride Share Pools Table
CREATE TABLE IF NOT EXISTS ride_share_pools (
  edge_id TEXT PRIMARY KEY,
  hub_id TEXT NOT NULL,
  pool_size_count INT4 NOT NULL DEFAULT 2,
  member_session_ids JSONB NOT NULL DEFAULT '["seed_commuter_1", "seed_commuter_2"]'::jsonb,
  updated_timestamp_ms INT8 NOT NULL
);

-- 4. Interception Logs Table
CREATE TABLE IF NOT EXISTS interception_logs (
  event_id TEXT PRIMARY KEY,
  timestamp_ms INT8 NOT NULL,
  status TEXT NOT NULL,
  rejected_payload_summary TEXT NOT NULL,
  execution_time_ms FLOAT8 NOT NULL
);

-- ==============================================================================
-- Row-Level Security (RLS) Configuration
-- Open Anonymous Access Policies (Zero Auth / No /login Wall)
-- ==============================================================================

ALTER TABLE transit_edges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read/write for hackathon demo" ON transit_edges;
CREATE POLICY "Allow public read/write for hackathon demo" ON transit_edges 
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE street_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read/write for hackathon demo" ON street_alerts;
CREATE POLICY "Allow public read/write for hackathon demo" ON street_alerts 
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE ride_share_pools ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read/write for hackathon demo" ON ride_share_pools;
CREATE POLICY "Allow public read/write for hackathon demo" ON ride_share_pools 
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE interception_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read/write for hackathon demo" ON interception_logs;
CREATE POLICY "Allow public read/write for hackathon demo" ON interception_logs 
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ==============================================================================
-- Initial Seed Telemetry (Demo & Presentation Seed)
-- ==============================================================================

INSERT INTO street_alerts (
  alert_id,
  edge_id,
  hub_id,
  incident_type,
  status,
  validation_status,
  severity_alpha,
  confidence_pct,
  half_life_remaining_ms,
  created_timestamp_ms,
  votes
) VALUES 
(
  'alert_farmgate_waterlogging',
  'E_BUS_SURFACE_MIRPUR10_FARMGATE',
  'H_FARMGATE',
  'WATERLOGGING',
  'VERIFIED_ACTIVE',
  'GRAPH_GROUNDED',
  2.4,
  91.8,
  1800000,
  1773715200000,
  '[{"vote_id": "v1", "voter_session_id": "s_demo1", "direction": 1, "reliability_weight": 0.85, "timestamp_ms": 1773715200000}]'::jsonb
),
(
  'alert_malibagh_gridlock',
  'E_BUS_MALIBAGH_MOTIJHEEL',
  'H_MALIBAGH',
  'SEVERE_GRIDLOCK',
  'VERIFIED_ACTIVE',
  'GRAPH_GROUNDED',
  1.9,
  89.2,
  1800000,
  1773715260000,
  '[{"vote_id": "v2", "voter_session_id": "s_demo2", "direction": 1, "reliability_weight": 0.78, "timestamp_ms": 1773715260000}]'::jsonb
)
ON CONFLICT (alert_id) DO UPDATE SET
  confidence_pct = EXCLUDED.confidence_pct,
  status = EXCLUDED.status;

INSERT INTO ride_share_pools (
  edge_id,
  hub_id,
  pool_size_count,
  member_session_ids,
  updated_timestamp_ms
) VALUES 
(
  'E_RICK_MOTIJHEEL_LASTMILE',
  'H_MOTIJHEEL',
  2,
  '["seed_commuter_1", "seed_commuter_2"]'::jsonb,
  1773715200000
),
(
  'E_RICK_MIRPUR10_FEEDER',
  'H_MIRPUR10',
  3,
  '["seed_student_1", "seed_student_2", "seed_student_3"]'::jsonb,
  1773715200000
)
ON CONFLICT (edge_id) DO UPDATE SET
  pool_size_count = EXCLUDED.pool_size_count,
  member_session_ids = EXCLUDED.member_session_ids;
