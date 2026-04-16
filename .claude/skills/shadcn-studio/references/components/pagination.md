# Pagination Components

15 variants from ShadcnStudio. Select based on use case.

## Quick Reference

| # | Style | Features | Use Case |
|---|-------|----------|----------|
| 1 | Default | Text prev/next | Basic pagination |
| 2 | Icon Only | Chevron icons | Minimal style |
| 3 | Primary Button | Filled active state | Emphasized current |
| 4 | Secondary Button | Muted active state | Subtle highlight |
| 5 | Bordered | Divider lines | Grouped buttons |
| 6 | Rounded | Pill buttons | Soft UI |
| 7 | First/Last | 4 nav buttons | Full navigation |
| 8 | Ellipsis | Tooltip on ... | Many pages |
| 9 | Underline | Bottom border active | Tab-like style |
| 10 | Card | Container border | Grouped UI |
| 11 | Numberless | Prev/Next only | Simple nav |
| 12 | Numberless Text | Page X of Y | Minimal with info |
| 13 | Mini | Compact icons | Space constrained |
| 14 | With Select | Dropdown page jump | Quick navigation |
| 15 | Table | Full controls | Data tables |

---

## 1. Default

Basic pagination with text labels.

```tsx
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination'

const PaginationDemo = () => {
  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href='#' />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href='#'>1</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href='#' isActive>
            2
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href='#'>3</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href='#' />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

export default PaginationDemo
```

---

## 2. Icon Only

Chevron icons for prev/next.

```tsx
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'

import { Pagination, PaginationContent, PaginationItem, PaginationLink } from '@/components/ui/pagination'

const PaginationWithIconDemo = () => {
  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationLink href='#' aria-label='Go to previous page' size='icon'>
            <ChevronLeftIcon className='size-4' />
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href='#'>1</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href='#' isActive>
            2
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href='#'>3</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href='#' aria-label='Go to next page' size='icon'>
            <ChevronRightIcon className='size-4' />
          </PaginationLink>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

export default PaginationWithIconDemo
```

---

## 3. Primary Button

Primary filled active state.

```tsx
import { buttonVariants } from '@/components/ui/button'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination'

import { cn } from '@/lib/utils'

const PaginationWithPrimaryButtonDemo = () => {
  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href='#' />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href='#'>1</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink
            href='#'
            isActive
            className={cn(
              buttonVariants({
                variant: 'default',
                size: 'icon'
              }),
              'hover:!text-primary-foreground dark:bg-primary dark:text-primary-foreground dark:hover:text-primary-foreground dark:hover:bg-primary/90 !shadow-none dark:border-transparent'
            )}
          >
            2
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href='#'>3</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href='#' />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

export default PaginationWithPrimaryButtonDemo
```

---

## 4. Secondary Button

Secondary muted active state.

```tsx
import { buttonVariants } from '@/components/ui/button'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination'

import { cn } from '@/lib/utils'

const PaginationWithSecondaryButtonDemo = () => {
  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href='#' />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href='#'>1</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink
            href='#'
            isActive
            className={cn(
              'hover:!text-secondary-foreground !border-none !shadow-none',
              buttonVariants({
                variant: 'secondary',
                size: 'icon'
              })
            )}
          >
            2
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href='#'>3</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href='#' />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

export default PaginationWithSecondaryButtonDemo
```

---

## 5. Bordered

Grouped with divider lines.

```tsx
import { buttonVariants } from '@/components/ui/button'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination'

import { cn } from '@/lib/utils'

const pages = [1, 2, 3]

const BorderedPaginationDemo = () => {
  return (
    <Pagination>
      <PaginationContent className='gap-0 divide-x overflow-hidden rounded-lg border'>
        <PaginationItem>
          <PaginationPrevious href='#' className='rounded-none' />
        </PaginationItem>
        {pages.map(page => {
          const isActive = page === 2

          return (
            <PaginationItem key={page}>
              <PaginationLink
                href={`#${page}`}
                className={cn(
                  {
                    [buttonVariants({
                      variant: 'default',
                      className:
                        'hover:!text-primary-foreground dark:bg-primary dark:text-primary-foreground dark:hover:text-primary-foreground dark:hover:bg-primary/90 dark:border-transparent'
                    })]: isActive
                  },
                  'rounded-none border-none'
                )}
                isActive={isActive}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          )
        })}
        <PaginationItem>
          <PaginationNext href='#' className='rounded-none' />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

