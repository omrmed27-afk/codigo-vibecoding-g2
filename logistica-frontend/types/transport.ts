import type { DriverStatus } from '@/types/drivers'

export type VehicleType = 'truck' | 'van' | 'motorcycle' | 'bicycle'
export type TransportStatus = 'available' | 'in_transit' | 'maintenance'

export interface DriverRef {
  id: number
  license_number: string
  phone: string
  status: DriverStatus
}

export interface Transport {
  id: number
  name: string
  type: VehicleType
  plate_number: string
  capacity_kg: string
  capacity_m3: string
  driver: DriverRef | null
  status: TransportStatus
  created_at: string
  updated_at: string
}

export interface TransportListParams {
  page?: number
  search?: string
  status?: TransportStatus
  type?: VehicleType
  driver?: number
  ordering?: 'name' | '-name' | 'created_at' | '-created_at' | 'status' | '-status'
}

export interface CreateTransportBody {
  name: string
  type: VehicleType
  plate_number: string
  capacity_kg: string
  capacity_m3: string
  driver?: number | null
  status: TransportStatus
}

export interface UpdateTransportBody {
  name?: string
  type?: VehicleType
  plate_number?: string
  capacity_kg?: string
  capacity_m3?: string
  driver?: number | null
  status?: TransportStatus
}

export interface AssignDriverBody {
  driver_id: number
}
