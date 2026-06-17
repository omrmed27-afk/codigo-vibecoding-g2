'use client'

import { useShipmentList } from '@/hooks/shipments/use-shipments'
import type { ShipmentStatus } from '@/types/shipments'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

const STATUSES: { key: ShipmentStatus; label: string; color: string }[] = [
  { key: 'pending', label: 'Pendiente', color: '#f59e0b' },
  { key: 'picked_up', label: 'Recogido', color: '#3b82f6' },
  { key: 'in_transit', label: 'En Tránsito', color: '#6366f1' },
  { key: 'delivered', label: 'Entregado', color: '#22c55e' },
  { key: 'cancelled', label: 'Cancelado', color: '#ef4444' },
]

function useStatusCount(status: ShipmentStatus) {
  return useShipmentList({ status, page: 1 })
}

export default function ShipmentsByStatus() {
  const pending = useStatusCount('pending')
  const pickedUp = useStatusCount('picked_up')
  const inTransit = useStatusCount('in_transit')
  const delivered = useStatusCount('delivered')
  const cancelled = useStatusCount('cancelled')

  const queries = [pending, pickedUp, inTransit, delivered, cancelled]
  const isLoading = queries.some((q) => q.isLoading)

  const data = STATUSES.map((s, i) => ({
    label: s.label,
    color: s.color,
    count: queries[i].data?.count ?? 0,
  }))

  // Only render slices with data — pie charts with 0-value slices mislead
  const chartData = data
    .filter((d) => d.count > 0)
    .map((d) => ({ name: d.label, value: d.count, color: d.color }))

  const total = data.reduce((acc, d) => acc + d.count, 0)

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5 shadow-sm h-full" aria-label="Envíos por estado">
      <h2 className="text-sm font-semibold text-gray-800 mb-4">Envíos por Estado</h2>
      {isLoading ? (
        <div className="flex items-center justify-center h-52">
          <LoadingSpinner />
        </div>
      ) : total === 0 ? (
        <div className="flex flex-col items-center justify-center h-52 gap-2">
          <p className="text-sm text-gray-500">Sin datos de envíos</p>
          <p className="text-xs text-gray-400">Los envíos aparecerán aquí cuando existan registros</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={95}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [`${value} envíos`, name]}
              contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #e5e7eb' }}
            />
            <Legend
              iconSize={10}
              formatter={(value) => {
                const item = data.find((d) => d.label === value)
                return (
                  <span style={{ fontSize: 12, color: '#374151' }}>
                    {value} ({item?.count ?? 0})
                  </span>
                )
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
