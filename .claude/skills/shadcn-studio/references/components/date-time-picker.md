# Date and Time Picker Components

Collection de 13 variantes de Date and Time Picker de shadcn-studio.

## Référence Rapide

| # | Nom | Description |
|---|-----|-------------|
| 1 | Basic | Date picker simple avec popover |
| 2 | Range | Sélection de plage de dates |
| 3 | With Icon | Date picker avec icône calendrier |
| 4 | Within Input | Date picker intégré dans un input |
| 5 | Natural Language | Input avec parsing langage naturel (chrono-node) |
| 6 | Short Date | Affichage date courte (little-date) |
| 7 | Disable Outside | Masquer les jours hors mois |
| 8 | Time Input | Input time natif stylé |
| 9 | Time With Icon | Input time avec icône |
| 10 | Date + Time | Date picker + time input séparés |
| 11 | Date + Time Range | Date + plage horaire (from/to) |
| 12 | Date Range + Time | Departure/Return avec heures |
| 13 | Chart Filter | Filtre date range pour graphique |

---

## Date and Time Picker 1 - Basic

Date picker simple avec popover.

```tsx
'use client'

import { useState } from 'react'

import { ChevronDownIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

const DatePickerDemo = () => {
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState<Date | undefined>(undefined)

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor='date' className='px-1'>
        Date picker
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant='outline' id='date' className='w-full justify-between font-normal'>
            {date ? date.toLocaleDateString() : 'Pick a date'}
            <ChevronDownIcon />
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-auto overflow-hidden p-0' align='start'>
          <Calendar
            mode='single'
            selected={date}
            onSelect={date => {
              setDate(date)
              setOpen(false)
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

export default DatePickerDemo
```

---

## Date and Time Picker 2 - Range

Sélection de plage de dates.

```tsx
'use client'

import { useState } from 'react'

import { ChevronDownIcon } from 'lucide-react'
import { type DateRange } from 'react-day-picker'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

const DatePickerRangeDemo = () => {
  const [range, setRange] = useState<DateRange | undefined>(undefined)

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor='dates' className='px-1'>
        Range date picker
      </Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant='outline' id='dates' className='w-full justify-between font-normal'>
            {range?.from && range?.to
              ? `${range.from.toLocaleDateString()} - ${range.to.toLocaleDateString()}`
              : 'Pick a date'}
            <ChevronDownIcon />
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-auto overflow-hidden p-0' align='start'>
          <Calendar
            mode='range'
            selected={range}
            onSelect={range => {
              setRange(range)
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

export default DatePickerRangeDemo
```

---

## Date and Time Picker 3 - With Icon

Date picker avec icône calendrier.

```tsx
'use client'

import { useState } from 'react'

import { CalendarIcon, ChevronDownIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

const DatePickerWithIconDemo = () => {
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState<Date | undefined>(undefined)

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor='date' className='px-1'>
        Date picker with icon
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant='outline' id='date' className='w-full justify-between font-normal'>
            <span className='flex items-center'>
              <CalendarIcon className='mr-2' />
              {date ? date.toLocaleDateString() : 'Pick a date'}
            </span>
            <ChevronDownIcon />
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-auto overflow-hidden p-0' align='start'>
          <Calendar
            mode='single'
            selected={date}
            onSelect={date => {
              setDate(date)
              setOpen(false)
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

export default DatePickerWithIconDemo
```

---

## Date and Time Picker 4 - Within Input

Date picker intégré dans un input texte.

