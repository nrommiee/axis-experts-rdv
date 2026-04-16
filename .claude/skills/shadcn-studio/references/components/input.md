# Input Components

46 variants from ShadcnStudio. Select based on use case.

## Quick Reference

| # | Style | Features | Use Case |
|---|-------|----------|----------|
| 1 | Default | Basic input | Simple text entry |
| 2 | With Label | Label + input | Standard forms |
| 3 | Required | Red asterisk | Mandatory fields |
| 4 | Disabled | Grayed out | Non-editable fields |
| 5 | Read-only | Non-editable value | Display only |
| 6 | Sizes | sm/md/lg heights | Different contexts |
| 7 | Default Value | Pre-filled | Edit existing data |
| 8 | Rounded | Full rounded corners | Soft UI style |
| 9 | Start Helper | Description below | Field guidance |
| 10 | End Helper | Right-aligned text | Compact guidance |
| 11 | Hint Text | Optional label | Non-required fields |
| 12 | Error State | Red border + message | Validation feedback |
| 13 | Colored Ring | Custom focus color | Brand theming |
| 14 | Start Icon | Icon left | Username, search |
| 15 | End Icon | Icon right | Email fields |
| 16 | Start Text Add-on | Inline prefix | URL prefix |
| 17 | End Text Add-on | Inline suffix | Domain suffix |
| 18 | Text Add-ons | Both prefix/suffix | Full URL input |
| 19 | Start Add-on | Bordered prefix | Protocol selection |
| 20 | End Add-on | Bordered suffix | Domain display |
| 21 | Add-ons | Both bordered | Complete URL |
| 22 | Filled | Background color | Subtle style |
| 23 | Overlapping Label | Label on border | Material design |
| 24 | Floating Label | Animated label | Modern forms |
| 25 | Inset Label | Label inside | Compact forms |
| 26 | Password | Show/hide toggle | Login forms |
| 27 | File | File upload | Document upload |
| 28 | Start Select | Dropdown prefix | Protocol picker |
| 29 | End Select | Dropdown suffix | Domain picker |
| 30 | With Button | Side button | Newsletter signup |
| 31 | End Inline Button | Icon button inside | Quick actions |
| 32 | Icon Button | Bordered icon btn | Download actions |
| 33 | End Button | Full button | Subscribe forms |
| 34 | Character Limit | Counter display | Bio, descriptions |
| 35 | Characters Left | Remaining count | Twitter-style |
| 36 | Clear Button | X to clear | Search fields |
| 37 | Search with Kbd | Keyboard shortcut | Command palette |
| 38 | Search Icon+Btn | Search + mic | Voice search |
| 39 | Search Loader | Loading spinner | Async search |
| 40 | Plus/Minus Buttons | Number stepper | Quantity selector |
| 41 | End Buttons | Right-side stepper | Compact stepper |
| 42 | Stacked Buttons | Vertical +/- | Classic stepper |
| 43 | Plus/Minus Rounded | Rounded stepper | Soft UI stepper |
| 44 | End Buttons Rounded | Rounded end btns | Compact rounded |
| 45 | Stacked Chevrons | Up/down arrows | Numeric input |
| 46 | Password Strength | Strength meter | Registration |

---

## 1. Default

Basic input without label.

```tsx
import { Input } from '@/components/ui/input'

const InputDemo = () => {
  return <Input type='email' placeholder='Email address' className='max-w-xs' />
}

export default InputDemo
```

---

## 2. With Label

Input with associated label.

```tsx
import { useId } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const InputLabelDemo = () => {
  const id = useId()

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Input with label</Label>
      <Input id={id} type='email' placeholder='Email address' />
    </div>
  )
}

export default InputLabelDemo
```

---

## 3. Required

Input with required indicator.

```tsx
import { useId } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const InputRequiredDemo = () => {
  const id = useId()

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id} className='gap-1'>
        Required input <span className='text-destructive'>*</span>
      </Label>
      <Input id={id} type='email' placeholder='Email address' required />
    </div>
  )
}

export default InputRequiredDemo
```

---

## 4. Disabled

Non-interactive input.

```tsx
import { useId } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const InputDisabledDemo = () => {
  const id = useId()

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Disabled input</Label>
      <Input id={id} type='email' placeholder='Email address' disabled />
    </div>
  )
}

export default InputDisabledDemo
```

---

## 5. Read-only

Display-only input with value.

```tsx
import { useId } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const InputReadOnlyDemo = () => {
  const id = useId()

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Read-only input</Label>
      <Input
        id={id}
        type='email'
        placeholder='Email address'
        defaultValue='example@xyz.com'
        className='read-only:bg-muted'
        readOnly
      />
    </div>
  )
}

export default InputReadOnlyDemo
```

---

## 6. Sizes

Different input heights.

```tsx
import { Input } from '@/components/ui/input'

const InputSizesDemo = () => {
  return (
    <div className='w-full max-w-xs space-y-2'>
      <Input type='text' placeholder='Small input' className='h-8' />
      <Input type='text' placeholder='Medium input' />
      <Input type='text' placeholder='Large input' className='h-10' />
    </div>
  )
}

export default InputSizesDemo
```

---

## 7. Default Value

Pre-filled input.

```tsx
import { useId } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const InputDefaultValueDemo = () => {
  const id = useId()

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Input with default value</Label>
      <Input id={id} type='email' placeholder='Email address' defaultValue='example@email.com' />
    </div>
  )
}

export default InputDefaultValueDemo
```

---

## 8. Rounded

Full rounded corners.

