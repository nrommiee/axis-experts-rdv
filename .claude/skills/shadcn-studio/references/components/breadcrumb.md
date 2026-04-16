# Breadcrumb Components

8 variants from ShadcnStudio. Select based on use case.

## Quick Reference

| # | Style | Separator | Use Case |
|---|-------|-----------|----------|
| 1 | Default | Chevron | Standard navigation |
| 2 | Slash | / | Simple text path |
| 3 | Double Chevron | >> | With folder icons |
| 4 | Dot | • | Minimal separator |
| 5 | Tabs Outline | Chevron + badges | Highlighted steps |
| 6 | With Dropdown | / + dropdown | Expandable options |
| 7 | Icon Dropdown | >> + folder | Folder navigation |
| 8 | Outline Box | Chevron + border | Contained breadcrumb |

---

## 1. Default

Standard breadcrumb with chevron separator.

```tsx
import { HomeIcon } from 'lucide-react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb'

const BreadcrumbDemo = () => {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href='#'>
            <HomeIcon className='size-4' />
            <span className='sr-only'>Home</span>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href='#'>Documents</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Add Document</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}
```

---

## 2. Slash Separator

With slash separator and home icon + text.

```tsx
import { HomeIcon } from 'lucide-react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb'

const BreadcrumbSlashSeparatorDemo = () => {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href='#' className='flex items-center gap-2'>
            <HomeIcon className='size-4' />
            Home
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator> / </BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbLink href='#'>Documents</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator> / </BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbPage>Add Document</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}
```

---

## 3. Double Chevron with Icons

With folder/file icons and double chevron separator.

```tsx
import { ChevronsRightIcon, FileIcon, FolderIcon, HomeIcon } from 'lucide-react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb'

const BreadcrumbChevronsSeparatorDemo = () => {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href='#'>
            <HomeIcon className='size-4' />
            <span className='sr-only'>Home</span>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator>
          <ChevronsRightIcon />
        </BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbLink href='#' className='flex items-center gap-2'>
            <FolderIcon className='size-4' />
            Documents
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator>
          <ChevronsRightIcon />
        </BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbPage className='flex items-center gap-2'>
            <FileIcon className='inline size-4' />
            Add Document
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}
```

---

## 4. Dot Separator

Minimal dot separator.

```tsx
import { DotIcon } from 'lucide-react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb'

const BreadcrumbDotSeparatorDemo = () => {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href='#'>Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator>
          <DotIcon className='size-4' />
        </BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbLink href='#'>Documents</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator>
          <DotIcon className='size-4' />
        </BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbPage>Add Document</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}
```

---

## 5. Tabs Outline (Badges)

Badge-styled breadcrumb items.

```tsx
import { Badge } from '@/components/ui/badge'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb'

const BreadcrumbTabsOutlineDemo = () => {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href='#'>
            <Badge variant='outline' className='text-muted-foreground hover:text-foreground'>
              Home
            </Badge>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href='#'>
            <Badge variant='outline' className='text-muted-foreground hover:text-foreground'>
              Documents
            </Badge>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>
            <Badge variant='outline' className='border-primary text-primary'>
              Add Document
            </Badge>
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}
```

---

## 6. With Dropdown

Dropdown menu on current page.

```tsx
import { ChevronDownIcon, HomeIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

const BreadcrumbWithDropdownDemo = () => {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href='#'>
            <Badge variant='outline' className='text-muted-foreground hover:text-foreground'>
              <HomeIcon className='size-3' />
              Home
            </Badge>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator> / </BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbLink href='#'>
            <Badge variant='outline' className='text-muted-foreground hover:text-foreground'>
              Documents
            </Badge>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator> / </BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbPage>
            <DropdownMenu>
              <DropdownMenuTrigger className='flex items-center gap-1'>
                Add Document
                <ChevronDownIcon className='size-4' />
              </DropdownMenuTrigger>
              <DropdownMenuContent align='start'>
                <DropdownMenuItem>Documentation</DropdownMenuItem>
                <DropdownMenuItem>Themes</DropdownMenuItem>
                <DropdownMenuItem>GitHub</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}
```

---

## 7. Folder Icon Dropdown

Folder icon that opens/closes with dropdown.

```tsx
'use client'
import { useState } from 'react'
import { ChevronsRightIcon, FolderIcon, FolderOpenIcon, HomeIcon } from 'lucide-react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

const BreadcrumbWithIconDemo = () => {
  const [open, setOpen] = useState(false)
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href='#'>
            <HomeIcon className='size-4' />
            <span className='sr-only'>Home</span>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator>
          <ChevronsRightIcon />
        </BreadcrumbSeparator>
        <BreadcrumbItem className='flex items-center gap-2'>
          <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger className='flex cursor-pointer items-center gap-1'>
              {open ? <FolderOpenIcon className='size-4' /> : <FolderIcon className='size-4' />}
              <span className='sr-only'>{open ? 'Open' : 'Close'}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='start'>
              <DropdownMenuItem>Documentation</DropdownMenuItem>
              <DropdownMenuItem>Themes</DropdownMenuItem>
              <DropdownMenuItem>GitHub</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </BreadcrumbItem>
        <BreadcrumbSeparator>
          <ChevronsRightIcon />
        </BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbPage>Add Document</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}
```

---

## 8. Outline Box

Breadcrumb in bordered container.

```tsx
import { HomeIcon } from 'lucide-react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb'

const BreadcrumbOutlineDemo = () => {
  return (
    <Breadcrumb>
      <BreadcrumbList className='h-8 gap-2 rounded-md border px-3 text-sm'>
        <BreadcrumbItem>
          <BreadcrumbLink href='#'>
            <HomeIcon className='size-4' />
            <span className='sr-only'>Home</span>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href='#'>Documents</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Add Document</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}
```
