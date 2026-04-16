# Animated Button Components

17 variants (39-55) from ShadcnStudio. Special button components with advanced animations requiring motion/react, custom UI components, or CSS.

## Quick Reference

| # | Style | Dependencies | Use Case |
|---|-------|--------------|----------|
| 39 | Ripple Effect | motion/react, ripple-button.tsx | Material-style click feedback |
| 40 | Ring Hover | CSS only | Focus ring effect on hover |
| 41 | Shine Hover | CSS only | Shine sweep effect on hover |
| 42 | Tap Animation | motion/react | Scale down on tap/click |
| 43 | Shimmer Effect | motion/react, shimmer-button.tsx | Eye-catching CTA with shimmer |
| 44 | Bounce Hover | motion/react, bounce-button.tsx | Playful spring animation |
| 45 | Magnetic Effect | motion/react, magnetic-button.tsx | Cursor-following magnetic pull |
| 46 | Heartbeat Effect | CSS keyframes | Pulsing attention-grabber |
| 47 | Stitches | CSS only | Dashed border stitch effect |
| 48 | *Not provided* | - | - |
| 49 | Craft Button | craft-button.tsx | Expanding icon with label |
| 50 | *Not provided* | - | - |
| 51 | *Not provided* | - | - |
| 52 | Orion Button | orion-button.tsx | 3D inset shadow effect |
| 53 | Grow Button | grow-button.tsx | Glowing shadow on press |
| 54 | *Not provided* | - | - |
| 55 | Glass Button | CSS @property, glass-button.tsx | Glassmorphism with gradient border |

---

## 39. Ripple Effect

Material Design-style ripple animation on click. Requires the `RippleButton` UI component and `motion/react`.

### Dependencies

```bash
npm install motion
# or
bun add motion
```

### Usage

```tsx
import { RippleButton } from '@/components/ui/ripple-button'

const ButtonRippleEffectDemo = () => {
  return <RippleButton>Ripple Effect</RippleButton>
}

export default ButtonRippleEffectDemo
```

### UI Component: ripple-button.tsx

Create this file at `@/components/ui/ripple-button.tsx`:

```tsx
'use client'

import * as React from 'react'
import { motion, type HTMLMotionProps, type Transition } from 'motion/react'
import type { VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

interface Ripple {
  id: number
  x: number
  y: number
}

interface RippleButtonProps extends HTMLMotionProps<'button'>, VariantProps<typeof buttonVariants> {
  children: React.ReactNode
  scale?: number
  transition?: Transition
}

function RippleButton({
  ref,
  children,
  onClick,
  className,
  variant,
  size,
  scale = 10,
  transition = { duration: 0.6, ease: 'easeOut' },
  ...props
}: RippleButtonProps) {
  const [ripples, setRipples] = React.useState<Ripple[]>([])
  const buttonRef = React.useRef<HTMLButtonElement>(null)

  React.useImperativeHandle(ref, () => buttonRef.current as HTMLButtonElement)

  const createRipple = React.useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    const button = buttonRef.current
    if (!button) return

    const rect = button.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    const newRipple: Ripple = {
      id: Date.now(),
      x,
      y
    }

    setRipples(prev => [...prev, newRipple])

    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id))
    }, 600)
  }, [])

  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      createRipple(event)
      if (onClick) {
        onClick(event)
      }
    },
    [createRipple, onClick]
  )

  return (
    <motion.button
      ref={buttonRef}
      data-slot='ripple-button'
      onClick={handleClick}
      className={cn(buttonVariants({ variant, size }), 'relative overflow-hidden', className)}
      {...props}
    >
      {children}
      {ripples.map(ripple => (
        <motion.span
          key={ripple.id}
          initial={{ scale: 0, opacity: 0.5 }}
          animate={{ scale, opacity: 0 }}
          transition={transition}
          className='pointer-events-none absolute size-5 rounded-full bg-current'
          style={{
            top: ripple.y - 10,
            left: ripple.x - 10
          }}
        />
      ))}
    </motion.button>
  )
}

export { RippleButton, type RippleButtonProps }
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `buttonVariants` | `default` | Button variant from shadcn |
| `size` | `buttonVariants` | `default` | Button size from shadcn |
| `scale` | `number` | `10` | Ripple expansion scale |
| `transition` | `Transition` | `{ duration: 0.6, ease: 'easeOut' }` | Motion transition config |

### Examples

#### With variants

```tsx
<RippleButton variant='outline'>Outline Ripple</RippleButton>
<RippleButton variant='secondary'>Secondary Ripple</RippleButton>
<RippleButton variant='destructive'>Destructive Ripple</RippleButton>
```

#### Custom ripple scale

```tsx
<RippleButton scale={15}>Larger Ripple</RippleButton>
<RippleButton scale={5}>Smaller Ripple</RippleButton>
```

#### Custom transition

```tsx
<RippleButton transition={{ duration: 1, ease: 'easeInOut' }}>
  Slow Ripple
