import Link from 'next/link'
import RegisterForm from '@/components/auth/RegisterForm'

export default function RegisterPage() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold text-gray-900">Crear cuenta</h1>
        <p className="mt-1 text-sm text-gray-500">Completa tus datos para comenzar</p>
      </div>

      <RegisterForm />

      <p className="mt-4 text-center text-sm text-gray-500">
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" className="font-medium text-gray-900 hover:underline">
          Inicia sesión
        </Link>
      </p>
    </div>
  )
}
