import { ArrowUp, ArrowDown, Minus } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface KpiCardProps {
  label: string
  value: string
  trend: number
  trendLabel: string
  icon: React.ReactNode
  alert?: boolean
}

export function KpiCard({ label, value, trend, trendLabel, icon, alert }: KpiCardProps) {
  const isPositive = trend > 0
  const isNegative = trend < 0

  return (
    <Card className={cn(alert && 'border-red-900/40')}>
      {/* Label + icon */}
      <div className="flex items-center justify-between px-3 pt-3">
        <span className="truncate pr-1 text-[10px] font-medium uppercase tracking-wider text-[#666666]">
          {label}
        </span>
        <span className="shrink-0 text-[#444444]">{icon}</span>
      </div>

      {/* Value */}
      <div className="px-3 pb-3 pt-1.5">
        <p
          className={cn(
            'text-[22px] font-semibold tabular-nums leading-none',
            alert ? 'text-red-400' : 'text-[#EBEBEB]',
          )}
        >
          {value}
        </p>

        {/* Trend + context — single line */}
        <div className="mt-1.5 flex items-center gap-1.5">
          {trend !== 0 ? (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 text-[11px] font-medium leading-none',
                isPositive && 'text-emerald-400',
                isNegative && 'text-red-400',
              )}
            >
              {isPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
              {Math.abs(trend)}%
            </span>
          ) : (
            <span className="inline-flex items-center text-[11px] leading-none text-[#444444]">
              <Minus className="h-3 w-3" />
            </span>
          )}
          <span className="text-[11px] leading-none text-[#555555]">{trendLabel}</span>
        </div>
      </div>
    </Card>
  )
}
