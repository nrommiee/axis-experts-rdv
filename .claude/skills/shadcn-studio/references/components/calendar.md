# Calendar Components

25 variants from ShadcnStudio. Select based on use case.

## Quick Reference

| # | Style | Features | Use Case |
|---|-------|----------|----------|
| 1 | Default | Single month | Basic date selection |
| 2 | Multi month | 2 months side by side | Date range visibility |
| 3 | Range single | Range selection | Booking periods |
| 4 | Range multi | Range + 2 months | Extended booking |
| 5 | Min days | Minimum 5 days | Minimum stay booking |
| 6 | Disabled days | Block past dates | Future-only selection |
| 7 | Disabled weekends | No Sat/Sun | Business days only |
| 8 | Localized | Multi-language | International apps |
| 9 | Month/Year dropdown | Quick navigation | Birth dates, history |
| 10 | Variable size | Responsive sizing | Mobile/desktop adapt |
| 11 | Event list | With events sidebar | Scheduling apps |
| 12 | Multi select | Multiple dates | Multiple appointments |
| 13 | Custom day style | Custom selection style | Branded calendars |
| 14 | Custom range style | Custom range style | Branded range picker |
| 15 | Right nav | Nav buttons right | Alternative layout |
| 16 | Left nav | Nav buttons left | Alternative layout |
| 17 | Week numbers | Show week numbers | Business/ISO weeks |
| 18 | Today button | Quick jump to today | Long-term planning |
| 19 | Date input | With text input | Manual date entry |
| 20 | Time input | With time picker | DateTime selection |
| 21 | Advanced selection | Year/month picker | Birth date, archives |
| 22 | Presets | Quick date buttons | Common selections |
| 23 | Range presets | Range quick buttons | Reporting periods |
| 24 | Appointment | Date + time slots | Booking system |
| 25 | Pricing | Price per day | Hotel/rental booking |

---

## 1. Default

Basic calendar with single date selection.

```tsx
'use client'

import { useState } from 'react'

import { Calendar } from '@/components/ui/calendar'

const CalendarDemo = () => {
  const [date, setDate] = useState<Date | undefined>(new Date())

  return (
    <div>
      <Calendar mode='single' defaultMonth={date} selected={date} onSelect={setDate} className='rounded-lg border' />
      <p className='text-muted-foreground mt-3 text-center text-xs' role='region'>
        Default Month
      </p>
    </div>
  )
}

export default CalendarDemo
```

---

## 2. Multi Month

Two months displayed side by side.

```tsx
'use client'

import { useState } from 'react'

import { Calendar } from '@/components/ui/calendar'

const CalendarMultiMonthDemo = () => {
  const [date, setDate] = useState<Date | undefined>(new Date())

  return (
    <div>
      <Calendar
        mode='single'
        defaultMonth={date}
        numberOfMonths={2}
        selected={date}
        onSelect={setDate}
        className='rounded-lg border'
      />
      <p className='text-muted-foreground mt-4 text-center text-xs' role='region'>
        Multi month calendar
      </p>
    </div>
  )
}

export default CalendarMultiMonthDemo
```

---

## 3. Range Single Month

Single month with range selection.

```tsx
'use client'

import { useState } from 'react'

import { type DateRange } from 'react-day-picker'

import { Calendar } from '@/components/ui/calendar'

const CalendarRangeSingleMonthDemo = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(2025, 5, 4),
    to: new Date(2025, 5, 17)
  })

  return (
    <div>
      <Calendar
        mode='range'
        selected={dateRange}
        defaultMonth={dateRange?.from}
        onSelect={setDateRange}
        className='rounded-lg border'
      />
      <p className='text-muted-foreground mt-3 text-center text-xs' role='region'>
        Single month calendar with range selection
      </p>
    </div>
  )
}

export default CalendarRangeSingleMonthDemo
```

---

## 4. Range Multi Month

Two months with range selection.

```tsx
'use client'

import { useState } from 'react'

import { type DateRange } from 'react-day-picker'

import { Calendar } from '@/components/ui/calendar'

const CalendarRangeCalendarMultiMonthDemo = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(2025, 4, 22),
    to: new Date(2025, 5, 17)
  })

  return (
    <div>
      <Calendar
        mode='range'
        defaultMonth={dateRange?.from}
        selected={dateRange}
        onSelect={setDateRange}
        numberOfMonths={2}
        className='rounded-lg border'
      />
      <p className='text-muted-foreground mt-3 text-center text-xs' role='region'>
        Multi month calendar with range selection
      </p>
    </div>
  )
}

export default CalendarRangeCalendarMultiMonthDemo
```

---

## 5. Minimum Days Selection

Range with minimum 5 days requirement.