```tsx
import { useId } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const InputRoundedDemo = () => {
  const id = useId()

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Rounded input</Label>
      <Input id={id} type='email' placeholder='Email address' className='rounded-full' />
    </div>
  )
}

export default InputRoundedDemo
```

---

## 9. Start Helper Text

Helper text below input.

```tsx
import { useId } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const InputStartHelperTextDemo = () => {
  const id = useId()

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Input with start helper text</Label>
      <Input id={id} type='email' placeholder='Email address' />
      <p className='text-muted-foreground text-xs'>We&apos;ll never share your email with anyone else.</p>
    </div>
  )
}

export default InputStartHelperTextDemo
```

---

## 10. End Helper Text

Right-aligned helper text.

```tsx
import { useId } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const InputEndHelperTextDemo = () => {
  const id = useId()

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Input with end helper text</Label>
      <Input id={id} type='email' placeholder='Email address' />
      <p className='text-muted-foreground text-end text-xs'>We&apos;ll never share your email with anyone else.</p>
    </div>
  )
}

export default InputEndHelperTextDemo
```

---

## 11. Hint Text

Optional field indicator.

```tsx
import { useId } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const InputHintTextDemo = () => {
  const id = useId()

  return (
    <div className='w-full max-w-xs space-y-2'>
      <div className='flex items-center justify-between gap-1'>
        <Label htmlFor={id}>Input with hint text</Label>
        <span className='text-muted-foreground text-xs'>Optional field</span>
      </div>
      <Input id={id} type='email' placeholder='Email address' />
    </div>
  )
}

export default InputHintTextDemo
```

---

## 12. Error State

Input with error message.

```tsx
import { useId } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const InputErrorDemo = () => {
  const id = useId()

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Input with error</Label>
      <Input
        id={id}
        type='email'
        placeholder='Email address'
        className='peer'
        defaultValue='invalid@email.com'
        aria-invalid
      />
      <p className='text-muted-foreground peer-aria-invalid:text-destructive text-xs'>This email is invalid.</p>
    </div>
  )
}

export default InputErrorDemo
```

---

## 13. Colored Ring

Custom focus ring color.

```tsx
import { useId } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const InputColoredRingDemo = () => {
  const id = useId()

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Input with colored ring</Label>
      <Input
        id={id}
        type='email'
        placeholder='Email address'
        className='focus-visible:border-indigo-500 focus-visible:ring-indigo-500/20 dark:focus-visible:ring-indigo-500/40'
      />
    </div>
  )
}

export default InputColoredRingDemo
```

---

## 14. Start Icon

Icon on the left side.

```tsx
import { useId } from 'react'

import { UserIcon } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const InputStartIconDemo = () => {
  const id = useId()

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Input with start icon</Label>
      <div className='relative'>
        <div className='text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center pl-3 peer-disabled:opacity-50'>
          <UserIcon className='size-4' />
          <span className='sr-only'>User</span>
        </div>
        <Input id={id} type='text' placeholder='Username' className='peer pl-9' />
      </div>
    </div>
  )
}

export default InputStartIconDemo
```

---

## 15. End Icon

Icon on the right side.

```tsx
import { useId } from 'react'

import { MailIcon } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const InputEndIconDemo = () => {
  const id = useId()

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Input with end icon</Label>
      <div className='relative'>
        <Input id={id} type='email' placeholder='Email address' className='peer pr-9' />
        <div className='text-muted-foreground pointer-events-none absolute inset-y-0 right-0 flex items-center justify-center pr-3 peer-disabled:opacity-50'>
          <MailIcon className='size-4' />
          <span className='sr-only'>Email</span>
        </div>
      </div>
    </div>
  )
}

export default InputEndIconDemo
```

---

## 16. Start Text Add-on

Inline text prefix.

```tsx
import { useId } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const InputStartTextAddOnDemo = () => {
  const id = useId()

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Input with start text add-on</Label>
      <div className='relative'>
        <Input id={id} type='text' placeholder='shadcnstudio.com' className='peer pl-17' />
        <span className='pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center pl-3 text-sm peer-disabled:opacity-50'>
          https://
        </span>
      </div>
    </div>
  )
}

export default InputStartTextAddOnDemo
```

---

## 17. End Text Add-on

Inline text suffix.

```tsx
import { useId } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const InputEndTextAddOnDemo = () => {
  const id = useId()

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Input with end text add-on</Label>
      <div className='relative'>
        <Input id={id} type='text' placeholder='shadcnstudio' className='peer pr-13' />
        <span className='pointer-events-none absolute inset-y-0 right-0 flex items-center justify-center pr-3 text-sm peer-disabled:opacity-50'>
          .com
        </span>
      </div>
    </div>
  )
}

export default InputEndTextAddOnDemo
```

---

## 18. Text Add-ons

Both prefix and suffix inline.

```tsx
import { useId } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const InputTextAddOnsDemo = () => {
  const id = useId()

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Input with text add-ons</Label>
      <div className='relative'>
        <Input id={id} type='text' placeholder='shadcnstudio' className='peer pr-13 pl-17' />
        <span className='pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center pl-3 text-sm peer-disabled:opacity-50'>
          https://
        </span>
        <span className='pointer-events-none absolute inset-y-0 right-0 flex items-center justify-center pr-3 text-sm peer-disabled:opacity-50'>
          .com
        </span>
      </div>
    </div>
  )
}

export default InputTextAddOnsDemo
```

---

## 19. Start Add-on

Bordered prefix section.

```tsx
import { useId } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const InputStartAddOnDemo = () => {
  const id = useId()

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Input with start add-on</Label>
      <div className='flex rounded-md shadow-xs'>
        <span className='border-input bg-background text-muted-foreground -z-1 inline-flex items-center rounded-l-md border px-3 text-sm'>
          https://
        </span>
        <Input id={id} type='text' placeholder='shadcnstudio.com' className='-ms-px rounded-l-none shadow-none' />
      </div>
    </div>
  )
}

export default InputStartAddOnDemo
```

