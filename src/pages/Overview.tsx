import { useState } from 'react'
import {
  PlayCircle,
  CheckCircle2,
  Gauge,
  Timer,
  XOctagon,
  LayoutGrid,
  ChevronDown,
  AlertTriangle,
  XCircle,
  Info,
  RefreshCw,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { KpiCard } from '@/components/dashboard/kpi-card'
import { CustoReceitaChart } from '@/components/dashboard/custo-receita-chart'
import { useOverviewData } from '@/hooks/useOverviewData'
import { cn } from '@/lib/utils'
import type { AlertSeverity } from '@/lib/types'

// ── Filter options ────────────────────────────────────────────────────────────

const PERIODOS  = [{ v: '24h', l: 'Últimas 24h'  },
                   { v: '7d',  l: 'Últimos 7 dias' },
                   { v: '30d', l: 'Últimos 30 dias' }]

const CANAIS    = ['Todos', 'WhatsApp', 'Email', 'Instagram', 'Site']
const CAMPANHAS = ['Todas', 'Q2 Leads', 'Retargeting', 'Outbound AI', 'Inbound SEO']

// ── KPI card skeleton (loading state) ────────────────────────────────────────

const KPI_SKELETON = Array.from({ length: 6 }, (_, i) => ({
  label:      ['Execuções 24h','Taxa Sucesso','Throughput','Latência Média','Erros Críticos','Workflows Ativos'][i],
  value:      '—',
  trend:      0,
  trendLabel: 'carregando…',
  icon:       [
    <PlayCircle  className="h-3.5 w-3.5" />,
    <CheckCircle2 className="h-3.5 w-3.5" />,
    <Gauge       className="h-3.5 w-3.5" />,
    <Timer       className="h-3.5 w-3.5" />,
    <XOctagon    className="h-3.5 w-3.5" />,
    <LayoutGrid  className="h-3.5 w-3.5" />,
  ][i],
}))

// ── Alert display constants ───────────────────────────────────────────────────

const ALERT_ICON: Record<AlertSeverity, React.ReactNode> = {
  critical: <XCircle       className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400"   />,
  warning:  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />,
  info:     <Info          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#4A6FA5]" />,
}

const ALERT_LABEL: Record<AlertSeverity, string> = {
  critical: 'Crítico', warning: 'Alerta', info: 'Info',
}

const ALERT_BORDER: Record<AlertSeverity, string> = {
  critical: 'border-l-2 border-l-red-500/50',
  warning:  'border-l-2 border-l-amber-500/40',
  info:     'border-l-2 border-l-transparent',
}

// ── Shared chart style ────────────────────────────────────────────────────────

const TOOLTIP_STYLE = {
  backgroundColor: '#1A1A1A',
  border: '1px solid #2A2A2A',
  borderRadius: 4,
  fontSize: 12,
  color: '#E5E5E5',
}

const AXIS_TICK = { fontSize: 10, fill: '#555555' }

// ── FilterSelect ──────────────────────────────────────────────────────────────

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: string[] | { v: string; l: string }[]
  onChange: (v: string) => void
}) {
  const opts = (options as Array<string | { v: string; l: string }>).map((o) =>
    typeof o === 'string' ? { v: o, l: o } : o
  )
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[11px] text-[#777777]">{label}</span>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="
            appearance-none cursor-pointer rounded border border-[#2A2A2A]
            bg-[#181818] px-2.5 py-1 pr-6 text-[11px] text-[#CCCCCC]
            outline-none transition-colors
            hover:border-[#3A3A3A] focus:border-[#3A3A3A]
          "
        >
          {opts.map((o) => (
            <option key={o.v} value={o.v}>{o.l}</option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-[#555555]" />
      </div>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number | null | undefined, suffix = ''): string {
  if (n == null) return '—'
  return n.toLocaleString('pt-BR') + suffix
}

function relativeTime(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60)   return `há ${diff}s`
  if (diff < 3600) return `há ${Math.floor(diff / 60)}min`
  if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`
  return `há ${Math.floor(diff / 86400)}d`
}

// ── Overview ──────────────────────────────────────────────────────────────────

export default function Overview() {
  const [periodo,  setPeriodo]  = useState('24h')
  const [canal,    setCanal]    = useState('Todos')
  const [campanha, setCampanha] = useState('Todas')

  // suppress unused — canal/campanha will filter server-side in a future step
  void canal
  void campanha

  const { kpis, trendData, latenciaData, alertas, loading, error, refetch } =
    useOverviewData(periodo)

  // ── Build KPI card definitions from live data ───────────────────────────────

  const kpiCards = kpis
    ? [
        {
          label:      'Execuções 24h',
          value:      fmt(kpis.execucoes_total),
          trend:      0,
          trendLabel: `${fmt(kpis.throughput_per_h)} exec/h`,
          icon:       <PlayCircle  className="h-3.5 w-3.5" />,
        },
        {
          label:      'Taxa de Sucesso',
          value:      fmt(kpis.taxa_sucesso, '%'),
          trend:      0,
          trendLabel: `${fmt(kpis.execucoes_total)} execuções`,
          icon:       <CheckCircle2 className="h-3.5 w-3.5" />,
        },
        {
          label:      'Throughput',
          value:      fmt(kpis.throughput_per_h, ' exec/h'),
          trend:      0,
          trendLabel: `no período selecionado`,
          icon:       <Gauge className="h-3.5 w-3.5" />,
        },
        {
          label:      'Latência Média',
          value:      fmt(kpis.latencia_media_ms, ' ms'),
          trend:      0,
          trendLabel: `avg duration_ms`,
          icon:       <Timer className="h-3.5 w-3.5" />,
        },
        {
          label:      'Erros Críticos',
          value:      fmt(kpis.erros_criticos),
          trend:      0,
          trendLabel: `severity = critical`,
          icon:       <XOctagon className="h-3.5 w-3.5" />,
          alert:      kpis.erros_criticos > 0,
        },
        {
          label:      'Workflows Ativos',
          value:      fmt(kpis.workflows_ativos),
          trend:      0,
          trendLabel: `distinct no período`,
          icon:       <LayoutGrid className="h-3.5 w-3.5" />,
        },
      ]
    : KPI_SKELETON

  const activeAlerts = alertas.filter((a) => a.severity !== 'info').length
  const trendInterval = periodo === '30d' ? 4 : 0

  return (
    <div className="min-h-screen bg-[#111111] text-[#E5E5E5]">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 border-b border-[#1E1E1E] bg-[#111111]">
        <div className="flex items-center justify-between px-6 py-3">

          {/* Brand */}
          <div className="flex items-center gap-4">
            <div>
              <p className="text-[13px] font-semibold leading-tight tracking-tight text-[#E5E5E5]">
                AI Performance Dashboard
              </p>
              <p className="text-[11px] text-[#555555]">Keterflow · Overview</p>
            </div>
            <div className="h-6 w-px bg-[#2A2A2A]" />
          </div>

          {/* Filters + refresh */}
          <div className="flex items-center gap-5">
            <FilterSelect label="Período"  value={periodo}  options={PERIODOS}  onChange={setPeriodo}  />
            <FilterSelect label="Canal"    value={canal}    options={CANAIS}    onChange={setCanal}    />
            <FilterSelect label="Campanha" value={campanha} options={CAMPANHAS} onChange={setCampanha} />
            <button
              onClick={refetch}
              disabled={loading}
              className="flex items-center gap-1 text-[11px] text-[#555555] transition-colors hover:text-[#888888] disabled:opacity-40"
            >
              <RefreshCw className={cn('h-3 w-3', loading && 'animate-spin')} />
              Atualizar
            </button>
          </div>

        </div>
      </header>

      {/* ── Error banner ───────────────────────────────────────────────────── */}
      {error && (
        <div className="border-b border-red-900/40 bg-red-950/30 px-6 py-2">
          <p className="text-[11px] text-red-400">
            Erro ao carregar dados: {error}
          </p>
        </div>
      )}

      {/* ── Main ───────────────────────────────────────────────────────────── */}
      <main className="space-y-4 p-6">

        {/* 1 ── KPI row */}
        <section className="grid grid-cols-6 gap-3">
          {kpiCards.map((kpi) => (
            <KpiCard key={kpi.label} {...kpi} />
          ))}
        </section>

        {/* 2 ── Charts row */}
        <section className="grid grid-cols-5 gap-3">

          {/* Execuções & Erros — 3/5 */}
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Execuções & Erros — tendência</CardTitle>
            </CardHeader>
            <CardContent className="pt-2 pb-3">
              <ResponsiveContainer width="100%" height={228}>
                <AreaChart
                  data={trendData}
                  margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="gExec" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#4A8FD4" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#4A8FD4" stopOpacity={0}    />
                    </linearGradient>
                    <linearGradient id="gErros" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#C45A5A" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#C45A5A" stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E1E1E" />
                  <XAxis dataKey="hora"      tick={AXIS_TICK} tickLine={false} axisLine={false} interval={trendInterval} />
                  <YAxis                     tick={AXIS_TICK} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ stroke: '#333', strokeWidth: 1 }} />
                  <Legend iconSize={7} iconType="circle" wrapperStyle={{ fontSize: 11, color: '#777', paddingTop: 8 }} />
                  <Area type="monotone" dataKey="execucoes" name="Execuções" stroke="#4A8FD4" strokeWidth={1.5} fill="url(#gExec)"  dot={false} activeDot={{ r: 3, fill: '#4A8FD4' }} />
                  <Area type="monotone" dataKey="erros"     name="Erros"     stroke="#C45A5A" strokeWidth={1.5} fill="url(#gErros)" dot={false} activeDot={{ r: 3, fill: '#C45A5A' }} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Latência por workflow — 2/5 */}
          <div className="col-span-2">
            <CustoReceitaChart data={latenciaData} loading={loading} />
          </div>

        </section>

        {/* 3 ── Alert summary */}
        <section>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Alertas ativos</CardTitle>
                <span className="text-[11px] text-[#555555]">
                  {loading ? '…' : `${activeAlerts} críticos/alertas · ${alertas.length} total`}
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {alertas.length === 0 && !loading && (
                <p className="px-4 py-3 text-[12px] text-[#555555]">
                  Nenhum alerta no período selecionado.
                </p>
              )}
              <div className="divide-y divide-[#1A1A1A]">
                {alertas.map((alert) => (
                  <div
                    key={alert.id}
                    className={cn(
                      'flex items-start gap-3 py-2.5 pr-4 pl-3',
                      ALERT_BORDER[alert.severity],
                    )}
                  >
                    {ALERT_ICON[alert.severity]}
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] leading-snug text-[#E0E0E0]">
                        {alert.error_message}
                      </p>
                      <p className="mt-0.5 text-[11px] text-[#555555]">
                        {alert.workflow_name}
                        <span className="mx-1.5 text-[#333333]">·</span>
                        {relativeTime(alert.created_at)}
                      </p>
                    </div>
                    <Badge variant={alert.severity} className="ml-2 mt-0.5 shrink-0">
                      {ALERT_LABEL[alert.severity]}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

      </main>
    </div>
  )
}