```tsx
'use client'

import { useState } from 'react'

import { type DateRange } from 'react-day-picker'

import { Calendar } from '@/components/ui/calendar'

const CalendarRangeWithMinimumDaysDemo = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(2025, 5, 8),
    to: new Date(2025, 5, 17)
  })

  return (
    <div>
      <Calendar
        mode='range'
        defaultMonth={dateRange?.from}
        selected={dateRange}
        onSelect={setDateRange}
        numberOfMonths={1}
        min={5}
        className='rounded-lg border'
      />
      <p className='text-muted-foreground mt-3 text-center text-xs' role='region'>
        Minimum 5 days selection
      </p>
    </div>
  )
}

export default CalendarRangeWithMinimumDaysDemo
```

---

## 6. Disabled Days

Calendar with past dates disabled.

```tsx
'use client'

import { useState } from 'react'

import { Calendar } from '@/components/ui/calendar'

const CalendarDisableDayDemo = () => {
  const [date, setDate] = useState<Date | undefined>(new Date(2025, 5, 18))

  return (
    <div>
      <Calendar
        mode='single'
        defaultMonth={date}
        selected={date}
        onSelect={setDate}
        disabled={{
          before: new Date(2025, 5, 12)
        }}
        className='rounded-lg border'
      />
      <p className='text-muted-foreground mt-3 text-center text-xs' role='region'>
        Disabled day calendar
      </p>
    </div>
  )
}

export default CalendarDisableDayDemo
```

---

## 7. Disabled Weekends

Calendar with weekends disabled.

```tsx
'use client'

import { useState } from 'react'

import { type DateRange } from 'react-day-picker'

import { Calendar } from '@/components/ui/calendar'

const CalendarDisabledWeekendsDemo = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(2025, 5, 17),
    to: new Date(2025, 5, 20)
  })

  return (
    <div>
      <Calendar
        mode='range'
        defaultMonth={dateRange?.from}
        selected={dateRange}
        onSelect={setDateRange}
        disabled={{ dayOfWeek: [0, 6] }}
        className='rounded-lg border'
        excludeDisabled
      />
      <p className='text-muted-foreground mt-3 text-center text-xs' role='region'>
        Disabled weekend calendar
      </p>
    </div>
  )
}

export default CalendarDisabledWeekendsDemo
```

---

## 8. Localized

Calendar with language selection (English/Hindi).

```tsx
'use client'

import { useState } from 'react'

import { type DateRange } from 'react-day-picker'
import { enUS, hi } from 'react-day-picker/locale'

import { Calendar } from '@/components/ui/calendar'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const localizedStrings = {
  en: {
    title: 'Book an appointment',
    description: 'Select the dates for your appointment'
  },
  hi: {
    title: 'अपॉइंटमेंट बुक करें',
    description: 'अपनी अपॉइंटमेंट के लिए तारीखें चुनें'
  }
} as const

export function CalendarLocalizationDemo() {
  const [locale, setLocale] = useState<keyof typeof localizedStrings>('en')

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(2025, 8, 9),
    to: new Date(2025, 8, 17)
  })

  return (
    <div>
      <Card className='w-2xs shadow-none'>
        <CardHeader className='border-b'>
          <CardTitle>{localizedStrings[locale].title}</CardTitle>
          <CardDescription>{localizedStrings[locale].description}</CardDescription>
          <CardAction>
            <Select value={locale} onValueChange={value => setLocale(value as keyof typeof localizedStrings)}>
              <SelectTrigger className='w-[100px]' aria-label='Select language'>
                <SelectValue placeholder='Language' />
              </SelectTrigger>
              <SelectContent align='end'>
                <SelectItem value='hi'>Hindi</SelectItem>
                <SelectItem value='en'>English</SelectItem>
              </SelectContent>
            </Select>
          </CardAction>
        </CardHeader>
        <CardContent>
          <Calendar
            mode='range'
            selected={dateRange}
            onSelect={setDateRange}
            defaultMonth={dateRange?.from}
            locale={locale === 'hi' ? hi : enUS}
            numerals={locale === 'hi' ? 'deva' : 'latn'}
            className='w-full bg-transparent p-0'
            buttonVariant='outline'
          />
        </CardContent>
      </Card>
      <p className='text-muted-foreground mt-3 text-center text-xs' role='region'>
        Localize calendar
      </p>
    </div>
  )
}

export default CalendarLocalizationDemo
```

---

## 9. Month/Year Dropdown

Calendar with dropdown navigation for month and year.

```tsx
'use client'

import { useState } from 'react'

import { Calendar } from '@/components/ui/calendar'

const CalendarWithMonthYearDropdownDemo = () => {
  const [date, setDate] = useState<Date | undefined>(new Date())

  return (
    <div>
      <Calendar
        mode='single'
        selected={date}
        onSelect={setDate}
        className='rounded-md border'
        captionLayout='dropdown'
      />
      <p className='text-muted-foreground mt-3 text-center text-xs' role='region'>
        Month and year dropdown calendar
      </p>
    </div>
  )
}

export default CalendarWithMonthYearDropdownDemo
```

