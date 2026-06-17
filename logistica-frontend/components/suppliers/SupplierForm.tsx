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
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { useCreateSupplier, useUpdateSupplier } from '@/hooks/suppliers/use-suppliers'
import type { Supplier } from '@/types/suppliers'
import type { ApiError } from '@/types/api'

const supplierSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  contact_name: z.string().min(1, 'Contact name is required').max(200),
  email: z.string().min(1, 'Email is required').email('Must be a valid email'),
  phone: z.string().min(1, 'Phone is required').max(30),
  address: z.string().min(1, 'Address is required').max(500),
  city: z.string().min(1, 'City is required').max(100),
  country: z.string().min(1, 'Country is required').max(100),
})

type FormValues = z.infer<typeof supplierSchema>

interface Props {
  mode: 'create' | 'edit'
  defaultValues?: Supplier
  onSuccess: () => void
}

export default function SupplierForm({ mode, defaultValues, onSuccess }: Props) {
  const createSupplier = useCreateSupplier()
  const updateSupplier = useUpdateSupplier()

  const isPending =
    mode === 'create' ? createSupplier.isPending : updateSupplier.isPending

  const form = useForm<FormValues>({
    resolver: zodResolver(supplierSchema) as Resolver<FormValues>,
    defaultValues: {
      name: defaultValues?.name ?? '',
      contact_name: defaultValues?.contact_name ?? '',
      email: defaultValues?.email ?? '',
      phone: defaultValues?.phone ?? '',
      address: defaultValues?.address ?? '',
      city: defaultValues?.city ?? '',
      country: defaultValues?.country ?? '',
    },
  })

  useEffect(() => {
    if (defaultValues) {
      form.reset({
        name: defaultValues.name,
        contact_name: defaultValues.contact_name,
        email: defaultValues.email,
        phone: defaultValues.phone,
        address: defaultValues.address,
        city: defaultValues.city,
        country: defaultValues.country,
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
    }
  }

  function onSubmit(values: FormValues) {
    if (mode === 'create') {
      createSupplier.mutate(values, {
        onSuccess,
        onError: handleFieldErrors,
      })
    } else {
      if (!defaultValues?.id) return
      updateSupplier.mutate(
        {
          id: defaultValues.id,
          body: values,
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
                <Input type="text" placeholder="e.g. Tech Supplier Inc" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contact_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact Name</FormLabel>
              <FormControl>
                <Input type="text" placeholder="e.g. John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="e.g. john@techsupply.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone</FormLabel>
              <FormControl>
                <Input type="tel" placeholder="e.g. +1987654321" {...field} />
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
                <Input type="text" placeholder="e.g. 456 Industrial Ave" {...field} />
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
                <Input type="text" placeholder="e.g. Los Angeles" {...field} />
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
                <Input type="text" placeholder="e.g. USA" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending} className="flex items-center gap-2">
          {isPending && <LoadingSpinner className="w-4 h-4 border-white border-t-transparent" />}
          {mode === 'create' ? 'Create Supplier' : 'Save Changes'}
        </Button>
      </form>
    </Form>
  )
}
