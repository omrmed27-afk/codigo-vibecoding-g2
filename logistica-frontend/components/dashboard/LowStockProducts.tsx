'use client'

import { useMemo } from 'react'
import { useProductList } from '@/hooks/products/use-products'
import { useShipmentList } from '@/hooks/shipments/use-shipments'
import LoadingSpinner from '@/components/shared/LoadingSpinner'

function availableBarColor(available: number): string {
  if (available < 5) return 'bg-red-500'
  if (available < 20) return 'bg-yellow-500'
  return 'bg-green-500'
}

function buildCommittedMap(shipments: { shipment_products?: { product: { id: number }; quantity: number }[] }[]): Map<number, number> {
  const map = new Map<number, number>()
  for (const s of shipments) {
    for (const sp of (s.shipment_products ?? [])) {
      map.set(sp.product.id, (map.get(sp.product.id) ?? 0) + sp.quantity)
    }
  }
  return map
}

export default function LowStockProducts() {
  const { data: productData, isLoading: productsLoading } = useProductList({ ordering: 'stock_quantity', page: 1 })

  // Active orders — units reserved but not yet shipped
  const pending    = useShipmentList({ status: 'pending',    page: 1 })
  const pickedUp   = useShipmentList({ status: 'picked_up', page: 1 })
  const inTransit  = useShipmentList({ status: 'in_transit', page: 1 })

  // Delivered — units already sent out (backend doesn't decrement stock_quantity on delivery)
  const delivered  = useShipmentList({ status: 'delivered',  page: 1, ordering: '-created_at' })

  const isLoading =
    productsLoading ||
    pending.isLoading || pickedUp.isLoading || inTransit.isLoading || delivered.isLoading

  const activeMap = useMemo(() => buildCommittedMap([
    ...(pending.data?.results   ?? []),
    ...(pickedUp.data?.results  ?? []),
    ...(inTransit.data?.results ?? []),
  ]), [pending.data, pickedUp.data, inTransit.data])

  const deliveredMap = useMemo(() => buildCommittedMap(
    delivered.data?.results ?? []
  ), [delivered.data])

  const products = (productData?.results ?? []).slice(0, 10)

  const rows = products.map((p) => {
    const totalStock   = p.stock_quantity
    const activeQty    = activeMap.get(p.id) ?? 0
    const deliveredQty = deliveredMap.get(p.id) ?? 0
    const available    = Math.max(0, totalStock - activeQty - deliveredQty)

    const denom = totalStock > 0 ? totalStock : 1
    const availablePct  = (available  / denom) * 100
    const activePct     = Math.min((activeQty    / denom) * 100, 100 - availablePct)
    const deliveredPct  = Math.min((deliveredQty / denom) * 100, 100 - availablePct - activePct)

    return { id: p.id, name: p.name, totalStock, activeQty, deliveredQty, available, availablePct, activePct, deliveredPct, barColor: availableBarColor(available) }
  })

  // partial note if any status had more results than page 1
  const hasMore =
    (pending.data?.count ?? 0)   > (pending.data?.results.length   ?? 0) ||
    (pickedUp.data?.count ?? 0)  > (pickedUp.data?.results.length  ?? 0) ||
    (inTransit.data?.count ?? 0) > (inTransit.data?.results.length ?? 0) ||
    (delivered.data?.count ?? 0) > (delivered.data?.results.length ?? 0)

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-4">
        <h2 className="text-sm font-semibold text-gray-800">Stock de Productos</h2>
        {hasMore && (
          <span className="text-xs text-gray-500 italic">Basado en los 20 envíos más recientes por estado</span>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <LoadingSpinner />
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 gap-2">
          <p className="text-sm text-gray-500">Sin productos encontrados</p>
        </div>
      ) : (
        <>
          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-4">
            <span className="flex items-center gap-1.5 text-xs text-gray-600">
              <span className="w-3 h-3 rounded-sm bg-green-500 inline-block shrink-0" />
              Disponible
            </span>
            <span className="flex items-center gap-1.5 text-xs text-gray-600">
              <span className="w-3 h-3 rounded-sm bg-yellow-500 inline-block shrink-0" />
              Disponible (bajo)
            </span>
            <span className="flex items-center gap-1.5 text-xs text-gray-600">
              <span className="w-3 h-3 rounded-sm bg-red-500 inline-block shrink-0" />
              Disponible (crítico)
            </span>
            <span className="flex items-center gap-1.5 text-xs text-gray-600">
              <span className="w-3 h-3 rounded-sm bg-amber-400 inline-block shrink-0" />
              Pedidos activos
            </span>
            <span className="flex items-center gap-1.5 text-xs text-gray-600">
              <span className="w-3 h-3 rounded-sm bg-slate-400 inline-block shrink-0" />
              Entregados
            </span>
          </div>

          {/* Stacked bar rows */}
          <div className="space-y-3">
            {rows.map((row) => (
              <div key={row.id} className="flex items-center gap-3">
                {/* Name */}
                <div className="w-28 sm:w-36 text-xs text-gray-700 truncate shrink-0" title={row.name}>
                  {row.name}
                </div>

                {/* Stacked bar */}
                <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden flex">
                  {row.available > 0 && (
                    <div
                      style={{ width: `${row.availablePct}%` }}
                      className={`h-full transition-all duration-300 ${row.barColor}`}
                      title={`Disponible: ${row.available} uds.`}
                    />
                  )}
                  {row.activeQty > 0 && (
                    <div
                      style={{ width: `${row.activePct}%` }}
                      className="h-full bg-amber-400 transition-all duration-300"
                      title={`Pedidos activos: ${row.activeQty} uds.`}
                    />
                  )}
                  {row.deliveredQty > 0 && (
                    <div
                      style={{ width: `${row.deliveredPct}%` }}
                      className="h-full bg-slate-400 transition-all duration-300"
                      title={`Entregados: ${row.deliveredQty} uds.`}
                    />
                  )}
                </div>

                {/* Values */}
                <div className="text-xs text-gray-600 shrink-0 tabular-nums whitespace-nowrap">
                  <span className="font-semibold text-gray-900">{row.available}</span>
                  <span className="text-gray-500">/{row.totalStock}</span>
                  {row.activeQty > 0 && (
                    <span className="ml-1 text-amber-600 font-medium">+{row.activeQty}▲</span>
                  )}
                  {row.deliveredQty > 0 && (
                    <span className="ml-1 text-slate-500">+{row.deliveredQty}✓</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-500 mt-4 border-t border-gray-100 pt-3">
            Disp/Total · <span className="text-amber-600">▲ pedidos activos</span> · <span className="text-slate-500">✓ entregados</span> (sin descontar del inventario)
          </p>
        </>
      )}
    </div>
  )
}