---

## 10. Variable Size

Responsive calendar with different sizes for mobile/desktop.

```tsx
'use client'

import { useState } from 'react'

import { Calendar } from '@/components/ui/calendar'

const CalendarVariableSizeDemo = () => {
  const [date, setDate] = useState<Date | undefined>(new Date())

  return (
    <div>
      <Calendar
        mode='single'
        selected={date}
        onSelect={setDate}
        className='rounded-lg border [--cell-size:--spacing(11)] md:[--cell-size:--spacing(13)]'
      />
      <p className='text-muted-foreground mt-3 text-center text-xs' role='region'>
        Variable size calendar
      </p>
    </div>
  )
}

export default CalendarVariableSizeDemo
```

---

## 11. Event List

Calendar with events sidebar.

```tsx
'use client'

import { useState } from 'react'

import { formatDateRange } from 'little-date'
import { PlusIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardFooter } from '@/components/ui/card'

const events = [
  {
    title: 'Team Sync Meeting',
    from: '2025-06-12T09:00:00',
    to: '2025-06-12T10:00:00'
  },
  {
    title: 'Design Review',
    from: '2025-06-12T11:30:00',
    to: '2025-06-12T12:30:00'
  },
  {
    title: 'Client Presentation',
    from: '2025-06-12T14:00:00',
    to: '2025-06-12T15:00:00'
  }
]

const CalendarEventListDemo = () => {
  const [date, setDate] = useState<Date | undefined>(new Date())

  return (
    <div>
      <Card className='w-2xs py-4'>
        <CardContent className='px-4'>
          <Calendar mode='single' selected={date} onSelect={setDate} className='w-full bg-transparent p-0' required />
        </CardContent>
        <CardFooter className='flex flex-col items-start gap-3 border-t px-4 !pt-4'>
          <div className='flex w-full items-center justify-between px-1'>
            <div className='text-sm font-medium'>
              {date?.toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </div>
            <Button variant='ghost' size='icon' className='size-6' title='Add Event'>
              <PlusIcon />
              <span className='sr-only'>Add Event</span>
            </Button>
          </div>
          <div className='flex w-full flex-col gap-2'>
            {events.map(event => (
              <div
                key={event.title}
                className='bg-muted after:bg-primary/70 relative rounded-md p-2 pl-6 text-sm after:absolute after:inset-y-2 after:left-2 after:w-1 after:rounded-full'
              >
                <div className='font-medium'>{event.title}</div>
                <div className='text-muted-foreground text-xs'>
                  {formatDateRange(new Date(event.from), new Date(event.to))}
                </div>
              </div>
            ))}
          </div>
        </CardFooter>
      </Card>
      <p className='text-muted-foreground mt-3 text-center text-xs' role='region'>
        Calendar with event list
      </p>
    </div>
  )
}

export default CalendarEventListDemo
```

---

## 12. Multi Select

Select multiple individual dates.

```tsx
'use client'

import { useState } from 'react'

import { Calendar } from '@/components/ui/calendar'

const CalendarMultiSelectDemo = () => {
  const [dates, setDates] = useState<Date[]>([new Date(2025, 5, 12), new Date(2025, 5, 17)])

  return (
    <div>
      <Calendar mode='multiple' required selected={dates} onSelect={setDates} max={5} className='rounded-lg border' />
      <p className='text-muted-foreground mt-3 text-center text-xs' role='region'>
        Multi day select calendar
      </p>
    </div>
  )
}

export default CalendarMultiSelectDemo
```

---

## 13. Custom Day Style

Calendar with custom selection styling.

```tsx
'use client'

import { useState } from 'react'

import { Calendar } from '@/components/ui/calendar'

const CalendarCustomSelectDayDemo = () => {
  const [date, setDate] = useState<Date | undefined>(new Date())

  return (
    <div>
      <Calendar
        mode='single'
        selected={date}
        onSelect={setDate}
        className='rounded-md border'
        classNames={{
          day_button:
            'rounded-full! data-[selected-single=true]:bg-sky-600! data-[selected-single=true]:text-white! data-[selected-single=true]:dark:bg-sky-400! data-[selected-single=true]:group-data-[focused=true]/day:ring-sky-600/20 data-[selected-single=true]:dark:group-data-[focused=true]/day:ring-sky-400/40',
          today: 'rounded-full! bg-accent!'
        }}
      />
      <p className='text-muted-foreground mt-3 text-center text-xs' role='region'>
        Custom day select calendar
      </p>
    </div>
  )
}

export default CalendarCustomSelectDayDemo
```

---

## 14. Custom Range Style

Calendar with custom range selection styling.

