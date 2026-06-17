'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import PageHeader from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import ShipmentForm from '@/components/shipments/ShipmentForm'

export default function NewShipmentPage() {
  const router = useRouter()

  return (
    <div className="p-6">
      <PageHeader
        title="Nuevo Envío"
        action={
          <Link href="/shipments">
            <Button variant="outline">Volver</Button>
          </Link>
        }
      />
      <ShipmentForm
        mode="create"
        onSuccess={() => router.push('/shipments')}
      />
    </div>
  )
}
