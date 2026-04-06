// ── DB row types ──────────────────────────────────────────────────────────────

export type WorkflowStatus = 'success' | 'error' | 'partial'
export type AlertSeverity  = 'critical' | 'warning' | 'info'

export interface KpiPayload {
  key:   string
  value: number
  unit:  string
}

export interface WorkflowMetric {
  id:            string
  workflow_name: string
  execution_id:  string
  status:        WorkflowStatus
  duration_ms:   number
  business_kpi1: KpiPayload | null
  business_kpi2: KpiPayload | null
  business_kpi3: KpiPayload | null
  created_at:    string
}

export interface WorkflowError {
  id:            string
  workflow_name: string
  execution_id:  string
  error_message: string
  severity:      AlertSeverity
  created_at:    string
}

// ── RPC return types ──────────────────────────────────────────────────────────

/** Returned by get_overview_kpis() + get_critical_errors_count() */
export interface OverviewKPIs {
  execucoes_total:   number
  taxa_sucesso:      number   // 0–100
  throughput_per_h:  number
  latencia_media_ms: number
  workflows_ativos:  number
  erros_criticos:    number
}

/** Returned by get_execucoes_trend() — one row per hour */
export interface TrendPoint {
  hora:      string   // 'HH:MI'
  execucoes: number
  erros:     number
}

/** Returned by get_latencia_por_workflow() */
export interface LatenciaPoint {
  workflow_name: string
  avg_ms:        number
  total_exec:    number
}
