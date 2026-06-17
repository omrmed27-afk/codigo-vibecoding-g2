'use client'

import { useEffect } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
import { useCreateTransport, useUpdateTransport } from '@/hooks/transport/use-transport'
import type { Transport } from '@/types/transport'
import type { ApiError } from '@/types/api'

const transportSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  type: z.enum(['truck', 'van', 'motorcycle', 'bicycle'], {
    error: 'Type is required',
  }),
  plate_number: z.string().min(1, 'Plate number is required').max(20),
  capacity_kg: z
    .string()
    .min(1, 'Capacity (kg) is required')
    .regex(/^\d+(\.\d+)?$/, 'Must be a valid decimal number'),
  capacity_m3: z
    .string()
    .min(1, 'Capacity (m³) is required')
    .regex(/^\d+(\.\d+)?$/, 'Must be a valid decimal number'),
  driver: z.number().nullable().optional(),
  status: z.enum(['available', 'in_transit', 'maintenance'], {
    error: 'Status is required',
  }),
})

type TransportFormValues = z.infer<typeof transportSchema>

interface Props {
  mode: 'create' | 'edit'
  defaultValues?: Transport
  onSuccess: () => void
}

export default function TransportForm({ mode, defaultValues, onSuccess }: Props) {
  const createTransport = useCreateTransport()
  const updateTransport = useUpdateTransport()

  const isPending =
    mode === 'create' ? createTransport.isPending : updateTransport.isPending

  const form = useForm<TransportFormValues>({
    resolver: zodResolver(transportSchema) as Resolver<TransportFormValues>,
    defaultValues:
      mode === 'create'
        ? {
            name: '',
            type: undefined,
            plate_number: '',
            capacity_kg: '',
            capacity_m3: '',
            driver: undefined,
            status: undefined,
          }
        : {
            name: defaultValues?.name ?? '',
            type: defaultValues?.type ?? undefined,
            plate_number: defaultValues?.plate_number ?? '',
            capacity_kg: defaultValues?.capacity_kg ?? '',
            capacity_m3: defaultValues?.capacity_m3 ?? '',
            driver: undefined,
            status: defaultValues?.status ?? undefined,
          },
  })

  useEffect(() => {
    if (mode === 'edit' && defaultValues) {
      form.reset({
        name: defaultValues.name,
        type: defaultValues.type,
        plate_number: defaultValues.plate_number,
        capacity_kg: defaultValues.capacity_kg,
        capacity_m3: defaultValues.capacity_m3,
        driver: undefined,
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
        form.setError(field as keyof TransportFormValues, { message })
      }
    }
  }

  function onSubmit(values: TransportFormValues) {
    if (mode === 'create') {
      createTransport.mutate(
        {
          name: values.name,
          type: values.type,
          plate_number: values.plate_number,
          capacity_kg: values.capacity_kg,
          capacity_m3: values.capacity_m3,
          status: values.status,
        },
        {
          onSuccess,
          onError: handleFieldErrors,
        }
      )
    } else {
      if (!defaultValues?.id) return
      updateTransport.mutate(
        {
          id: defaultValues.id,
          body: {
            name: values.name,
            type: values.type,
            plate_number: values.plate_number,
            capacity_kg: values.capacity_kg,
            capacity_m3: values.capacity_m3,
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-xl">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input type="text" placeholder="e.g. Truck A1" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => {
            return (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select
                  value={field.value ?? ''}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="truck">Truck</SelectItem>
                    <SelectItem value="van">Van</SelectItem>
                    <SelectItem value="motorcycle">Motorcycle</SelectItem>
                    <SelectItem value="bicycle">Bicycle</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )
          }}
        />

        <FormField
          control={form.control}
          name="plate_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Plate Number</FormLabel>
              <FormControl>
                <Input type="text" placeholder="e.g. ABC-1234" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="capacity_kg"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Capacity (kg)</FormLabel>
              <FormControl>
                <Input type="text" placeholder="e.g. 5000.00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="capacity_m3"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Capacity (m³)</FormLabel>
              <FormControl>
                <Input type="text" placeholder="e.g. 12.500" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => {
            return (
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
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="in_transit">In Transit</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )
          }}
        />

        <Button type="submit" disabled={isPending} className="flex items-center gap-2">
          {isPending && <LoadingSpinner className="w-4 h-4 border-white border-t-transparent" />}
          {mode === 'create' ? 'Create Vehicle' : 'Save Changes'}
        </Button>
      </form>
    </Form>
  )
}
