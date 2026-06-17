import api from '@/services/api'
import type { PaginatedResponse } from '@/types/api'
import type {
  Shipment,
  ShipmentListParams,
  CreateShipmentBody,
  UpdateShipmentBody,
  AssignTransportBody,
} from '@/types/shipments'

export async function getList(
  params: ShipmentListParams
): Promise<PaginatedResponse<Shipment>> {
  const res = await api.get<PaginatedResponse<Shipment>>('/shipments/', { params })
  return res.data
}

export async function getById(id: number): Promise<Shipment> {
  const res = await api.get<Shipment>(`/shipments/${id}/`)
  return res.data
}

export async function create(body: CreateShipmentBody): Promise<Shipment> {
  const res = await api.post<Shipment>('/shipments/', body)
  return res.data
}

export async function update(id: number, body: UpdateShipmentBody): Promise<Shipment> {
  const res = await api.patch<Shipment>(`/shipments/${id}/`, body)
  return res.data
}

export async function remove(id: number): Promise<void> {
  await api.delete(`/shipments/${id}/`)
}

export async function assignTransport(
  id: number,
  body: AssignTransportBody
): Promise<Shipment> {
  const res = await api.post<Shipment>(`/shipments/${id}/assign-transport/`, body)
  return res.data
}

export async function markInTransit(id: number): Promise<Shipment> {
  const res = await api.post<Shipment>(`/shipments/${id}/mark-in-transit/`, {})
  return res.data
}

export async function markDelivered(id: number): Promise<Shipment> {
  const res = await api.post<Shipment>(`/shipments/${id}/mark-delivered/`, {})
  return res.data
}

export async function cancel(id: number): Promise<Shipment> {
  const res = await api.post<Shipment>(`/shipments/${id}/cancel/`, {})
  return res.data
}
