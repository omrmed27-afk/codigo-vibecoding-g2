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
import { useCreateCustomer, useUpdateCustomer } from '@/hooks/customers/use-customers'
import type { Customer } from '@/types/customers'
import type { ApiError } from '@/types/api'

const customerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  customer_type: z.enum(['company', 'individual'], {
    error: 'Customer type is required',
  }),
  email: z.string().min(1, 'Email is required').email('Must be a valid email'),
  phone: z.string().min(1, 'Phone is required').max(30),
  address: z.string().min(1, 'Address is required').max(500),
  city: z.string().min(1, 'City is required').max(100),
  country: z.string().min(1, 'Country is required').max(100),
  tax_id: z.string().max(100).optional().nullable(),
})

type FormValues = z.infer<typeof customerSchema>

interface Props {
  mode: 'create' | 'edit'
  defaultValues?: Customer
  onSuccess: () => void
}

export default function CustomerForm({ mode, defaultValues, onSuccess }: Props) {
  const createCustomer = useCreateCustomer()
  const updateCustomer = useUpdateCustomer()

  const isPending =
    mode === 'create' ? createCustomer.isPending : updateCustomer.isPending

  const form = useForm<FormValues>({
    resolver: zodResolver(customerSchema) as Resolver<FormValues>,
    defaultValues: {
      name: defaultValues?.name ?? '',
      customer_type: defaultValues?.customer_type ?? undefined,
      email: defaultValues?.email ?? '',
      phone: defaultValues?.phone ?? '',
      address: defaultValues?.address ?? '',
      city: defaultValues?.city ?? '',
      country: defaultValues?.country ?? '',
      tax_id: defaultValues?.tax_id ?? '',
    },
  })

  useEffect(() => {
    if (defaultValues) {
      form.reset({
        name: defaultValues.name,
        customer_type: defaultValues.customer_type,
        email: defaultValues.email,
        phone: defaultValues.phone,
        address: defaultValues.address,
        city: defaultValues.city,
        country: defaultValues.country,
        // Map null to empty string so input stays controlled
        tax_id: defaultValues.tax_id ?? '',
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
    // Transform empty tax_id string to null before sending
    const tax_id =
      values.tax_id === '' || values.tax_id === null || values.tax_id === undefined
        ? null
        : values.tax_id

    const body = {
      name: values.name,
      customer_type: values.customer_type,
      email: values.email,
      phone: values.phone,
      address: values.address,
      city: values.city,
      country: values.country,
      tax_id,
    }

    if (mode === 'create') {
      createCustomer.mutate(body, {
        onSuccess,
        onError: handleFieldErrors,
      })
    } else {
      if (!defaultValues?.id) return
      updateCustomer.mutate(
        { id: defaultValues.id, body },
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
                <Input type="text" placeholder="e.g. Acme Corp" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="customer_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Customer Type</FormLabel>
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
                  <SelectItem value="company">Company</SelectItem>
                  <SelectItem value="individual">Individual</SelectItem>
                </SelectContent>
              </Select>
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
                <Input type="email" placeholder="e.g. contact@acme.com" {...field} />
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
                <Input type="tel" placeholder="e.g. +1234567890" {...field} />
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
                <Input type="text" placeholder="e.g. 123 Main St" {...field} />
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
                <Input type="text" placeholder="e.g. New York" {...field} />
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

        <FormField
          control={form.control}
          name="tax_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Tax ID <span className="text-gray-400 font-normal">(optional)</span>
              </FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="e.g. US12345678"
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending} className="flex items-center gap-2">
          {isPending && <LoadingSpinner className="w-4 h-4 border-white border-t-transparent" />}
          {mode === 'create' ? 'Create Customer' : 'Save Changes'}
        </Button>
      </form>
    </Form>
  )
}
