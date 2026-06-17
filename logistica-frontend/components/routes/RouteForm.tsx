'use client'

import { useEffect } from 'react'
import { useForm, useFieldArray, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Trash2 } from 'lucide-react'
import type { AxiosError } from 'axios'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { useCreateRoute, useUpdateRoute } from '@/hooks/routes/use-routes'
import { useWarehouseList } from '@/hooks/warehouses/use-warehouses'
import type { Route } from '@/types/routes'
import type { ApiError } from '@/types/api'

const stopSchema = z.object({
  stop_order: z
    .number({ error: 'Stop order is required' })
    .int()
    .min(1),
  address: z
    .string({ error: 'Address is required' })
    .min(1, 'Address is required')
    .max(500),
  city: z
    .string({ error: 'City is required' })
    .min(1, 'City is required')
    .max(100),
  latitude: z
    .string()
    .regex(/^-?\d+(\.\d+)?$/, 'Must be a valid decimal')
    .optional()
    .nullable(),
  longitude: z
    .string()
    .regex(/^-?\d+(\.\d+)?$/, 'Must be a valid decimal')
    .optional()
    .nullable(),
})

const routeSchema = z.object({
  name: z
    .string({ error: 'Name is required' })
    .min(1, 'Name is required')
    .max(200),
  origin_warehouse: z.number({ error: 'Warehouse is required' }),
  status: z.enum(['active', 'inactive'], { error: 'Status is required' }),
  stops: z.array(stopSchema).optional(),
})

type RouteFormValues = z.infer<typeof routeSchema>

interface Props {
  mode: 'create' | 'edit'
  defaultValues?: Route
  onSuccess: () => void
}

export default function RouteForm({ mode, defaultValues, onSuccess }: Props) {
  const createRoute = useCreateRoute()
  const updateRoute = useUpdateRoute()
  const { data: warehousesData, isLoading: warehousesLoading } = useWarehouseList({ page: 1 })

  const isPending =
    mode === 'create' ? createRoute.isPending : updateRoute.isPending

  const form = useForm<RouteFormValues>({
    resolver: zodResolver(routeSchema) as Resolver<RouteFormValues>,
    defaultValues:
      mode === 'create'
        ? {
            name: '',
            origin_warehouse: undefined,
            status: undefined,
            stops: [],
          }
        : {
            name: defaultValues?.name ?? '',
            origin_warehouse: defaultValues?.origin_warehouse.id ?? undefined,
            status: defaultValues?.status ?? undefined,
          },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'stops',
  })

  useEffect(() => {
    if (mode === 'edit' && defaultValues) {
      form.reset({
        name: defaultValues.name,
        origin_warehouse: defaultValues.origin_warehouse.id,
        status: defaultValues.status,
      })
    }
  }, [defaultValues, form, mode])

  function handleFieldErrors(error: unknown) {
    const axiosError = error as AxiosError<ApiError>
    const details = axiosError.response?.data?.error?.details
    if (details) {
      for (const [field, messages] of Object.entries(details)) {
        const message = Array.isArray(messages) ? messages[0] : String(messages)
        form.setError(field as keyof RouteFormValues, { message })
      }
    }
  }

  function onSubmit(values: RouteFormValues) {
    if (mode === 'create') {
      const stops = values.stops && values.stops.length > 0 ? values.stops : undefined
      createRoute.mutate(
        {
          name: values.name,
          origin_warehouse: values.origin_warehouse,
          status: values.status,
          ...(stops !== undefined ? { stops } : {}),
        },
        {
          onSuccess,
          onError: handleFieldErrors,
        }
      )
    } else {
      if (!defaultValues?.id) return
      updateRoute.mutate(
        {
          id: defaultValues.id,
          body: {
            name: values.name,
            origin_warehouse: values.origin_warehouse,
            status: values.status,
          },
        },
        {
          onSuccess,
          onError: handleFieldErrors,
        }
      )
    }
  }

  function getNextStopOrder(): number {
    const stops = form.getValues('stops') ?? []
    if (stops.length === 0) return 1
    const max = Math.max(...stops.map((s) => s.stop_order ?? 0))
    return max + 1
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-xl">
        {/* Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input type="text" placeholder="e.g. Downtown Express" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Origin Warehouse */}
        <FormField
          control={form.control}
          name="origin_warehouse"
          render={({ field }) => (
              <FormItem>
                <FormLabel>Origin Warehouse</FormLabel>
                <Select
                  value={field.value !== undefined ? String(field.value) : ''}
                  onValueChange={(val) => field.onChange(Number(val))}
                  disabled={warehousesLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      {warehousesLoading ? (
                        <div className="flex items-center gap-2">
                          <LoadingSpinner className="w-4 h-4" />
                          <span className="text-gray-400">Loading warehouses…</span>
                        </div>
                      ) : (
                        <SelectValue placeholder="Select a warehouse" />
                      )}
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {warehousesData?.results.map((w) => (
                      <SelectItem key={w.id} value={String(w.id)}>
                        {w.name} – {w.city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
          )}
        />

        {/* Status */}
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select
                value={field.value ?? ''}
                onValueChange={field.onChange}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Inline stops — create mode only */}
        {mode === 'create' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900">Stops</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({
                    stop_order: getNextStopOrder(),
                    address: '',
                    city: '',
                    latitude: null,
                    longitude: null,
                  })
                }
              >
                Add Stop
              </Button>
            </div>

            {fields.length === 0 && (
              <p className="text-sm text-gray-500">No stops added yet.</p>
            )}

            {fields.map((field, index) => (
              <div
                key={field.id}
                className="border border-gray-200 rounded-lg p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Stop {index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                    aria-label="Remove stop"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name={`stops.${index}.stop_order`}
                    render={({ field: f }) => (
                      <FormItem>
                        <FormLabel>Stop #</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...f}
                            onChange={(e) => f.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`stops.${index}.city`}
                    render={({ field: f }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input type="text" placeholder="e.g. New York" {...f} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name={`stops.${index}.address`}
                  render={({ field: f }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input type="text" placeholder="e.g. 123 Oak St" {...f} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name={`stops.${index}.latitude`}
                    render={({ field: f }) => (
                      <FormItem>
                        <FormLabel>Latitude (optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="e.g. 40.712776"
                            value={f.value ?? ''}
                            onChange={(e) =>
                              f.onChange(e.target.value || null)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`stops.${index}.longitude`}
                    render={({ field: f }) => (
                      <FormItem>
                        <FormLabel>Longitude (optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="e.g. -74.005974"
                            value={f.value ?? ''}
                            onChange={(e) =>
                              f.onChange(e.target.value || null)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <Button type="submit" disabled={isPending} className="flex items-center gap-2">
          {isPending && (
            <LoadingSpinner className="w-4 h-4 border-white border-t-transparent" />
          )}
          {mode === 'create' ? 'Create Route' : 'Save Changes'}
        </Button>
      </form>
    </Form>
  )
}
