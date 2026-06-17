'use client'

import { useEffect } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { AxiosError } from 'axios'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { useTransportList } from '@/hooks/transport/use-transport'
import { useRouteList } from '@/hooks/routes/use-routes'
import { useAssignTransport } from '@/hooks/shipments/use-shipments'
import type { ApiError } from '@/types/api'

const assignSchema = z.object({
  transport_id: z.number({ error: 'Transport is required' }),
  route_id: z.number().optional(),
})

type FormValues = z.infer<typeof assignSchema>

interface Props {
  shipmentId: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function AssignTransportDialog({ shipmentId, open, onOpenChange }: Props) {
  const assignTransport = useAssignTransport()

  const { data: transportData, isLoading: transportLoading, isError: transportError } =
    useTransportList({ status: 'available' })

  const { data: routeData, isLoading: routeLoading } =
    useRouteList({ status: 'active' })

  const availableTransports = transportData?.results ?? []
  const activeRoutes = routeData?.results ?? []

  const form = useForm<FormValues>({
    resolver: zodResolver(assignSchema) as Resolver<FormValues>,
    defaultValues: {
      transport_id: undefined,
      route_id: undefined,
    },
  })

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      form.reset({ transport_id: undefined, route_id: undefined })
    }
  }, [open, form])

  function onSubmit(values: FormValues) {
    const body = {
      transport_id: values.transport_id,
      ...(values.route_id !== undefined ? { route_id: values.route_id } : {}),
    }

    assignTransport.mutate(
      { id: shipmentId, body },
      {
        onSuccess: () => {
          onOpenChange(false)
        },
        onError: (error: unknown) => {
          const axiosError = error as AxiosError<ApiError>
          const details = axiosError.response?.data?.error?.details
          if (details) {
            for (const [field, messages] of Object.entries(details)) {
              const message = Array.isArray(messages) ? messages[0] : String(messages)
              form.setError(field as keyof FormValues, { message })
            }
          }
        },
      }
    )
  }

  const noTransportAvailable = !transportLoading && availableTransports.length === 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Asignar Transporte</DialogTitle>
        </DialogHeader>

        {transportError ? (
          <div className="py-4 text-center text-red-600 text-sm">
            No se pudo cargar el transporte disponible. Por favor intente de nuevo.
          </div>
        ) : transportLoading ? (
          <div className="py-6 flex justify-center">
            <LoadingSpinner />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Transport Select */}
              <FormField
                control={form.control}
                name="transport_id"
                render={({ field }) => {
                  return (
                    <FormItem>
                      <FormLabel>Transporte</FormLabel>
                      <Select
                        value={field.value !== undefined ? String(field.value) : ''}
                        onValueChange={(val) => field.onChange(Number(val))}
                        disabled={noTransportAvailable}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                noTransportAvailable
                                  ? 'Sin transporte disponible'
                                  : 'Seleccionar transporte'
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableTransports.map((t) => (
                            <SelectItem key={t.id} value={String(t.id)}>
                              {t.name} — {t.plate_number}{t.driver ? ` (Conductor: ${t.driver.license_number})` : ' (Sin conductor)'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500 mt-1">
                        Solo se muestran vehículos con estado &apos;Disponible&apos;.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )
                }}
              />

              {/* Route Select (optional) */}
              <FormField
                control={form.control}
                name="route_id"
                render={({ field }) => {
                  return (
                    <FormItem>
                      <FormLabel>
                        Ruta{' '}
                        <span className="text-gray-400 font-normal">(opcional)</span>
                      </FormLabel>
                      <Select
                        value={field.value !== undefined ? String(field.value) : 'none'}
                        onValueChange={(val) =>
                          field.onChange(val === 'none' ? undefined : Number(val))
                        }
                        disabled={routeLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sin ruta" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Sin ruta</SelectItem>
                          {activeRoutes.length === 0 ? (
                            <SelectItem value="__disabled__" disabled>
                              Sin rutas disponibles
                            </SelectItem>
                          ) : (
                            activeRoutes.map((r) => (
                              <SelectItem key={r.id} value={String(r.id)}>
                                {r.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )
                }}
              />

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={assignTransport.isPending}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={assignTransport.isPending || noTransportAvailable}
                  className="flex items-center gap-2"
                >
                  {assignTransport.isPending && (
                    <LoadingSpinner className="w-4 h-4 border-white border-t-transparent" />
                  )}
                  Asignar Transporte
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}
