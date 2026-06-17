'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import PageHeader from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import SupplierForm from '@/components/suppliers/SupplierForm'

export default function NewSupplierPage() {
  const router = useRouter()

  return (
    <div className="p-6">
      <PageHeader
        title="Nuevo Proveedor"
        action={
          <Link href="/suppliers">
            <Button variant="outline">Volver</Button>
          </Link>
        }
      />
      <SupplierForm
        mode="create"
        onSuccess={() => router.push('/suppliers')}
      />
    </div>
  )
}
