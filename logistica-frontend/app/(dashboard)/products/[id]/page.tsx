'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import PageHeader from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { useProduct, useDeleteProduct } from '@/hooks/products/use-products'
import type { AxiosError } from 'axios'

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = Number(params.id)

  const { data, isLoading, isError, error } = useProduct(id)
  const deleteProduct = useDeleteProduct()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

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
        title={data.name}
        action={
          <div className="flex flex-wrap gap-2">
            <Link href="/products">
              <Button variant="outline" size="sm">Volver</Button>
            </Link>
            <Link href={`/products/${id}/edit`}>
              <Button variant="outline">Editar</Button>
            </Link>
            <Button
              variant="outline"
              className="text-red-600 border-red-300 hover:bg-red-50"
              onClick={() => setShowDeleteDialog(true)}
            >
              Eliminar
            </Button>
          </div>
        }
      />

      <div className="bg-white rounded-lg border border-gray-200 p-6 max-w-3xl">
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <dt className="text-sm font-medium text-gray-500">SKU</dt>
            <dd className="mt-1 text-sm text-gray-900 font-mono bg-gray-50 px-2 py-1 rounded w-fit">
              {data.sku}
            </dd>
          </div>

          <div className="sm:col-span-2">
            <dt className="text-sm font-medium text-gray-500">Descripción</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {data.description ?? '—'}
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">Precio Unitario</dt>
            <dd className="mt-1 text-sm text-gray-900">{data.unit_price}</dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">Stock</dt>
            <dd className="mt-1 text-sm text-gray-900">{data.stock_quantity}</dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">Peso (kg)</dt>
            <dd className="mt-1 text-sm text-gray-900">{data.weight_kg}</dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">Ancho (cm)</dt>
            <dd className="mt-1 text-sm text-gray-900">{data.width_cm}</dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">Alto (cm)</dt>
            <dd className="mt-1 text-sm text-gray-900">{data.height_cm}</dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">Profundidad (cm)</dt>
            <dd className="mt-1 text-sm text-gray-900">{data.depth_cm}</dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">Proveedor</dt>
            <dd className="mt-1 text-sm text-gray-900">
              <Link
                href={`/suppliers/${data.supplier.id}`}
                className="text-blue-600 hover:underline"
              >
                {data.supplier.name}
              </Link>
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">Bodega</dt>
            <dd className="mt-1 text-sm text-gray-900">
              <Link
                href={`/warehouses/${data.warehouse.id}`}
                className="text-blue-600 hover:underline"
              >
                {data.warehouse.name}
              </Link>
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">Creado</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {new Date(data.created_at).toLocaleString('es-CO', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">Actualizado</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {new Date(data.updated_at).toLocaleString('es-CO', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </dd>
          </div>
        </dl>
      </div>

      <ConfirmDialog
        open={showDeleteDialog}
        title="Eliminar Producto"
        description={`¿Está seguro de que desea eliminar "${data.name}"? Esta acción no se puede deshacer.`}
        onConfirm={() => {
          deleteProduct.mutate(id, {
            onSuccess: () => {
              router.push('/products')
            },
          })
        }}
        onCancel={() => setShowDeleteDialog(false)}
        isLoading={deleteProduct.isPending}
      />
    </div>
  )
}