```tsx
'use client'

import { useState } from 'react'

import { CalendarIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

function formatDate(date: Date | undefined) {
  if (!date) {
    return ''
  }

  return date.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}

function isValidDate(date: Date | undefined) {
  if (!date) {
    return false
  }

  return !isNaN(date.getTime())
}

const DatePickerWithinInputDemo = () => {
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [month, setMonth] = useState<Date | undefined>(date)
  const [value, setValue] = useState(formatDate(date))

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor='date' className='px-1'>
        Date picker within input
      </Label>
      <div className='relative flex gap-2'>
        <Input
          id='date'
          value={value}
          placeholder='January 01, 2025'
          className='bg-background pr-10'
          onChange={e => {
            const date = new Date(e.target.value)

            setValue(e.target.value)

            if (isValidDate(date)) {
              setDate(date)
              setMonth(date)
            }
          }}
          onKeyDown={e => {
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setOpen(true)
            }
          }}
        />
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button id='date-picker' variant='ghost' className='absolute top-1/2 right-2 size-6 -translate-y-1/2'>
              <CalendarIcon className='size-3.5' />
              <span className='sr-only'>Pick a date</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className='w-auto overflow-hidden p-0' align='end' alignOffset={-8} sideOffset={10}>
            <Calendar
              mode='single'
              selected={date}
              month={month}
              onMonthChange={setMonth}
              onSelect={date => {
                setDate(date)
                setValue(formatDate(date))
                setOpen(false)
              }}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}

export default DatePickerWithinInputDemo
```

---

## Date and Time Picker 5 - Natural Language

Input avec parsing langage naturel (chrono-node).

```tsx
'use client'

import { useState } from 'react'

import { parseDate } from 'chrono-node'
import { CalendarIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

function formatDate(date: Date | undefined) {
  if (!date) {
    return ''
  }

  return date.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}

const DatePickerWithNaturalLanguageDemo = () => {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('In 2 days')
  const [date, setDate] = useState<Date | undefined>(parseDate(value) || undefined)
  const [month, setMonth] = useState<Date | undefined>(date)

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor='date' className='px-1'>
        Date picker with natural language input
      </Label>
      <div className='relative flex gap-2'>
        <Input
          id='date'
          value={value}
          placeholder='Tomorrow or next week'
          className='bg-background pr-10'
          onChange={e => {
            setValue(e.target.value)
            const date = parseDate(e.target.value)

            if (date) {
              setDate(date)
              setMonth(date)
            }
          }}
          onKeyDown={e => {
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setOpen(true)
            }
          }}
        />
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button id='date-picker' variant='ghost' className='absolute top-1/2 right-2 size-6 -translate-y-1/2'>
              <CalendarIcon className='size-3.5' />
              <span className='sr-only'>Pick a date</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className='w-auto overflow-hidden p-0' align='end' alignOffset={-8} sideOffset={10}>
            <Calendar
              mode='single'
              selected={date}
              month={month}
              onMonthChange={setMonth}
              onSelect={date => {
                setDate(date)
                setValue(formatDate(date))
                setOpen(false)
              }}
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className='text-muted-foreground px-1 text-sm'>
        Your post will be published on <span className='font-medium'>{formatDate(date)}</span>.
      </div>
    </div>
  )
}

export default DatePickerWithNaturalLanguageDemo
```

---

## Date and Time Picker 6 - Short Date

Affichage date courte avec little-date.

```tsx
'use client'

import { useState } from 'react'

import { formatDateRange } from 'little-date'
import { ChevronDownIcon } from 'lucide-react'
import { type DateRange } from 'react-day-picker'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

const DatePickerWithShortDateDisplayDemo = () => {
  const [range, setRange] = useState<DateRange | undefined>({
    from: new Date(2025, 10, 20),
    to: new Date(2025, 10, 24)
  })

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor='dates' className='px-1'>
        Date picker with short date
      </Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant='outline' id='dates' className='w-full justify-between font-normal'>
            {range?.from && range?.to
              ? formatDateRange(range.from, range.to, {
                  includeTime: false
                })
              : 'Pick a date'}
            <ChevronDownIcon />
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-auto overflow-hidden p-0' align='start'>
          <Calendar
            mode='range'
            selected={range}
            onSelect={range => {
              setRange(range)
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

export default DatePickerWithShortDateDisplayDemo
```

---

## Date and Time Picker 7 - Disable Outside Days

