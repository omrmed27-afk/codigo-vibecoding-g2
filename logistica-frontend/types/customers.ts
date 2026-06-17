export type CustomerType = 'company' | 'individual'

export interface Customer {
  id: number
  name: string
  customer_type: CustomerType
  email: string
  phone: string
  address: string
  city: string
  country: string
  tax_id: string | null
  created_at: string
  updated_at: string
}

export interface CustomerListParams {
  page?: number
  search?: string
  customer_type?: CustomerType
  city?: string
  country?: string
  ordering?: 'name' | '-name' | 'created_at' | '-created_at'
}

export interface CreateCustomerBody {
  name: string
  customer_type: CustomerType
  email: string
  phone: string
  address: string
  city: string
  country: string
  tax_id?: string | null
}

export interface UpdateCustomerBody {
  name?: string
  customer_type?: CustomerType
  email?: string
  phone?: string
  address?: string
  city?: string
  country?: string
  tax_id?: string | null
}
