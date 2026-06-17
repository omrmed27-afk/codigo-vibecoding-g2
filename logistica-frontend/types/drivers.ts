export type DriverStatus = 'available' | 'busy' | 'off_duty'

export interface UserInfo {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
}

export interface Driver {
  id: number
  user: UserInfo
  license_number: string
  license_expiry: string
  phone: string
  status: DriverStatus
  created_at: string
  updated_at: string
}

export interface DriverListParams {
  page?: number
  search?: string
  status?: DriverStatus
  ordering?: 'created_at' | '-created_at' | 'status' | '-status'
}

export interface CreateDriverBody {
  username: string
  password: string
  email: string
  first_name: string
  last_name: string
  license_number: string
  license_expiry: string
  phone: string
  status: DriverStatus
}

export interface UpdateDriverBody {
  email?: string
  first_name?: string
  last_name?: string
  license_number?: string
  license_expiry?: string
  phone?: string
  status?: DriverStatus
}
