export interface ProductRef {
  id: number
  name: string
}

export interface Product {
  id: number
  name: string
  description: string | null
  sku: string
  weight_kg: string
  width_cm: string
  height_cm: string
  depth_cm: string
  unit_price: string
  stock_quantity: number
  supplier: ProductRef
  warehouse: ProductRef
  created_at: string
  updated_at: string
}

export interface ProductListParams {
  page?: number
  search?: string
  supplier?: number
  warehouse?: number
  ordering?: 'name' | '-name' | 'unit_price' | '-unit_price' | 'stock_quantity' | '-stock_quantity' | 'created_at' | '-created_at'
}

export interface CreateProductBody {
  name: string
  description?: string | null
  sku: string
  weight_kg: string
  width_cm: string
  height_cm: string
  depth_cm: string
  unit_price: string
  stock_quantity: number
  supplier: number
  warehouse: number
}

export interface UpdateProductBody {
  name?: string
  description?: string | null
  sku?: string
  weight_kg?: string
  width_cm?: string
  height_cm?: string
  depth_cm?: string
  unit_price?: string
  stock_quantity?: number
  supplier?: number
  warehouse?: number
}