</RippleButton>
```

---

## 40. Ring Hover

Button with ring effect appearing on hover.

### Usage

```tsx
import { Button } from '@/components/ui/button'

const ButtonRingHoverDemo = () => {
  return (
    <Button className='ring-offset-background hover:ring-primary/90 transition-all duration-300 hover:ring-2 hover:ring-offset-2'>
      Ring Hover
    </Button>
  )
}

export default ButtonRingHoverDemo
```

---

## 41. Shine Hover

Button with shine sweep effect on hover.

### Usage

```tsx
import { Button } from '@/components/ui/button'

const ButtonShineHoverDemo = () => {
  return (
    <Button className='relative overflow-hidden before:absolute before:inset-0 before:rounded-[inherit] before:bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.5)_50%,transparent_75%,transparent_100%)] before:bg-[length:250%_250%] before:bg-[position:200%_0] before:transition-[background-position] before:duration-500 hover:before:bg-[position:-100%_0]'>
      Shine Hover
    </Button>
  )
}

export default ButtonShineHoverDemo
```

---

## 42. Tap Animation

Button that scales down on tap/click using motion.

### Dependencies

```bash
npm install motion
```

### Usage

```tsx
import * as motion from 'motion/react-client'
import { Button } from '@/components/ui/button'

const ButtonTapAnimationDemo = () => {
  return (
    <Button className='transition-none' asChild>
      <motion.button whileTap={{ scale: 0.85 }}>Tap Animation</motion.button>
    </Button>
  )
}

export default ButtonTapAnimationDemo
```

### Notes

This variant uses the shadcn Button with `asChild` prop to pass styles to a motion.button element. No additional UI component file needed.

---

## 43. Shimmer Effect

Button with animated shimmer/shine effect across the surface.

### Dependencies

```bash
npm install motion
```

### Usage

```tsx
import { ShimmerButton } from '@/components/ui/shimmer-button'

const ButtonShimmerEffectDemo = () => {
  return <ShimmerButton>Shimmer Button</ShimmerButton>
}

export default ButtonShimmerEffectDemo
```

### UI Component: shimmer-button.tsx

```tsx
'use client'

import * as React from 'react'
import { motion, type HTMLMotionProps } from 'motion/react'
import { cn } from '@/lib/utils'

interface ShimmerButtonProps extends HTMLMotionProps<'button'> {
  children: React.ReactNode
}

function ShimmerButton({ children, className, ...props }: ShimmerButtonProps) {
  return (
    <motion.button
      className='relative inline-flex overflow-hidden rounded-lg bg-[linear-gradient(120deg,var(--primary)_calc(var(--shimmer-button-x)-25%),var(--primary-foreground)_var(--shimmer-button-x),var(--primary)_calc(var(--shimmer-button-x)+25%))] [--shimmer-button-x:0%]'
      initial={{
        scale: 1,
        '--shimmer-button-x': '-100%'
      }}
      animate={{
        '--shimmer-button-x': '200%'
      }}
      transition={{
        stiffness: 500,
        damping: 20,
        type: 'spring',
        '--shimmer-button-x': {
          duration: 3,
          repeat: Infinity,
          ease: [0.445, 0.05, 0.55, 0.95]
        }
      }}
      whileTap={{
        scale: 0.95
      }}
      whileHover={{
        scale: 1.05
      }}
      {...props}
    >
      <span
        className={cn(
          'bg-destructive m-0.5 rounded-md px-4 py-2 text-sm font-medium text-white backdrop-blur-sm',
          className
        )}
      >
        {children}
      </span>
    </motion.button>
  )
}

