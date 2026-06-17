'use client'

import { useEffect } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { useCreateUser, useGroups } from '@/hooks/users/use-users'
import type { AxiosError } from 'axios'
import type { ApiError } from '@/types/api'

const schema = z.object({
  username: z.string().min(1, 'Username is required').max(150),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  email: z.string().email('Must be a valid email').or(z.literal('')).optional(),
  first_name: z.string().max(150).optional(),
  last_name: z.string().max(150).optional(),
  group_ids: z.array(z.number()).optional(),
})

type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function CreateUserDialog({ open, onOpenChange }: Props) {
  const createUser = useCreateUser()
  const { data: groups = [] } = useGroups()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      username: '',
      password: '',
      email: '',
      first_name: '',
      last_name: '',
      group_ids: [],
    },
  })

  useEffect(() => {
    if (open) form.reset()
  }, [open, form])

  function toggleGroup(id: number) {
    const current = form.getValues('group_ids') ?? []
    if (current.includes(id)) {
      form.setValue('group_ids', current.filter((g) => g !== id))
    } else {
      form.setValue('group_ids', [...current, id])
    }
  }

  function onSubmit(values: FormValues) {
    createUser.mutate(
      {
        ...values,
        email: values.email || undefined,
        first_name: values.first_name || undefined,
        last_name: values.last_name || undefined,
      },
      {
        onSuccess: () => onOpenChange(false),
        onError: (error: unknown) => {
          const axiosError = error as AxiosError<ApiError>
          const details = axiosError.response?.data?.error?.details
          if (details) {
            Object.entries(details).forEach(([field, msgs]) => {
              form.setError(field as keyof FormValues, { message: msgs[0] })
            })
          }
        },
      }
    )
  }

  const selectedGroupIds = form.watch('group_ids') ?? []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New User</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
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
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username *</FormLabel>
                  <FormControl>
                    <Input placeholder="jdoe" {...field} />
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
                    <Input type="email" placeholder="jdoe@example.com" {...field} />
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
                  <FormLabel>Password *</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Min. 8 characters" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {groups.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Roles</p>
                <div className="flex flex-wrap gap-2">
                  {groups.map((group) => (
                    <label
                      key={group.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-200 cursor-pointer hover:bg-gray-50 text-sm transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedGroupIds.includes(group.id)}
                        onChange={() => toggleGroup(group.id)}
                        className="w-3.5 h-3.5 accent-gray-900"
                      />
                      <span className="capitalize">{group.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createUser.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createUser.isPending} className="flex items-center gap-2">
                {createUser.isPending && (
                  <LoadingSpinner className="w-4 h-4 border-white border-t-transparent" />
                )}
                Create
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
