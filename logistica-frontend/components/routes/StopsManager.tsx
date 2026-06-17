'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { useAddStop, useRemoveStop } from '@/hooks/routes/use-routes'
import type { RouteStop } from '@/types/routes'
import type { AxiosError } from 'axios'
import type { ApiError } from '@/types/api'

interface Props {
  routeId: number
  stops: RouteStop[]
  mode: 'view' | 'edit'
}

interface AddStopForm {
  stop_order: string
  address: string
  city: string
  latitude: string
  longitude: string
}

interface FormErrors {
  stop_order?: string
  address?: string
  city?: string
  latitude?: string
  longitude?: string
}

function getDefaultStopOrder(stops: RouteStop[]): number {
  if (stops.length === 0) return 1
  return Math.max(...stops.map((s) => s.stop_order)) + 1
}

export default function StopsManager({ routeId, stops, mode }: Props) {
  const addStop = useAddStop()
  const removeStop = useRemoveStop()

  const [deleteStopId, setDeleteStopId] = useState<number | null>(null)

  const [addForm, setAddForm] = useState<AddStopForm>({
    stop_order: String(getDefaultStopOrder(stops)),
    address: '',
    city: '',
    latitude: '',
    longitude: '',
  })
  const [formErrors, setFormErrors] = useState<FormErrors>({})

  const sortedStops = [...stops].sort((a, b) => a.stop_order - b.stop_order)

  function validateAddForm(): boolean {
    const errors: FormErrors = {}
    const orderNum = parseInt(addForm.stop_order, 10)
    if (!addForm.stop_order || isNaN(orderNum) || orderNum < 1 || !Number.isInteger(orderNum)) {
      errors.stop_order = 'Stop order must be a positive integer'
    }
    if (!addForm.address.trim()) {
      errors.address = 'Address is required'
    }
    if (!addForm.city.trim()) {
      errors.city = 'City is required'
    }
    if (addForm.latitude && !/^-?\d+(\.\d+)?$/.test(addForm.latitude)) {
      errors.latitude = 'Must be a valid decimal'
    }
    if (addForm.longitude && !/^-?\d+(\.\d+)?$/.test(addForm.longitude)) {
      errors.longitude = 'Must be a valid decimal'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  function handleAddStop() {
    if (!validateAddForm()) return

    const orderNum = parseInt(addForm.stop_order, 10)

    addStop.mutate(
      {
        routeId,
        body: {
          stop_order: orderNum,
          address: addForm.address.trim(),
          city: addForm.city.trim(),
          latitude: addForm.latitude || null,
          longitude: addForm.longitude || null,
        },
      },
      {
        onSuccess: () => {
          setAddForm({
            stop_order: String(getDefaultStopOrder([...stops, { stop_order: orderNum } as RouteStop])),
            address: '',
            city: '',
            latitude: '',
            longitude: '',
          })
          setFormErrors({})
        },
        onError: (error: unknown) => {
          const axiosError = error as AxiosError<ApiError>
          const details = axiosError.response?.data?.error?.details
          if (details?.stop_order) {
            const msg = Array.isArray(details.stop_order)
              ? details.stop_order[0]
              : String(details.stop_order)
            setFormErrors((prev) => ({ ...prev, stop_order: msg }))
          }
        },
      }
    )
  }

  function handleDeleteConfirm() {
    if (deleteStopId === null) return
    removeStop.mutate(
      { routeId, stopId: deleteStopId },
      {
        onSuccess: () => setDeleteStopId(null),
      }
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-base font-medium text-gray-900">Stops</h3>

      {/* Stops list */}
      {sortedStops.length === 0 ? (
        <p className="text-sm text-gray-500">No stops defined for this route</p>
      ) : (
        <div className="space-y-2">
          {sortedStops.map((stop) => (
            <div
              key={stop.id}
              className="flex items-start justify-between border border-gray-200 rounded-lg p-3"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase">
                    Stop {stop.stop_order}
                  </span>
                </div>
                <p className="text-sm text-gray-900">{stop.address}</p>
                <p className="text-sm text-gray-600">{stop.city}</p>
                {(stop.latitude || stop.longitude) && (
                  <p className="text-xs text-gray-400">
                    {stop.latitude && `Lat: ${stop.latitude}`}
                    {stop.latitude && stop.longitude && ' · '}
                    {stop.longitude && `Lng: ${stop.longitude}`}
                  </p>
                )}
              </div>

              {mode === 'edit' && (
                <button
                  type="button"
                  onClick={() => setDeleteStopId(stop.id)}
                  disabled={removeStop.isPending}
                  className="text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors ml-3 mt-0.5"
                  aria-label="Remove stop"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add stop form — edit mode only */}
      {mode === 'edit' && (
        <div className="border border-dashed border-gray-300 rounded-lg p-4 space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Add Stop</h4>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Stop Order
              </label>
              <Input
                type="number"
                value={addForm.stop_order}
                onChange={(e) =>
                  setAddForm((prev) => ({ ...prev, stop_order: e.target.value }))
                }
                min={1}
              />
              {formErrors.stop_order && (
                <p className="text-xs text-red-600 mt-1">{formErrors.stop_order}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                City
              </label>
              <Input
                type="text"
                placeholder="e.g. New York"
                value={addForm.city}
                onChange={(e) =>
                  setAddForm((prev) => ({ ...prev, city: e.target.value }))
                }
              />
              {formErrors.city && (
                <p className="text-xs text-red-600 mt-1">{formErrors.city}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Address
            </label>
            <Input
              type="text"
              placeholder="e.g. 123 Oak St"
              value={addForm.address}
              onChange={(e) =>
                setAddForm((prev) => ({ ...prev, address: e.target.value }))
              }
            />
            {formErrors.address && (
              <p className="text-xs text-red-600 mt-1">{formErrors.address}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Latitude (optional)
              </label>
              <Input
                type="text"
                placeholder="e.g. 40.712776"
                value={addForm.latitude}
                onChange={(e) =>
                  setAddForm((prev) => ({ ...prev, latitude: e.target.value }))
                }
              />
              {formErrors.latitude && (
                <p className="text-xs text-red-600 mt-1">{formErrors.latitude}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Longitude (optional)
              </label>
              <Input
                type="text"
                placeholder="e.g. -74.005974"
                value={addForm.longitude}
                onChange={(e) =>
                  setAddForm((prev) => ({ ...prev, longitude: e.target.value }))
                }
              />
              {formErrors.longitude && (
                <p className="text-xs text-red-600 mt-1">{formErrors.longitude}</p>
              )}
            </div>
          </div>

          <Button
            type="button"
            onClick={handleAddStop}
            disabled={addStop.isPending}
            className="flex items-center gap-2"
          >
            {addStop.isPending && (
              <LoadingSpinner className="w-4 h-4 border-white border-t-transparent" />
            )}
            Add Stop
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={deleteStopId !== null}
        title="Remove Stop"
        description="Remove this stop from the route?"
        confirmLabel="Remove"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteStopId(null)}
        isLoading={removeStop.isPending}
      />
    </div>
  )
}
