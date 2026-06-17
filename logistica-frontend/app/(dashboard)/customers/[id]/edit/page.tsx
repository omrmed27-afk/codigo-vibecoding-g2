'use client'

import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import PageHeader from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import CustomerForm from '@/components/customers/CustomerForm'
import { useCustomer } from '@/hooks/customers/use-customers'
import type { AxiosError } from 'axios'

export default function EditCustomerPage() {
  const params = useParams()
  const router = useRouter()
  const id = Number(params.id)

  const { data, isLoading, isError, error } = useCustomer(id)

  const is404 =
    isError && (error as AxiosError)?.response?.status === 404

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[200px]">
        <LoadingSpinner />
      </div>
    )
  }

  if (is404 || (!isLoading && !data)) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg mb-4">Cliente no encontrado</p>
          <Link href="/customers">
            <Button variant="outline">Volver a Clientes</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-6">
        <div className="text-center py-12 text-red-600">
          Error al cargar el cliente. Intente nuevamente.
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="p-6">
      <PageHeader
        title="Editar Cliente"
        action={
          <Link href={`/customers/${id}`}>
            <Button variant="outline">Volver</Button>
          </Link>
        }
      />
      <CustomerForm
        mode="edit"
        defaultValues={data}
        onSuccess={() => router.push(`/customers/${id}`)}
      />
    </div>
  )
}