Masquer les jours hors du mois courant.

```tsx
'use client'

import { useState } from 'react'

import { ChevronDownIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

const DatePickerDisableOutsideDaysDemo = () => {
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState<Date | undefined>(undefined)

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor='date' className='px-1'>
        Disable outside days
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant='outline' id='date' className='w-full justify-between font-normal'>
            {date ? date.toLocaleDateString() : 'Pick a date'}
            <ChevronDownIcon />
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-auto overflow-hidden p-0' align='start'>
          <Calendar
            mode='single'
            selected={date}
            showOutsideDays={false}
            onSelect={date => {
              setDate(date)
              setOpen(false)
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

export default DatePickerDisableOutsideDaysDemo
```

---

## Date and Time Picker 8 - Time Input

Input time natif stylé.

```tsx
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const DatePickerDemo = () => {
  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor='time-picker' className='px-1'>
        Time input
      </Label>
      <Input
        type='time'
        id='time-picker'
        step='1'
        defaultValue='08:30:00'
        className='bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none'
      />
    </div>
  )
}

export default DatePickerDemo
```

---

## Date and Time Picker 9 - Time With Icon

Input time avec icône.

```tsx
import { Clock8Icon } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const TimePickerWithIconDemo = () => {
  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor='timepicker'>Time input with start icon</Label>
      <div className='relative'>
        <div className='text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center pl-3 peer-disabled:opacity-50'>
          <Clock8Icon className='size-4' />
          <span className='sr-only'>User</span>
        </div>
        <Input
          type='time'
          id='time-picker'
          step='1'
          defaultValue='08:30:00'
          className='peer bg-background appearance-none pl-9 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none'
        />
      </div>
    </div>
  )
}

export default TimePickerWithIconDemo
```

---

## Date and Time Picker 10 - Date + Time

Date picker et time input séparés.

```tsx
'use client'

import { useState } from 'react'

import { ChevronDownIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

const DatePickerAndTimePickerDemo = () => {
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState<Date | undefined>(undefined)

  return (
    <div className='flex gap-4'>
      <div className='flex flex-col gap-3'>
        <Label htmlFor='date-picker' className='px-1'>
          Date picker
        </Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant='outline' id='date-picker' className='justify-between font-normal'>
              {date ? date.toLocaleDateString() : 'Pick a date'}
              <ChevronDownIcon />
            </Button>
          </PopoverTrigger>
          <PopoverContent className='w-auto overflow-hidden p-0' align='start'>
            <Calendar
              mode='single'
              selected={date}
              onSelect={date => {
                setDate(date)
                setOpen(false)
              }}
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className='flex flex-col gap-3'>
        <Label htmlFor='time-picker' className='px-1'>
          Time input
        </Label>
        <Input
          type='time'
          id='time-picker'
          step='1'
          defaultValue='06:30:00'
          className='bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none'
        />
      </div>
    </div>
  )
}

export default DatePickerAndTimePickerDemo
```

---

## Date and Time Picker 11 - Date + Time Range

Date avec plage horaire (from/to).

```tsx
'use client'

import { useState } from 'react'

import { ChevronDownIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

const DatePickerAndTimeRangePicker = () => {
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState<Date | undefined>(undefined)

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex w-full max-w-xs flex-col gap-3'>
        <Label htmlFor='date' className='px-1'>
          Date
        </Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant='outline' id='date' className='w-full justify-between font-normal'>
              {date ? date.toLocaleDateString() : 'Pick a date'}
              <ChevronDownIcon />
            </Button>
          </PopoverTrigger>
          <PopoverContent className='w-auto overflow-hidden p-0' align='start'>
            <Calendar
              mode='single'
              selected={date}
              onSelect={date => {
                setDate(date)
                setOpen(false)
              }}
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className='flex gap-4'>
        <div className='flex flex-col gap-3'>
          <Label htmlFor='time-from' className='px-1'>
            From
          </Label>
          <Input
            type='time'
            id='time-from'
            step='1'
            defaultValue='01:30:00'
            className='bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none'
          />
        </div>
        <div className='flex flex-col gap-3'>
          <Label htmlFor='time-to' className='px-1'>
            To
          </Label>
          <Input
            type='time'
            id='time-to'
            step='1'
            defaultValue='02:30:00'
            className='bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none'
          />
        </div>
      </div>
    </div>
  )
}

export default DatePickerAndTimeRangePicker
```

