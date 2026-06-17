export interface Supplier {
  id: number
  name: string
  contact_name: string
  email: string
  phone: string
  address: string
  city: string
  country: string
  created_at: string
  updated_at: string
}

export interface SupplierListParams {
  page?: number
  search?: string
  city?: string
  country?: string
  ordering?: 'name' | '-name' | 'created_at' | '-created_at'
}

export interface CreateSupplierBody {
  name: string
  contact_name: string
  email: string
  phone: string
  address: string
  city: string
  country: string
}

export interface UpdateSupplierBody {
  name?: string
  contact_name?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  country?: string
}