---

## 20. End Add-on

Bordered suffix section.

```tsx
import { useId } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const InputEndAddOnDemo = () => {
  const id = useId()

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Input with end add-on</Label>
      <div className='flex rounded-md shadow-xs'>
        <Input id={id} type='text' placeholder='shadcnstudio' className='-me-px rounded-r-none shadow-none' />
        <span className='border-input bg-background text-muted-foreground -z-1 inline-flex items-center rounded-r-md border px-3 text-sm'>
          .com
        </span>
      </div>
    </div>
  )
}

export default InputEndAddOnDemo
```

---

## 21. Add-ons

Both bordered prefix and suffix.

```tsx
import { useId } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const InputAddOnsDemo = () => {
  const id = useId()

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Input with add-ons</Label>
      <div className='flex rounded-md shadow-xs'>
        <span className='border-input bg-background text-muted-foreground -z-1 inline-flex items-center rounded-l-md border px-3 text-sm'>
          https://
        </span>
        <Input id={id} type='text' placeholder='shadcnstudio' className='-mx-px rounded-none shadow-none' />
        <span className='border-input bg-background text-muted-foreground -z-1 inline-flex items-center rounded-r-md border px-3 text-sm'>
          .com
        </span>
      </div>
    </div>
  )
}

export default InputAddOnsDemo
```

---

## 22. Filled

Input with background color.

```tsx
import { useId } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const InputFilledDemo = () => {
  const id = useId()

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Filled input</Label>
      <Input id={id} type='email' placeholder='Email address' className='bg-muted border-transparent shadow-none' />
    </div>
  )
}

export default InputFilledDemo
```

---

## 23. Overlapping Label

Label positioned on border.

```tsx
import { useId } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const InputOverlappingLabelDemo = () => {
  const id = useId()

  return (
    <div className='group relative w-full max-w-xs'>
      <Label
        htmlFor={id}
        className='bg-background text-foreground absolute top-0 left-2 z-1 block -translate-y-1/2 px-1 text-xs'
      >
        Input with overlapping label
      </Label>
      <Input id={id} type='email' placeholder='Email address' className='dark:bg-background h-10' />
    </div>
  )
}

export default InputOverlappingLabelDemo
```

---

## 24. Floating Label

Animated label on focus.

```tsx
import { useId } from 'react'

import { Input } from '@/components/ui/input'

const InputFloatingLabelDemo = () => {
  const id = useId()

  return (
    <div className='group relative w-full max-w-xs'>
      <label
        htmlFor={id}
        className='origin-start text-muted-foreground group-focus-within:text-foreground has-[+input:not(:placeholder-shown)]:text-foreground absolute top-1/2 block -translate-y-1/2 cursor-text px-2 text-sm transition-all group-focus-within:pointer-events-none group-focus-within:top-0 group-focus-within:cursor-default group-focus-within:text-xs group-focus-within:font-medium has-[+input:not(:placeholder-shown)]:pointer-events-none has-[+input:not(:placeholder-shown)]:top-0 has-[+input:not(:placeholder-shown)]:cursor-default has-[+input:not(:placeholder-shown)]:text-xs has-[+input:not(:placeholder-shown)]:font-medium'
      >
        <span className='bg-background inline-flex px-1'>Input with floating label</span>
      </label>
      <Input id={id} type='email' placeholder=' ' className='dark:bg-background' />
    </div>
  )
}

export default InputFloatingLabelDemo
```

---

## 25. Inset Label

Label inside input container.

```tsx
import { useId } from 'react'

const InputInsetLabelDemo = () => {
  const id = useId()

  return (
    <div className='border-input bg-background focus-within:border-ring focus-within:ring-ring/50 has-aria-invalid:ring-destructive/20 dark:has-aria-invalid:ring-destructive/40 has-aria-invalid:border-destructive relative w-full max-w-xs rounded-md border shadow-xs transition-[color,box-shadow] outline-none focus-within:ring-[3px] has-disabled:pointer-events-none has-disabled:cursor-not-allowed has-disabled:opacity-50 has-[input:is(:disabled)]:*:pointer-events-none'>
      <label htmlFor={id} className='text-foreground dark:bg-input/30 block px-3 pt-1 text-xs font-medium'>
        Input with inset label
      </label>
      <input
        id={id}
        type='email'
        placeholder='Email address'
        className='text-foreground placeholder:text-muted-foreground dark:bg-input/30 flex h-9 w-full bg-transparent px-3 pb-1 text-sm focus-visible:outline-none'
      />
    </div>
  )
}

export default InputInsetLabelDemo
```

---

## 26. Password

Password input with visibility toggle.

```tsx
'use client'

import { useId, useState } from 'react'

import { EyeIcon, EyeOffIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const InputPasswordDemo = () => {
  const [isVisible, setIsVisible] = useState(false)

  const id = useId()

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Password input</Label>
      <div className='relative'>
        <Input id={id} type={isVisible ? 'text' : 'password'} placeholder='Password' className='pr-9' />
        <Button
          variant='ghost'
          size='icon'
          onClick={() => setIsVisible(prevState => !prevState)}
          className='text-muted-foreground focus-visible:ring-ring/50 absolute inset-y-0 right-0 rounded-l-none hover:bg-transparent'
        >
          {isVisible ? <EyeOffIcon /> : <EyeIcon />}
          <span className='sr-only'>{isVisible ? 'Hide password' : 'Show password'}</span>
        </Button>
      </div>
    </div>
  )
}

export default InputPasswordDemo
```

