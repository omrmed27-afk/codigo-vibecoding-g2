import { cn } from '@/lib/utils'
import type { ShipmentStatus } from '@/types/shipments'

interface Props {
  status: ShipmentStatus
}

const steps: { key: ShipmentStatus; label: string }[] = [
  { key: 'pending', label: 'Pending' },
  { key: 'picked_up', label: 'Picked Up' },
  { key: 'in_transit', label: 'In Transit' },
  { key: 'delivered', label: 'Delivered' },
]

const stepOrder: Record<ShipmentStatus, number> = {
  pending: 0,
  picked_up: 1,
  in_transit: 2,
  delivered: 3,
  cancelled: -1,
}

export default function StatusTimeline({ status }: Props) {
  const isCancelled = status === 'cancelled'
  const currentOrder = stepOrder[status]

  return (
    <div className="w-full">
      {isCancelled ? (
        <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <span className="text-sm font-medium text-red-700">Cancelled</span>
        </div>
      ) : (
        <div className="flex items-start gap-0">
          {steps.map((step, index) => {
            const stepIdx = index
            const isCompleted = currentOrder > stepIdx
            const isCurrent = currentOrder === stepIdx
            const isFuture = currentOrder < stepIdx

            return (
              <div key={step.key} className="flex items-center flex-1 min-w-0">
                <div className="flex flex-col items-center flex-1 min-w-0">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 border-2 transition-colors',
                      isCompleted &&
                        'bg-green-500 border-green-500 text-white',
                      isCurrent &&
                        'bg-blue-600 border-blue-600 text-white ring-4 ring-blue-100',
                      isFuture &&
                        'bg-white border-gray-300 text-gray-400'
                    )}
                  >
                    {isCompleted ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      stepIdx + 1
                    )}
                  </div>
                  <span
                    className={cn(
                      'mt-1.5 text-xs font-medium text-center leading-tight px-1',
                      isCompleted && 'text-green-600',
                      isCurrent && 'text-blue-600',
                      isFuture && 'text-gray-400'
                    )}
                  >
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'h-0.5 flex-1 mx-1 mt-[-18px] transition-colors',
                      currentOrder > stepIdx ? 'bg-green-400' : 'bg-gray-200'
                    )}
                  />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
