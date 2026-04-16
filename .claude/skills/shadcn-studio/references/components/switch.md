# Switch Components

18 variants from ShadcnStudio. Select based on use case.

## Quick Reference

| # | Style | Features | Use Case |
|---|-------|----------|----------|
| 1 | Default | With label | Basic toggle |
| 2 | Square | Rounded corners | Alternative style |
| 3 | Mini | Smaller thumb | Compact UI |
| 4 | Colors | Multiple colors | Status indication |
| 5 | Sizes | sm/md/lg | Different contexts |
| 6 | Outline | Border style | Subtle design |
| 7 | Gradient | Gradient bg | Decorative |
| 8 | Toggle Label | Dynamic label | Yes/No states |
| 9 | Dual Label | Labels both sides | Clear options |
| 10 | Icon Label | Icon changes | Theme toggle |
| 11 | Dual Icon | Icons both sides | Light/Dark mode |
| 12 | Icon Indicator | Icons in track | Visual feedback |
| 13 | Permanent Indicator | Always visible icons | Check/X icons |
| 14 | Square Indicator | Text indicators | Yes/No text |
| 15 | Card | With description | Settings panel |
| 16 | Card Google | Brand integration | Service toggles |
| 17 | Card GitHub | Brand integration | Connection toggles |
| 18 | List Group | Multiple switches | Settings list |

---

## 1. Default

Basic switch with label.

```tsx
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

const SwitchDemo = () => {
  return (
    <div className='flex items-center space-x-2'>
      <Switch id='airplane-mode' />
      <Label htmlFor='airplane-mode'>Airplane Mode</Label>
    </div>
  )
}

export default SwitchDemo
```

---

## 2. Square

Switch with square corners.

```tsx
import { Switch } from '@/components/ui/switch'

const SwitchSquareDemo = () => {
  return <Switch aria-label='Square switch' className='rounded-xs [&_span]:rounded-xs' />
}

export default SwitchSquareDemo
```

---

## 3. Mini

Compact switch with smaller thumb.

```tsx
import { Switch } from '@/components/ui/switch'

const SwitchMiniDemo = () => {
  return (
    <Switch
      aria-label='Mini switch'
      className='[&_span]:border-input h-3 border-none [&_span]:size-4.5 [&_span]:border'
    />
  )
}

export default SwitchMiniDemo
```

---

## 4. Colors

Switches with different color themes.

```tsx
import { Switch } from '@/components/ui/switch'

const SwitchColorsDemo = () => {
  return (
    <div className='flex items-center gap-3'>
      <Switch
        className='focus-visible:border-destructive focus-visible:ring-destructive/20 data-[state=checked]:bg-destructive dark:focus-visible:ring-destructive/40'
        aria-label='Destructive Switch'
        defaultChecked
      />
      <Switch
        className='focus-visible:border-ring-green-600 dark:focus-visible:border-ring-green-400 focus-visible:ring-green-600/20 data-[state=checked]:bg-green-600 dark:focus-visible:ring-green-400/40 dark:data-[state=checked]:bg-green-400'
        aria-label='Success Switch'
        defaultChecked
      />
      <Switch
        className='focus-visible:border-ring-sky-600 dark:focus-visible:border-ring-sky-400 focus-visible:ring-sky-600/20 data-[state=checked]:bg-sky-600 dark:focus-visible:ring-sky-400/40 dark:data-[state=checked]:bg-sky-400'
        aria-label='Info Switch'
        defaultChecked
      />
      <Switch
        className='focus-visible:border-ring-amber-600 dark:focus-visible:border-ring-amber-400 focus-visible:ring-amber-600/20 data-[state=checked]:bg-amber-600 dark:focus-visible:ring-amber-400/40 dark:data-[state=checked]:bg-amber-400'
        aria-label='Warning Switch'
        defaultChecked
      />
    </div>
  )
}

export default SwitchColorsDemo
```

---

## 5. Sizes

Switches in different sizes.