```tsx
'use client'

import { useState } from 'react'

import { type DateRange } from 'react-day-picker'

import { Calendar } from '@/components/ui/calendar'

const CalendarCustomRangeSelectDemo = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(2025, 5, 4),
    to: new Date(2025, 5, 17)
  })

  return (
    <div>
      <Calendar
        mode='range'
        defaultMonth={dateRange?.from}
        selected={dateRange}
        onSelect={setDateRange}
        className='rounded-md border'
        classNames={{
          range_start: 'bg-sky-600/20 dark:bg-sky-400/10 rounded-l-full',
          range_end: 'bg-sky-600/20 dark:bg-sky-400/10 rounded-r-full',
          day_button:
            'data-[range-end=true]:rounded-full! data-[range-start=true]:rounded-full! data-[range-start=true]:bg-sky-600! data-[range-start=true]:text-white! data-[range-start=true]:dark:bg-sky-400! data-[range-start=true]:group-data-[focused=true]/day:ring-sky-600/20 data-[range-start=true]:dark:group-data-[focused=true]/day:ring-sky-400/40 data-[range-end=true]:bg-sky-600! data-[range-end=true]:text-white! data-[range-end=true]:dark:bg-sky-400! data-[range-end=true]:group-data-[focused=true]/day:ring-sky-600/20 data-[range-end=true]:dark:group-data-[focused=true]/day:ring-sky-400/40 data-[range-middle=true]:rounded-none data-[range-middle=true]:bg-sky-600/20 data-[range-middle=true]:dark:bg-sky-400/10 hover:rounded-full',
          today:
            'data-[selected=true]:rounded-l-none! rounded-full bg-accent! data-[selected=true]:bg-sky-600/20! dark:data-[selected=true]:bg-sky-400/10! [&_button[data-range-middle=true]]:bg-transparent!'
        }}
      />
      <p className='text-muted-foreground mt-3 text-center text-xs' role='region'>
        Custom range selection calendar
      </p>
    </div>
  )
}

export default CalendarCustomRangeSelectDemo
```

---

## 15. Right Side Navigation

Navigation buttons aligned to the right.

```tsx
'use client'

import { useState } from 'react'

import { Calendar } from '@/components/ui/calendar'

const CalendarRightYearMonthDemo = () => {
  const [date, setDate] = useState<Date | undefined>(new Date())

  return (
    <div>
      <Calendar
        mode='single'
        selected={date}
        defaultMonth={date}
        onSelect={setDate}
        className='rounded-md border'
        classNames={{
          month_caption: 'flex items-center h-8 justify-start',
          nav: 'flex justify-end absolute w-full items-center'
        }}
      />
      <p className='text-muted-foreground mt-4 text-center text-xs' role='region'>
        Right side month year navigation calendar
      </p>
    </div>
  )
}

export default CalendarRightYearMonthDemo
```

---

## 16. Left Side Navigation

Navigation buttons aligned to the left.

```tsx
'use client'

import { useState } from 'react'

import { Calendar } from '@/components/ui/calendar'

const CalendarLeftYearMonthDemo = () => {
  const [date, setDate] = useState<Date | undefined>(new Date())

  return (
    <div>
      <Calendar
        mode='single'
        selected={date}
        defaultMonth={date}
        onSelect={setDate}
        className='rounded-md border'
        classNames={{
          month_caption: 'flex items-center h-8 justify-end',
          nav: 'flex justify-start absolute w-full items-center'
        }}
      />
      <p className='text-muted-foreground mt-4 text-center text-xs' role='region'>
        Left side month year navigation calendar
      </p>
    </div>
  )
}

export default CalendarLeftYearMonthDemo
```

---

## 17. Week Numbers

Calendar displaying week numbers.

```tsx
'use client'

import { useState } from 'react'

import { Calendar } from '@/components/ui/calendar'

const CalendarWeekNumberDemo = () => {
  const [date, setDate] = useState<Date | undefined>(new Date())

  return (
    <div>
      <Calendar
        mode='single'
        defaultMonth={date}
        selected={date}
        onSelect={setDate}
        className='rounded-lg border shadow-sm'
        showWeekNumber
      />
      <p className='text-muted-foreground mt-4 text-center text-xs' role='region'>
        Week number calendar
      </p>
    </div>
  )
}

export default CalendarWeekNumberDemo
```

---

## 18. Today Button

Calendar with quick jump to today.

```tsx
'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const CalendarWithTodayMonthButtonDemo = () => {
  const [date, setDate] = useState<Date | undefined>(new Date(2025, 5, 15))
  const [month, setMonth] = useState<Date | undefined>(new Date())

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Book the show</CardTitle>
          <CardDescription>Find a date</CardDescription>
          <CardAction>
            <Button
              size='sm'
              variant='outline'
              onClick={() => {
                setMonth(new Date())
                setDate(new Date())
              }}
            >
              Today
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <Calendar
            mode='single'
            month={month}
            onMonthChange={setMonth}
            selected={date}
            onSelect={setDate}
            className='bg-transparent p-0'
          />
        </CardContent>
      </Card>
      <p className='text-muted-foreground mt-4 text-center text-xs' role='region'>
        Calendar with today button
      </p>
    </div>
  )
}

export default CalendarWithTodayMonthButtonDemo
```

