'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff } from 'lucide-react'
import type { AxiosError } from 'axios'
import { useLogin } from '@/hooks/auth/use-login'
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
  username: z.string().min(1, 'Requerido'),
  password: z.string().min(1, 'Requerido'),
})

type FormValues = z.infer<typeof schema>

export default function LoginForm() {
  const { mutate, isPending, error } = useLogin()
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { username: '', password: '' },
  })

  function onSubmit(values: FormValues) {
    mutate(values)
  }

  const apiError = (error as AxiosError<ApiError> | null)?.response?.data?.error?.message

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Usuario</FormLabel>
              <FormControl>
                <Input placeholder="nombre de usuario" autoComplete="username" {...field} />
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
              <FormLabel>Contraseña</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Tu contraseña"
                    autoComplete="current-password"
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

        {apiError && (
          <p className="text-sm text-red-600 text-center" role="alert">{apiError}</p>
        )}

        <Button type="submit" disabled={isPending} className="w-full cursor-pointer">
          {isPending && <LoadingSpinner className="mr-2 w-4 h-4" />}
          Iniciar sesión
        </Button>
      </form>
    </Form>
  )
}