```tsx
import { Switch } from '@/components/ui/switch'

const SwitchSizesDemo = () => {
  return (
    <div className='flex items-center gap-3'>
      <Switch aria-label='Small switch' />
      <Switch
        aria-label='Medium switch'
        className='h-6 w-10 [&_span]:size-5 data-[state=checked]:[&_span]:translate-x-4.5 data-[state=checked]:[&_span]:rtl:-translate-x-4.5'
      />
      <Switch
        aria-label='Large switch'
        className='h-7 w-12 [&_span]:size-6 data-[state=checked]:[&_span]:translate-x-5.5 data-[state=checked]:[&_span]:rtl:-translate-x-5.5'
      />
    </div>
  )
}

export default SwitchSizesDemo
```

---

## 6. Outline

Switches with outline/border style when checked.

```tsx
import { Switch } from '@/components/ui/switch'

const SwitchOutlineDemo = () => {
  return (
    <div className='flex items-center gap-3'>
      <Switch
        className='focus-visible:border-primary data-[state=checked]:[&_span]:bg-primary dark:data-[state=checked]:[&_span]:bg-primary data-[state=checked]:border-primary data-[state=checked]:[&_span]:border-background data-[state=checked]:bg-transparent [&_span]:border'
        aria-label='Default outline Switch'
        defaultChecked
      />
      <Switch
        className='focus-visible:border-destructive focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 data-[state=checked]:[&_span]:bg-destructive dark:data-[state=checked]:[&_span]:bg-destructive data-[state=checked]:border-destructive data-[state=checked]:[&_span]:border-background data-[state=checked]:bg-transparent [&_span]:border'
        aria-label='Destructive Switch'
        defaultChecked
      />
      <Switch
        className='data-[state=checked]:[&_span]:border-background focus-visible:border-green-600 focus-visible:ring-green-600/20 data-[state=checked]:border-green-600 data-[state=checked]:bg-transparent dark:focus-visible:border-green-400 dark:focus-visible:ring-green-400/40 dark:data-[state=checked]:border-green-400 [&_span]:border data-[state=checked]:[&_span]:bg-green-600 dark:data-[state=checked]:[&_span]:bg-green-400'
        aria-label='Success outline Switch'
        defaultChecked
      />
    </div>
  )
}

export default SwitchOutlineDemo
```

---

## 7. Gradient

Switch with gradient background.

```tsx
import { Switch } from '@/components/ui/switch'

const SwitchGradientDemo = () => {
  return (
    <Switch
      aria-label='Gradient Switch'
      className='focus-visible:border-destructive to-destructive/60 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 h-6 w-10 border-none bg-gradient-to-r from-amber-500 data-[state=checked]:from-sky-400 data-[state=checked]:to-indigo-700 [&_span]:size-5 [&_span]:!translate-x-0.25 data-[state=checked]:[&_span]:!translate-x-4.75 data-[state=checked]:[&_span]:rtl:!-translate-x-4.75'
    />
  )
}

export default SwitchGradientDemo
```

---

## 8. Toggle Label

Switch with dynamic Yes/No label.

```tsx
'use client'

import { useState } from 'react'

import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

const SwitchToggleLabelDemo = () => {
  const [checked, setChecked] = useState<boolean>(true)

  return (
    <div className='inline-flex items-center gap-2'>
      <Switch id='toggle-label' checked={checked} onCheckedChange={setChecked} aria-label='Toggle switch label' />
      <Label htmlFor='toggle-label' className='text-sm font-medium'>
        {checked ? 'Yes' : 'No'}
      </Label>
    </div>
  )
}

export default SwitchToggleLabelDemo
```

---

## 9. Dual Toggle Label

Switch with clickable labels on both sides.

```tsx
'use client'

import { useId, useState } from 'react'

import { Switch } from '@/components/ui/switch'

const SwitchDualToggleLabelDemo = () => {
  const id = useId()
  const [checked, setChecked] = useState(false)

  const toggleSwitch = () => setChecked(prev => !prev)

  return (
    <div className='group inline-flex items-center gap-2' data-state={checked ? 'checked' : 'unchecked'}>
      <span
        id={`${id}-yes`}
        className='group-data-[state=checked]:text-muted-foreground/70 cursor-pointer text-right text-sm font-medium'
        aria-controls={id}
        onClick={() => setChecked(false)}
      >
        Yes
      </span>
      <Switch id={id} checked={checked} onCheckedChange={toggleSwitch} aria-labelledby={`${id}-yes ${id}-no`} />
      <span
        id={`${id}-no`}
        className='group-data-[state=unchecked]:text-muted-foreground/70 cursor-pointer text-left text-sm font-medium'
        aria-controls={id}
        onClick={() => setChecked(true)}
      >
        No
      </span>
    </div>
  )
}

export default SwitchDualToggleLabelDemo
```