export default BorderedPaginationDemo
```

---

## 6. Rounded

Pill-shaped buttons.

```tsx
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination'

const pages = [1, 2, 3]

const PaginationWithRoundedButton = () => {
  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href='#' className='rounded-full' />
        </PaginationItem>
        {pages.map(page => (
          <PaginationItem key={page}>
            <PaginationLink href={`#${page}`} isActive={page === 2} className='rounded-full'>
              {page}
            </PaginationLink>
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext href='#' className='rounded-full' />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

export default PaginationWithRoundedButton
```

---

## 7. First/Last Navigation

Full navigation with first/last buttons.

```tsx
import { ChevronFirstIcon, ChevronLastIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'

import { Pagination, PaginationContent, PaginationItem, PaginationLink } from '@/components/ui/pagination'

const pages = [1, 2, 3]

const PaginationWithFirstAndLastPageButtonNavigation = () => {
  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationLink href='#' aria-label='Go to first page' size='icon' className='rounded-full'>
            <ChevronFirstIcon className='size-4' />
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href='#' aria-label='Go to previous page' size='icon' className='rounded-full'>
            <ChevronLeftIcon className='size-4' />
          </PaginationLink>
        </PaginationItem>
        {pages.map(page => (
          <PaginationItem key={page}>
            <PaginationLink href={`#${page}`} isActive={page === 2} className='rounded-full'>
              {page}
            </PaginationLink>
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationLink href='#' aria-label='Go to next page' size='icon' className='rounded-full'>
            <ChevronRightIcon className='size-4' />
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href='#' aria-label='Go to last page' size='icon' className='rounded-full'>
            <ChevronLastIcon className='size-4' />
          </PaginationLink>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

export default PaginationWithFirstAndLastPageButtonNavigation
```

---

## 8. Ellipsis

With tooltip on ellipsis.

```tsx
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const PaginationWithEllipsisDemo = () => {
  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href='#' />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href='#'>1</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href='#' isActive>
            2
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <Tooltip>
            <TooltipTrigger asChild>
              <PaginationEllipsis />
            </TooltipTrigger>
            <TooltipContent>
              <p>8 other pages</p>
            </TooltipContent>
          </Tooltip>
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href='#' />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

export default PaginationWithEllipsisDemo
```

---

## 9. Underline

Tab-like underline active style.

```tsx
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination'

const PaginationUnderlineDemo = () => {
  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href='#' className='rounded-none' />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink
            href='#'
            isActive
            className='border-primary! rounded-none border-0 border-b-2 bg-transparent! !shadow-none'
          >
            1
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href='#' className='rounded-none'>
            2
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href='#' className='rounded-none'>
            3
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href='#' className='rounded-none' />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

export default PaginationUnderlineDemo
```

---

## 10. Card

Container with border and shadow.

```tsx
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination'

const CardPaginationDemo = () => {
  return (
    <Pagination>
      <PaginationContent className='rounded-md border p-1 shadow-xs'>
        <PaginationItem>
          <PaginationPrevious href='#' />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href='#'>1</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href='#' isActive>
            2
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href='#'>3</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href='#' />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

export default CardPaginationDemo
```

---

## 11. Numberless

Previous/Next only.

```tsx
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination'

const NumberlessPaginationDemo = () => {
  return (
    <Pagination>
      <PaginationContent className='w-full justify-between'>
        <PaginationItem>
          <PaginationPrevious href='#' className='border' />
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href='#' className='border' />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

export default NumberlessPaginationDemo
```

---

## 12. Numberless with Text

Page X of Y display.

```tsx
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination'

const NumberlessPaginationWithTextDemo = () => {
  return (
    <Pagination>
      <PaginationContent className='w-full justify-between'>
        <PaginationItem>
          <PaginationPrevious href='#' className='border' />
        </PaginationItem>
        <PaginationItem>
          <p className='text-muted-foreground text-sm' aria-live='polite'>
            Page <span className='text-foreground'>2</span> of <span className='text-foreground'>5</span>
          </p>
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href='#' className='border' />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

export default NumberlessPaginationWithTextDemo
```

---

## 13. Mini

Compact icon-only pagination.

```tsx
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'

import { Pagination, PaginationContent, PaginationItem, PaginationLink } from '@/components/ui/pagination'

const MiniPagination = () => {
  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationLink href='#' aria-label='Go to previous page' size='icon'>
            <ChevronLeftIcon className='size-4' />
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <p className='text-muted-foreground text-sm' aria-live='polite'>
            Page <span className='text-foreground'>2</span> of <span className='text-foreground'>5</span>
          </p>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href='#' aria-label='Go to next page' size='icon'>
            <ChevronRightIcon className='size-4' />
          </PaginationLink>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

export default MiniPagination
```

---

## 14. With Select

Dropdown for quick page jump.

```tsx
import { ChevronFirstIcon, ChevronLastIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'

import { Pagination, PaginationContent, PaginationItem, PaginationLink } from '@/components/ui/pagination'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const PaginationWithSelectDemo = () => {
  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationLink href='#' aria-label='Go to first page' size='icon' className='rounded-full'>
            <ChevronFirstIcon className='size-4' />
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href='#' aria-label='Go to previous page' size='icon' className='rounded-full'>
            <ChevronLeftIcon className='size-4' />
          </PaginationLink>
        </PaginationItem>

        <PaginationItem>
          <Select defaultValue={String(1)} aria-label='Select page'>
            <SelectTrigger id='select-page' className='w-fit whitespace-nowrap' aria-label='Select page'>
              <SelectValue placeholder='Select page' />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 10 }, (_, i) => i + 1).map(page => (
                <SelectItem key={page} value={String(page)}>
                  Page {page}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </PaginationItem>

        <PaginationItem>
          <PaginationLink href='#' aria-label='Go to next page' size='icon' className='rounded-full'>
            <ChevronRightIcon className='size-4' />
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href='#' aria-label='Go to last page' size='icon' className='rounded-full'>
            <ChevronLastIcon className='size-4' />
          </PaginationLink>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

export default PaginationWithSelectDemo
```

---

## 15. Table Pagination

Full controls for data tables.

```tsx
import { useId } from 'react'

import { ChevronFirstIcon, ChevronLastIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'

import { Label } from '@/components/ui/label'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink
} from '@/components/ui/pagination'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const pages = [1, 2, 3]

const TablePaginationDemo = () => {
  const id = useId()

  return (
    <div className='flex w-full flex-wrap items-center justify-between gap-6 max-sm:justify-center'>
      <div className='flex shrink-0 items-center gap-3'>
        <Label htmlFor={id}>Rows per page</Label>
        <Select defaultValue='10'>
          <SelectTrigger id={id} className='w-fit whitespace-nowrap'>
            <SelectValue placeholder='Select number of results' />
          </SelectTrigger>
          <SelectContent className='[&_*[role=option]]:pr-8 [&_*[role=option]]:pl-2 [&_*[role=option]>span]:right-2 [&_*[role=option]>span]:left-auto'>
            <SelectItem value='10'>10</SelectItem>
            <SelectItem value='25'>25</SelectItem>
            <SelectItem value='50'>50</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className='text-muted-foreground flex grow items-center justify-end whitespace-nowrap max-sm:justify-center'>
        <p className='text-muted-foreground text-sm whitespace-nowrap' aria-live='polite'>
          Showing <span className='text-foreground'>1</span> to <span className='text-foreground'>10</span> of{' '}
          <span className='text-foreground'>100</span> products
        </p>
      </div>
      <Pagination className='w-fit max-sm:mx-0'>
        <PaginationContent>
          <PaginationItem>
            <PaginationLink href='#' aria-label='Go to first page' size='icon' className='rounded-full'>
              <ChevronFirstIcon className='size-4' />
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href='#' aria-label='Go to previous page' size='icon' className='rounded-full'>
              <ChevronLeftIcon className='size-4' />
            </PaginationLink>
          </PaginationItem>
          {pages.map(page => (
            <PaginationItem key={page}>
              <PaginationLink href={`#${page}`} isActive={page === 2} className='rounded-full'>
                {page}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            <Tooltip>
              <TooltipTrigger asChild>
                <PaginationEllipsis />
              </TooltipTrigger>
              <TooltipContent>
                <p>2 other pages</p>
              </TooltipContent>
            </Tooltip>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href='#' aria-label='Go to next page' size='icon' className='rounded-full'>
              <ChevronRightIcon className='size-4' />
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href='#' aria-label='Go to last page' size='icon' className='rounded-full'>
              <ChevronLastIcon className='size-4' />
            </PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}

export default TablePaginationDemo
```
