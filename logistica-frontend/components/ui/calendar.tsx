'use client'

import { DayPicker } from 'react-day-picker'
import { cn } from '@/lib/utils'

export type CalendarProps = React.ComponentProps<typeof DayPicker>

export function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row gap-4',
        month: 'flex flex-col gap-4',
        month_caption: 'flex justify-center pt-1 relative items-center w-full',
        caption_label: 'text-sm font-medium',
        nav: 'flex items-center gap-1',
        button_previous: 'absolute left-1 h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 flex items-center justify-center rounded-md hover:bg-gray-100',
        button_next: 'absolute right-1 h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 flex items-center justify-center rounded-md hover:bg-gray-100',
        month_grid: 'w-full border-collapse',
        weekdays: 'flex',
        weekday: 'text-gray-500 rounded-md w-8 font-normal text-[0.8rem] text-center',
        week: 'flex w-full mt-2',
        day: 'relative p-0 text-center text-sm focus-within:relative focus-within:z-20',
        day_button: cn(
          'h-8 w-8 p-0 font-normal rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors',
          'aria-selected:opacity-100'
        ),
        selected: '[&>button]:bg-gray-900 [&>button]:text-white [&>button]:hover:bg-gray-800',
        today: '[&>button]:bg-gray-100 [&>button]:font-semibold',
        outside: 'text-gray-400 opacity-50',
        disabled: 'text-gray-400 opacity-50 pointer-events-none',
        range_middle: '[&>button]:bg-gray-100 [&>button]:rounded-none',
        hidden: 'invisible',
        ...classNames,
      }}
      {...props}
    />
  )
}