---

## 10. Icon Label

Switch with icon that changes based on state.

```tsx
'use client'

import { useState } from 'react'

import { MoonIcon, SunIcon } from 'lucide-react'

import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

const SwitchIconLabelDemo = () => {
  const [checked, setChecked] = useState<boolean>(true)

  return (
    <div className='inline-flex items-center gap-2'>
      <Switch id='icon-label' checked={checked} onCheckedChange={setChecked} aria-label='Toggle switch' />
      <Label htmlFor='icon-label'>
        <span className='sr-only'>Toggle switch</span>
        {checked ? (
          <MoonIcon className='size-4' aria-hidden='true' />
        ) : (
          <SunIcon className='size-4' aria-hidden='true' />
        )}
      </Label>
    </div>
  )
}

export default SwitchIconLabelDemo
```

---

## 11. Dual Icon Label

Switch with icons on both sides for theme toggle.

```tsx
'use client'

import { useId, useState } from 'react'

import { MoonIcon, SunIcon } from 'lucide-react'

import { Switch } from '@/components/ui/switch'

const SwitchDualIconLabelDemo = () => {
  const id = useId()
  const [checked, setChecked] = useState(true)

  const toggleSwitch = () => setChecked(prev => !prev)

  return (
    <div className='group inline-flex items-center gap-2' data-state={checked ? 'checked' : 'unchecked'}>
      <span
        id={`${id}-light`}
        className='group-data-[state=checked]:text-muted-foreground/70 cursor-pointer text-left text-sm font-medium'
        aria-controls={id}
        onClick={() => setChecked(false)}
      >
        <SunIcon className='size-4' aria-hidden='true' />
      </span>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={toggleSwitch}
        aria-labelledby={`${id}-dark ${id}-light`}
        aria-label='Toggle between dark and light mode'
      />
      <span
        id={`${id}-dark`}
        className='group-data-[state=unchecked]:text-muted-foreground/70 cursor-pointer text-right text-sm font-medium'
        aria-controls={id}
        onClick={() => setChecked(true)}
      >
        <MoonIcon className='size-4' aria-hidden='true' />
      </span>
    </div>
  )
}

export default SwitchDualIconLabelDemo
```

---

## 12. Icon Indicator

Switch with check/X icons visible in track.

```tsx
'use client'

import { useState } from 'react'

import { CheckIcon, XIcon } from 'lucide-react'

import { Switch } from '@/components/ui/switch'

const SwitchIconIndicatorDemo = () => {
  const [checked, setChecked] = useState<boolean>(true)

  return (
    <div>
      <div className='relative inline-grid h-7 grid-cols-[1fr_1fr] items-center text-sm font-medium'>
        <Switch
          checked={checked}
          onCheckedChange={setChecked}
          className='peer data-[state=checked]:bg-input/50 data-[state=unchecked]:bg-input/50 [&_span]:!bg-background absolute inset-0 h-[inherit] w-14 [&_span]:size-6.5 [&_span]:transition-transform [&_span]:duration-300 [&_span]:ease-[cubic-bezier(0.16,1,0.3,1)] [&_span]:data-[state=checked]:translate-x-7 [&_span]:data-[state=checked]:rtl:-translate-x-7'
          aria-label='Switch with icon indicators'
        />
        <span className='peer-data-[state=checked]:text-muted-foreground/70 pointer-events-none relative ml-1.75 flex min-w-7 items-center text-center'>
          <CheckIcon className='size-4' aria-hidden='true' />
        </span>
        <span className='peer-data-[state=unchecked]:text-muted-foreground/70 pointer-events-none relative -ms-0.25 flex min-w-7 items-center text-center'>
          <XIcon className='size-4' aria-hidden='true' />
        </span>
      </div>
    </div>
  )
}

export default SwitchIconIndicatorDemo
```

