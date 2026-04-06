-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Overview RPC functions
-- Apply via: Supabase MCP → apply_migration OR Supabase Dashboard → SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Tables (idempotent) ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS workflow_metrics (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_name  text        NOT NULL,
  execution_id   text        NOT NULL UNIQUE,
  status         text        NOT NULL DEFAULT 'success',
    -- 'success' | 'error' | 'partial'
  duration_ms    integer     NOT NULL DEFAULT 0,
  business_kpi1  jsonb,
  business_kpi2  jsonb,
  business_kpi3  jsonb,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workflow_errors (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_name  text        NOT NULL,
  execution_id   text        NOT NULL,
  error_message  text        NOT NULL,
  severity       text        NOT NULL DEFAULT 'warning',
    -- 'critical' | 'warning' | 'info'
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_wm_workflow_name  ON workflow_metrics (workflow_name);
CREATE INDEX IF NOT EXISTS idx_wm_created_at     ON workflow_metrics (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wm_status         ON workflow_metrics (status);
CREATE INDEX IF NOT EXISTS idx_we_workflow_name  ON workflow_errors  (workflow_name);
CREATE INDEX IF NOT EXISTS idx_we_severity       ON workflow_errors  (severity);
CREATE INDEX IF NOT EXISTS idx_we_created_at     ON workflow_errors  (created_at DESC);

-- 2. get_overview_kpis ─────────────────────────────────────────────────────────
-- Implements:
--   COUNT(*) as execucoes_24h
--   COUNT(*) FILTER (WHERE status='success') * 100.0 / COUNT(*) as taxa_sucesso
--   throughput = execucoes / period_hours
--   latencia   = AVG(duration_ms)
--   workflows_ativos = COUNT(DISTINCT workflow_name)

CREATE OR REPLACE FUNCTION get_overview_kpis(period_hours int DEFAULT 24)
RETURNS TABLE (
  execucoes_total   bigint,
  taxa_sucesso      numeric,
  throughput_per_h  numeric,
  latencia_media_ms numeric,
  workflows_ativos  bigint
)
LANGUAGE sql STABLE
AS $$
  SELECT
    COUNT(*)
      AS execucoes_total,

    ROUND(
      100.0 * COUNT(*) FILTER (WHERE status = 'success')
      / NULLIF(COUNT(*), 0),
    1)  AS taxa_sucesso,

    ROUND(
      COUNT(*)::numeric / NULLIF(period_hours, 0),
    2)  AS throughput_per_h,

    ROUND(AVG(duration_ms)::numeric, 0)
      AS latencia_media_ms,

    COUNT(DISTINCT workflow_name)
      AS workflows_ativos

  FROM workflow_metrics
  WHERE created_at > now() - (period_hours || ' hours')::interval;
$$;

-- 3. get_critical_errors_count ────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_critical_errors_count(period_hours int DEFAULT 24)
RETURNS bigint
LANGUAGE sql STABLE
AS $$
  SELECT COUNT(*)
  FROM workflow_errors
  WHERE severity  = 'critical'
    AND created_at > now() - (period_hours || ' hours')::interval;
$$;

-- 4. get_execucoes_trend ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_execucoes_trend(period_hours int DEFAULT 24)
RETURNS TABLE (
  hora      text,
  execucoes bigint,
  erros     bigint
)
LANGUAGE sql STABLE
AS $$
  SELECT
    to_char(date_trunc('hour', created_at), 'HH24:MI')  AS hora,
    COUNT(*)                                             AS execucoes,
    COUNT(*) FILTER (WHERE status = 'error')             AS erros
  FROM workflow_metrics
  WHERE created_at > now() - (period_hours || ' hours')::interval
  GROUP BY date_trunc('hour', created_at)
  ORDER BY date_trunc('hour', created_at);
$$;

-- 5. get_latencia_por_workflow ─────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_latencia_por_workflow(period_hours int DEFAULT 24)
RETURNS TABLE (
  workflow_name text,
  avg_ms        numeric,
  total_exec    bigint
)
LANGUAGE sql STABLE
AS $$
  SELECT
    workflow_name,
    ROUND(AVG(duration_ms)::numeric, 0)  AS avg_ms,
    COUNT(*)                             AS total_exec
  FROM workflow_metrics
  WHERE created_at > now() - (period_hours || ' hours')::interval
  GROUP BY workflow_name
  ORDER BY avg_ms DESC
  LIMIT 8;
$$;

-- 6. get_workflow_errors_recent ────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_workflow_errors_recent(period_hours int DEFAULT 24)
RETURNS TABLE (
  id            uuid,
  workflow_name text,
  execution_id  text,
  error_message text,
  severity      text,
  created_at    timestamptz
)
LANGUAGE sql STABLE
AS $$
  SELECT id, workflow_name, execution_id, error_message, severity, created_at
  FROM workflow_errors
  WHERE created_at > now() - (period_hours || ' hours')::interval
  ORDER BY created_at DESC
  LIMIT 5;
$$;
