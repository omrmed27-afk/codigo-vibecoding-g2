'use client'

import { useMemo } from 'react'
import { useShipmentList } from '@/hooks/shipments/use-shipments'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts'

function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function formatWeekShort(monday: Date): string {
  const mm = String(monday.getMonth() + 1).padStart(2, '0')
  const dd = String(monday.getDate()).padStart(2, '0')
  return `${mm}/${dd}`
}

interface ShipmentsOverTimeProps {
  days?: number
}

export default function ShipmentsOverTime({ days = 30 }: ShipmentsOverTimeProps) {
  const { data, isLoading } = useShipmentList({ ordering: '-created_at', page: 1 })

  const { chartData, isPartial } = useMemo(() => {
    if (!data?.results) return { chartData: [], isPartial: false }

    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)

    const filtered = data.results.filter((s) => new Date(s.created_at) >= cutoff)

    const weekMap = new Map<string, number>()
    for (const shipment of filtered) {
      const monday = getMonday(new Date(shipment.created_at))
      const key = monday.toISOString()
      weekMap.set(key, (weekMap.get(key) ?? 0) + 1)
    }

    const sorted = Array.from(weekMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([isoKey, count]) => ({
        week: formatWeekShort(new Date(isoKey)),
        weekFull: `Semana del ${formatWeekShort(new Date(isoKey))}`,
        count,
      }))

    return {
      chartData: sorted,
      isPartial: (data.count ?? 0) > 20,
    }
  }, [data, days])

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-4">
        <h2 className="text-sm font-semibold text-gray-800">Envíos en el Tiempo</h2>
        {isPartial && (
          <span className="text-xs text-gray-500 italic">
            Basado en los 20 envíos más recientes
          </span>
        )}
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center h-52">
          <LoadingSpinner />
        </div>
      ) : chartData.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-52 gap-2">
          <p className="text-sm text-gray-500">Sin envíos en el período seleccionado</p>
          <p className="text-xs text-gray-400">Prueba ampliar el rango de fechas</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={chartData} margin={{ top: 10, right: 16, left: -8, bottom: 0 }}>
            <defs>
              <linearGradient id="shipmentGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis
              dataKey="week"
              tick={{ fontSize: 11, fill: '#6b7280' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: '#6b7280' }}
              axisLine={false}
              tickLine={false}
              width={28}
            />
            <Tooltip
              labelFormatter={(label, payload) => {
                const item = payload?.[0]?.payload
                return item?.weekFull ?? label
              }}
              formatter={(value) => [`${value} envíos`, 'Total']}
              contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #e5e7eb', color: '#111827' }}
            />
            <Area
              type="monotone"
              dataKey="count"
              name="Envíos"
              stroke="#6366f1"
              strokeWidth={2}
              fill="url(#shipmentGradient)"
              dot={{ fill: '#6366f1', r: 3 }}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
