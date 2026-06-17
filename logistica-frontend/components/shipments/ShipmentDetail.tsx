import StatusBadge from '@/components/shared/StatusBadge'
import StatusTimeline from '@/components/shipments/StatusTimeline'
import type { Shipment } from '@/types/shipments'

interface Props {
  shipment: Shipment
}

export default function ShipmentDetail({ shipment }: Props) {
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Tracking Number
            </p>
            <p className="text-2xl font-bold font-mono text-gray-900 tracking-wider">
              {shipment.tracking_number}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={shipment.status} />
            <p className="text-xs text-gray-500">
              Created{' '}
              {new Date(shipment.created_at).toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>
        <div className="mt-6">
          <StatusTimeline status={shipment.status} />
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Destination Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
            Destination
          </h3>
          <dl className="space-y-3">
            <div>
              <dt className="text-xs font-medium text-gray-500">Address</dt>
              <dd className="mt-0.5 text-sm text-gray-900">{shipment.destination_address}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500">City</dt>
              <dd className="mt-0.5 text-sm text-gray-900">{shipment.destination_city}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500">Country</dt>
              <dd className="mt-0.5 text-sm text-gray-900">{shipment.destination_country}</dd>
            </div>
          </dl>
        </div>

        {/* Logistics Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
            Logistics
          </h3>
          <dl className="space-y-3">
            <div>
              <dt className="text-xs font-medium text-gray-500">Origin Warehouse</dt>
              <dd className="mt-0.5 text-sm text-gray-900">{shipment.origin_warehouse.name}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500">Customer</dt>
              <dd className="mt-0.5 text-sm text-gray-900">
                {shipment.customer.name}{' '}
                <span className="text-gray-500 text-xs">({shipment.customer.email})</span>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500">Scheduled Delivery</dt>
              <dd className="mt-0.5 text-sm text-gray-900">{shipment.scheduled_delivery_date}</dd>
            </div>
            {shipment.actual_delivery_date && (
              <div>
                <dt className="text-xs font-medium text-gray-500">Actual Delivery</dt>
                <dd className="mt-0.5 text-sm text-green-700 font-medium">
                  {shipment.actual_delivery_date}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-xs font-medium text-gray-500">Weight</dt>
              <dd className="mt-0.5 text-sm text-gray-900">{shipment.weight_kg} kg</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500">Transport</dt>
              <dd className="mt-0.5 text-sm text-gray-900">
                {shipment.transport
                  ? `${shipment.transport.name} (${shipment.transport.plate_number})`
                  : <span className="text-gray-400 italic">Not assigned</span>}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500">Route</dt>
              <dd className="mt-0.5 text-sm text-gray-900">
                {shipment.route
                  ? shipment.route.name
                  : <span className="text-gray-400 italic">Not assigned</span>}
              </dd>
            </div>
          </dl>
        </div>

        {/* Cost Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
            Costs
          </h3>
          <dl className="space-y-3">
            <div>
              <dt className="text-xs font-medium text-gray-500">Base Cost</dt>
              <dd className="mt-0.5 text-sm text-gray-900">${shipment.base_cost}</dd>
              <p className="text-xs text-gray-400 mt-0.5">Calculado automáticamente según el peso del envío</p>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500">Final Cost</dt>
              <dd className="mt-0.5 text-lg font-semibold text-gray-900">
                ${shipment.calculated_cost}
              </dd>
              <p className="text-xs text-gray-400 mt-0.5">Puede diferir del costo base tras ajustes</p>
            </div>
          </dl>
        </div>

        {/* Notes Section */}
        {shipment.notes && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
              Notes
            </h3>
            <p className="text-sm text-gray-700 whitespace-pre-line">{shipment.notes}</p>
          </div>
        )}
      </div>

      {/* Products Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
          Products ({shipment.shipment_products.length})
        </h3>
        {shipment.shipment_products.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No products attached.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Product Name
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    SKU
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                    Qty
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                    Unit Price
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                    Line Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {shipment.shipment_products.map((sp) => {
                  const lineTotal = (
                    parseFloat(sp.unit_price_at_shipment) * sp.quantity
                  ).toFixed(2)
                  return (
                    <tr key={sp.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-gray-900 font-medium">
                        {sp.product.name}
                      </td>
                      <td className="px-3 py-2 text-gray-500 font-mono text-xs">
                        {sp.product.sku}
                      </td>
                      <td className="px-3 py-2 text-right text-gray-900">
                        {sp.quantity}
                      </td>
                      <td className="px-3 py-2 text-right text-gray-900">
                        ${sp.unit_price_at_shipment}
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-gray-900">
                        ${lineTotal}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
