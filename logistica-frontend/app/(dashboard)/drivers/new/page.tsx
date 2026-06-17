'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import PageHeader from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import DriverForm from '@/components/drivers/DriverForm'

export default function NewDriverPage() {
  const router = useRouter()

  return (
    <div className="p-6">
      <PageHeader
        title="Nuevo Conductor"
        action={
          <Link href="/drivers">
            <Button variant="outline">Volver</Button>
          </Link>
        }
      />
      <DriverForm
        mode="create"
        onSuccess={() => router.push('/drivers')}
      />
    </div>
  )
}
