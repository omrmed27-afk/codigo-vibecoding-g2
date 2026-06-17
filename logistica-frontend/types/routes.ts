export type RouteStatus = 'active' | 'inactive'

export interface WarehouseRef {
  id: number
  name: string
  city: string
}

export interface RouteStop {
  id: number
  stop_order: number
  address: string
  city: string
  latitude: string | null
  longitude: string | null
  created_at: string
}

export interface Route {
  id: number
  name: string
  origin_warehouse: WarehouseRef
  status: RouteStatus
  stops: RouteStop[]
  created_at: string
  updated_at: string
}

export interface RouteListParams {
  page?: number
  search?: string
  status?: RouteStatus
  origin_warehouse?: number
  ordering?: 'name' | '-name' | 'created_at' | '-created_at'
}

export interface CreateRouteStopBody {
  stop_order: number
  address: string
  city: string
  latitude?: string | null
  longitude?: string | null
}

export interface CreateRouteBody {
  name: string
  origin_warehouse: number
  status: RouteStatus
  stops?: CreateRouteStopBody[]
}

export interface UpdateRouteBody {
  name?: string
  origin_warehouse?: number
  status?: RouteStatus
}

export interface AddStopBody {
  stop_order: number
  address: string
  city: string
  latitude?: string | null
  longitude?: string | null
}