---

## 27. File

File upload input.

```tsx
import { useId } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const InputFileDemo = () => {
  const id = useId()

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>File input</Label>
      <Input
        id={id}
        type='file'
        className='text-muted-foreground file:border-input file:text-foreground p-0 pr-3 italic file:mr-3 file:h-full file:border-0 file:border-r file:border-solid file:bg-transparent file:px-3 file:text-sm file:font-medium file:not-italic'
      />
    </div>
  )
}

export default InputFileDemo
```

---

## 28. Start Select

Select dropdown as prefix.

```tsx
import { useId } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const InputStartSelectDemo = () => {
  const id = useId()

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Input with start select</Label>
      <div className='flex rounded-md shadow-xs'>
        <Select defaultValue='https://'>
          <SelectTrigger id={id} className='rounded-r-none shadow-none focus-visible:z-1'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='https://' className='pr-2 [&_svg]:hidden'>
              https://
            </SelectItem>
            <SelectItem value='http://' className='pr-2 [&_svg]:hidden'>
              http://
            </SelectItem>
            <SelectItem value='ftp://' className='pr-2 [&_svg]:hidden'>
              ftp://
            </SelectItem>
            <SelectItem value='sftp://' className='pr-2 [&_svg]:hidden'>
              sftp://
            </SelectItem>
            <SelectItem value='ws://' className='pr-2 [&_svg]:hidden'>
              ws://
            </SelectItem>
            <SelectItem value='wss://' className='pr-2 [&_svg]:hidden'>
              wss://
            </SelectItem>
          </SelectContent>
        </Select>
        <Input id={id} type='text' placeholder='shadcnstudio.com' className='-ms-px rounded-l-none shadow-none' />
      </div>
    </div>
  )
}

export default InputStartSelectDemo
```

---

## 29. End Select

Select dropdown as suffix.

```tsx
import { useId } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const InputEndSelectDemo = () => {
  const id = useId()

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Input with end select</Label>
      <div className='flex rounded-md shadow-xs'>
        <Input
          id={id}
          type='text'
          placeholder='shadcnstudio'
          className='-me-px rounded-r-none shadow-none focus-visible:z-1'
        />
        <Select defaultValue='.com'>
          <SelectTrigger id={id} className='rounded-l-none shadow-none'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='.com' className='pr-2 [&_svg]:hidden'>
              .com
            </SelectItem>
            <SelectItem value='.org' className='pr-2 [&_svg]:hidden'>
              .org
            </SelectItem>
            <SelectItem value='.net' className='pr-2 [&_svg]:hidden'>
              .net
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

export default InputEndSelectDemo
```

---

## 30. With Button

Input with side button.

```tsx
import { useId } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const InputButtonDemo = () => {
  const id = useId()

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Input with button</Label>
      <div className='flex gap-2'>
        <Input id={id} type='email' placeholder='Email address' />
        <Button type='submit'>Subscribe</Button>
      </div>
    </div>
  )
}

export default InputButtonDemo
```

---

## 31. End Inline Button

Icon button inside input.

```tsx
import { useId } from 'react'

import { SendHorizonalIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const InputEndInlineButtonDemo = () => {
  const id = useId()

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Input with end inline button</Label>
      <div className='relative'>
        <Input id={id} type='email' placeholder='Email address' className='pr-9' />
        <Button
          variant='ghost'
          size='icon'
          className='text-muted-foreground focus-visible:ring-ring/50 absolute inset-y-0 right-0 rounded-l-none hover:bg-transparent'
        >
          <SendHorizonalIcon />
          <span className='sr-only'>Subscribe</span>
        </Button>
      </div>
    </div>
  )
}

export default InputEndInlineButtonDemo
```

---

## 32. Icon Button

Input with bordered icon button.

```tsx
import { useId } from 'react'

import { DownloadIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const InputIconButtonDemo = () => {
  const id = useId()

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Input with icon button</Label>
      <div className='flex rounded-md shadow-xs'>
        <Input
          id={id}
          type='email'
          placeholder='Email address'
          className='-me-px rounded-r-none shadow-none focus-visible:z-1'
        />
        <Button variant='outline' size='icon' className='rounded-l-none'>
          <DownloadIcon />
          <span className='sr-only'>Download</span>
        </Button>
      </div>
    </div>
  )
}

export default InputIconButtonDemo
```

---

## 33. End Button

Input with full button attached.

```tsx
import { useId } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const InputEndButtonDemo = () => {
  const id = useId()

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Input with end button</Label>
      <div className='flex rounded-md shadow-xs'>
        <Input
          id={id}
          type='email'
          placeholder='Email address'
          className='-me-px rounded-r-none shadow-none focus-visible:z-1'
        />
        <Button className='rounded-l-none'>Subscribe</Button>
      </div>
    </div>
  )
}

export default InputEndButtonDemo
```

---

## 34. Character Limit

Input with character counter.

```tsx
'use client'

import { useId, useState, type ChangeEvent } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const maxLength = 50
const initialValue = ''

const InputCharacterLimitDemo = () => {
  const [value, setValue] = useState(initialValue)
  const [characterCount, setCharacterCount] = useState(initialValue.length)

  const id = useId()

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.value.length <= maxLength) {
      setValue(e.target.value)
      setCharacterCount(e.target.value.length)
    }
  }

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Input with character limit</Label>
      <div className='relative'>
        <Input
          id={id}
          type='text'
          placeholder='Username'
          value={value}
          maxLength={maxLength}
          onChange={handleChange}
          className='peer pr-14'
        />
        <span className='text-muted-foreground pointer-events-none absolute inset-y-0 right-0 flex items-center justify-center pr-3 text-xs tabular-nums peer-disabled:opacity-50'>
          {characterCount}/{maxLength}
        </span>
      </div>
    </div>
  )
}

export default InputCharacterLimitDemo
```