---

## 19. Date Input

Calendar with text input for manual date entry.

```tsx
'use client'

import { useEffect, useId, useState } from 'react'

import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'

import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const CalendarWithDateInput = () => {
  const id = useId()
  const today = new Date()
  const [month, setMonth] = useState(today)
  const [date, setDate] = useState<Date | undefined>(today)
  const [inputValue, setInputValue] = useState('')

  const handleDayPickerSelect = (date: Date | undefined) => {
    if (!date) {
      setInputValue('')
      setDate(undefined)
    } else {
      setDate(date)
      setMonth(date)
      setInputValue(format(date, 'yyyy-MM-dd'))
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value

    setInputValue(value)

    if (value) {
      const parsedDate = new Date(value)

      setDate(parsedDate)
      setMonth(parsedDate)
    } else {
      setDate(undefined)
    }
  }

  useEffect(() => {
    setInputValue(format(today, 'yyyy-MM-dd'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div>
      <Card className='gap-5 py-5'>
        <CardHeader className='flex items-center border-b px-3 !pb-3'>
          <Label htmlFor={id} className='shrink-0 text-xs'>
            Enter date
          </Label>
          <div className='relative grow'>
            <Input
              id={id}
              type='date'
              value={inputValue}
              onChange={handleInputChange}
              className='peer appearance-none pl-9 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none'
              aria-label='Select date'
            />
            <div className='text-muted-foreground/80 pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center pl-3 peer-disabled:opacity-50'>
              <CalendarIcon size={16} aria-hidden='true' />
            </div>
          </div>
        </CardHeader>
        <CardContent className='px-5'>
          <Calendar
            mode='single'
            selected={date}
            onSelect={handleDayPickerSelect}
            month={month}
            onMonthChange={setMonth}
            className='bg-transparent p-0'
          />
        </CardContent>
      </Card>
      <p className='text-muted-foreground mt-4 text-center text-xs' role='region'>
        Calendar with date input
      </p>
    </div>
  )
}

export default CalendarWithDateInput
```

---

## 20. Time Input

Calendar with time picker input.

```tsx
'use client'

import { useId, useState } from 'react'

import { ClockIcon } from 'lucide-react'

import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const CalendarWithTimeInput = () => {
  const id = useId()
  const [date, setDate] = useState<Date | undefined>(new Date())

  return (
    <div>
      <Card className='gap-5 py-5'>
        <CardHeader className='flex items-center border-b px-3 !pb-3'>
          <Label htmlFor={id} className='text-xs'>
            Enter time
          </Label>
          <div className='relative grow'>
            <Input
              id={id}
              type='time'
              step='1'
              defaultValue='12:00:00'
              className='peer appearance-none pl-9 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none'
            />
            <div className='text-muted-foreground/80 pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center pl-3 peer-disabled:opacity-50'>
              <ClockIcon size={16} aria-hidden='true' />
            </div>
          </div>
        </CardHeader>
        <CardContent className='px-5'>
          <Calendar mode='single' selected={date} onSelect={setDate} className='bg-transparent p-0' />
        </CardContent>
      </Card>
      <p className='text-muted-foreground mt-4 text-center text-xs' role='region'>
        Calendar with time input
      </p>
    </div>
  )
}

export default CalendarWithTimeInput
```

---

## 21. Advanced Selection

Calendar with year/month picker overlay.

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'

import { eachMonthOfInterval, eachYearOfInterval, endOfYear, format, isAfter, isBefore, startOfYear } from 'date-fns'
import { ChevronDownIcon } from 'lucide-react'
import type { CaptionLabelProps, MonthGridProps } from 'react-day-picker'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ScrollArea } from '@/components/ui/scroll-area'

