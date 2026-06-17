'use client'

import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import PageHeader from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ProductForm from '@/components/products/ProductForm'
import { useProduct } from '@/hooks/products/use-products'
import type { AxiosError } from 'axios'

export default function EditProductPage() {
  const params = useParams()
  const router = useRouter()
  const id = Number(params.id)

  const { data, isLoading, isError, error } = useProduct(id)

  const is404 =
    isError &&
    (error as AxiosError)?.response?.status === 404

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
          <p className="text-gray-500 text-lg mb-4">Producto no encontrado</p>
          <Link href="/products">
            <Button variant="outline">Volver a Productos</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-6">
        <div className="text-center py-12 text-red-600">
          Error al cargar el producto. Intente nuevamente.
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="p-6">
      <PageHeader
        title="Editar Producto"
        action={
          <Link href={`/products/${id}`}>
            <Button variant="outline">Volver</Button>
          </Link>
        }
      />
      <ProductForm
        mode="edit"
        defaultValues={data}
        onSuccess={() => router.push(`/products/${id}`)}
      />
    </div>
  )
}
