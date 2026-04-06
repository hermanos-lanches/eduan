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

const BASE_DATA = Array.from({ length: 30 }, (_, i) => {
  const date = new Date(2025, 2, 1 + i)
  const leads = Math.floor(28 + Math.random() * 22 + i * 0.9)
  return {
    date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    leads,
    conversoes: Math.floor(leads * (0.18 + Math.random() * 0.1)),
  }
})

const DATA_BY_PERIOD: Record<string, typeof BASE_DATA> = {
  '7d': BASE_DATA.slice(-7),
  '30d': BASE_DATA,
  '90d': Array.from({ length: 90 }, (_, i) => {
    const date = new Date(2024, 11, 1 + i)
    const leads = Math.floor(22 + Math.random() * 30 + i * 0.6)
    return {
      date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      leads,
      conversoes: Math.floor(leads * (0.17 + Math.random() * 0.12)),
    }
  }),
}

interface LeadsTrendChartProps {
  period: string
}

export function LeadsTrendChart({ period }: LeadsTrendChartProps) {
  const data = DATA_BY_PERIOD[period] ?? BASE_DATA
  const interval = period === '90d' ? 13 : period === '7d' ? 0 : 4

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Leads & Conversões — tendência diária</CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        <ResponsiveContainer width="100%" height={224}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gradLeads" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4A8FD4" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#4A8FD4" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradConversoes" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3D7A6C" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#3D7A6C" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#232323" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: '#666666' }}
              tickLine={false}
              axisLine={false}
              interval={interval}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#666666' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1A1A1A',
                border: '1px solid #2A2A2A',
                borderRadius: 4,
                fontSize: 12,
                color: '#E5E5E5',
              }}
              cursor={{ stroke: '#3A3A3A', strokeWidth: 1 }}
            />
            <Legend
              iconSize={7}
              iconType="circle"
              wrapperStyle={{ fontSize: 11, color: '#888888', paddingTop: 8 }}
            />
            <Area
              type="monotone"
              dataKey="leads"
              name="Leads"
              stroke="#4A8FD4"
              strokeWidth={1.5}
              fill="url(#gradLeads)"
              dot={false}
              activeDot={{ r: 3, fill: '#4A8FD4' }}
            />
            <Area
              type="monotone"
              dataKey="conversoes"
              name="Conversões"
              stroke="#3D7A6C"
              strokeWidth={1.5}
              fill="url(#gradConversoes)"
              dot={false}
              activeDot={{ r: 3, fill: '#3D7A6C' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