---

## 35. Characters Left

Shows remaining characters.

```tsx
'use client'

import { useId, useState, type ChangeEvent } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const maxLength = 12
const initialValue = ''

const InputCharacterLeftDemo = () => {
  const [value, setValue] = useState(initialValue)
  const [characterCount, setCharacterCount] = useState(initialValue.length)

  const id = useId()

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.value.length <= maxLength) {
      setValue(e.target.value)
      setCharacterCount(e.target.value.length)
    }
  }

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Input with characters left</Label>
      <Input type='text' placeholder='Username' value={value} maxLength={maxLength} onChange={handleChange} />
      <p className='text-muted-foreground text-xs'>
        <span className='tabular-nums'>{maxLength - characterCount}</span> characters left
      </p>
    </div>
  )
}

export default InputCharacterLeftDemo
```

---

## 36. Clear Button

Input with clear functionality.

```tsx
'use client'

import { useId, useRef, useState } from 'react'

import { CircleXIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const InputClearDemo = () => {
  const [value, setValue] = useState('Click to clear')

  const inputRef = useRef<HTMLInputElement>(null)

  const id = useId()

  const handleClearInput = () => {
    setValue('')

    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Input with clear button</Label>
      <div className='relative'>
        <Input
          ref={inputRef}
          id={id}
          type='text'
          placeholder='Type something...'
          value={value}
          onChange={e => setValue(e.target.value)}
          className='pr-9'
        />
        {value && (
          <Button
            variant='ghost'
            size='icon'
            onClick={handleClearInput}
            className='text-muted-foreground focus-visible:ring-ring/50 absolute inset-y-0 right-0 rounded-l-none hover:bg-transparent'
          >
            <CircleXIcon />
            <span className='sr-only'>Clear input</span>
          </Button>
        )}
      </div>
    </div>
  )
}

export default InputClearDemo
```

---

## 37. Search with Kbd

Search input with keyboard shortcut.

```tsx
import { useId } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const InputSearchDemo = () => {
  const id = useId()

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Search input with &lt;kbd&gt;</Label>
      <div className='relative'>
        <Input
          id={id}
          type='search'
          placeholder='Search...'
          className='peer pr-11 [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none [&::-webkit-search-results-button]:appearance-none [&::-webkit-search-results-decoration]:appearance-none'
        />
        <div className='pointer-events-none absolute inset-y-0 right-0 flex items-center justify-center pr-3 peer-disabled:opacity-50'>
          <kbd className='text-muted-foreground bg-accent inline-flex h-5 max-h-full items-center rounded border px-1 font-[inherit] text-[0.625rem] font-medium'>
            ⌘k
          </kbd>
        </div>
      </div>
    </div>
  )
}

export default InputSearchDemo
```

---

## 38. Search Icon + Button

Search with icon and microphone button.

```tsx
import { useId } from 'react'

import { MicIcon, SearchIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const InputSearchIconDemo = () => {
  const id = useId()

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Search input with icon and button</Label>
      <div className='relative'>
        <div className='text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center pl-3 peer-disabled:opacity-50'>
          <SearchIcon className='size-4' />
          <span className='sr-only'>Search</span>
        </div>
        <Input
          id={id}
          type='search'
          placeholder='Search...'
          className='peer px-9 [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none [&::-webkit-search-results-button]:appearance-none [&::-webkit-search-results-decoration]:appearance-none'
        />
        <Button
          variant='ghost'
          size='icon'
          className='text-muted-foreground focus-visible:ring-ring/50 absolute inset-y-0 right-0 rounded-l-none hover:bg-transparent'
        >
          <MicIcon />
          <span className='sr-only'>Press to speak</span>
        </Button>
      </div>
    </div>
  )
}

export default InputSearchIconDemo
```

---

## 39. Search Loader

Search with loading indicator.

```tsx
'use client'

import { useEffect, useId, useState } from 'react'

import { LoaderCircleIcon, SearchIcon } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const InputSearchLoaderDemo = () => {
  const [value, setValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const id = useId()

  useEffect(() => {
    if (value) {
      setIsLoading(true)

      const timer = setTimeout(() => {
        setIsLoading(false)
      }, 500)

      return () => clearTimeout(timer)
    }

    setIsLoading(false)
  }, [value])

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Search input with loader</Label>
      <div className='relative'>
        <div className='text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center pl-3 peer-disabled:opacity-50'>
          <SearchIcon className='size-4' />
          <span className='sr-only'>Search</span>
        </div>
        <Input
          id={id}
          type='search'
          placeholder='Search...'
          value={value}
          onChange={e => setValue(e.target.value)}
          className='peer px-9 [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none [&::-webkit-search-results-button]:appearance-none [&::-webkit-search-results-decoration]:appearance-none'
        />
        {isLoading && (
          <div className='text-muted-foreground pointer-events-none absolute inset-y-0 right-0 flex items-center justify-center pr-3 peer-disabled:opacity-50'>
            <LoaderCircleIcon className='size-4 animate-spin' />
            <span className='sr-only'>Loading...</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default InputSearchLoaderDemo
```

---

## 40. Plus/Minus Buttons

Number input with side steppers.

