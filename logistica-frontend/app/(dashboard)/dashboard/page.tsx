'use client'

import { useState } from 'react'
import { Package, Clock, Navigation, CheckCircle2, Truck } from 'lucide-react'
import { useShipmentList } from '@/hooks/shipments/use-shipments'
import { useDriverList } from '@/hooks/drivers/use-drivers'
import { useTransportList } from '@/hooks/transport/use-transport'
import KpiCard from '@/components/dashboard/KpiCard'
import ShipmentsByStatus from '@/components/dashboard/ShipmentsByStatus'
import FleetStatus from '@/components/dashboard/FleetStatus'
import ShipmentsOverTime from '@/components/dashboard/ShipmentsOverTime'
import LowStockProducts from '@/components/dashboard/LowStockProducts'
import PageHeader from '@/components/shared/PageHeader'

const DATE_RANGE_OPTIONS = [
  { label: '7 días', value: 7 },
  { label: '30 días', value: 30 },
  { label: '90 días', value: 90 },
] as const

type DateRange = 7 | 30 | 90

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState<DateRange>(30)

  // KPI queries — use count from paginated response
  const totalShipments = useShipmentList({ page: 1 })
  const pendingShipments = useShipmentList({ status: 'pending', page: 1 })
  const inTransitShipments = useShipmentList({ status: 'in_transit', page: 1 })
  const deliveredShipments = useShipmentList({ status: 'delivered', page: 1 })
  const availableTransport = useTransportList({ status: 'available', page: 1 })
  const availableDrivers = useDriverList({ status: 'available', page: 1 })

  const kpiLoading =
    totalShipments.isLoading ||
    pendingShipments.isLoading ||
    inTransitShipments.isLoading ||
    deliveredShipments.isLoading ||
    availableTransport.isLoading ||
    availableDrivers.isLoading

  const kpis = [
    {
      title: 'Total Envíos',
      value: kpiLoading ? '—' : (totalShipments.data?.count ?? 0),
      color: 'blue' as const,
      Icon: Package,
    },
    {
      title: 'Pendientes',
      value: kpiLoading ? '—' : (pendingShipments.data?.count ?? 0),
      color: 'yellow' as const,
      Icon: Clock,
    },
    {
      title: 'En Tránsito',
      value: kpiLoading ? '—' : (inTransitShipments.data?.count ?? 0),
      color: 'blue' as const,
      Icon: Navigation,
    },
    {
      title: 'Entregados',
      value: kpiLoading ? '—' : (deliveredShipments.data?.count ?? 0),
      color: 'green' as const,
      Icon: CheckCircle2,
    },
    {
      title: 'Vehículos Disponibles',
      value: kpiLoading ? '—' : (availableTransport.data?.count ?? 0),
      subtitle: `${availableDrivers.data?.count ?? '—'} conductores disponibles`,
      color: 'green' as const,
      Icon: Truck,
    },
  ]

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6">
      <PageHeader
        title="Tablero"
        action={
          <div className="flex flex-wrap items-center gap-2">
            {DATE_RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDateRange(opt.value)}
                className={`px-3 py-1.5 text-xs rounded-md border transition-colors cursor-pointer ${
                  dateRange === opt.value
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        }
      />

      {/* Row 1: KPI cards — last card spans 2 cols on mobile so grid doesn't leave orphan */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {kpis.map((kpi, i) => (
          <div key={kpi.title} className={i === kpis.length - 1 ? 'col-span-2 sm:col-span-1' : ''}>
            <KpiCard
              title={kpi.title}
              value={kpi.value}
              subtitle={kpi.subtitle}
              color={kpi.color}
              Icon={kpi.Icon}
            />
          </div>
        ))}
      </div>

      {/* Row 2: Shipments by status + Fleet status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ShipmentsByStatus />
        <FleetStatus />
      </div>

      {/* Row 3: Shipments over time */}
      <ShipmentsOverTime days={dateRange} />

      {/* Row 4: Low stock products */}
      <LowStockProducts />
    </div>
  )
}
