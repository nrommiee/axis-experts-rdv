# Input OTP Components

10 variants from ShadcnStudio. Select based on use case.

## Quick Reference

| # | Style | Features | Use Case |
|---|-------|----------|----------|
| 1 | Number | Digits only | PIN codes |
| 2 | Alphanumeric | Letters + digits | Verification codes |
| 3 | With Resend | Resend link | Email verification |
| 4 | Resend Timer | Countdown timer | SMS verification |
| 5 | Outlined | Individual borders | Modern style |
| 6 | Filled | Background color | Subtle style |
| 7 | Minimal | Bottom border only | Minimal design |
| 8 | Grouped | Separator dash | Phone verification |
| 9 | Outlined Grouped | Bordered + separator | 2FA codes |
| 10 | Custom Separator | Dot separator | Custom branding |

---

## 1. Number

Digits-only OTP input.

```tsx
'use client'

import { useId } from 'react'

import { REGEXP_ONLY_DIGITS } from 'input-otp'

import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { Label } from '@/components/ui/label'

const InputOTPNumberDemo = () => {
  const id = useId()

  return (
    <div className='space-y-3'>
      <Label htmlFor={id}>Input OTP number</Label>
      <InputOTP id={id} maxLength={4} pattern={REGEXP_ONLY_DIGITS}>
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
          <InputOTPSlot index={3} />
        </InputOTPGroup>
      </InputOTP>
    </div>
  )
}

export default InputOTPNumberDemo
```

---

## 2. Alphanumeric

Letters and digits OTP input.

```tsx
'use client'

import { useId } from 'react'

import { REGEXP_ONLY_DIGITS_AND_CHARS } from 'input-otp'

import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { Label } from '@/components/ui/label'

const InputOTPAlphanumericDemo = () => {
  const id = useId()

  return (
    <div className='space-y-3'>
      <Label htmlFor={id}>Input OTP Alphanumeric</Label>
      <InputOTP id={id} maxLength={4} pattern={REGEXP_ONLY_DIGITS_AND_CHARS}>
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
          <InputOTPSlot index={3} />
        </InputOTPGroup>
      </InputOTP>
    </div>
  )
}

export default InputOTPAlphanumericDemo
```

---

## 3. With Resend

OTP with resend code link.

```tsx
import { useId } from 'react'

import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { Label } from '@/components/ui/label'

const InputOTPWithResendDemo = () => {
  const id = useId()

  return (
    <div className='space-y-3'>
      <Label htmlFor={id}>Input OTP with resend</Label>
      <InputOTP id={id} maxLength={4}>
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
          <InputOTPSlot index={3} />
        </InputOTPGroup>
      </InputOTP>
      <p className='text-muted-foreground text-xs'>
        Didn&apos;t get the code?{' '}
        <a href='#' className='text-primary hover:underline'>
          Resend code
        </a>
      </p>
    </div>
  )
}

export default InputOTPWithResendDemo
```

---

## 4. Resend Timer

OTP with countdown timer.

```tsx
'use client'

import { useEffect, useId, useState } from 'react'

import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { Label } from '@/components/ui/label'

const InputOTPWithResendTimerDemo = () => {
  const [timeLeft, setTimeLeft] = useState(30)
  const id = useId()

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(prev => prev - 1)
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [timeLeft])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60

    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleResend = () => {
    setTimeLeft(60)
  }

  return (
    <div className='space-y-3'>
      <Label htmlFor={id}>Input OTP with resend timer</Label>
      <InputOTP id={id} maxLength={4}>
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
          <InputOTPSlot index={3} />
        </InputOTPGroup>
      </InputOTP>
      <p className='text-muted-foreground text-xs'>
        {timeLeft > 0 ? (
          `Resend available in ${formatTime(timeLeft)}`
        ) : (
          <a
            href='#'
            onClick={e => {
              e.preventDefault()
              handleResend()
            }}
            className='hover:text-primary underline'
          >
            Resend code
          </a>
        )}
      </p>
    </div>
  )
}

export default InputOTPWithResendTimerDemo
```

---

## 5. Outlined

Individual bordered slots.