---

## Date and Time Picker 12 - Date Range + Time

Departure/Return avec heures.

```tsx
'use client'

import { useState } from 'react'

import { ChevronDownIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

const DatePickerRangeAndTimePickerDemo = () => {
  const [openFrom, setOpenFrom] = useState(false)
  const [openTo, setOpenTo] = useState(false)
  const [dateFrom, setDateFrom] = useState<Date | undefined>(new Date('2025-06-18'))
  const [dateTo, setDateTo] = useState<Date | undefined>(new Date('2025-06-25'))

  return (
    <div className='flex w-full max-w-64 min-w-0 flex-col gap-6'>
      <div className='flex gap-4'>
        <div className='flex flex-1 flex-col gap-3'>
          <Label htmlFor='date-from' className='px-1'>
            Departure date
          </Label>
          <Popover open={openFrom} onOpenChange={setOpenFrom}>
            <PopoverTrigger asChild>
              <Button variant='outline' id='date-from' className='w-full justify-between font-normal'>
                {dateFrom
                  ? dateFrom.toLocaleDateString('en-US', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })
                  : 'Pick a date'}
                <ChevronDownIcon />
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-auto overflow-hidden p-0' align='start'>
              <Calendar
                mode='single'
                selected={dateFrom}
                onSelect={date => {
                  setDateFrom(date)
                  setOpenFrom(false)
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className='flex flex-col gap-3'>
          <Label htmlFor='time-from' className='invisible px-1'>
            From
          </Label>
          <Input
            type='time'
            id='time-from'
            step='1'
            defaultValue='09:30:00'
            className='bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none'
          />
        </div>
      </div>
      <div className='flex gap-4'>
        <div className='flex flex-1 flex-col gap-3'>
          <Label htmlFor='date-to' className='px-1'>
            Return date
          </Label>
          <Popover open={openTo} onOpenChange={setOpenTo}>
            <PopoverTrigger asChild>
              <Button variant='outline' id='date-to' className='w-full justify-between font-normal'>
                {dateTo
                  ? dateTo.toLocaleDateString('en-US', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })
                  : 'Pick a date'}
                <ChevronDownIcon />
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-auto overflow-hidden p-0' align='start'>
              <Calendar
                mode='single'
                selected={dateTo}
                captionLayout='dropdown'
                onSelect={date => {
                  setDateTo(date)
                  setOpenTo(false)
                }}
                disabled={dateFrom && { before: dateFrom }}
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className='flex flex-col gap-3'>
          <Label htmlFor='time-to' className='invisible px-1'>
            To
          </Label>
          <Input
            type='time'
            id='time-to'
            step='1'
            defaultValue='18:30:00'
            className='bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none'
          />
        </div>
      </div>
    </div>
  )
}

export default DatePickerRangeAndTimePickerDemo
```

---

## Date and Time Picker 13 - Chart Filter

Filtre date range pour graphique avec recharts.

