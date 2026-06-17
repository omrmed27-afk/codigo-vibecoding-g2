'use client'

import { format, parseISO, isValid } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface DatePickerProps {
  value?: string       // YYYY-MM-DD string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  minDate?: Date
}

export function DatePicker({ value, onChange, placeholder = 'Seleccionar fecha', disabled, minDate }: DatePickerProps) {
  const selectedDate = value && isValid(parseISO(value)) ? parseISO(value) : undefined

  function handleSelect(date: Date | undefined) {
    if (date) {
      onChange(format(date, 'yyyy-MM-dd'))
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-start text-left font-normal',
            !selectedDate && 'text-muted-foreground'
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          {selectedDate
            ? format(selectedDate, 'PPP', { locale: es })
            : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          disabled={minDate ? (date) => date < minDate : undefined}
          defaultMonth={selectedDate}
        />
      </PopoverContent>
    </Popover>
  )
}
