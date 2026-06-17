'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import PageHeader from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import WarehouseForm from '@/components/warehouses/WarehouseForm'

export default function NewWarehousePage() {
  const router = useRouter()

  return (
    <div className="p-6">
      <PageHeader
        title="Nueva Bodega"
        action={
          <Link href="/warehouses">
            <Button variant="outline">Volver</Button>
          </Link>
        }
      />
      <WarehouseForm
        mode="create"
        onSuccess={() => router.push('/warehouses')}
      />
    </div>
  )
}