```tsx
'use client'

import { useState, useMemo } from 'react'

import { CalendarIcon } from 'lucide-react'
import type { DateRange } from 'react-day-picker'
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import type { ChartConfig } from '@/components/ui/chart'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

const chartData = [
  { date: '2025-01-01', visitors: 178 },
  { date: '2025-01-02', visitors: 470 },
  { date: '2025-01-03', visitors: 103 },
  { date: '2025-01-04', visitors: 439 },
  { date: '2025-01-05', visitors: 88 },
  { date: '2025-01-06', visitors: 294 },
  { date: '2025-01-07', visitors: 323 },
  { date: '2025-01-08', visitors: 385 },
  { date: '2025-01-09', visitors: 438 },
  { date: '2025-01-10', visitors: 155 },
  { date: '2025-01-11', visitors: 92 },
  { date: '2025-01-12', visitors: 492 },
  { date: '2025-01-13', visitors: 81 },
  { date: '2025-01-14', visitors: 426 },
  { date: '2025-01-15', visitors: 307 },
  { date: '2025-01-16', visitors: 371 },
  { date: '2025-01-17', visitors: 475 },
  { date: '2025-01-18', visitors: 107 },
  { date: '2025-01-19', visitors: 341 },
  { date: '2025-01-20', visitors: 408 },
  { date: '2025-01-21', visitors: 169 },
  { date: '2025-01-22', visitors: 317 },
  { date: '2025-01-23', visitors: 480 },
  { date: '2025-01-24', visitors: 132 },
  { date: '2025-01-25', visitors: 141 },
  { date: '2025-01-26', visitors: 434 },
  { date: '2025-01-27', visitors: 448 },
  { date: '2025-01-28', visitors: 149 },
  { date: '2025-01-29', visitors: 103 },
  { date: '2025-01-30', visitors: 446 },
  { date: '2025-01-31', visitors: 320 }
]

const total = chartData.reduce((acc, curr) => acc + curr.visitors, 0)

const chartConfig = {
  visitors: {
    label: 'Visitors',
    color: 'var(--color-primary)'
  }
} satisfies ChartConfig

const ChartFilterDemo = () => {
  const [range, setRange] = useState<DateRange | undefined>({
    from: new Date(2025, 0, 1),
    to: new Date(2025, 0, 31)
  })

  const filteredData = useMemo(() => {
    if (!range?.from && !range?.to) {
      return chartData
    }

    return chartData.filter(item => {
      const date = new Date(item.date)

      return date >= range.from! && date <= range.to!
    })
  }, [range])

  return (
    <Card className='@container/card w-full max-w-xl'>
      <CardHeader className='flex flex-col border-b @md/card:grid'>
        <CardTitle>Web Analytics</CardTitle>
        <CardDescription>Showing total visitors for this month.</CardDescription>
        <CardAction className='mt-2 @md/card:mt-0'>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant='outline'>
                <CalendarIcon />
                {range?.from && range?.to
                  ? `${range.from.toLocaleDateString()} - ${range.to.toLocaleDateString()}`
                  : 'January 2025'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-auto overflow-hidden p-0' align='end'>
              <Calendar
                className='w-full'
                mode='range'
                defaultMonth={range?.from}
                selected={range}
                onSelect={setRange}
                startMonth={range?.from}
                fixedWeeks
                showOutsideDays
                disabled={{
                  after: new Date(2025, 0, 31),
                  before: new Date(2025, 0, 1)
                }}
              />
            </PopoverContent>
          </Popover>
        </CardAction>
      </CardHeader>
      <CardContent className='px-4'>
        <ChartContainer config={chartConfig} className='aspect-auto h-62 w-full'>
          <BarChart
            accessibilityLayer
            data={filteredData}
            margin={{
              left: 12,
              right: 12
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey='date'
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={20}
              tickFormatter={value => {
                const date = new Date(value)

                return date.toLocaleDateString('en-US', {
                  day: 'numeric'
                })
              }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className='w-[150px]'
                  nameKey='visitors'
                  labelFormatter={value => {
                    return new Date(value).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })
                  }}
                />
              }
            />
            <Bar dataKey='visitors' fill={`var(--color-visitors)`} radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className='border-t'>
        <div className='text-sm'>
          You had <span className='font-semibold'>{total.toLocaleString()}</span> visitors for the month of January.
        </div>
      </CardFooter>
    </Card>
  )
}

export default ChartFilterDemo
```
