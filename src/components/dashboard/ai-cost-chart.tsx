import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

const ALL_DATA = [
  { semana: 'S1', sonnet: 142.5, haiku: 28.3, opus: 87.2 },
  { semana: 'S2', sonnet: 178.4, haiku: 31.7, opus: 94.1 },
  { semana: 'S3', sonnet: 163.2, haiku: 26.9, opus: 103.7 },
  { semana: 'S4', sonnet: 191.8, haiku: 35.4, opus: 89.5 },
]

function filterByModel(model: string) {
  if (model === 'all') return ALL_DATA
  return ALL_DATA.map((d) => ({
    semana: d.semana,
    sonnet: model === 'sonnet' ? d.sonnet : 0,
    haiku: model === 'haiku' ? d.haiku : 0,
    opus: model === 'opus' ? d.opus : 0,
  }))
}

interface AICostChartProps {
  model: string
}

export function AICostChart({ model }: AICostChartProps) {
  const data = filterByModel(model)

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Custo IA por modelo — semanal (USD)</CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        <ResponsiveContainer width="100%" height={224}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={12}>
            <CartesianGrid strokeDasharray="3 3" stroke="#232323" vertical={false} />
            <XAxis
              dataKey="semana"
              tick={{ fontSize: 10, fill: '#666666' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#666666' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `$${v}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1A1A1A',
                border: '1px solid #2A2A2A',
                borderRadius: 4,
                fontSize: 12,
                color: '#E5E5E5',
              }}
              cursor={{ fill: '#252525' }}
              formatter={(v: number) => [`$${v.toFixed(2)}`, undefined]}
            />
            <Legend
              iconSize={7}
              iconType="circle"
              wrapperStyle={{ fontSize: 11, color: '#888888', paddingTop: 8 }}
            />
            <Bar dataKey="sonnet" name="Sonnet" fill="#4A8FD4" radius={[2, 2, 0, 0]} />
            <Bar dataKey="haiku" name="Haiku" fill="#3D7A6C" radius={[2, 2, 0, 0]} />
            <Bar dataKey="opus" name="Opus" fill="#C4A560" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
