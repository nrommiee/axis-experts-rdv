# Input Mask Components

6 variants from ShadcnStudio. Select based on use case.

## Quick Reference

| # | Style | Library | Use Case |
|---|-------|---------|----------|
| 1 | Custom Mask | use-mask-input | License plates, codes |
| 2 | Time | use-mask-input | Time entry (HH:MM:ss) |
| 3 | Card Number | react-payment-inputs | Credit card number |
| 4 | Expiry Date | react-payment-inputs | Card expiration |
| 5 | CVC Code | react-payment-inputs | Card security code |
| 6 | Card Details | react-payment-inputs | Full card form |

---

## 1. Custom Mask

Input with custom pattern mask.

```tsx
'use client'

import { useId } from 'react'

import { withMask } from 'use-mask-input'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const InputWithMaskDemo = () => {
  const id = useId()

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Input with mask</Label>
      <Input
        id={id}
        type='text'
        placeholder='AB12 CDE'
        ref={withMask('AA99 AAA', {
          placeholder: '_',
          showMaskOnHover: false
        })}
      />
      <p className='text-muted-foreground text-xs'>
        Built with{' '}
        <a
          className='hover:text-foreground underline'
          href='https://github.com/eduardoborges/use-mask-input'
          target='_blank'
          rel='noopener noreferrer'
        >
          use-mask-input
        </a>
      </p>
    </div>
  )
}

export default InputWithMaskDemo
```

---

## 2. Time

Time input with HH:MM:ss format.

```tsx
'use client'

import { useId } from 'react'

import { withMask } from 'use-mask-input'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const InputTimeDemo = () => {
  const id = useId()

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Input time</Label>
      <Input
        id={id}
        type='text'
        placeholder='00:00:00'
        ref={withMask('datetime', {
          placeholder: '_',
          inputFormat: 'HH:MM:ss',
          outputFormat: 'HH:MM:ss',
          showMaskOnHover: false
        })}
      />
      <p className='text-muted-foreground text-xs'>
        Built with{' '}
        <a
          className='hover:text-foreground underline'
          href='https://github.com/eduardoborges/use-mask-input'
          target='_blank'
          rel='noopener noreferrer'
        >
          use-mask-input
        </a>
      </p>
    </div>
  )
}

export default InputTimeDemo
```

---

## 3. Card Number

Credit card number with auto-detection.

```tsx
'use client'

import { useId } from 'react'

import { CreditCardIcon } from 'lucide-react'

import { usePaymentInputs } from 'react-payment-inputs'
import images, { type CardImages } from 'react-payment-inputs/images'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const InputCardNumberDemo = () => {
  const id = useId()
  const { meta, getCardNumberProps, getCardImageProps } = usePaymentInputs()

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Card number</Label>
      <div className='relative'>
        <Input {...getCardNumberProps()} id={id} className='peer pr-11' />
        <div className='text-muted-foreground pointer-events-none absolute inset-y-0 right-0 flex items-center justify-center pr-3 peer-disabled:opacity-50'>
          {meta.cardType ? (
            <svg
              className='w-6 overflow-hidden'
              {...getCardImageProps({
                images: images as unknown as CardImages
              })}
            />
          ) : (
            <CreditCardIcon className='size-4' />
          )}
          <span className='sr-only'>Card Provider</span>
        </div>
      </div>
      <p className='text-muted-foreground text-xs'>
        Built with{' '}
        <a
          className='hover:text-foreground underline'
          href='https://github.com/medipass/react-payment-inputs'
          target='_blank'
          rel='noopener noreferrer'
        >
          React Payment Inputs
        </a>
      </p>
    </div>
  )
}

export default InputCardNumberDemo
```

---

## 4. Expiry Date

Card expiration date input.

```tsx
'use client'

import { useId } from 'react'

import { usePaymentInputs } from 'react-payment-inputs'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const InputExpiryDateDemo = () => {
  const id = useId()
  const { getExpiryDateProps } = usePaymentInputs()

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Expiry date</Label>
      <Input {...getExpiryDateProps()} id={id} />
      <p className='text-muted-foreground text-xs'>
        Built with{' '}
        <a
          className='hover:text-foreground underline'
          href='https://github.com/medipass/react-payment-inputs'
          target='_blank'
          rel='noopener noreferrer'
        >
          React Payment Inputs
        </a>
      </p>
    </div>
  )
}

export default InputExpiryDateDemo
```

---

## 5. CVC Code

Card security code input.

```tsx
'use client'

import { useId } from 'react'

import { usePaymentInputs } from 'react-payment-inputs'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const InputCVCCodeDemo = () => {
  const id = useId()
  const { getCVCProps } = usePaymentInputs()

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>CVC code</Label>
      <Input {...getCVCProps()} id={id} />
      <p className='text-muted-foreground text-xs'>
        Built with{' '}
        <a
          className='hover:text-foreground underline'
          href='https://github.com/medipass/react-payment-inputs'
          target='_blank'
          rel='noopener noreferrer'
        >
          React Payment Inputs
        </a>
      </p>
    </div>
  )
}

export default InputCVCCodeDemo
```

---

## 6. Card Details

Complete card details form.

```tsx
'use client'

import { useId } from 'react'

import { CreditCardIcon } from 'lucide-react'

import { usePaymentInputs } from 'react-payment-inputs'
import images, { type CardImages } from 'react-payment-inputs/images'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const InputCardDetailsDemo = () => {
  const id = useId()
  const { meta, getCardNumberProps, getExpiryDateProps, getCVCProps, getCardImageProps } = usePaymentInputs()

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label>Card details</Label>
      <div>
        <div className='relative focus-within:z-1'>
          <Input {...getCardNumberProps()} id={`number-${id}`} className='peer rounded-b-none pr-9 shadow-none' />
          <div className='text-muted-foreground pointer-events-none absolute inset-y-0 right-0 flex items-center justify-center pr-3 peer-disabled:opacity-50'>
            {meta.cardType ? (
              <svg
                className='w-6 overflow-hidden'
                {...getCardImageProps({
                  images: images as unknown as CardImages
                })}
              />
            ) : (
              <CreditCardIcon className='size-4' />
            )}
            <span className='sr-only'>Card Provider</span>
          </div>
        </div>
        <div className='-mt-px flex'>
          <div className='min-w-0 flex-1 focus-within:z-1'>
            <Input
              {...getExpiryDateProps()}
              id={`expiry-${id}`}
              className='rounded-t-none rounded-r-none shadow-none'
            />
          </div>
          <div className='-ms-px min-w-0 flex-1 focus-within:z-1'>
            <Input {...getCVCProps()} id={`cvc-${id}`} className='rounded-t-none rounded-l-none shadow-none' />
          </div>
        </div>
      </div>
      <p className='text-muted-foreground text-xs'>
        Built with{' '}
        <a
          className='hover:text-foreground underline'
          href='https://github.com/medipass/react-payment-inputs'
          target='_blank'
          rel='noopener noreferrer'
        >
          React Payment Inputs
        </a>
      </p>
    </div>
  )
}

export default InputCardDetailsDemo
```
