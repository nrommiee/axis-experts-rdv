# Textarea Components

21 variants (1-21) from ShadcnStudio. Textarea input components with various styles including labels, validation, icons, and special behaviors.

## Quick Reference

| # | Style | Dependencies | Use Case |
|---|-------|--------------|----------|
| 1 | Default | CSS only | Basic textarea |
| 2 | With Label | Label component | Labeled textarea |
| 3 | With Helper Text | CSS only | Textarea with description below |
| 4 | Helper Text Right | CSS only | Right-aligned helper text |
| 5 | Invalid | CSS only | Error state textarea |
| 6 | With Hint Text | CSS only | Optional field indicator |
| 7 | Required | CSS only | Required field indicator |
| 8 | Colored Border | CSS only | Custom focus ring color |
| 9 | Filled | CSS only | Filled/muted background |
| 10 | Sizes | CSS only | Small, medium, large variants |
| 11 | Start Icon | lucide-react | Icon at the start |
| 12 | End Icon | lucide-react | Icon at the end |
| 13 | Overlapping Label | CSS only | Label overlaps border |
| 14 | Floating Label | CSS only | Animated floating label |
| 15 | Inset Label | CSS only | Label inside textarea |
| 16 | With Button | Button component | Textarea with submit button |
| 17 | Auto Grow | CSS only | Expands with content |
| 18 | No Resize | CSS only | Disabled resize handle |
| 19 | Character Left | React state | Character counter |
| 20 | Read Only | CSS only | Non-editable textarea |
| 21 | Disabled | CSS only | Disabled state |

---

## 1. Default

Basic textarea component.

### Usage

```tsx
import { Textarea } from '@/components/ui/textarea'

const TextareaDemo = () => {
  return <Textarea placeholder='Type your message here.' className='w-full max-w-xs' />
}

export default TextareaDemo
```

---

## 2. With Label

Textarea with an associated label.

### Usage

```tsx
import { useId } from 'react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const TextareaWithLabelDemo = () => {
  const id = useId()

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Textarea with label</Label>
      <Textarea placeholder='Type your feedback here' id={id} />
    </div>
  )
}

export default TextareaWithLabelDemo
```

---

## 3. With Helper Text

Textarea with descriptive helper text below.

### Usage

```tsx
import { useId } from 'react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const TextareaWithHelperTextDemo = () => {
  const id = useId()

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Textarea with helper text</Label>
      <Textarea placeholder='Type your feedback here' id={id} />
      <p className='text-muted-foreground text-xs'>Your feedback is useful for us.</p>
    </div>
  )
}

export default TextareaWithHelperTextDemo
```

---

## 4. Helper Text Right

Textarea with right-aligned helper text.

### Usage

```tsx
import { useId } from 'react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const TextareaWithHelperTextRightDemo = () => {
  const id = useId()

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Textarea with right helper text</Label>
      <Textarea placeholder='Type your feedback here' id={id} />
      <p className='text-muted-foreground text-end text-xs'>Your feedback is useful for us.</p>
    </div>
  )
}

export default TextareaWithHelperTextRightDemo
```

---

## 5. Invalid

Textarea with error/invalid state.

### Usage

```tsx
import { useId } from 'react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const TextareaInvalidDemo = () => {
  const id = useId()

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Invalid Textarea</Label>
      <Textarea aria-invalid placeholder='Type your feedback here' id={id} />
      <p className='text-destructive text-xs'>Your feedback is useful for us.</p>
    </div>
  )
}

export default TextareaInvalidDemo
```

---

## 6. With Hint Text

Textarea with optional field indicator.

### Usage

```tsx
import { useId } from 'react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const TextareaWithHintTextDemo = () => {
  const id = useId()

  return (
    <div className='w-full max-w-xs space-y-2'>
      <div className='flex items-center justify-between gap-1'>
        <Label htmlFor={id}>Input with hint text</Label>
        <span className='text-muted-foreground text-xs'>Optional field</span>
      </div>
      <Textarea placeholder='Type your feedback here' id={id} />
    </div>
  )
}

export default TextareaWithHintTextDemo
```

---

## 7. Required

Textarea with required field indicator.

### Usage

```tsx
import { useId } from 'react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const TextareaRequiredDemo = () => {
  const id = useId()

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>
        Required textarea <span className='text-destructive'>*</span>
      </Label>
      <Textarea placeholder='Type your feedback here' id={id} required />
    </div>
  )
}

export default TextareaRequiredDemo
```

