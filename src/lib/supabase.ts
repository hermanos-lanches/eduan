import { createClient } from '@supabase/supabase-js'
import type { OverviewKPIs, TrendPoint, LatenciaPoint, WorkflowError } from './types'

// ── Client ────────────────────────────────────────────────────────────────────

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL      as string
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('[supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ── Retry with exponential backoff (max 3 attempts) ───────────────────────────

async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 500,
): Promise<T> {
  try {
    return await fn()
  } catch (err) {
    if (retries === 0) throw err
    console.warn(`[supabase] Retrying in ${delayMs}ms… (${retries} left)`)
    await new Promise((res) => setTimeout(res, delayMs))
    return withRetry(fn, retries - 1, delayMs * 2)
  }
}

// ── RPC callers ───────────────────────────────────────────────────────────────

/**
 * Fetches all 6 Overview KPIs for the given window.
 * Calls: get_overview_kpis(period_hours) + get_critical_errors_count(period_hours)
 */
export async function fetchOverviewKPIs(periodHours: number): Promise<OverviewKPIs> {
  return withRetry(async () => {
    const [kpiRes, errRes] = await Promise.all([
      supabase.rpc('get_overview_kpis', { period_hours: periodHours }).single(),
      supabase.rpc('get_critical_errors_count', { period_hours: periodHours }).single(),
    ])

    if (kpiRes.error) throw new Error(`get_overview_kpis: ${kpiRes.error.message}`)
    if (errRes.error) throw new Error(`get_critical_errors_count: ${errRes.error.message}`)

    return {
      ...kpiRes.data,
      erros_criticos: (errRes.data as number) ?? 0,
    } as OverviewKPIs
  })
}

/**
 * Executions + errors grouped by hour.
 * Calls: get_execucoes_trend(period_hours)
 */
export async function fetchTrendData(periodHours: number): Promise<TrendPoint[]> {
  return withRetry(async () => {
    const { data, error } = await supabase.rpc('get_execucoes_trend', { period_hours: periodHours })
    if (error) throw new Error(`get_execucoes_trend: ${error.message}`)
    return (data ?? []) as TrendPoint[]
  })
}

/**
 * Average latency per workflow, descending.
 * Calls: get_latencia_por_workflow(period_hours)
 */
export async function fetchLatenciaData(periodHours: number): Promise<LatenciaPoint[]> {
  return withRetry(async () => {
    const { data, error } = await supabase.rpc('get_latencia_por_workflow', { period_hours: periodHours })
    if (error) throw new Error(`get_latencia_por_workflow: ${error.message}`)
    return (data ?? []) as LatenciaPoint[]
  })
}

/**
 * Recent workflow errors for the alert list (max 5).
 * Calls: get_workflow_errors_recent(period_hours)
 */
export async function fetchRecentErrors(periodHours: number): Promise<WorkflowError[]> {
  return withRetry(async () => {
    const { data, error } = await supabase.rpc('get_workflow_errors_recent', { period_hours: periodHours })
    if (error) throw new Error(`get_workflow_errors_recent: ${error.message}`)
    return (data ?? []) as WorkflowError[]
  })
}
