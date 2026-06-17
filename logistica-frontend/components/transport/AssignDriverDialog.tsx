'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { useDriverList } from '@/hooks/drivers/use-drivers'
import { useAssignDriver } from '@/hooks/transport/use-transport'

interface Props {
  transportId: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function AssignDriverDialog({ transportId, open, onOpenChange }: Props) {
  const [selectedDriverId, setSelectedDriverId] = useState<string>('')

  const { data: driversData, isLoading: isLoadingDrivers } = useDriverList({
    status: 'available',
  })

  const assignDriver = useAssignDriver()

  // Reset selected driver when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedDriverId('')
    }
  }, [open])

  function handleConfirm() {
    if (!selectedDriverId) return
    assignDriver.mutate(
      { id: transportId, driver_id: Number(selectedDriverId) },
      {
        onSuccess: () => {
          onOpenChange(false)
        },
      }
    )
  }

  const availableDrivers = driversData?.results ?? []
  const hasNoDrivers = !isLoadingDrivers && availableDrivers.length === 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Driver</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {isLoadingDrivers ? (
            <div className="flex justify-center py-6">
              <LoadingSpinner />
            </div>
          ) : hasNoDrivers ? (
            <p className="text-sm text-gray-500 text-center py-4">
              No available drivers
            </p>
          ) : (
            <Select
              value={selectedDriverId}
              onValueChange={setSelectedDriverId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a driver" />
              </SelectTrigger>
              <SelectContent>
                {availableDrivers.map((driver) => (
                  <SelectItem key={driver.id} value={String(driver.id)}>
                    {driver.user.first_name} {driver.user.last_name} — {driver.license_number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={assignDriver.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedDriverId || assignDriver.isPending || hasNoDrivers}
            className="flex items-center gap-2"
          >
            {assignDriver.isPending && (
              <LoadingSpinner className="w-4 h-4 border-white border-t-transparent" />
            )}
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