```tsx
'use client'

import { MinusIcon, PlusIcon } from 'lucide-react'

import { Button, Group, Input, Label, NumberField } from 'react-aria-components'

const InputWithPlusMinusButtonsDemo = () => {
  return (
    <NumberField defaultValue={1024} minValue={0} className='w-full max-w-xs space-y-2'>
      <Label className='flex items-center gap-2 text-sm leading-none font-medium select-none'>
        Input with plus/minus buttons
      </Label>
      <Group className='dark:bg-input/30 border-input data-focus-within:border-ring data-focus-within:ring-ring/50 data-focus-within:has-aria-invalid:ring-destructive/20 dark:data-focus-within:has-aria-invalid:ring-destructive/40 data-focus-within:has-aria-invalid:border-destructive relative inline-flex h-9 w-full min-w-0 items-center overflow-hidden rounded-md border bg-transparent text-base whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none data-disabled:pointer-events-none data-disabled:cursor-not-allowed data-disabled:opacity-50 data-focus-within:ring-[3px] md:text-sm'>
        <Button
          slot='decrement'
          className='border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground -ms-px flex aspect-square h-[inherit] items-center justify-center rounded-l-md border text-sm transition-[color,box-shadow] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50'
        >
          <MinusIcon />
          <span className='sr-only'>Decrement</span>
        </Button>
        <Input className='selection:bg-primary selection:text-primary-foreground w-full grow px-3 py-2 text-center tabular-nums outline-none' />
        <Button
          slot='increment'
          className='border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground -me-px flex aspect-square h-[inherit] items-center justify-center rounded-r-md border text-sm transition-[color,box-shadow] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50'
        >
          <PlusIcon />
          <span className='sr-only'>Increment</span>
        </Button>
      </Group>
      <p className='text-muted-foreground text-xs'>
        Built with{' '}
        <a
          className='hover:text-foreground underline'
          href='https://react-spectrum.adobe.com/react-aria/NumberField.html'
          target='_blank'
          rel='noopener noreferrer'
        >
          React Aria
        </a>
      </p>
    </NumberField>
  )
}

export default InputWithPlusMinusButtonsDemo
```

---

## 41. End Buttons

Number input with right-side steppers.

```tsx
'use client'

import { MinusIcon, PlusIcon } from 'lucide-react'

import { Button, Group, Input, Label, NumberField } from 'react-aria-components'

const InputWithEndButtonsDemo = () => {
  return (
    <NumberField defaultValue={1024} minValue={0} className='w-full max-w-xs space-y-2'>
      <Label className='flex items-center gap-2 text-sm leading-none font-medium select-none'>
        Input with end buttons
      </Label>
      <Group className='dark:bg-input/30 border-input data-focus-within:border-ring data-focus-within:ring-ring/50 data-focus-within:has-aria-invalid:ring-destructive/20 dark:data-focus-within:has-aria-invalid:ring-destructive/40 data-focus-within:has-aria-invalid:border-destructive relative inline-flex h-9 w-full min-w-0 items-center overflow-hidden rounded-md border bg-transparent text-base whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none data-disabled:pointer-events-none data-disabled:cursor-not-allowed data-disabled:opacity-50 data-focus-within:ring-[3px] md:text-sm'>
        <Input className='selection:bg-primary selection:text-primary-foreground w-full grow px-3 py-2 text-center tabular-nums outline-none' />
        <Button
          slot='decrement'
          className='border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground -me-px flex aspect-square h-[inherit] items-center justify-center border text-sm transition-[color,box-shadow] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50'
        >
          <MinusIcon />
          <span className='sr-only'>Decrement</span>
        </Button>
        <Button
          slot='increment'
          className='border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground -me-px flex aspect-square h-[inherit] items-center justify-center rounded-r-md border text-sm transition-[color,box-shadow] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50'
        >
          <PlusIcon />
          <span className='sr-only'>Increment</span>
        </Button>
      </Group>
      <p className='text-muted-foreground text-xs'>
        Built with{' '}
        <a
          className='hover:text-foreground underline'
          href='https://react-spectrum.adobe.com/react-aria/NumberField.html'
          target='_blank'
          rel='noopener noreferrer'
        >
          React Aria
        </a>
      </p>
    </NumberField>
  )
}

export default InputWithEndButtonsDemo
```

---

## 42. Stacked Buttons

Vertical +/- buttons.

```tsx
'use client'

import { MinusIcon, PlusIcon } from 'lucide-react'

import { Button, Group, Input, Label, NumberField } from 'react-aria-components'

const InputWithStackedButtonsDemo = () => {
  return (
    <NumberField defaultValue={1024} minValue={0} className='w-full max-w-xs space-y-2'>
      <Label className='flex items-center gap-2 text-sm leading-none font-medium select-none'>
        Input with stacked buttons
      </Label>
      <Group className='dark:bg-input/30 border-input data-focus-within:border-ring data-focus-within:ring-ring/50 data-focus-within:has-aria-invalid:ring-destructive/20 dark:data-focus-within:has-aria-invalid:ring-destructive/40 data-focus-within:has-aria-invalid:border-destructive relative inline-flex h-9 w-full min-w-0 items-center overflow-hidden rounded-md border bg-transparent text-base whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none data-disabled:pointer-events-none data-disabled:cursor-not-allowed data-disabled:opacity-50 data-focus-within:ring-[3px] md:text-sm'>
        <Input className='selection:bg-primary selection:text-primary-foreground w-full grow px-3 py-2 text-center tabular-nums outline-none' />
        <div className='flex h-[calc(100%+2px)] flex-col'>
          <Button
            slot='increment'
            className='border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground -me-px flex h-1/2 w-6 flex-1 items-center justify-center border text-sm transition-[color,box-shadow] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50'
          >
            <PlusIcon className='size-3' />
            <span className='sr-only'>Increment</span>
          </Button>
          <Button
            slot='decrement'
            className='border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground -me-px -mt-px flex h-1/2 w-6 flex-1 items-center justify-center border text-sm transition-[color,box-shadow] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50'
          >
            <MinusIcon className='size-3' />
            <span className='sr-only'>Decrement</span>
          </Button>
        </div>
      </Group>
      <p className='text-muted-foreground text-xs'>
        Built with{' '}
        <a
          className='hover:text-foreground underline'
          href='https://react-spectrum.adobe.com/react-aria/NumberField.html'
          target='_blank'
          rel='noopener noreferrer'
        >
          React Aria
        </a>
      </p>
    </NumberField>
  )
}

export default InputWithStackedButtonsDemo
```

