'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff } from 'lucide-react'
import type { AxiosError } from 'axios'
import { useRegister } from '@/hooks/auth/use-register'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import type { ApiError } from '@/types/api'

const schema = z.object({
  username: z.string().min(1, 'Requerido').max(150),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  email: z.string().email('Correo inválido').or(z.literal('')).optional(),
  first_name: z.string().max(150).optional(),
  last_name: z.string().max(150).optional(),
})

type FormValues = z.infer<typeof schema>

export default function RegisterForm() {
  const { mutate, isPending } = useRegister()
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: '',
      password: '',
      email: '',
      first_name: '',
      last_name: '',
    },
  })

  function onSubmit(values: FormValues) {
    mutate(values, {
      onError: (error) => {
        const details = (error as AxiosError<ApiError>).response?.data?.error?.details
        if (details) {
          Object.entries(details).forEach(([field, messages]) => {
            form.setError(field as keyof FormValues, { message: messages[0] })
          })
        }
      },
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Name fields — stack on mobile, side-by-side on sm+ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input placeholder="Juan" autoComplete="given-name" {...field} />
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
                <FormLabel>Apellido</FormLabel>
                <FormControl>
                  <Input placeholder="Pérez" autoComplete="family-name" {...field} />
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
              <FormLabel>
                Usuario <span className="text-red-500" aria-hidden="true">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="nombre_de_usuario" autoComplete="username" {...field} />
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
              <FormLabel>Correo electrónico</FormLabel>
              <FormControl>
                <Input type="email" placeholder="juan@ejemplo.com" autoComplete="email" {...field} />
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
              <FormLabel>
                Contraseña <span className="text-red-500" aria-hidden="true">*</span>
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mín. 8 caracteres"
                    autoComplete="new-password"
                    className="pr-10"
                    {...field}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending} className="w-full cursor-pointer">
          {isPending && <LoadingSpinner className="mr-2 w-4 h-4" />}
          Crear cuenta
        </Button>
      </form>
    </Form>
  )
}