---

## 13. Permanent Indicator

Switch with always visible check/X icons that animate.

```tsx
'use client'

import { useState } from 'react'

import { CheckIcon, XIcon } from 'lucide-react'

import { Switch } from '@/components/ui/switch'

const SwitchPermanentIndicatorDemo = () => {
  const [checked, setChecked] = useState<boolean>(true)

  return (
    <div>
      <div className='relative inline-grid h-7 grid-cols-[1fr_1fr] items-center text-sm font-medium'>
        <Switch
          checked={checked}
          onCheckedChange={setChecked}
          className='peer data-[state=unchecked]:bg-input/50 absolute inset-0 h-[inherit] w-14 [&_span]:z-10 [&_span]:size-6.5 [&_span]:transition-transform [&_span]:duration-300 [&_span]:ease-[cubic-bezier(0.16,1,0.3,1)] [&_span]:data-[state=checked]:translate-x-7 [&_span]:data-[state=checked]:rtl:-translate-x-7'
          aria-label='Switch with permanent icon indicators'
        />
        <span className='pointer-events-none relative ml-0.5 flex min-w-8 items-center justify-center text-center transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] peer-data-[state=checked]:invisible peer-data-[state=unchecked]:translate-x-6 peer-data-[state=unchecked]:rtl:-translate-x-6'>
          <XIcon className='size-4' aria-hidden='true' />
        </span>
        <span className='peer-data-[state=checked]:text-background pointer-events-none relative flex min-w-8 items-center justify-center text-center transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] peer-data-[state=checked]:-translate-x-full peer-data-[state=unchecked]:invisible peer-data-[state=checked]:rtl:translate-x-full'>
          <CheckIcon className='size-4' aria-hidden='true' />
        </span>
      </div>
    </div>
  )
}

export default SwitchPermanentIndicatorDemo
```

---

## 14. Square Permanent Indicator

Square switch with Yes/No text indicators.

```tsx
'use client'

import { useState } from 'react'

import { Switch } from '@/components/ui/switch'

const SwitchSquarePermanentIndicatorDemo = () => {
  const [checked, setChecked] = useState<boolean>(true)

  return (
    <div>
      <div className='relative inline-grid h-8 grid-cols-[1fr_1fr] items-center text-sm font-medium'>
        <Switch
          checked={checked}
          onCheckedChange={setChecked}
          className='peer data-[state=unchecked]:bg-input/50 absolute inset-0 h-[inherit] w-auto rounded-md [&_span]:z-10 [&_span]:h-full [&_span]:w-1/2 [&_span]:rounded-sm [&_span]:transition-transform [&_span]:duration-300 [&_span]:ease-[cubic-bezier(0.16,1,0.3,1)] [&_span]:data-[state=checked]:translate-x-8.75 [&_span]:data-[state=checked]:rtl:-translate-x-8.75'
          aria-label='Square switch with permanent text indicators'
        />
        <span className='pointer-events-none relative ml-0.5 flex items-center justify-center px-2 text-center transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] peer-data-[state=checked]:invisible peer-data-[state=unchecked]:translate-x-full peer-data-[state=unchecked]:rtl:-translate-x-full'>
          <span className='text-[10px] font-medium uppercase'>No</span>
        </span>
        <span className='peer-data-[state=checked]:text-background pointer-events-none relative mr-0.5 flex items-center justify-center px-2 text-center transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] peer-data-[state=checked]:-translate-x-full peer-data-[state=unchecked]:invisible peer-data-[state=checked]:rtl:translate-x-full'>
          <span className='text-[10px] font-medium uppercase'>Yes</span>
        </span>
      </div>
    </div>
  )
}

export default SwitchSquarePermanentIndicatorDemo
```

---

## 15. Card with Icon

Switch in a card layout with icon and description.

