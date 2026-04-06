import { AlertTriangle, Info, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

type Severity = 'critical' | 'warning' | 'info'

interface Alert {
  id: string
  severity: Severity
  message: string
  time: string
  source: string
}

const MOCK_ALERTS: Alert[] = [
  {
    id: '1',
    severity: 'critical',
    message: 'Custo IA ultrapassou 90% do limite mensal',
    time: 'há 12 min',
    source: 'n8n / cost-monitor',
  },
  {
    id: '2',
    severity: 'warning',
    message: 'Taxa de conversão abaixo de 20% nas últimas 6h',
    time: 'há 1h',
    source: 'leads-pipeline',
  },
  {
    id: '3',
    severity: 'warning',
    message: 'Workflow "enrich-lead" com latência elevada (p95 > 8s)',
    time: 'há 2h',
    source: 'n8n / enrich-lead',
  },
  {
    id: '4',
    severity: 'info',
    message: 'Novo modelo Haiku disponível — custo estimado 40% menor',
    time: 'há 4h',
    source: 'sistema',
  },
  {
    id: '5',
    severity: 'info',
    message: '1.200 leads processados com sucesso no ciclo diário',
    time: 'há 6h',
    source: 'leads-pipeline',
  },
]

const ICON: Record<Severity, React.ReactNode> = {
  critical: <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />,
  warning: <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />,
  info: <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-400" />,
}

const LABEL: Record<Severity, string> = {
  critical: 'Crítico',
  warning: 'Alerta',
  info: 'Info',
}

export function AlertsMiniList() {
  const active = MOCK_ALERTS.filter((a) => a.severity !== 'info').length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Alertas ativos</CardTitle>
          <span className="text-xs text-[#555555]">
            {active} críticos/alertas · {MOCK_ALERTS.length} total
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-[#222222]">
          {MOCK_ALERTS.map((alert) => (
            <div key={alert.id} className="flex items-start gap-3 px-4 py-2.5">
              {ICON[alert.severity]}
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-snug text-[#E5E5E5]">{alert.message}</p>
                <p className="mt-0.5 text-xs text-[#555555]">
                  {alert.source} · {alert.time}
                </p>
              </div>
              <Badge variant={alert.severity} className="ml-2 shrink-0">
                {LABEL[alert.severity]}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
