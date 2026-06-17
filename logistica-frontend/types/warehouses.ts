export interface Warehouse {
  id: number
  name: string
  address: string
  city: string
  country: string
  latitude: string | null
  longitude: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface WarehouseListParams {
  page?: number
  search?: string
  is_active?: boolean
  city?: string
  country?: string
  ordering?: 'name' | '-name' | 'created_at' | '-created_at'
}

export interface CreateWarehouseBody {
  name: string
  address: string
  city: string
  country: string
  latitude?: string | null
  longitude?: string | null
  is_active: boolean
}

export interface UpdateWarehouseBody {
  name?: string
  address?: string
  city?: string
  country?: string
  latitude?: string | null
  longitude?: string | null
  is_active?: boolean
}