```tsx
import { useId } from 'react'

import { DatabaseIcon } from 'lucide-react'

import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

const SwitchCardDemo = () => {
  const id = useId()

  return (
    <div className='border-input has-data-[state=checked]:border-primary/50 relative flex w-full items-start gap-2 rounded-md border p-4 shadow-xs outline-none'>
      <Switch
        id={id}
        className='order-1 h-4 w-6 after:absolute after:inset-0 [&_span]:size-3 data-[state=checked]:[&_span]:translate-x-2.5 data-[state=checked]:[&_span]:rtl:-translate-x-2.5'
        aria-describedby={`${id}-description`}
      />
      <div className='flex grow items-center gap-3'>
        <DatabaseIcon />
        <div className='grid grow gap-2'>
          <Label htmlFor={id}>Backup</Label>
          <p id={`${id}-description`} className='text-muted-foreground text-xs'>
            Backup every file from your project.
          </p>
        </div>
      </div>
    </div>
  )
}

export default SwitchCardDemo
```

---

## 16. Card Google

Switch card with Google branding.

```tsx
import { useId } from 'react'

import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

const SwitchCardDemo = () => {
  const id = useId()

  return (
    <div className='border-input has-data-[state=checked]:border-primary/50 relative flex w-full items-start gap-2 rounded-md border p-4 shadow-xs outline-none'>
      <Switch
        id={id}
        className='order-1 h-4 w-6 after:absolute after:inset-0 [&_span]:size-3 data-[state=checked]:[&_span]:translate-x-2.5 data-[state=checked]:[&_span]:rtl:-translate-x-2.5'
        aria-describedby={`${id}-description`}
      />
      <div className='flex grow gap-3'>
        <img
          src='https://cdn.shadcnstudio.com/ss-assets/brand-logo/google-icon.png?width=20&height=20&format=auto'
          alt='Google Icon'
          className='size-5'
        />
        <div className='grid grow gap-2'>
          <Label htmlFor={id}>Google Cloud Backup</Label>
          <p id={`${id}-description`} className='text-muted-foreground text-xs'>
            Backup every picture, video and PDFs.
          </p>
        </div>
      </div>
    </div>
  )
}

export default SwitchCardDemo
```

---

## 17. Card GitHub

Switch card with GitHub branding.

```tsx
import { useId } from 'react'

import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

const SwitchCardDemo = () => {
  const id = useId()

  return (
    <div className='border-input has-data-[state=checked]:border-primary/50 relative flex w-full items-start gap-2 rounded-md border p-4 shadow-xs outline-none'>
      <Switch
        id={id}
        className='order-1 h-4 w-6 after:absolute after:inset-0 [&_span]:size-3 data-[state=checked]:[&_span]:translate-x-2.5 data-[state=checked]:[&_span]:rtl:-translate-x-2.5'
        aria-describedby={`${id}-description`}
      />
      <div className='flex grow items-center gap-3'>
        <img
          src='https://cdn.shadcnstudio.com/ss-assets/brand-logo/github-icon.png?width=20&height=20&format=auto'
          alt='GitHub Icon'
          className='size-5'
        />
        <div className='grid grow gap-2'>
          <Label htmlFor={id}>Connect with GitHub</Label>
          <p id={`${id}-description`} className='text-muted-foreground text-xs'>
            Access your projects direct from GitHub.
          </p>
        </div>
      </div>
    </div>
  )
}

export default SwitchCardDemo
```

---

## 18. List Group

Multiple switches in a list with icons.

```tsx
import { ChartPieIcon, CodeIcon, PaletteIcon } from 'lucide-react'

import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

const skills = [
  { label: 'Web Development', icon: CodeIcon },
  { label: 'Data Analysis', icon: ChartPieIcon },
  { label: 'Graphic Design', icon: PaletteIcon }
]

const SwitchListGroupDemo = () => {
  return (
    <fieldset className='w-full max-w-96 space-y-4'>
      <legend className='text-foreground text-sm leading-none font-medium'>Switch to your preferred field: </legend>
      <ul className='flex w-full flex-col divide-y rounded-md border'>
        {skills.map(({ label, icon: Icon }) => (
          <li key={label}>
            <Label htmlFor={label} className='flex items-center justify-between gap-2 px-5 py-3'>
              <span className='flex items-center gap-2'>
                <Icon className='size-4' /> {label}
              </span>
              <Switch id={label} />
            </Label>
          </li>
        ))}
      </ul>
    </fieldset>
  )
}

export default SwitchListGroupDemo
```
