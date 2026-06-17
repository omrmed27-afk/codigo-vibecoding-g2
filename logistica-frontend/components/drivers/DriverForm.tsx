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
import { DatePicker } from '@/components/ui/date-picker'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { useCreateDriver, useUpdateDriver } from '@/hooks/drivers/use-drivers'
import type { Driver } from '@/types/drivers'
import type { ApiError } from '@/types/api'

// Schema used when creating a new driver (includes username + password)
const createDriverSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  email: z.string().min(1, 'Email is required').email('Must be a valid email'),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  license_number: z.string().min(1, 'License number is required').max(50),
  license_expiry: z
    .string()
    .min(1, 'License expiry is required')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be a valid date (YYYY-MM-DD)'),
  phone: z.string().min(1, 'Phone is required').max(30),
  status: z.enum(['available', 'busy', 'off_duty'], { error: 'Status is required' }),
})

// Schema used when editing an existing driver (no username/password; all fields optional for PATCH)
const editDriverSchema = z.object({
  email: z.string().email('Must be a valid email').optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  license_number: z.string().max(50).optional(),
  license_expiry: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be a valid date (YYYY-MM-DD)')
    .optional(),
  phone: z.string().max(30).optional(),
  status: z.enum(['available', 'busy', 'off_duty'], { error: 'Status is required' }).optional(),
})

type CreateFormValues = z.infer<typeof createDriverSchema>
type EditFormValues = z.infer<typeof editDriverSchema>
type FormValues = CreateFormValues | EditFormValues

interface Props {
  mode: 'create' | 'edit'
  defaultValues?: Driver
  onSuccess: () => void
}

export default function DriverForm({ mode, defaultValues, onSuccess }: Props) {
  const createDriver = useCreateDriver()
  const updateDriver = useUpdateDriver()

  const isPending =
    mode === 'create' ? createDriver.isPending : updateDriver.isPending

  const schema = mode === 'create' ? createDriverSchema : editDriverSchema

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues:
      mode === 'create'
        ? {
            username: '',
            password: '',
            email: '',
            first_name: '',
            last_name: '',
            license_number: '',
            license_expiry: '',
            phone: '',
            status: undefined,
          }
        : {
            email: defaultValues?.user.email ?? '',
            first_name: defaultValues?.user.first_name ?? '',
            last_name: defaultValues?.user.last_name ?? '',
            license_number: defaultValues?.license_number ?? '',
            license_expiry: defaultValues?.license_expiry ?? '',
            phone: defaultValues?.phone ?? '',
            status: defaultValues?.status ?? undefined,
          },
  })

  useEffect(() => {
    if (mode === 'edit' && defaultValues) {
      form.reset({
        email: defaultValues.user.email,
        first_name: defaultValues.user.first_name,
        last_name: defaultValues.user.last_name,
        license_number: defaultValues.license_number,
        license_expiry: defaultValues.license_expiry,
        phone: defaultValues.phone,
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
        form.setError(field as keyof FormValues, { message })
      }
    }
  }

  function onSubmit(values: FormValues) {
    if (mode === 'create') {
      const createValues = values as CreateFormValues
      createDriver.mutate(
        {
          username: createValues.username,
          password: createValues.password,
          email: createValues.email,
          first_name: createValues.first_name,
          last_name: createValues.last_name,
          license_number: createValues.license_number,
          license_expiry: createValues.license_expiry,
          phone: createValues.phone,
          status: createValues.status,
        },
        {
          onSuccess,
          onError: handleFieldErrors,
        }
      )
    } else {
      if (!defaultValues?.id) return
      const editValues = values as EditFormValues
      updateDriver.mutate(
        {
          id: defaultValues.id,
          body: {
            email: editValues.email,
            first_name: editValues.first_name,
            last_name: editValues.last_name,
            license_number: editValues.license_number,
            license_expiry: editValues.license_expiry,
            phone: editValues.phone,
            status: editValues.status,
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
        {/* Create-only fields */}
        {mode === 'create' && (
          <>
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="e.g. jsmith" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Min. 8 characters" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {/* Fields common to both create and edit */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="e.g. jsmith@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="first_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>First Name</FormLabel>
              <FormControl>
                <Input type="text" placeholder="e.g. John" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="last_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Last Name</FormLabel>
              <FormControl>
                <Input type="text" placeholder="e.g. Smith" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="license_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>License Number</FormLabel>
              <FormControl>
                <Input type="text" placeholder="e.g. DL-2026-00001" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="license_expiry"
          render={({ field }) => (
            <FormItem>
              <FormLabel>License Expiry</FormLabel>
              <FormControl>
                <DatePicker
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  placeholder="Seleccionar fecha de vencimiento"
                />
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
                <Input type="tel" placeholder="e.g. +19876543210" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="busy">Busy</SelectItem>
                    <SelectItem value="off_duty">Off Duty</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
        />

        <Button type="submit" disabled={isPending} className="flex items-center gap-2">
          {isPending && <LoadingSpinner className="w-4 h-4 border-white border-t-transparent" />}
          {mode === 'create' ? 'Create Driver' : 'Save Changes'}
        </Button>
      </form>
    </Form>
  )
}
