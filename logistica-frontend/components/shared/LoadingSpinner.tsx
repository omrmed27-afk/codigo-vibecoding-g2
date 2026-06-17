import { cn } from '@/lib/utils'

interface Props {
  className?: string
}

export default function LoadingSpinner({ className }: Props) {
  return (
    <div
      className={cn(
        'w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin',
        className
      )}
    />
  )
}
