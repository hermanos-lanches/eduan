import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import type { LatenciaPoint } from '@/lib/types'

// ── Skeleton rows shown while loading ────────────────────────────────────────

const SKELETON_DATA: LatenciaPoint[] = [
  { workflow_name: '—', avg_ms: 0, total_exec: 0 },
  { workflow_name: '—', avg_ms: 0, total_exec: 0 },
  { workflow_name: '—', avg_ms: 0, total_exec: 0 },
]

const TOOLTIP_STYLE = {
  backgroundColor: '#1A1A1A',
  border: '1px solid #2A2A2A',
  borderRadius: 4,
  fontSize: 12,
  color: '#E5E5E5',
}

// Threshold: bars > 3 000ms get a warning colour
const WARN_MS = 3_000

interface LatenciaChartProps {
  data:    LatenciaPoint[]
  loading?: boolean
}

export function CustoReceitaChart({ data, loading = false }: LatenciaChartProps) {
  const rows = loading || data.length === 0 ? SKELETON_DATA : data

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Latência média por workflow (ms)</CardTitle>
      </CardHeader>
      <CardContent className="pt-2 pb-3">
        <ResponsiveContainer width="100%" height={228}>
          <BarChart
            data={rows}
            layout="vertical"
            margin={{ top: 4, right: 8, left: 4, bottom: 0 }}
            barSize={12}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1E1E1E" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 10, fill: '#555555' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `${v}ms`}
            />
            <YAxis
              type="category"
              dataKey="workflow_name"
              tick={{ fontSize: 10, fill: '#888888' }}
              tickLine={false}
              axisLine={false}
              width={90}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              cursor={{ fill: '#252525' }}
              formatter={(v: number, _: string, entry) => [
                `${v.toLocaleString('pt-BR')} ms  ·  ${entry.payload.total_exec} exec`,
                'Latência',
              ]}
            />
            <Bar dataKey="avg_ms" name="Latência" radius={[0, 2, 2, 0]}>
              {rows.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.avg_ms >= WARN_MS ? '#C4A560' : '#4A8FD4'}
                  opacity={loading ? 0.25 : 1}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