const CalendarWithAdvanceSelectionDemo = () => {
  const today = new Date()
  const [month, setMonth] = useState(today)
  const [date, setDate] = useState<Date | undefined>(today)
  const [isYearView, setIsYearView] = useState(false)
  const startDate = new Date(1980, 6)
  const endDate = new Date(2030, 6)

  const years = eachYearOfInterval({
    start: startOfYear(startDate),
    end: endOfYear(endDate)
  })

  return (
    <div>
      <Calendar
        mode='single'
        selected={date}
        onSelect={setDate}
        month={month}
        onMonthChange={setMonth}
        defaultMonth={new Date()}
        startMonth={startDate}
        endMonth={endDate}
        className='overflow-hidden rounded-md border p-2'
        classNames={{
          month_caption: 'ml-2.5 mr-20 justify-start',
          nav: 'flex absolute w-fit right-0 items-center'
        }}
        components={{
          CaptionLabel: (props: CaptionLabelProps) => (
            <CaptionLabel isYearView={isYearView} setIsYearView={setIsYearView} {...props} />
          ),
          MonthGrid: (props: MonthGridProps) => {
            return (
              <MonthGrid
                className={props.className}
                isYearView={isYearView}
                setIsYearView={setIsYearView}
                startDate={startDate}
                endDate={endDate}
                years={years}
                currentYear={month.getFullYear()}
                currentMonth={month.getMonth()}
                onMonthSelect={(selectedMonth: Date) => {
                  setMonth(selectedMonth)
                  setIsYearView(false)
                }}
              >
                {props.children}
              </MonthGrid>
            )
          }
        }}
      />
      <p className='text-muted-foreground mt-4 text-center text-xs' role='region'>
        Calendar with advance selection{' '}
        <a href='https://originui.com/calendar-date-picker' className='hover:text-primary underline' target='_blank'>
          Origin UI
        </a>
      </p>
    </div>
  )
}

function MonthGrid({
  className,
  children,
  isYearView,
  startDate,
  endDate,
  years,
  currentYear,
  currentMonth,
  onMonthSelect
}: {
  className?: string
  children: React.ReactNode
  isYearView: boolean
  setIsYearView: React.Dispatch<React.SetStateAction<boolean>>
  startDate: Date
  endDate: Date
  years: Date[]
  currentYear: number
  currentMonth: number
  onMonthSelect: (date: Date) => void
}) {
  const currentYearRef = useRef<HTMLDivElement>(null)
  const currentMonthButtonRef = useRef<HTMLButtonElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isYearView && currentYearRef.current && scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement

      if (viewport) {
        const yearTop = currentYearRef.current.offsetTop

        viewport.scrollTop = yearTop
      }

      setTimeout(() => {
        currentMonthButtonRef.current?.focus()
      }, 100)
    }
  }, [isYearView])

  return (
    <div className='relative'>
      <table className={className}>{children}</table>
      {isYearView && (
        <div className='bg-background absolute inset-0 z-20 -mx-2 -mb-2'>
          <ScrollArea ref={scrollAreaRef} className='h-full'>
            {years.map(year => {
              const months = eachMonthOfInterval({
                start: startOfYear(year),
                end: endOfYear(year)
              })

              const isCurrentYear = year.getFullYear() === currentYear

              return (
                <div key={year.getFullYear()} ref={isCurrentYear ? currentYearRef : undefined}>
                  <CollapsibleYear title={year.getFullYear().toString()} open={isCurrentYear}>
                    <div className='grid grid-cols-3 gap-2'>
                      {months.map(month => {
                        const isDisabled = isBefore(month, startDate) || isAfter(month, endDate)
                        const isCurrentMonth = month.getMonth() === currentMonth && year.getFullYear() === currentYear

                        return (
                          <Button
                            key={month.getTime()}
                            ref={isCurrentMonth ? currentMonthButtonRef : undefined}
                            variant={isCurrentMonth ? 'default' : 'outline'}
                            size='sm'
                            className='h-7'
                            disabled={isDisabled}
                            onClick={() => onMonthSelect(month)}
                          >
                            {format(month, 'MMM')}
                          </Button>
                        )
                      })}
                    </div>
                  </CollapsibleYear>
                </div>
              )
            })}
          </ScrollArea>
        </div>
      )}
    </div>
  )
}

function CaptionLabel({
  children,
  isYearView,
  setIsYearView
}: {
  isYearView: boolean
  setIsYearView: React.Dispatch<React.SetStateAction<boolean>>
} & React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <Button
      className='data-[state=open]:text-muted-foreground/80 -ms-2 flex items-center gap-2 text-sm font-medium hover:bg-transparent [&[data-state=open]>svg]:rotate-180'
      variant='ghost'
      size='sm'
      onClick={() => setIsYearView(prev => !prev)}
      data-state={isYearView ? 'open' : 'closed'}
    >
      {children}
      <ChevronDownIcon
        className='text-muted-foreground/80 shrink-0 transition-transform duration-200'
        aria-hidden='true'
      />
    </Button>
  )
}

function CollapsibleYear({ title, children, open }: { title: string; children: React.ReactNode; open?: boolean }) {
  return (
    <Collapsible className='border-t px-2 py-1.5' defaultOpen={open}>
      <CollapsibleTrigger asChild>
        <Button
          className='flex w-full justify-start gap-2 text-sm font-medium hover:bg-transparent [&[data-state=open]>svg]:rotate-180'
          variant='ghost'
          size='sm'
        >
          <ChevronDownIcon
            className='text-muted-foreground/80 shrink-0 transition-transform duration-200'
            aria-hidden='true'
          />
          {title}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className='data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden px-3 py-1 text-sm transition-all'>
        {children}
      </CollapsibleContent>
    </Collapsible>
  )
}