---

## 8. Colored Border

Textarea with custom colored focus ring.

### Usage

```tsx
import { useId } from 'react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const TextareaWithColoredBorderDemo = () => {
  const id = useId()

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Textarea with colored border and ring</Label>
      <Textarea
        placeholder='Type your feedback here'
        id={id}
        className='focus-visible:border-indigo-500 focus-visible:ring-indigo-500/20 dark:focus-visible:ring-indigo-500/40'
      />
    </div>
  )
}

export default TextareaWithColoredBorderDemo
```

---

## 9. Filled

Textarea with filled/muted background style.

### Usage

```tsx
import { useId } from 'react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const TextareaFilledDemo = () => {
  const id = useId()

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Filled Textarea</Label>
      <Textarea className='bg-muted border-transparent shadow-none' placeholder='Type your feedback here' id={id} />
    </div>
  )
}

export default TextareaFilledDemo
```

---

## 10. Sizes

Textarea size variants (small, medium, large).

### Usage

```tsx
import { Textarea } from '@/components/ui/textarea'

const TextareaSizesDemo = () => {
  return (
    <div className='w-full max-w-xs space-y-2'>
      <Textarea className='min-h-10 py-1.5' placeholder='Small Textarea' />
      <Textarea placeholder='Default(Medium) Textarea' />
      <Textarea className='min-h-20 py-2.5' placeholder='Large Textarea' />
    </div>
  )
}

export default TextareaSizesDemo
```

---

## 11. Start Icon

Textarea with icon at the start.

### Dependencies

```bash
npm install lucide-react
```

### Usage

```tsx
import { useId } from 'react'
import { HomeIcon } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

const TextareaStartIconDemo = () => {
  const id = useId()

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Textarea with start icon</Label>
      <div className='relative'>
        <div className='text-muted-foreground pointer-events-none absolute top-2.5 left-0 flex items-center justify-center pl-3 peer-disabled:opacity-50'>
          <HomeIcon className='size-4' />
          <span className='sr-only'>Address</span>
        </div>
        <Textarea id={id} placeholder='Address' className='peer pl-9' />
      </div>
    </div>
  )
}

export default TextareaStartIconDemo
```

---

## 12. End Icon

Textarea with icon at the end.

### Usage

```tsx
import { useId } from 'react'
import { HomeIcon } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

const TextareaEndIconDemo = () => {
  const id = useId()

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Textarea with end icon</Label>
      <div className='relative'>
        <div className='text-muted-foreground pointer-events-none absolute top-2.5 right-0 flex items-center justify-center pr-3 peer-disabled:opacity-50'>
          <HomeIcon className='size-4' />
          <span className='sr-only'>Address</span>
        </div>
        <Textarea id={id} placeholder='Address' className='peer pr-9' />
      </div>
    </div>
  )
}

export default TextareaEndIconDemo
```

---

## 13. Overlapping Label

Label that overlaps the textarea border.

### Usage

```tsx
import { useId } from 'react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const TextareaWithOverlappingLabelDemo = () => {
  const id = useId()

  return (
    <div className='relative w-full max-w-xs space-y-2'>
      <Label
        htmlFor={id}
        className='bg-background text-foreground absolute top-0 left-2 z-10 block -translate-y-1/2 px-1 text-xs font-medium group-has-disabled:opacity-50'
      >
        Textarea with overlapping label
      </Label>
      <Textarea id={id} className='!bg-background' />
    </div>
  )
}

export default TextareaWithOverlappingLabelDemo
```

---

## 14. Floating Label

Animated label that floats on focus.

### Usage

```tsx
import { useId } from 'react'
import { Textarea } from '@/components/ui/textarea'

const TextareaWithFloatingLabelDemo = () => {
  const id = useId()

  return (
    <div className='group relative w-full max-w-xs space-y-2'>
      <label
        htmlFor={id}
        className='origin-start text-muted-foreground/70 group-focus-within:text-foreground has-[+textarea:not(:placeholder-shown)]:text-foreground has-aria-invalid:ring-destructive/20 dark:has-aria-invalid:ring-destructive/40 has-aria-invalid:border-destructive absolute top-0 block translate-y-2 cursor-text px-2 text-sm transition-all group-focus-within:pointer-events-none group-focus-within:-translate-y-1/2 group-focus-within:cursor-default group-focus-within:text-xs group-focus-within:font-medium has-[+textarea:not(:placeholder-shown)]:pointer-events-none has-[+textarea:not(:placeholder-shown)]:-translate-y-1/2 has-[+textarea:not(:placeholder-shown)]:cursor-default has-[+textarea:not(:placeholder-shown)]:text-xs has-[+textarea:not(:placeholder-shown)]:font-medium'
      >
        <span className='bg-background inline-flex px-1'>Textarea with floating label</span>
      </label>
      <Textarea id={id} placeholder=' ' className='!bg-background' />
    </div>
  )
}

export default TextareaWithFloatingLabelDemo
```

