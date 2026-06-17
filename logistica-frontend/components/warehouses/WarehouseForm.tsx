'use client'

import { useEffect } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
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
import { Switch } from '@/components/ui/switch'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { useCreateWarehouse, useUpdateWarehouse } from '@/hooks/warehouses/use-warehouses'
import type { Warehouse } from '@/types/warehouses'
import type { ApiError } from '@/types/api'

const warehouseSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(200),
    address: z.string().min(1, 'Address is required').max(500),
    city: z.string().min(1, 'City is required').max(100),
    country: z.string().min(1, 'Country is required').max(100),
    latitude: z
      .string()
      .refine((v) => v === '' || v == null || /^-?(\d+(\.\d+)?)$/.test(v), 'Invalid decimal format')
      .nullable()
      .optional(),
    longitude: z
      .string()
      .refine((v) => v === '' || v == null || /^-?(\d+(\.\d+)?)$/.test(v), 'Invalid decimal format')
      .nullable()
      .optional(),
    is_active: z.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    const latProvided = data.latitude !== null && data.latitude !== undefined && data.latitude !== ''
    const lngProvided = data.longitude !== null && data.longitude !== undefined && data.longitude !== ''
    if (latProvided && !lngProvided) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Both latitude and longitude are required together',
        path: ['longitude'],
      })
    }
    if (lngProvided && !latProvided) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Both latitude and longitude are required together',
        path: ['latitude'],
      })
    }
    if (latProvided && data.latitude) {
      const num = parseFloat(data.latitude)
      if (num < -90 || num > 90) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Latitude must be between -90 and 90',
          path: ['latitude'],
        })
      }
    }
    if (lngProvided && data.longitude) {
      const num = parseFloat(data.longitude)
      if (num < -180 || num > 180) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Longitude must be between -180 and 180',
          path: ['longitude'],
        })
      }
    }
  })

type FormValues = z.infer<typeof warehouseSchema>

interface Props {
  mode: 'create' | 'edit'
  defaultValues?: Warehouse
  onSuccess: () => void
}

export default function WarehouseForm({ mode, defaultValues, onSuccess }: Props) {
  const createWarehouse = useCreateWarehouse()
  const updateWarehouse = useUpdateWarehouse()

  const isPending =
    mode === 'create' ? createWarehouse.isPending : updateWarehouse.isPending

  const form = useForm<FormValues>({
    resolver: zodResolver(warehouseSchema) as Resolver<FormValues>,
    defaultValues: {
      name: defaultValues?.name ?? '',
      address: defaultValues?.address ?? '',
      city: defaultValues?.city ?? '',
      country: defaultValues?.country ?? '',
      latitude: defaultValues?.latitude ?? '',
      longitude: defaultValues?.longitude ?? '',
      is_active: defaultValues?.is_active ?? true,
    },
  })

  useEffect(() => {
    if (defaultValues) {
      form.reset({
        name: defaultValues.name,
        address: defaultValues.address,
        city: defaultValues.city,
        country: defaultValues.country,
        latitude: defaultValues.latitude ?? '',
        longitude: defaultValues.longitude ?? '',
        is_active: defaultValues.is_active,
      })
    }
  }, [defaultValues, form])

  function handleFieldErrors(error: unknown) {
    const axiosError = error as AxiosError<ApiError>
    const details = axiosError.response?.data?.error?.details
    if (details) {
      for (const [field, messages] of Object.entries(details)) {
        const message = Array.isArray(messages) ? messages[0] : String(messages)
        form.setError(field as keyof FormValues, { message })
      }
    } else {
      const message =
        axiosError.response?.data?.error?.message ?? 'An unexpected error occurred'
      toast.error(message)
    }
  }

  function onSubmit(values: FormValues) {
    const latitude =
      values.latitude === '' || values.latitude === null || values.latitude === undefined
        ? null
        : values.latitude
    const longitude =
      values.longitude === '' || values.longitude === null || values.longitude === undefined
        ? null
        : values.longitude

    if (mode === 'create') {
      createWarehouse.mutate(
        {
          name: values.name,
          address: values.address,
          city: values.city,
          country: values.country,
          latitude,
          longitude,
          is_active: values.is_active,
        },
        {
          onSuccess,
          onError: handleFieldErrors,
        }
      )
    } else {
      if (!defaultValues?.id) return
      updateWarehouse.mutate(
        {
          id: defaultValues.id,
          body: {
            name: values.name,
            address: values.address,
            city: values.city,
            country: values.country,
            latitude,
            longitude,
            is_active: values.is_active,
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
                <Input type="text" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input type="text" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>City</FormLabel>
              <FormControl>
                <Input type="text" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="country"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Country</FormLabel>
              <FormControl>
                <Input type="text" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="latitude"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Latitude <span className="text-gray-400 font-normal">(optional)</span></FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="e.g. 41.881832"
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="longitude"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Longitude <span className="text-gray-400 font-normal">(optional)</span></FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="e.g. -87.629799"
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center gap-3">
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="cursor-pointer">Active</FormLabel>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending} className="flex items-center gap-2">
          {isPending && <LoadingSpinner className="w-4 h-4 border-white border-t-transparent" />}
          {mode === 'create' ? 'Create Warehouse' : 'Save Changes'}
        </Button>
      </form>
    </Form>
  )
}
