import api from '@/services/api'
import type { PaginatedResponse } from '@/types/api'
import type {
  Route,
  RouteStop,
  RouteListParams,
  CreateRouteBody,
  UpdateRouteBody,
  AddStopBody,
} from '@/types/routes'

export async function getList(
  params: RouteListParams
): Promise<PaginatedResponse<Route>> {
  const query = new URLSearchParams()
  if (params.page !== undefined) query.set('page', String(params.page))
  if (params.search) query.set('search', params.search)
  if (params.status) query.set('status', params.status)
  if (params.origin_warehouse !== undefined)
    query.set('origin_warehouse', String(params.origin_warehouse))
  if (params.ordering) query.set('ordering', params.ordering)

  const res = await api.get<PaginatedResponse<Route>>(
    `/routes/?${query.toString()}`
  )
  return res.data
}

export async function getById(id: number): Promise<Route> {
  const res = await api.get<Route>(`/routes/${id}/`)
  return res.data
}

export async function create(body: CreateRouteBody): Promise<Route> {
  const res = await api.post<Route>('/routes/', body)
  return res.data
}

export async function update(id: number, body: UpdateRouteBody): Promise<Route> {
  const res = await api.patch<Route>(`/routes/${id}/`, body)
  return res.data
}

export async function remove(id: number): Promise<void> {
  await api.delete(`/routes/${id}/`)
}

export async function getStops(routeId: number): Promise<RouteStop[]> {
  const res = await api.get<RouteStop[]>(`/routes/${routeId}/stops/`)
  return res.data
}

export async function addStop(routeId: number, body: AddStopBody): Promise<RouteStop> {
  const res = await api.post<RouteStop>(`/routes/${routeId}/stops/`, body)
  return res.data
}

export async function removeStop(routeId: number, stopId: number): Promise<void> {
  await api.delete(`/routes/${routeId}/stops/${stopId}/`)
}
