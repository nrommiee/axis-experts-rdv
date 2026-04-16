# Animated Select Components

2 variants from ShadcnStudio. Select based on use case.

## Quick Reference

| # | Style | Animation | Use Case |
|---|-------|-----------|----------|
| 1 | Slide-in | Slide from bottom + zoom | Standard dropdowns |
| 2 | Zoom-in | Scale from center | Centered focus effect |

---

## 1. Slide-in from Bottom

Select menu slides in from bottom with subtle zoom effect.

```tsx
import { useId } from 'react'

import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

const SelectMenuSlideInDemo = () => {
  const id = useId()

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Select menu slide-in from bottom</Label>
      <Select defaultValue='apple'>
        <SelectTrigger id={id} className='w-full'>
          <SelectValue placeholder='Select a fruit' />
        </SelectTrigger>
        <SelectContent className='data-[state=open]:slide-in-from-bottom-8 data-[state=open]:zoom-in-100 duration-400'>
          <SelectGroup>
            <SelectLabel>Fruits</SelectLabel>
            <SelectItem value='apple'>Apple</SelectItem>
            <SelectItem value='banana'>Banana</SelectItem>
            <SelectItem value='blueberry'>Blueberry</SelectItem>
            <SelectItem value='grapes'>Grapes</SelectItem>
            <SelectItem value='pineapple'>Pineapple</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}

export default SelectMenuSlideInDemo
```

---

## 2. Zoom-in

Select menu zooms in from center with scale animation.

```tsx
import { useId } from 'react'

import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

const SelectMenuZoomInDemo = () => {
  const id = useId()

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Select menu zoom-in</Label>
      <Select defaultValue='apple'>
        <SelectTrigger id={id} className='w-full'>
          <SelectValue placeholder='Select a fruit' />
        </SelectTrigger>
        <SelectContent className='data-[state=open]:!zoom-in-0 origin-center duration-400'>
          <SelectGroup>
            <SelectLabel>Fruits</SelectLabel>
            <SelectItem value='apple'>Apple</SelectItem>
            <SelectItem value='banana'>Banana</SelectItem>
            <SelectItem value='blueberry'>Blueberry</SelectItem>
            <SelectItem value='grapes'>Grapes</SelectItem>
            <SelectItem value='pineapple'>Pineapple</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}

export default SelectMenuZoomInDemo
```
