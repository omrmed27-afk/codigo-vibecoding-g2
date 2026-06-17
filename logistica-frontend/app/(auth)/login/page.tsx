import Link from 'next/link'
import LoginForm from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold text-gray-900">Iniciar sesión</h1>
        <p className="mt-1 text-sm text-gray-500">Ingresa tus credenciales para continuar</p>
      </div>

      <LoginForm />

      <p className="mt-4 text-center text-sm text-gray-500">
        ¿No tienes cuenta?{' '}
        <Link href="/register" className="font-medium text-gray-900 hover:underline">
          Regístrate
        </Link>
      </p>
    </div>
  )
}