---

## 43. Plus/Minus Buttons (Rounded)

Rounded number stepper buttons.

```tsx
'use client'

import { MinusIcon, PlusIcon } from 'lucide-react'

import { Button, Group, Input, Label, NumberField } from 'react-aria-components'

const InputWithPlusMinusButtonsRoundedDemo = () => {
  return (
    <NumberField defaultValue={1024} minValue={0} className='w-full max-w-xs space-y-2'>
      <Label className='flex items-center gap-2 text-sm leading-none font-medium select-none'>
        Input with plus/minus buttons (rounded)
      </Label>
      <Group className='dark:bg-input/30 border-input data-focus-within:border-ring data-focus-within:ring-ring/50 data-focus-within:has-aria-invalid:ring-destructive/20 dark:data-focus-within:has-aria-invalid:ring-destructive/40 data-focus-within:has-aria-invalid:border-destructive relative inline-flex h-9 w-full min-w-0 items-center overflow-hidden rounded-md border bg-transparent text-base whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none data-disabled:pointer-events-none data-disabled:cursor-not-allowed data-disabled:opacity-50 data-focus-within:ring-[3px] md:text-sm'>
        <Button
          slot='decrement'
          className='border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground ml-2 flex aspect-square h-5 items-center justify-center rounded-sm border text-sm transition-[color,box-shadow] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50'
        >
          <MinusIcon className='size-3' />
          <span className='sr-only'>Decrement</span>
        </Button>
        <Input className='selection:bg-primary selection:text-primary-foreground w-full grow px-3 py-2 text-center tabular-nums outline-none' />
        <Button
          slot='increment'
          className='border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground mr-2 flex aspect-square h-5 items-center justify-center rounded-sm border text-sm transition-[color,box-shadow] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50'
        >
          <PlusIcon className='size-3' />
          <span className='sr-only'>Increment</span>
        </Button>
      </Group>
      <p className='text-muted-foreground text-xs'>
        Built with{' '}
        <a
          className='hover:text-foreground underline'
          href='https://react-spectrum.adobe.com/react-aria/NumberField.html'
          target='_blank'
          rel='noopener noreferrer'
        >
          React Aria
        </a>
      </p>
    </NumberField>
  )
}

export default InputWithPlusMinusButtonsRoundedDemo
```

---

## 44. End Buttons (Rounded)

Rounded end stepper buttons.

```tsx
'use client'

import { MinusIcon, PlusIcon } from 'lucide-react'

import { Button, Group, Input, Label, NumberField } from 'react-aria-components'

const InputWithEndButtonsRoundedDemo = () => {
  return (
    <NumberField defaultValue={1024} minValue={0} className='w-full max-w-xs space-y-2'>
      <Label className='flex items-center gap-2 text-sm leading-none font-medium select-none'>
        Input with end buttons (rounded)
      </Label>
      <Group className='dark:bg-input/30 border-input data-focus-within:border-ring data-focus-within:ring-ring/50 data-focus-within:has-aria-invalid:ring-destructive/20 dark:data-focus-within:has-aria-invalid:ring-destructive/40 data-focus-within:has-aria-invalid:border-destructive relative inline-flex h-9 w-full min-w-0 items-center overflow-hidden rounded-md border bg-transparent text-base whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none data-disabled:pointer-events-none data-disabled:cursor-not-allowed data-disabled:opacity-50 data-focus-within:ring-[3px] md:text-sm'>
        <Input className='selection:bg-primary selection:text-primary-foreground w-full grow px-3 py-2 text-center tabular-nums outline-none' />
        <Button
          slot='decrement'
          className='border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground mr-1.5 flex aspect-square h-5 items-center justify-center rounded-sm border text-sm transition-[color,box-shadow] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50'
        >
          <MinusIcon className='size-3' />
          <span className='sr-only'>Decrement</span>
        </Button>
        <Button
          slot='increment'
          className='border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground mr-2 flex aspect-square h-5 items-center justify-center rounded-sm border text-sm transition-[color,box-shadow] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50'
        >
          <PlusIcon className='size-3' />
          <span className='sr-only'>Increment</span>
        </Button>
      </Group>
      <p className='text-muted-foreground text-xs'>
        Built with{' '}
        <a
          className='hover:text-foreground underline'
          href='https://react-spectrum.adobe.com/react-aria/NumberField.html'
          target='_blank'
          rel='noopener noreferrer'
        >
          React Aria
        </a>
      </p>
    </NumberField>
  )
}

export default InputWithEndButtonsRoundedDemo
```

---

## 45. Stacked Chevrons

Up/down chevron buttons.

