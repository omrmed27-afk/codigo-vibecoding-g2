export type ShipmentStatus = 'pending' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled'

export interface CustomerRef {
  id: number
  name: string
  email: string
}

export interface ShipmentWarehouseRef {
  id: number
  name: string
  city: string
}

export interface ShipmentTransportRef {
  id: number
  name: string
  plate_number: string
  status: 'available' | 'in_transit' | 'maintenance'
}

export interface ShipmentRouteRef {
  id: number
  name: string
  status: 'active' | 'inactive'
}

export interface ShipmentProductRef {
  id: number
  name: string
  sku: string
  unit_price: string
}

export interface ShipmentProduct {
  id: number
  product: ShipmentProductRef
  quantity: number
  unit_price_at_shipment: string
  created_at: string
}

export interface Shipment {
  id: number
  tracking_number: string
  customer: CustomerRef
  origin_warehouse: ShipmentWarehouseRef
  destination_address: string
  destination_city: string
  destination_country: string
  status: ShipmentStatus
  transport: ShipmentTransportRef | null
  route: ShipmentRouteRef | null
  scheduled_delivery_date: string
  actual_delivery_date: string | null
  weight_kg: string
  base_cost: string
  calculated_cost: string
  notes: string | null
  shipment_products: ShipmentProduct[]
  created_at: string
  updated_at: string
}

export interface ShipmentListParams {
  page?: number
  search?: string
  status?: ShipmentStatus
  customer?: number
  origin_warehouse?: number
  transport?: number
  ordering?: 'created_at' | '-created_at' | 'scheduled_delivery_date' | '-scheduled_delivery_date' | 'base_cost' | '-base_cost'
}

export interface ShipmentProductInput {
  product: number
  quantity: number
}

export interface CreateShipmentBody {
  customer: number
  origin_warehouse: number
  destination_address: string
  destination_city: string
  destination_country: string
  scheduled_delivery_date: string
  weight_kg: string
  notes?: string | null
  products: ShipmentProductInput[]
}

export interface UpdateShipmentBody {
  destination_address?: string
  destination_city?: string
  destination_country?: string
  scheduled_delivery_date?: string
  weight_kg?: string
  notes?: string | null
}

export interface AssignTransportBody {
  transport_id: number
  route_id?: number
}