export { ShimmerButton, type ShimmerButtonProps }
```

---

## 44. Bounce Hover

Button with spring bounce animation on hover.

### Dependencies

```bash
npm install motion
```

### Usage

```tsx
import { BounceButton } from '@/components/ui/bounce-button'

const ButtonBounceHoverDemo = () => {
  return <BounceButton>Bounce Button</BounceButton>
}

export default ButtonBounceHoverDemo
```

### UI Component: bounce-button.tsx

```tsx
'use client'

import * as React from 'react'
import { motion, type HTMLMotionProps } from 'motion/react'
import type { VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

interface BounceButtonProps extends HTMLMotionProps<'button'>, VariantProps<typeof buttonVariants> {
  children: React.ReactNode
}

function BounceButton({ children, className, size, variant, ...props }: BounceButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      className={cn(buttonVariants({ variant, size }), 'transition-none', className)}
      transition={{ type: 'spring', stiffness: 400, damping: 10 }}
      {...props}
    >
      {children}
    </motion.button>
  )
}

export { BounceButton, type BounceButtonProps }
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `buttonVariants` | `default` | Button variant from shadcn |
| `size` | `buttonVariants` | `default` | Button size from shadcn |

---

## 45. Magnetic Effect

Button that follows the cursor with magnetic attraction effect.

### Dependencies

```bash
npm install motion
```

### Usage

```tsx
import { MagneticButton } from '@/components/ui/magnetic-button'

const ButtonMagneticEffectDemo = () => {
  return <MagneticButton>Magnetic Button</MagneticButton>
}

export default ButtonMagneticEffectDemo
```

### UI Component: magnetic-button.tsx

```tsx
'use client'

import * as React from 'react'
import { motion, type HTMLMotionProps, type Transition } from 'motion/react'
import type { VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

interface Position {
  x: number
  y: number
}

interface MagneticButtonProps extends HTMLMotionProps<'button'>, VariantProps<typeof buttonVariants> {
  children: React.ReactNode
  scale?: number
  transition?: Transition
}

function MagneticButton({ children, className, size, variant, ...props }: MagneticButtonProps) {
  const ref = React.useRef<HTMLButtonElement>(null)
  const [position, setPosition] = React.useState<Position>({ x: 0, y: 0 })

  const handleMouse = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (ref.current) {
      const { clientX, clientY } = e
      const { height, width, left, top } = ref.current.getBoundingClientRect()
      const middleX = clientX - (left + width / 2)
      const middleY = clientY - (top + height / 2)
      setPosition({ x: middleX, y: middleY })
    }
  }

  const reset = () => {
    setPosition({ x: 0, y: 0 })
  }

  const { x, y } = position

  return (
    <motion.button
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      animate={{ x, y }}
      transition={{ type: 'spring', stiffness: 150, damping: 15, mass: 0.1 }}
      whileTap={{
        scale: 0.95
      }}
      className={cn(buttonVariants({ variant, size }), 'relative transition-none', className)}
      {...props}
    >
      {children}
    </motion.button>
  )
}

export { MagneticButton, type MagneticButtonProps }
```

---

## 46. Heartbeat Effect

Pulsing button with heartbeat animation using CSS keyframes.

### CSS Required

Add to your global CSS or Tailwind config:

```css
@theme inline {
  --animate-heartbeat: heartbeat 2s infinite ease-in-out;

  @keyframes heartbeat {
    0% {
      box-shadow: 0 0 0 0 var(--heartbeat-color, var(--destructive));
      transform: scale(1);
    }
    50% {
      box-shadow: 0 0 0 7px transparent;
      transform: scale(1.05);
    }
    100% {
      box-shadow: 0 0 0 0 transparent;
      transform: scale(1);
    }
  }
}
```

### Usage

```tsx
import { Button } from '@/components/ui/button'

const ButtonHeartbeatEffectDemo = () => {
  return (
    <Button variant='destructive' className='animate-heartbeat dark:bg-destructive/100 m-9'>
      Heartbeat Effect
    </Button>
  )
}

export default ButtonHeartbeatEffectDemo
```

### Custom Heartbeat Color

```tsx
<Button 
  className='animate-heartbeat [--heartbeat-color:var(--primary)]'
>
  Custom Color
</Button>
```

---

## 47. Stitches Button

