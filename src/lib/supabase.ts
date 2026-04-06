import { createClient } from '@supabase/supabase-js'
import type { OverviewKPIs, TrendPoint, LatenciaPoint, WorkflowError } from './types'

// ── Client ────────────────────────────────────────────────────────────────────

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  console.warn('[supabase] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not set')
}

export const supabase = createClient(url ?? '', key ?? '')

// ── Retry with exponential backoff ────────────────────────────────────────────

async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 500,
): Promise<T> {
  try {
    return await fn()
  } catch (err) {
    if (retries === 0) throw err
    console.warn(`[supabase] retrying in ${delayMs}ms… (${retries} left)`)
    await new Promise((r) => setTimeout(r, delayMs))
    return withRetry(fn, retries - 1, delayMs * 2)
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** ISO timestamp for `now() - N hours` */
function cutoff(hours: number): string {
  return new Date(Date.now() - hours * 3_600_000).toISOString()
}

function avg(nums: number[]): number {
  if (!nums.length) return 0
  return Math.round(nums.reduce((s, n) => s + n, 0) / nums.length)
}

// ── fetchOverviewKPIs ─────────────────────────────────────────────────────────
// Implements:
//   COUNT(*) as execucoes_total FROM workflow_metrics WHERE created_at > NOW() - INTERVAL
//   COUNT(*) FILTER (status='success') * 100.0 / COUNT(*) as taxa_sucesso
//   execucoes_total / period_hours as throughput_per_h
//   AVG(duration_ms) as latencia_media_ms
//   COUNT(DISTINCT workflow_name) as workflows_ativos
//   COUNT(*) FROM workflow_errors WHERE severity='critical' as erros_criticos

export async function fetchOverviewKPIs(periodHours: number): Promise<OverviewKPIs> {
  return withRetry(async () => {
    const since = cutoff(periodHours)

    // 1 — all metric rows in window (select only needed columns)
    const { data: metrics, error: metricsErr } = await supabase
      .from('workflow_metrics')
      .select('status, duration_ms, workflow_name')
      .gte('created_at', since)

    if (metricsErr) throw new Error(`workflow_metrics: ${metricsErr.message}`)

    // 2 — critical errors count
    const { count: criticalCount, error: errErr } = await supabase
      .from('workflow_errors')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', since)
      .eq('severity', 'critical')

    if (errErr) throw new Error(`workflow_errors: ${errErr.message}`)

    // 3 — aggregate client-side (handles empty table gracefully)
    const rows       = metrics ?? []
    const total      = rows.length
    const successful = rows.filter((r) => r.status === 'success').length
    const durations  = rows.map((r) => r.duration_ms as number).filter(Boolean)
    const wfNames    = new Set(rows.map((r) => r.workflow_name as string))

    return {
      execucoes_total:   total,
      taxa_sucesso:      total > 0 ? Math.round((successful / total) * 1000) / 10 : 0,
      throughput_per_h:  total > 0 ? Math.round((total / periodHours) * 10) / 10 : 0,
      latencia_media_ms: avg(durations),
      workflows_ativos:  wfNames.size,
      erros_criticos:    criticalCount ?? 0,
    }
  })
}

// ── fetchTrendData ────────────────────────────────────────────────────────────
// Executions + errors grouped by hour, ordered ascending.

export async function fetchTrendData(periodHours: number): Promise<TrendPoint[]> {
  return withRetry(async () => {
    const { data, error } = await supabase
      .from('workflow_metrics')
      .select('created_at, status')
      .gte('created_at', cutoff(periodHours))
      .order('created_at', { ascending: true })

    if (error) throw new Error(`trend: ${error.message}`)

    // Group by hour bucket — handles empty table (returns [])
    const buckets = new Map<string, { execucoes: number; erros: number }>()

    for (const row of data ?? []) {
      const d    = new Date(row.created_at as string)
      const hora = `${String(d.getHours()).padStart(2, '0')}:00`
      const b    = buckets.get(hora) ?? { execucoes: 0, erros: 0 }
      b.execucoes++
      if (row.status === 'error') b.erros++
      buckets.set(hora, b)
    }

    return Array.from(buckets.entries()).map(([hora, v]) => ({ hora, ...v }))
  })
}

// ── fetchLatenciaData ─────────────────────────────────────────────────────────
// AVG(duration_ms) GROUP BY workflow_name, top 8 desc.

export async function fetchLatenciaData(periodHours: number): Promise<LatenciaPoint[]> {
  return withRetry(async () => {
    const { data, error } = await supabase
      .from('workflow_metrics')
      .select('workflow_name, duration_ms')
      .gte('created_at', cutoff(periodHours))

    if (error) throw new Error(`latencia: ${error.message}`)

    // Aggregate client-side — handles empty table (returns [])
    const acc = new Map<string, { total: number; count: number }>()

    for (const row of data ?? []) {
      const name = row.workflow_name as string
      const ms   = row.duration_ms   as number
      const cur  = acc.get(name) ?? { total: 0, count: 0 }
      cur.total += ms
      cur.count++
      acc.set(name, cur)
    }

    return Array.from(acc.entries())
      .map(([workflow_name, v]) => ({
        workflow_name,
        avg_ms:     Math.round(v.total / v.count),
        total_exec: v.count,
      }))
      .sort((a, b) => b.avg_ms - a.avg_ms)
      .slice(0, 8)
  })
}

// ── fetchRecentErrors ─────────────────────────────────────────────────────────
// Last 5 workflow_errors in the window, newest first.

export async function fetchRecentErrors(periodHours: number): Promise<WorkflowError[]> {
  return withRetry(async () => {
    const { data, error } = await supabase
      .from('workflow_errors')
      .select('id, workflow_name, execution_id, error_message, severity, created_at')
      .gte('created_at', cutoff(periodHours))
      .order('created_at', { ascending: false })
      .limit(5)

    if (error) throw new Error(`errors: ${error.message}`)

    // Empty table → return []
    return (data ?? []) as WorkflowError[]
  })
}