---

## 15. Inset Label

Label positioned inside the textarea container.

### Usage

```tsx
import { useId } from 'react'

const TextareaWithInsetLabelDemo = () => {
  const id = useId()

  return (
    <div className='border-input bg-background focus-within:border-ring focus-within:ring-ring/50 has-aria-invalid:ring-destructive/20 dark:has-aria-invalid:ring-destructive/40 has-aria-invalid:border-destructive relative w-full max-w-xs rounded-md border shadow-xs transition-[color,box-shadow] outline-none focus-within:ring-[3px] has-disabled:pointer-events-none has-disabled:cursor-not-allowed has-disabled:opacity-50 has-[input:is(:disabled)]:*:pointer-events-none'>
      <label htmlFor={id} className='text-foreground block px-3 pt-1 text-xs font-medium'>
        Textarea with inset label
      </label>
      <textarea
        id={id}
        className='text-foreground placeholder:text-muted-foreground/70 flex min-h-14 w-full px-3 pb-2 text-sm focus-visible:outline-none'
      />
    </div>
  )
}

export default TextareaWithInsetLabelDemo
```

---

## 16. With Button

Textarea with a submit button below.

### Usage

```tsx
import { useId } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const TextareaWithButtonDemo = () => {
  const id = useId()

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Textarea with button</Label>
      <Textarea id={id} placeholder='Type your feedback here' />
      <Button size='sm'>Submit Feedback</Button>
    </div>
  )
}

export default TextareaWithButtonDemo
```

---

## 17. Auto Grow

Textarea that expands with content.

### Usage

```tsx
import { useId } from 'react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const TextareaAutoGrowDemo = () => {
  const id = useId()

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Auto growing textarea</Label>
      <Textarea
        id={id}
        placeholder='Type your feedback here'
        className='field-sizing-content max-h-30 min-h-0 resize-none py-1.75'
      />
    </div>
  )
}

export default TextareaAutoGrowDemo
```

---

## 18. No Resize

Textarea with disabled resize handle.

### Usage

```tsx
import { useId } from 'react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const TextareaNoResizeDemo = () => {
  const id = useId()

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>No resize textarea</Label>
      <Textarea id={id} placeholder='Type your feedback here' className='[resize:none]' />
    </div>
  )
}

export default TextareaNoResizeDemo
```

---

## 19. Character Left

Textarea with character counter showing remaining characters.

### Usage

```tsx
'use client'

import { useId, useState, type ChangeEvent } from 'react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const maxLength = 200
const initialValue = ''

const TextareaCharacterLeftDemo = () => {
  const [value, setValue] = useState(initialValue)
  const [characterCount, setCharacterCount] = useState(initialValue.length)

  const id = useId()

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    if (e.target.value.length <= maxLength) {
      setValue(e.target.value)
      setCharacterCount(e.target.value.length)
    }
  }

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Textarea with characters left</Label>
      <Textarea placeholder='Type your feedback here' value={value} maxLength={maxLength} onChange={handleChange} />
      <p className='text-muted-foreground text-xs'>
        <span className='tabular-nums'>{maxLength - characterCount}</span> characters left
      </p>
    </div>
  )
}

export default TextareaCharacterLeftDemo
```

---

## 20. Read Only

Non-editable textarea.

### Usage

```tsx
import { useId } from 'react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const TextareaReadOnlyDemo = () => {
  const id = useId()

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Read only textarea</Label>
      <Textarea
        className='read-only:bg-muted'
        defaultValue='Read only text'
        placeholder='Type your feedback here'
        id={id}
        readOnly
      />
    </div>
  )
}

export default TextareaReadOnlyDemo
```

---

## 21. Disabled

Disabled textarea state.

### Usage

```tsx
import { useId } from 'react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const TextareaDisabledDemo = () => {
  const id = useId()

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Disabled textarea</Label>
      <Textarea placeholder='Type your feedback here' disabled id={id} />
    </div>
  )
}

export default TextareaDisabledDemo
```