```tsx
'use client'

import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react'

import { Button, Group, Input, Label, NumberField } from 'react-aria-components'

const InputWithStackedChevronsDemo = () => {
  return (
    <NumberField defaultValue={1024} minValue={0} className='w-full max-w-xs space-y-2'>
      <Label className='flex items-center gap-2 text-sm leading-none font-medium select-none'>
        Input with stacked chevrons
      </Label>
      <Group className='dark:bg-input/30 border-input data-focus-within:border-ring data-focus-within:ring-ring/50 data-focus-within:has-aria-invalid:ring-destructive/20 dark:data-focus-within:has-aria-invalid:ring-destructive/40 data-focus-within:has-aria-invalid:border-destructive relative inline-flex h-9 w-full min-w-0 items-center overflow-hidden rounded-md border bg-transparent text-base whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none data-disabled:pointer-events-none data-disabled:cursor-not-allowed data-disabled:opacity-50 data-focus-within:ring-[3px] md:text-sm'>
        <Input className='selection:bg-primary selection:text-primary-foreground w-full grow px-3 py-2 text-center tabular-nums outline-none' />
        <div className='flex h-[calc(100%+2px)] flex-col'>
          <Button
            slot='increment'
            className='border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground -me-px flex h-1/2 w-6 flex-1 items-center justify-center border text-sm transition-[color,box-shadow] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50'
          >
            <ChevronUpIcon className='size-3' />
            <span className='sr-only'>Increment</span>
          </Button>
          <Button
            slot='decrement'
            className='border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground -me-px -mt-px flex h-1/2 w-6 flex-1 items-center justify-center border text-sm transition-[color,box-shadow] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50'
          >
            <ChevronDownIcon className='size-3' />
            <span className='sr-only'>Decrement</span>
          </Button>
        </div>
      </Group>
      <p className='text-muted-foreground text-xs'>
        Built with{' '}
        <a
          className='hover:text-foreground underline'
          href='https://react-spectrum.adobe.com/react-aria/NumberField.html'
          target='_blank'
          rel='noopener noreferrer'
        >
          React Aria
        </a>
      </p>
    </NumberField>
  )
}

export default InputWithStackedChevronsDemo
```

---

## 46. Password Strength

Password with strength indicator.

```tsx
'use client'

import { useId, useMemo, useState } from 'react'

import { CheckIcon, EyeIcon, EyeOffIcon, XIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { cn } from '@/lib/utils'

const requirements = [
  { regex: /.{12,}/, text: 'At least 12 characters' },
  { regex: /[a-z]/, text: 'At least 1 lowercase letter' },
  { regex: /[A-Z]/, text: 'At least 1 uppercase letter' },
  { regex: /[0-9]/, text: 'At least 1 number' },
  {
    regex: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/,
    text: 'At least 1 special character'
  }
]

const InputPasswordStrengthDemo = () => {
  const [password, setPassword] = useState('')
  const [isVisible, setIsVisible] = useState(false)

  const id = useId()

  const toggleVisibility = () => setIsVisible(prevState => !prevState)

  const strength = requirements.map(req => ({
    met: req.regex.test(password),
    text: req.text
  }))

  const strengthScore = useMemo(() => {
    return strength.filter(req => req.met).length
  }, [strength])

  const getColor = (score: number) => {
    if (score === 0) return 'bg-border'
    if (score <= 1) return 'bg-destructive'
    if (score <= 2) return 'bg-orange-500 '
    if (score <= 3) return 'bg-amber-500'
    if (score === 4) return 'bg-yellow-400'

    return 'bg-green-500'
  }

  const getText = (score: number) => {
    if (score === 0) return 'Enter a password'
    if (score <= 2) return 'Weak password'
    if (score <= 3) return 'Medium password'
    if (score === 4) return 'Strong password'

    return 'Very strong password'
  }

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Input with password strength</Label>
      <div className='relative mb-3'>
        <Input
          id={id}
          type={isVisible ? 'text' : 'password'}
          placeholder='Password'
          value={password}
          onChange={e => setPassword(e.target.value)}
          className='pr-9'
        />
        <Button
          variant='ghost'
          size='icon'
          onClick={toggleVisibility}
          className='text-muted-foreground focus-visible:ring-ring/50 absolute inset-y-0 right-0 rounded-l-none hover:bg-transparent'
        >
          {isVisible ? <EyeOffIcon /> : <EyeIcon />}
          <span className='sr-only'>{isVisible ? 'Hide password' : 'Show password'}</span>
        </Button>
      </div>

      <div className='mb-4 flex h-1 w-full gap-1'>
        {Array.from({ length: 5 }).map((_, index) => (
          <span
            key={index}
            className={cn(
              'h-full flex-1 rounded-full transition-all duration-500 ease-out',
              index < strengthScore ? getColor(strengthScore) : 'bg-border'
            )}
          />
        ))}
      </div>

      <p className='text-foreground text-sm font-medium'>{getText(strengthScore)}. Must contain:</p>

      <ul className='mb-4 space-y-1.5'>
        {strength.map((req, index) => (
          <li key={index} className='flex items-center gap-2'>
            {req.met ? (
              <CheckIcon className='size-4 text-green-600 dark:text-green-400' />
            ) : (
              <XIcon className='text-muted-foreground size-4' />
            )}
            <span className={cn('text-xs', req.met ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground')}>
              {req.text}
              <span className='sr-only'>{req.met ? ' - Requirement met' : ' - Requirement not met'}</span>
            </span>
          </li>
        ))}
      </ul>

      <p className='text-muted-foreground text-xs'>
        Inspired by{' '}
        <a
          className='hover:text-foreground underline'
          href='https://flyonui.com/docs/advanced-forms/strong-password/#indicator-and-hints'
          target='_blank'
          rel='noopener noreferrer'
        >
          FlyonUI
        </a>
      </p>
    </div>
  )
}

export default InputPasswordStrengthDemo
```
