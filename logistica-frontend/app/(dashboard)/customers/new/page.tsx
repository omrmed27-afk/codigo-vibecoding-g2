'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import PageHeader from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import CustomerForm from '@/components/customers/CustomerForm'

export default function NewCustomerPage() {
  const router = useRouter()

  return (
    <div className="p-6">
      <PageHeader
        title="Nuevo Cliente"
        action={
          <Link href="/customers">
            <Button variant="outline">Volver</Button>
          </Link>
        }
      />
      <CustomerForm
        mode="create"
        onSuccess={() => router.push('/customers')}
      />
    </div>
  )
}