export default CalendarWithAdvanceSelectionDemo
```

---

## 22. Presets

Calendar with preset date buttons.

```tsx
'use client'

import { useState } from 'react'

import { addDays } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardFooter } from '@/components/ui/card'

const CalendarWithPresetsDemo = () => {
  const [date, setDate] = useState<Date | undefined>(new Date())

  return (
    <div>
      <Card className='max-w-xs py-4'>
        <CardContent className='px-4'>
          <Calendar
            mode='single'
            selected={date}
            onSelect={setDate}
            defaultMonth={date}
            className='w-full bg-transparent p-0'
          />
        </CardContent>
        <CardFooter className='flex flex-wrap gap-2 border-t px-4 !pt-4'>
          {[
            { label: 'Today', value: 0 },
            { label: 'Yesterday', value: -1 },
            { label: 'Tomorrow', value: 1 },
            { label: 'In 3 days', value: 3 },
            { label: 'In a week', value: 7 },
            { label: 'In 2 weeks', value: 14 }
          ].map(preset => (
            <Button
              key={preset.value}
              variant='outline'
              size='sm'
              className='flex-1'
              onClick={() => {
                const newDate = addDays(new Date(), preset.value)

                setDate(newDate)
              }}
            >
              {preset.label}
            </Button>
          ))}
        </CardFooter>
      </Card>
      <p className='text-muted-foreground mt-4 text-center text-xs' role='region'>
        Calendar with presets
      </p>
    </div>
  )
}

export default CalendarWithPresetsDemo
```

---

## 23. Range Presets

Calendar with range preset buttons.

```tsx
'use client'

import { useState } from 'react'

import {
  endOfMonth,
  endOfYear,
  startOfMonth,
  startOfYear,
  subDays,
  subMonths,
  subYears,
  addDays,
  addMonths
} from 'date-fns'
import type { DateRange } from 'react-day-picker'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardFooter } from '@/components/ui/card'

const CalendarWithRangePresetsDemo = () => {
  const today = new Date()

  const yesterday = {
    from: subDays(today, 1),
    to: subDays(today, 1)
  }

  const tomorrow = {
    from: today,
    to: addDays(today, 1)
  }

  const last7Days = {
    from: subDays(today, 6),
    to: today
  }

  const next7Days = {
    from: addDays(today, 1),
    to: addDays(today, 7)
  }

  const last30Days = {
    from: subDays(today, 29),
    to: today
  }

  const monthToDate = {
    from: startOfMonth(today),
    to: today
  }

  const lastMonth = {
    from: startOfMonth(subMonths(today, 1)),
    to: endOfMonth(subMonths(today, 1))
  }

  const nextMonth = {
    from: startOfMonth(addMonths(today, 1)),
    to: endOfMonth(addMonths(today, 1))
  }

  const yearToDate = {
    from: startOfYear(today),
    to: today
  }

  const lastYear = {
    from: startOfYear(subYears(today, 1)),
    to: endOfYear(subYears(today, 1))
  }

  const [month, setMonth] = useState(today)
  const [date, setDate] = useState<DateRange | undefined>(last7Days)

  return (
    <div>
      <Card className='max-w-xs py-4'>
        <CardContent className='px-4'>
          <Calendar
            mode='range'
            selected={date}
            onSelect={newDate => {
              if (newDate) {
                setDate(newDate)
              }
            }}
            month={month}
            onMonthChange={setMonth}
            className='w-full bg-transparent p-0'
          />
        </CardContent>
        <CardFooter className='flex flex-wrap gap-2 border-t px-4 !pt-4'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => {
              setDate({
                from: today,
                to: today
              })
              setMonth(today)
            }}
          >
            Today
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() => {
              setDate(yesterday)
              setMonth(yesterday.to)
            }}
          >
            Yesterday
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() => {
              setDate(tomorrow)
              setMonth(tomorrow.to)
            }}
          >
            Tomorrow
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() => {
              setDate(last7Days)
              setMonth(last7Days.to)
            }}
          >
            Last 7 days
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() => {
              setDate(next7Days)
              setMonth(next7Days.to)
            }}
          >
            Next 7 days
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() => {
              setDate(last30Days)
              setMonth(last30Days.to)
            }}
          >
            Last 30 days
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() => {
              setDate(monthToDate)
              setMonth(monthToDate.to)
            }}
          >
            Month to date
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() => {
              setDate(lastMonth)
              setMonth(lastMonth.to)
            }}
          >
            Last month
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() => {
              setDate(nextMonth)
              setMonth(nextMonth.to)
            }}
          >
            Next month
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() => {
              setDate(yearToDate)
              setMonth(yearToDate.to)
            }}
          >
            Year to date
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() => {
              setDate(lastYear)
              setMonth(lastYear.to)
            }}
          >
            Last year
          </Button>
        </CardFooter>
      </Card>
      <p className='text-muted-foreground mt-4 text-center text-xs' role='region'>
        Range calendar with presets
      </p>
    </div>
  )
}