Button with decorative dashed border stitch effect.

### Usage

```tsx
const ButtonStitchesDemo = () => {
  return (
    <button className='group relative rounded-lg border-2 border-sky-500 bg-sky-500 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-sky-600 hover:border-sky-600'>
      <span className='absolute top-0 left-0 size-full rounded-md border border-dashed border-sky-50 shadow-inner' />
      <span className='absolute top-0 left-0 size-full rotate-180 rounded-md border-sky-50 shadow-inner' />
      Stitches Button
    </button>
  )
}

export default ButtonStitchesDemo
```

---

## 49. Craft Button

Button with expanding circular icon that reveals on hover.

### Usage

```tsx
import { ArrowUpRightIcon } from 'lucide-react'
import { CraftButton, CraftButtonLabel, CraftButtonIcon } from '@/components/ui/craft-button'

const CraftButtonDemo = () => {
  return (
    <CraftButton>
      <CraftButtonLabel>Click me</CraftButtonLabel>
      <CraftButtonIcon>
        <ArrowUpRightIcon className='size-3 stroke-2 transition-transform duration-500 group-hover:rotate-45' />
      </CraftButtonIcon>
    </CraftButton>
  )
}

export default CraftButtonDemo
```

### UI Component: craft-button.tsx

```tsx
'use client'

import * as React from 'react'
import type { VariantProps } from 'class-variance-authority'
import { Button, type buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const CraftButtonContext = React.createContext<{
  size?: VariantProps<typeof buttonVariants>['size']
}>({})

interface CraftButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: VariantProps<typeof buttonVariants>['size']
  children?: React.ReactNode
  asChild?: boolean
}

interface CraftButtonLabelProps {
  children: React.ReactNode
  className?: string
}

interface CraftButtonIconProps {
  children: React.ReactNode
  className?: string
}

function CraftButtonLabel({ children, className }: CraftButtonLabelProps) {
  return (
    <span className={cn('group-hover:text-foreground relative z-2 transition-colors duration-500', className)}>
      {children}
    </span>
  )
}

function CraftButtonIcon({ children, className }: CraftButtonIconProps) {
  const { size } = React.useContext(CraftButtonContext)
  const iconSize = size === 'lg' ? 'size-6' : size === 'sm' ? 'size-4' : 'size-5'

  return (
    <span className={cn('relative z-1', iconSize, className)}>
      <span
        className={cn(
          'bg-background absolute inset-0 -z-1 rounded-full transition-transform duration-500 group-hover:scale-[15]',
          iconSize
        )}
      />
      <span
        className={cn(
          'bg-background text-primary group-hover:bg-primary group-hover:text-background relative z-2 flex items-center justify-center rounded-full transition-all duration-500',
          iconSize
        )}
      >
        {children}
      </span>
    </span>
  )
}

function CraftButton(props: CraftButtonProps) {
  const { children, size, asChild = false, className, ...rest } = props

  return (
    <CraftButtonContext.Provider value={{ size }}>
      <Button
        size={size}
        asChild={asChild}
        className={cn(
          'group hover:bg-background dark:hover:border-primary/30 relative cursor-pointer overflow-hidden rounded-full duration-500 hover:shadow-md dark:border dark:border-transparent',
          className
        )}
        {...rest}
      >
        {children}
      </Button>
    </CraftButtonContext.Provider>
  )
}

export {
  CraftButton,
  CraftButtonLabel,
  CraftButtonIcon,
  type CraftButtonProps,
  type CraftButtonLabelProps,
  type CraftButtonIconProps
}
```

---

## 52. Orion Button

Button with 3D inset shadow effect that flattens on hover.

### Usage

```tsx
import { PrimaryOrionButton } from '@/components/ui/orion-button'

const PrimaryOrionButtonDemo = () => {
  return <PrimaryOrionButton>Orion Button</PrimaryOrionButton>
}

export default PrimaryOrionButtonDemo
```

### UI Component: orion-button.tsx

