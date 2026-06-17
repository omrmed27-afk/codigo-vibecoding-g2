import { cn } from '@/lib/utils'

const colorMap: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  picked_up: 'bg-blue-100 text-blue-800',
  in_transit: 'bg-blue-100 text-blue-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  available: 'bg-green-100 text-green-800',
  busy: 'bg-orange-100 text-orange-800',
  off_duty: 'bg-gray-100 text-gray-800',
  maintenance: 'bg-amber-100 text-amber-800',
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  company: 'bg-blue-100 text-blue-800',
  individual: 'bg-indigo-100 text-indigo-800',
  // Vehicle types
  truck: 'bg-gray-100 text-gray-800',
  van: 'bg-blue-100 text-blue-800',
  motorcycle: 'bg-orange-100 text-orange-800',
  bicycle: 'bg-green-100 text-green-800',
}

interface Props {
  status: string
  label?: string
}

export default function StatusBadge({ status, label }: Props) {
  const color = colorMap[status] ?? 'bg-gray-100 text-gray-800'
  const display = label ?? status.replace(/_/g, ' ')

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize',
        color
      )}
    >
      {display}
    </span>
  )
}