export default CalendarWithRangePresetsDemo
```

---

## 24. Appointment Booking

Full appointment booking with date and time slots.

```tsx
'use client'

import { useState } from 'react'

import { CircleCheckIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'

const CalendarAppointmentBookingDemo = () => {
  const [date, setDate] = useState<Date | undefined>(new Date(2025, 5, 20))
  const [selectedTime, setSelectedTime] = useState<string | null>('10:00')

  const timeSlots = Array.from({ length: 37 }, (_, i) => {
    const totalMinutes = i * 15
    const hour = Math.floor(totalMinutes / 60) + 9
    const minute = totalMinutes % 60

    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
  })

  const bookedDates = Array.from({ length: 3 }, (_, i) => new Date(2025, 5, 17 + i))

  return (
    <div>
      <Card className='gap-0 p-0'>
        <CardHeader className='flex h-max justify-center border-b !p-4'>
          <CardTitle>Book your appointment</CardTitle>
        </CardHeader>
        <CardContent className='relative p-0 md:pr-48'>
          <div className='p-6'>
            <Calendar
              mode='single'
              selected={date}
              onSelect={setDate}
              defaultMonth={date}
              disabled={bookedDates}
              showOutsideDays={false}
              modifiers={{
                booked: bookedDates
              }}
              modifiersClassNames={{
                booked: '[&>button]:line-through opacity-100'
              }}
              className='bg-transparent p-0 [--cell-size:--spacing(10)]'
              formatters={{
                formatWeekdayName: date => {
                  return date.toLocaleString('en-US', { weekday: 'short' })
                }
              }}
            />
          </div>
          <div className='inset-y-0 right-0 flex w-full flex-col gap-4 border-t max-md:h-60 md:absolute md:w-48 md:border-t-0 md:border-l'>
            <ScrollArea className='h-full'>
              <div className='flex flex-col gap-2 p-6'>
                {timeSlots.map(time => (
                  <Button
                    key={time}
                    variant={selectedTime === time ? 'default' : 'outline'}
                    onClick={() => setSelectedTime(time)}
                    className='w-full shadow-none'
                  >
                    {time}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </CardContent>
        <CardFooter className='flex flex-col gap-4 border-t px-6 !py-5 md:flex-row'>
          <div className='flex items-center gap-2 text-sm'>
            {date && selectedTime ? (
              <>
                <CircleCheckIcon className='size-5 stroke-green-600 dark:stroke-green-400' />
                <span>
                  Your meeting is booked for{' '}
                  <span className='font-medium'>
                    {' '}
                    {date?.toLocaleDateString('en-US', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long'
                    })}{' '}
                  </span>
                  at <span className='font-medium'>{selectedTime}</span>.
                </span>
              </>
            ) : (
              <>Select a date and time for your meeting.</>
            )}
          </div>
          <Button disabled={!date || !selectedTime} className='w-full md:ml-auto md:w-auto' variant='outline'>
            Continue
          </Button>
        </CardFooter>
      </Card>
      <p className='text-muted-foreground mt-4 text-center text-xs' role='region'>
        Appointment calendar
      </p>
    </div>
  )
}

export default CalendarAppointmentBookingDemo
```

---

## 25. Pricing Calendar

Calendar displaying prices per day.

```tsx
'use client'

import { useState } from 'react'

import { Calendar, CalendarDayButton } from '@/components/ui/calendar'

function getPriceForDate(date: Date) {
  const seed = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate()

  const val = (seed * 9301 + 49297) % 233280

  return Math.floor(50 + (val / 233280) * 200)
}

const CalendarPricingDemo = () => {
  const [date, setDate] = useState<Date | undefined>(new Date())

  return (
    <div>
      <Calendar
        mode='single'
        selected={date}
        onSelect={setDate}
        showOutsideDays={false}
        className='rounded-lg border [--cell-size:--spacing(12)]'
        components={{
          DayButton: ({ children, modifiers, day, ...props }) => {
            const price = getPriceForDate(day.date)
            const isGreen = price < 100

            return (
              <CalendarDayButton day={day} modifiers={modifiers} {...props}>
                {children}
                {!modifiers.outside && (
                  <span className={isGreen ? 'text-green-600 dark:text-green-400' : ''}>${price}</span>
                )}
              </CalendarDayButton>
            )
          }
        }}
        disabled={{ before: new Date() }}
      />
      <p className='text-muted-foreground mt-4 text-center text-xs' role='region'>
        Calendar with pricing
      </p>
    </div>
  )
}

export default CalendarPricingDemo
```
