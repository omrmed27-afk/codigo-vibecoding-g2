'use client'

import LoadingSpinner from './LoadingSpinner'

interface Props {
  title: string
  description: string
  open: boolean
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
  confirmLabel?: string
}

export default function ConfirmDialog({
  title,
  description,
  open,
  onConfirm,
  onCancel,
  isLoading,
  confirmLabel = 'Delete',
}: Props) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onCancel}
      />
      <div className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-sm mx-4">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <p className="mt-2 text-sm text-gray-600">{description}</p>
        <div className="mt-4 flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {isLoading && <LoadingSpinner className="w-3 h-3 border-white border-t-transparent" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
