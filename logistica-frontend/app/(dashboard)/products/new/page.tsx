'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import PageHeader from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import ProductForm from '@/components/products/ProductForm'

export default function NewProductPage() {
  const router = useRouter()

  return (
    <div className="p-6">
      <PageHeader
        title="Nuevo Producto"
        action={
          <Link href="/products">
            <Button variant="outline">Volver</Button>
          </Link>
        }
      />
      <ProductForm
        mode="create"
        onSuccess={() => router.push('/products')}
      />
    </div>
  )
}
