import { useState, useEffect, useCallback } from 'react'
import {
  fetchOverviewKPIs,
  fetchTrendData,
  fetchLatenciaData,
  fetchRecentErrors,
} from '@/lib/supabase'
import type { OverviewKPIs, TrendPoint, LatenciaPoint, WorkflowError } from '@/lib/types'

// ── Period mapping ────────────────────────────────────────────────────────────

export const PERIOD_TO_HOURS: Record<string, number> = {
  '24h': 24,
  '7d':  168,
  '30d': 720,
}

// ── Zero-state (empty table) — never null after first load ───────────────────

const EMPTY_KPIS: OverviewKPIs = {
  execucoes_total:   0,
  taxa_sucesso:      0,
  throughput_per_h:  0,
  latencia_media_ms: 0,
  workflows_ativos:  0,
  erros_criticos:    0,
}

// ── Hook return type ──────────────────────────────────────────────────────────

export interface OverviewData {
  kpis:         OverviewKPIs
  trendData:    TrendPoint[]
  latenciaData: LatenciaPoint[]
  alertas:      WorkflowError[]
  loading:      boolean
  error:        string | null
  refetch:      () => void
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useOverviewData(period: string): OverviewData {
  const [kpis,         setKpis]         = useState<OverviewKPIs>(EMPTY_KPIS)
  const [trendData,    setTrendData]    = useState<TrendPoint[]>([])
  const [latenciaData, setLatenciaData] = useState<LatenciaPoint[]>([])
  const [alertas,      setAlertas]      = useState<WorkflowError[]>([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState<string | null>(null)

  const periodHours = PERIOD_TO_HOURS[period] ?? 24

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // All four queries run in parallel — each returns safe empty values on empty table
      const [kpiData, trend, latencia, errors] = await Promise.all([
        fetchOverviewKPIs(periodHours),
        fetchTrendData(periodHours),
        fetchLatenciaData(periodHours),
        fetchRecentErrors(periodHours),
      ])
      setKpis(kpiData)
      setTrendData(trend)
      setLatenciaData(latencia)
      setAlertas(errors)
    } catch (err) {
      // Table does not exist or network error — keep current data, show banner
      const msg = err instanceof Error ? err.message : 'Erro ao carregar dados'
      console.error('[useOverviewData]', msg)
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [periodHours])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  return { kpis, trendData, latenciaData, alertas, loading, error, refetch: fetchAll }
}
