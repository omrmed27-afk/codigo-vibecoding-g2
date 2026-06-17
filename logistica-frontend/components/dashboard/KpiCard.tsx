'use client'

import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

export interface KpiCardProps {
  title: string
  value: string | number
  subtitle?: string
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'gray'
  Icon?: LucideIcon
}

const borderMap: Record<NonNullable<KpiCardProps['color']>, string> = {
  blue:   'border-l-blue-500',
  green:  'border-l-green-500',
  yellow: 'border-l-yellow-500',
  red:    'border-l-red-500',
  gray:   'border-l-gray-400',
}

const valueColorMap: Record<NonNullable<KpiCardProps['color']>, string> = {
  blue:   'text-blue-700',
  green:  'text-green-700',
  yellow: 'text-yellow-700',
  red:    'text-red-700',
  gray:   'text-gray-700',
}

const iconBgMap: Record<NonNullable<KpiCardProps['color']>, string> = {
  blue:   'bg-blue-50 text-blue-600',
  green:  'bg-green-50 text-green-600',
  yellow: 'bg-yellow-50 text-yellow-700',
  red:    'bg-red-50 text-red-600',
  gray:   'bg-gray-100 text-gray-600',
}

export default function KpiCard({ title, value, subtitle, color = 'gray', Icon }: KpiCardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-lg border border-gray-200 border-l-4 p-4 sm:p-5 shadow-sm min-h-[84px]',
        borderMap[color]
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1 min-w-0">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide leading-tight">{title}</p>
          <p className={cn('text-2xl sm:text-3xl font-bold tabular-nums leading-none mt-0.5', valueColorMap[color])}>
            {value}
          </p>
          {subtitle && <p className="text-xs text-gray-500 mt-1 leading-snug">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={cn('p-2 rounded-lg shrink-0 mt-0.5', iconBgMap[color])}>
            <Icon className="w-4 h-4" strokeWidth={2} />
          </div>
        )}
      </div>
    </div>
  )
}