```tsx
import { useId } from 'react'

import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { Label } from '@/components/ui/label'

const InputOTPOutlinedDemo = () => {
  const id = useId()

  return (
    <div className='space-y-3'>
      <Label htmlFor={id}>Input OTP outlined</Label>
      <InputOTP id={id} maxLength={4}>
        <InputOTPGroup className='gap-2 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border'>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
          <InputOTPSlot index={3} />
        </InputOTPGroup>
      </InputOTP>
    </div>
  )
}

export default InputOTPOutlinedDemo
```

---

## 6. Filled

Filled background slots.

```tsx
import { useId } from 'react'

import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { Label } from '@/components/ui/label'

const InputOTPFilledDemo = () => {
  const id = useId()

  return (
    <div className='space-y-3'>
      <Label htmlFor={id}>Input OTP filled</Label>
      <InputOTP id={id} maxLength={4}>
        <InputOTPGroup className='*:data-[slot=input-otp-slot]:bg-muted gap-2 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border *:data-[slot=input-otp-slot]:border-transparent *:data-[slot=input-otp-slot]:shadow-none'>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
          <InputOTPSlot index={3} />
        </InputOTPGroup>
      </InputOTP>
    </div>
  )
}

export default InputOTPFilledDemo
```

---

## 7. Minimal

Bottom border only style.

```tsx
import { useId } from 'react'

import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { Label } from '@/components/ui/label'

const InputOTPMinimalDemo = () => {
  const id = useId()

  return (
    <div className='space-y-3'>
      <Label htmlFor={id}>Input OTP minimal</Label>
      <InputOTP id={id} maxLength={4}>
        <InputOTPGroup className='gap-2 *:data-[active=true]:ring-0 *:data-[slot=input-otp-slot]:rounded-none *:data-[slot=input-otp-slot]:border-0 *:data-[slot=input-otp-slot]:border-b-2 *:data-[slot=input-otp-slot]:shadow-none *:dark:data-[slot=input-otp-slot]:bg-transparent'>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
          <InputOTPSlot index={3} />
        </InputOTPGroup>
      </InputOTP>
    </div>
  )
}

export default InputOTPMinimalDemo
```

---

## 8. Grouped

6-digit with separator.

```tsx
import { useId } from 'react'

import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@/components/ui/input-otp'
import { Label } from '@/components/ui/label'

const InputOTPGroupedDemo = () => {
  const id = useId()

  return (
    <div className='space-y-3'>
      <Label htmlFor={id}>Input OTP Grouped</Label>
      <InputOTP id={id} maxLength={6}>
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
        </InputOTPGroup>
        <InputOTPSeparator />
        <InputOTPGroup>
          <InputOTPSlot index={3} />
          <InputOTPSlot index={4} />
          <InputOTPSlot index={5} />
        </InputOTPGroup>
      </InputOTP>
    </div>
  )
}

export default InputOTPGroupedDemo
```

---

## 9. Outlined Grouped

Bordered slots with separator.

```tsx
import { useId } from 'react'

import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@/components/ui/input-otp'
import { Label } from '@/components/ui/label'

const InputOTPOutlinedGroupedDemo = () => {
  const id = useId()

  return (
    <div className='space-y-3'>
      <Label htmlFor={id}>Input OTP Outline Grouped</Label>
      <InputOTP id={id} maxLength={6}>
        <InputOTPGroup className='gap-2 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border'>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
        </InputOTPGroup>
        <InputOTPSeparator />
        <InputOTPGroup className='gap-2 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border'>
          <InputOTPSlot index={3} />
          <InputOTPSlot index={4} />
          <InputOTPSlot index={5} />
        </InputOTPGroup>
      </InputOTP>
    </div>
  )
}

export default InputOTPOutlinedGroupedDemo
```

---

## 10. Custom Separator

Dot separator between groups.

```tsx
import { useId } from 'react'

import { DotIcon } from 'lucide-react'

import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { Label } from '@/components/ui/label'

const InputOTPCustomSeparatorDemo = () => {
  const id = useId()

  return (
    <div className='space-y-3'>
      <Label htmlFor={id}>Input OTP Custom Separator</Label>
      <InputOTP id={id} maxLength={6}>
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
        </InputOTPGroup>
        <div role='separator' className='text-muted-foreground'>
          <DotIcon />
        </div>
        <InputOTPGroup>
          <InputOTPSlot index={3} />
          <InputOTPSlot index={4} />
          <InputOTPSlot index={5} />
        </InputOTPGroup>
      </InputOTP>
    </div>
  )
}

export default InputOTPCustomSeparatorDemo
```