```tsx
'use client'

import * as React from 'react'
import type { VariantProps } from 'class-variance-authority'
import { Button, type buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface OrionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: VariantProps<typeof buttonVariants>['size']
  children: React.ReactNode
  className?: string
  asChild?: boolean
}

function PrimaryOrionButton({ children, size, asChild = false, className, ...props }: OrionButtonProps) {
  return (
    <Button
      size={size}
      asChild={asChild}
      className={cn(
        'hover:bg-primary border-0 shadow-[inset_0_2px_3px_0_var(--primary),inset_2px_-4px_4px_0_rgba(0,0,0,0.25),inset_-2px_4px_4px_0_rgba(255,255,255,0.35)] transition-shadow duration-300 hover:shadow-[inset_0_0_0_0_var(--primary),inset_1px_-1.5px_2px_0_rgba(0,0,0,0.25),inset_-1px_1.5px_2px_0_rgba(255,255,255,0.35)]',
        size === 'lg' && 'text-base has-[>svg]:px-6',
        className
      )}
      {...props}
    >
      {children}
    </Button>
  )
}

function SecondaryOrionButton({ children, size, asChild = false, className, ...props }: OrionButtonProps) {
  return (
    <Button
      variant='secondary'
      size={size}
      asChild={asChild}
      className={cn(
        'hover:bg-secondary bg-secondary text-secondary-foreground border-0 shadow-[inset_0_2px_3px_0_var(--secondary),inset_2px_-4px_4px_0_rgba(0,0,0,0.25),inset_-2px_4px_4px_0_rgba(255,255,255,0.35)] transition-shadow duration-300 hover:shadow-[inset_0_0_0_0_var(--secondary),inset_1px_-1.5px_2px_0_rgba(0,0,0,0.25),inset_-1px_1.5px_2px_0_rgba(255,255,255,0.35)]',
        size === 'lg' && 'text-base has-[>svg]:px-6',
        className
      )}
      {...props}
    >
      {children}
    </Button>
  )
}

export { PrimaryOrionButton, SecondaryOrionButton, type OrionButtonProps }
```

### Variants

```tsx
// Primary (default)
<PrimaryOrionButton>Primary Orion</PrimaryOrionButton>

// Secondary
<SecondaryOrionButton>Secondary Orion</SecondaryOrionButton>
```

---

## 53. Grow Button

Button with glowing shadow effect that intensifies on press.

### Usage

```tsx
import { PrimaryGrowButton } from '@/components/ui/grow-button'

const PrimaryGrowButtonDemo = () => {
  return <PrimaryGrowButton>Grow Button</PrimaryGrowButton>
}

export default PrimaryGrowButtonDemo
```

### UI Component: grow-button.tsx

