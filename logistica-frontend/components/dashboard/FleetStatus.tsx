'use client'

import { useTransportList } from '@/hooks/transport/use-transport'
import { useDriverList } from '@/hooks/drivers/use-drivers'
import LoadingSpinner from '@/components/shared/LoadingSpinner'

interface Segment {
  label: string
  value: number
  color: string
}

function FleetPanel({
  title,
  segments,
  isLoading,
}: {
  title: string
  segments: Segment[]
  isLoading: boolean
}) {
  const total = segments.reduce((acc, s) => acc + s.value, 0)

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-gray-700">{title}</h3>
        {!isLoading && (
          <span className="text-xs tabular-nums font-bold text-gray-900">{total}</span>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-14">
          <LoadingSpinner />
        </div>
      ) : total === 0 ? (
        <p className="text-xs text-gray-500 h-14 flex items-center">Sin datos</p>
      ) : (
        <>
          {/* Proportional bar */}
          <div className="h-4 bg-gray-100 rounded-full overflow-hidden flex">
            {segments.filter((s) => s.value > 0).map((s, i) => (
              <div
                key={i}
                style={{ width: `${(s.value / total) * 100}%` }}
                className={`h-full transition-all duration-300 ${s.color}`}
                title={`${s.label}: ${s.value}`}
              />
            ))}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
            {segments.map((s, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-sm shrink-0 ${s.color}`} />
                <span className="text-xs text-gray-600">{s.label}</span>
                <span className="text-xs font-semibold tabular-nums text-gray-900">{s.value}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default function FleetStatus() {
  const transportAvailable   = useTransportList({ status: 'available' })
  const transportInTransit   = useTransportList({ status: 'in_transit' })
  const transportMaintenance = useTransportList({ status: 'maintenance' })

  const driverAvailable = useDriverList({ status: 'available' })
  const driverBusy      = useDriverList({ status: 'busy' })
  const driverOffDuty   = useDriverList({ status: 'off_duty' })

  const transportLoading =
    transportAvailable.isLoading || transportInTransit.isLoading || transportMaintenance.isLoading
  const driverLoading =
    driverAvailable.isLoading || driverBusy.isLoading || driverOffDuty.isLoading

  const transportSegments: Segment[] = [
    { label: 'Disponible',    value: transportAvailable.data?.count   ?? 0, color: 'bg-green-500' },
    { label: 'En Tránsito',   value: transportInTransit.data?.count   ?? 0, color: 'bg-blue-500'  },
    { label: 'Mantenimiento', value: transportMaintenance.data?.count ?? 0, color: 'bg-yellow-500' },
  ]

  const driverSegments: Segment[] = [
    { label: 'Disponible',     value: driverAvailable.data?.count ?? 0, color: 'bg-green-500' },
    { label: 'Ocupado',        value: driverBusy.data?.count      ?? 0, color: 'bg-amber-500' },
    { label: 'Fuera de Turno', value: driverOffDuty.data?.count   ?? 0, color: 'bg-gray-400'  },
  ]

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5 shadow-sm h-full">
      <h2 className="text-sm font-semibold text-gray-800 mb-4">Estado de Flota</h2>

      <div className="flex flex-col gap-5">
        <FleetPanel title="Vehículos"   segments={transportSegments} isLoading={transportLoading} />
        <div className="h-px bg-gray-100" />
        <FleetPanel title="Conductores" segments={driverSegments}    isLoading={driverLoading} />
      </div>
    </div>
  )
}
