'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import PageHeader from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import TransportForm from '@/components/transport/TransportForm'

export default function NewTransportPage() {
  const router = useRouter()

  return (
    <div className="p-6">
      <PageHeader
        title="Nuevo Vehículo"
        action={
          <Link href="/transport">
            <Button variant="outline">Volver</Button>
          </Link>
        }
      />
      <TransportForm
        mode="create"
        onSuccess={() => router.push('/transport')}
      />
    </div>
  )
}
