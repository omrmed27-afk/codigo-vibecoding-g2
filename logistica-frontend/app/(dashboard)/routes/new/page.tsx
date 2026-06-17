'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import PageHeader from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import RouteForm from '@/components/routes/RouteForm'

export default function NewRoutePage() {
  const router = useRouter()

  return (
    <div className="p-6">
      <PageHeader
        title="Nueva Ruta"
        action={
          <Link href="/routes">
            <Button variant="outline">Volver a Rutas</Button>
          </Link>
        }
      />
      <RouteForm mode="create" onSuccess={() => router.push('/routes')} />
    </div>
  )
}