```tsx
import * as React from 'react'
import type { VariantProps } from 'class-variance-authority'
import { Button, type buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface GrowButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: VariantProps<typeof buttonVariants>['size']
  children?: React.ReactNode
  asChild?: boolean
}

function PrimaryGrowButton(props: GrowButtonProps) {
  const { children, asChild = false, size, className, ...rest } = props

  return (
    <Button
      size={size}
      asChild={asChild}
      className={cn(
        'rounded-lg duration-200 ease-in-out active:-translate-x-0.5 active:translate-y-0.5',
        // default shadows
        '[box-shadow:0px_1px_8px_0px_color-mix(in_oklab,white_7%,transparent)_inset,0px_0px_4.3px_0px_color-mix(in_oklab,var(--primary)_11%,transparent)_inset,0px_0px_0px_2.5px_var(--primary),0px_9px_21.7px_3px_color-mix(in_oklab,var(--primary)_40%,transparent),0px_-1px_0px_1px_color-mix(in_oklab,white_18%,transparent)_inset,0px_4px_4px_0px_color-mix(in_oklab,var(--primary)_16%,transparent)] dark:[box-shadow:0px_1px_8px_0px_color-mix(in_oklab,black_7%,transparent)_inset,0px_0px_4.3px_0px_color-mix(in_oklab,var(--primary)_11%,transparent)_inset,0px_0px_0px_2.5px_var(--primary),0px_9px_21.7px_3px_color-mix(in_oklab,var(--primary)_40%,transparent),0px_-1px_0px_1px_color-mix(in_oklab,black_18%,transparent)_inset,0px_4px_4px_0px_color-mix(in_oklab,var(--primary)_16%,transparent)]',
        // shadows on active state
        'active:[box-shadow:0px_1px_8px_0px_color-mix(in_oklab,white_7%,transparent)_inset,0px_0px_4.3px_0px_color-mix(in_oklab,var(--primary)_11%,transparent)_inset,0px_0px_0px_2.5px_var(--primary),0px_7px_12px_0px_color-mix(in_oklab,var(--primary)_60%,transparent),0px_-1px_0px_1px_color-mix(in_oklab,white_18%,transparent)_inset,0px_4px_4px_0px_color-mix(in_oklab,var(--primary)_16%,transparent)] dark:active:[box-shadow:0px_1px_8px_0px_color-mix(in_oklab,black_7%,transparent)_inset,0px_0px_4.3px_0px_color-mix(in_oklab,var(--primary)_11%,transparent)_inset,0px_0px_0px_2.5px_var(--primary),0px_7px_12px_0px_color-mix(in_oklab,var(--primary)_60%,transparent),0px_-1px_0px_1px_color-mix(in_oklab,black_18%,transparent)_inset,0px_4px_4px_0px_color-mix(in_oklab,var(--primary)_16%,transparent)]',
        // shadows on focus state
        'focus-visible:[box-shadow:0px_1px_8px_0px_color-mix(in_oklab,white_7%,transparent)_inset,0px_0px_4.3px_0px_color-mix(in_oklab,var(--primary)_11%,transparent)_inset,0px_0px_0px_2.5px_var(--primary),0px_7px_12px_0px_color-mix(in_oklab,var(--primary)_60%,transparent),0px_-1px_0px_1px_color-mix(in_oklab,white_18%,transparent)_inset,0px_4px_4px_0px_color-mix(in_oklab,var(--primary)_16%,transparent)] dark:focus-visible:[box-shadow:0px_1px_8px_0px_color-mix(in_oklab,black_7%,transparent)_inset,0px_0px_4.3px_0px_color-mix(in_oklab,var(--primary)_11%,transparent)_inset,0px_0px_0px_2.5px_var(--primary),0px_7px_12px_0px_color-mix(in_oklab,var(--primary)_60%,transparent),0px_-1px_0px_1px_color-mix(in_oklab,black_18%,transparent)_inset,0px_4px_4px_0px_color-mix(in_oklab,var(--primary)_16%,transparent)]',
        // size-based adjustments
        size === 'lg' && 'text-base has-[>svg]:px-6',
        className
      )}
      {...rest}
    >
      {children}
    </Button>
  )
}

function SecondaryGrowButton(props: GrowButtonProps) {
  const { children, size, asChild = false, className, ...rest } = props

  return (
    <Button
      variant='secondary'
      size={size}
      asChild={asChild}
      className={cn(
        'text-primary cursor-pointer rounded-lg border border-[color-mix(in_oklab,_var(--primary)_30%,_var(--card))] bg-[color-mix(in_oklab,_var(--primary)_10%,_var(--card))] hover:bg-[color-mix(in_oklab,_var(--primary)_15%,_var(--card))] active:scale-95',
        // size-based adjustments
        size === 'lg' && 'text-base has-[>svg]:px-6',
        className
      )}
      {...rest}
    >
      {children}
    </Button>
  )
}

export { PrimaryGrowButton, SecondaryGrowButton, type GrowButtonProps }
```

### Variants

```tsx
// Primary with glow
<PrimaryGrowButton>Primary Grow</PrimaryGrowButton>

// Secondary subtle
<SecondaryGrowButton>Secondary Grow</SecondaryGrowButton>
```

---

## 55. Glass Button

Glassmorphism button with animated gradient border.

### CSS Required

Add to your global CSS:

```css
@property --button-angle {
  syntax: '<angle>';
  inherits: false;
  initial-value: -75deg;
}
```

### Usage

```tsx
import { GlassButton } from '@/components/ui/glass-button'

const GlassButtonDemo = () => {
  return (
    <div className='flex size-full items-center justify-center rounded-xl bg-gray-800'>
      <GlassButton>Glass Button</GlassButton>
    </div>
  )
}

export default GlassButtonDemo
```

### UI Component: glass-button.tsx

> **Note:** You'll need to provide the complete `glass-button.tsx` component. The CSS `@property` rule enables the animated gradient border effect.

### Example with dark background

Glass buttons work best on dark backgrounds to showcase the glassmorphism effect:

```tsx
<div className='bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-xl'>
  <GlassButton>Glass Effect</GlassButton>
</div>
```
