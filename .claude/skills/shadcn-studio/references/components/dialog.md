# Dialog Components

Collection de 23 variantes de Dialog de shadcn-studio.

## Référence Rapide

| # | Nom | Description |
|---|-----|-------------|
| 1 | Alert Dialog | Dialog d'alerte basique |
| 2 | With Icon | Alert avec icône (update) |
| 3 | Destructive | Alert destructive avec checkbox |
| 4 | Scrollable | Dialog avec contenu scrollable |
| 5 | Sticky Header | Header fixe, contenu scrollable |
| 6 | Sticky Footer | Footer fixe, contenu scrollable |
| 7 | Full Screen | Dialog plein écran |
| 8 | Terms & Conditions | Dialog conditions d'utilisation |
| 9 | Subscribe | Dialog d'inscription newsletter |
| 10 | Refer & Earn | Dialog parrainage avec avatars |
| 11 | Rating | Dialog notation avec emojis |
| 12 | OTP Verification | Dialog vérification code OTP |
| 13 | Sign Up | Dialog inscription avec gradient |
| 14 | Sign In | Dialog connexion avec social login |
| 15 | Invite Friends | Dialog invitation avec liste |
| 16 | Top Left Align | Position top-left |
| 17 | Top Align | Position top center |
| 18 | Top Right Align | Position top-right |
| 19 | Middle Left Align | Position middle-left |
| 20 | Middle Right Align | Position middle-right |
| 21 | Bottom Left Align | Position bottom-left |
| 22 | Bottom Align | Position bottom center |
| 23 | Bottom Right Align | Position bottom-right |

---

## Dialog 1 - Alert Dialog

Dialog d'alerte basique.

```tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

const AlertDialogDemo = () => {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant='outline'>Alert Dialog</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your account and remove your data from our
            servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default AlertDialogDemo
```

---

## Dialog 2 - With Icon

Alert avec icône de mise à jour.

```tsx
import { UploadIcon } from 'lucide-react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

const AlertDialogWithIconDemo = () => {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant='outline'>Alert Dialog (With Icon)</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className='mb-4 flex size-9 items-center justify-center rounded-full bg-sky-600/10 sm:mx-0 dark:bg-sky-400/10'>
            <UploadIcon className='size-4.5 text-sky-600 dark:text-sky-400' />
          </div>
          <AlertDialogTitle>New Update is Available</AlertDialogTitle>
          <AlertDialogDescription>
            New update is available for your application. Please update to the latest version to enjoy new features.
          </AlertDialogDescription>
          <ol className='text-muted-foreground mt-4 flex list-decimal flex-col gap-2 pl-6 text-sm'>
            <li>New analytics widgets for daily/weekly metrics</li>
            <li>Simplified navigation menu</li>
            <li>Dark mode support</li>
            <li>Timeline: 6 weeks</li>
            <li>Follow-up meeting scheduled for next Tuesday</li>
          </ol>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction className='bg-sky-600 text-white hover:bg-sky-600 focus-visible:ring-sky-600 dark:bg-sky-400 dark:hover:bg-sky-400 dark:focus-visible:ring-sky-400'>
            Update Now
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default AlertDialogWithIconDemo
```

---

## Dialog 3 - Destructive

Alert destructive avec checkbox.

```tsx
import { TriangleAlertIcon } from 'lucide-react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

const AlertDialogDestructiveDemo = () => {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant='outline'>Alert Dialog Destructive</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader className='items-center'>
          <div className='bg-destructive/10 mx-auto mb-2 flex size-12 items-center justify-center rounded-full'>
            <TriangleAlertIcon className='text-destructive size-6' />
          </div>
          <AlertDialogTitle>Are you absolutely sure you want to delete?</AlertDialogTitle>
          <AlertDialogDescription className='text-center'>
            This action cannot be undone. This will permanently delete your account and remove your data from our
            servers.
            <span className='mt-4 flex items-center justify-center gap-3'>
              <Checkbox id='terms' />
              <Label htmlFor='terms'>Don&apos;t ask next again</Label>
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction className='bg-destructive dark:bg-destructive/60 hover:bg-destructive focus-visible:ring-destructive text-white'>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default AlertDialogDestructiveDemo
```

---

## Dialog 4 - Scrollable

Dialog avec contenu scrollable.

```tsx
import { ChevronLeftIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'

const DialogScrollableDemo = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant='outline'>Scrollable Dialog</Button>
      </DialogTrigger>
      <DialogContent className='flex max-h-[min(600px,80vh)] flex-col gap-0 p-0 sm:max-w-md'>
        <ScrollArea className='flex max-h-full flex-col overflow-hidden'>
          <DialogHeader className='contents space-y-0 text-left'>
            <DialogTitle className='px-6 pt-6'>Product Information</DialogTitle>
            <DialogDescription asChild>
              <div className='p-6'>
                <div className='[&_strong]:text-foreground space-y-4 [&_strong]:font-semibold'>
                  <div className='space-y-1'>
                    <p><strong>Product Name:</strong> SuperTech 2000</p>
                    <p>The SuperTech 2000 is a high-performance device designed for tech enthusiasts.</p>
                  </div>
                  <div className='space-y-1'>
                    <p><strong>Specifications:</strong></p>
                    <ul>
                      <li>Processor: 3.6GHz Octa-Core</li>
                      <li>Memory: 16GB RAM</li>
                      <li>Storage: 1TB SSD</li>
                      <li>Display: 15.6" 4K UHD</li>
                      <li>Battery Life: 12 hours</li>
                    </ul>
                  </div>
                  <div className='space-y-1'>
                    <p><strong>Price:</strong></p>
                    <p>$2,499.99 (Includes 1-year warranty)</p>
                  </div>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className='px-6 pb-6 sm:justify-end'>
            <DialogClose asChild>
              <Button variant='outline'><ChevronLeftIcon />Back</Button>
            </DialogClose>
            <Button type='button'>Read More</Button>
          </DialogFooter>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

export default DialogScrollableDemo
```

---

## Dialog 5 - Sticky Header

Header fixe avec contenu scrollable.

```tsx
import { ChevronLeftIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'

const DialogStickyHeaderDemo = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant='outline'>Sticky Header Dialog</Button>
      </DialogTrigger>
      <DialogContent className='flex max-h-[min(600px,80vh)] flex-col gap-0 p-0 sm:max-w-md'>
        <DialogHeader className='contents space-y-0 text-left'>
          <DialogTitle className='border-b px-6 py-4'>Product Information</DialogTitle>
          <ScrollArea className='flex max-h-full flex-col overflow-hidden'>
            <DialogDescription asChild>
              <div className='p-6'>
                {/* Content here */}
              </div>
            </DialogDescription>
            <DialogFooter className='px-6 pb-6 sm:justify-end'>
              <DialogClose asChild>
                <Button variant='outline'><ChevronLeftIcon />Back</Button>
              </DialogClose>
              <Button type='button'>Read More</Button>
            </DialogFooter>
          </ScrollArea>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}

export default DialogStickyHeaderDemo
```

---

## Dialog 6 - Sticky Footer

Footer fixe avec contenu scrollable.

```tsx
import { ChevronLeftIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'

const DialogStickyFooterDemo = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant='outline'>Sticky Footer Dialog</Button>
      </DialogTrigger>
      <DialogContent className='flex max-h-[min(600px,80vh)] flex-col gap-0 p-0 sm:max-w-md'>
        <DialogHeader className='contents space-y-0 text-left'>
          <ScrollArea className='flex max-h-full flex-col overflow-hidden'>
            <DialogTitle className='px-6 pt-6'>Product Information</DialogTitle>
            <DialogDescription asChild>
              <div className='p-6'>
                {/* Scrollable content here */}
              </div>
            </DialogDescription>
          </ScrollArea>
        </DialogHeader>
        <DialogFooter className='px-6 pb-6 sm:justify-end'>
          <DialogClose asChild>
            <Button variant='outline'><ChevronLeftIcon />Back</Button>
          </DialogClose>
          <Button type='button'>Read More</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default DialogStickyFooterDemo
```

---

## Dialog 8 - Terms & Conditions

Dialog conditions d'utilisation.

```tsx
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'

const DialogTermsAndConditionDemo = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant='outline'>Terms & Condition</Button>
      </DialogTrigger>
      <DialogContent className='gap-0 p-0 sm:max-h-[min(600px,80vh)] sm:max-w-md'>
        <DialogHeader className='contents space-y-0 text-left'>
          <DialogTitle className='border-b px-6 py-4'>Terms and Condition</DialogTitle>
          <div className='text-muted-foreground px-6 py-4 text-sm'>
            <ol className='flex list-decimal flex-col gap-2 pl-4'>
              <li><strong className='text-primary'>Eligibility:</strong> You must be at least 18 years old.</li>
              <li><strong className='text-primary'>Account Responsibility:</strong> You are responsible for your account.</li>
              <li><strong className='text-primary'>Usage:</strong> Do not misuse or attempt to disrupt the service.</li>
              <li><strong className='text-primary'>Data Collection:</strong> We collect data as described in our Privacy Policy.</li>
              <li><strong className='text-primary'>Modifications:</strong> We may update these terms at any time.</li>
              <li><strong className='text-primary'>Termination:</strong> We may suspend your access if you violate terms.</li>
            </ol>
          </div>
          <DialogFooter className='px-6 pb-4 sm:justify-end'>
            <DialogClose asChild>
              <Button variant='outline'>Cancel</Button>
            </DialogClose>
            <DialogClose asChild>
              <Button type='button'>I Agree</Button>
            </DialogClose>
          </DialogFooter>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}

export default DialogTermsAndConditionDemo
```

---

## Dialog 9 - Subscribe

Dialog d'inscription newsletter.

```tsx
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const DialogSubscribeDemo = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant='outline'>Subscribe</Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader className='text-center'>
          <DialogTitle className='text-xl'>Subscribe blog for latest updates</DialogTitle>
          <DialogDescription className='text-base'>
            Subscribe to our blog to stay updated with the latest posts and news.
          </DialogDescription>
        </DialogHeader>
        <form className='flex gap-4'>
          <div className='grid grow-1 gap-3'>
            <Label htmlFor='email'>Email</Label>
            <Input type='email' id='email' name='email' placeholder='example@gmail.com' required />
          </div>
          <Button type='submit' className='self-end'>Subscribe</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default DialogSubscribeDemo
```

---

## Dialog 10 - Refer & Earn

Dialog parrainage avec avatars.

```tsx
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const avatars = [
  { src: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-3.png', fallback: 'OS', name: 'Olivia Sparks' },
  { src: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-6.png', fallback: 'HL', name: 'Howard Lloyd' },
  { src: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-5.png', fallback: 'HR', name: 'Hallie Richards' }
]

const DialogReferAndEarnDemo = () => {
  return (
    <Dialog>
      <form>
        <DialogTrigger asChild>
          <Button variant='outline'>Refer & Earn</Button>
        </DialogTrigger>
        <DialogContent className='sm:max-w-xl'>
          <DialogHeader>
            <DialogTitle className='text-xl'>Refers & Earn AI Credits</DialogTitle>
            <DialogDescription className='text-base'>
              Get 5 AI credits per successful referral sign up.
            </DialogDescription>
          </DialogHeader>
          <form className='flex flex-col gap-4 pt-4'>
            <div className='grid grow-1 gap-3'>
              <Label htmlFor='email'>Refer by email</Label>
              <Input type='text' id='email' name='email' placeholder='Emails, separated by comas or tab' required />
            </div>
            <div className='flex items-center gap-3'>
              <Checkbox id='terms' />
              <Label htmlFor='terms'>Refer 13 people from acme.com</Label>
            </div>
            <div className='flex -space-x-2'>
              {avatars.map((avatar, index) => (
                <Avatar key={index} className='ring-background ring-2'>
                  <AvatarImage src={avatar.src} alt={avatar.name} />
                  <AvatarFallback className='text-xs'>{avatar.fallback}</AvatarFallback>
                </Avatar>
              ))}
              <Avatar className='ring-background ring-2'>
                <AvatarFallback className='text-xs'>+10</AvatarFallback>
              </Avatar>
            </div>
            <DialogFooter className='sm:justify-end'>
              <DialogClose asChild>
                <Button variant='outline'>Cancel</Button>
              </DialogClose>
              <Button type='submit'>Refer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </form>
    </Dialog>
  )
}

export default DialogReferAndEarnDemo
```

---

## Dialog 11 - Rating

Dialog notation avec emojis.

```tsx
import { useId } from 'react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'

const DialogRatingDemo = () => {
  const id = useId()

  const ratings = [
    { value: '1', label: 'Angry', icon: '😡' },
    { value: '2', label: 'Sad', icon: '🙁' },
    { value: '3', label: 'Neutral', icon: '🙂' },
    { value: '4', label: 'Happy', icon: '😁' },
    { value: '5', label: 'Laughing', icon: '🤩' }
  ]

  return (
    <Dialog>
      <form>
        <DialogTrigger asChild>
          <Button variant='outline'>Rating</Button>
        </DialogTrigger>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle className='text-xl'>Help us improve our product for you</DialogTitle>
          </DialogHeader>
          <form className='flex flex-col gap-4 pt-4'>
            <fieldset className='space-y-4'>
              <legend className='text-foreground text-sm leading-none font-medium'>
                How would you like to describe your experience with the app today?
              </legend>
              <RadioGroup className='flex gap-1.5' defaultValue='5'>
                {ratings.map(rating => (
                  <label
                    key={`${id}-${rating.value}`}
                    className='border-input relative flex size-9 cursor-pointer flex-col items-center justify-center rounded-full border text-center text-xl shadow-xs transition-[color,box-shadow] outline-none has-data-[state=checked]:border-sky-600 has-data-[state=checked]:bg-sky-600/10'
                  >
                    <RadioGroupItem id={`${id}-${rating.value}`} value={rating.value} className='sr-only after:absolute after:inset-0' />
                    {rating.icon}
                  </label>
                ))}
              </RadioGroup>
            </fieldset>
            <div className='grid grow-1 gap-3'>
              <Textarea placeholder='Type your message here.' id='message-2' required />
              <p className='text-muted-foreground text-sm'>500/500 characters left</p>
            </div>
            <div className='flex gap-3'>
              <Checkbox id='terms' />
              <Label htmlFor='terms'>I consent to Shadcn Studio contacting me based on my feedback</Label>
            </div>
            <DialogFooter className='sm:justify-end'>
              <DialogClose asChild>
                <Button variant='outline'>Cancel</Button>
              </DialogClose>
              <Button type='submit'>Submit</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </form>
    </Dialog>
  )
}

export default DialogRatingDemo
```

---

## Dialog 12 - OTP Verification

Dialog vérification code OTP.

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { CheckIcon, MailIcon } from 'lucide-react'
import { OTPInput, type SlotProps } from 'input-otp'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

const CORRECT_CODE = '11208'

const DialogOTPVerificationDemo = () => {
  const [value, setValue] = useState('')
  const [hasGuessed, setHasGuessed] = useState<undefined | boolean>(undefined)
  const inputRef = useRef<HTMLInputElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (hasGuessed) closeButtonRef.current?.focus()
  }, [hasGuessed])

  async function onSubmit(e?: React.FormEvent<HTMLFormElement>) {
    e?.preventDefault?.()
    inputRef.current?.select()
    await new Promise(r => setTimeout(r, 100))
    setHasGuessed(value === CORRECT_CODE)
    setValue('')
    setTimeout(() => inputRef.current?.blur(), 20)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant='outline'>OTP code</Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-md'>
        <div className='flex flex-col items-center gap-2'>
          <div className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-full bg-sky-600/10',
            { 'bg-green-600/10': hasGuessed }
          )}>
            {hasGuessed ? <CheckIcon className='text-green-600' /> : <MailIcon className='text-sky-600' />}
          </div>
          <DialogHeader>
            <DialogTitle className='sm:text-center'>
              {hasGuessed ? 'Account verified!' : 'Check Your Email'}
            </DialogTitle>
            <DialogDescription className='sm:text-center'>
              {hasGuessed ? (
                <span>Congratulations! your email has been verified</span>
              ) : (
                <span>We have sent a verification code. Try {CORRECT_CODE}</span>
              )}
            </DialogDescription>
          </DialogHeader>
        </div>

        {hasGuessed ? (
          <div className='text-center'>
            <DialogClose asChild>
              <Button type='button' ref={closeButtonRef}>Continue</Button>
            </DialogClose>
          </div>
        ) : (
          <div className='space-y-4'>
            <div className='flex justify-center'>
              <OTPInput
                ref={inputRef}
                value={value}
                onChange={setValue}
                maxLength={5}
                onComplete={onSubmit}
                render={({ slots }) => (
                  <div className='flex gap-2'>
                    {slots.map((slot, idx) => (
                      <div key={idx} className={cn(
                        'border-input flex size-9 items-center justify-center rounded-md border font-medium',
                        { 'border-ring ring-ring/50 z-10 ring-[3px]': slot.isActive }
                      )}>
                        {slot.char}
                      </div>
                    ))}
                  </div>
                )}
              />
            </div>
            <p className='text-center text-sm'>
              Didn't get a code? <a className='text-sky-600 hover:underline' href='#'>Resend</a>
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default DialogOTPVerificationDemo
```

---

## Dialog 13 - Sign Up

Dialog inscription avec gradient.

```tsx
import { useId } from 'react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const DialogSignUpDemo = () => {
  const id = useId()

  return (
    <Dialog>
      <form>
        <DialogTrigger asChild>
          <Button variant='outline'>Sign Up</Button>
        </DialogTrigger>
        <DialogContent className='to-card bg-gradient-to-b from-green-100 to-40% sm:max-w-sm dark:from-green-900'>
          <DialogHeader className='items-center'>
            <DialogTitle>Sign Up</DialogTitle>
            <DialogDescription>Start your 60-day free trial now.</DialogDescription>
          </DialogHeader>
          <form className='flex flex-col gap-4'>
            <div className='grid grid-cols-2 gap-4'>
              <div className='grid gap-3'>
                <Label htmlFor='first-name'>First Name</Label>
                <Input id='first-name' name='firstname' placeholder='John' />
              </div>
              <div className='grid gap-3'>
                <Label htmlFor='last-name'>Last Name</Label>
                <Input id='last-name' name='lastname' placeholder='Doe' />
              </div>
            </div>
            <div className='grid gap-3'>
              <Label htmlFor='email'>Email</Label>
              <Input type='email' id='email' name='useremail' placeholder='example@gmail.com' />
            </div>
            <div className='grid gap-3'>
              <Label htmlFor='password'>Password</Label>
              <Input type='password' id='password' name='userpassword' placeholder='Password' />
            </div>
            <div className='flex items-center gap-2'>
              <Checkbox id={id} className='data-[state=checked]:border-green-600 data-[state=checked]:bg-green-600' defaultChecked />
              <Label htmlFor={id}>I agree with <a href='#' className='underline'>condition</a> and <a href='#' className='underline'>privacy policy</a></Label>
            </div>
          </form>
          <DialogFooter className='pt-4 sm:flex-col'>
            <Button className='bg-green-600 text-white hover:bg-green-600'>Start your trial</Button>
            <div className='before:bg-border after:bg-border flex items-center gap-4 before:h-px before:flex-1 after:h-px after:flex-1'>
              <span className='text-muted-foreground text-xs'>Or</span>
            </div>
            <Button variant='outline'>
              <img src='https://cdn.shadcnstudio.com/ss-assets/brand-logo/google-icon.png?width=20&height=20&format=auto' alt='Google Icon' className='size-5' />
              Continue with Google
            </Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  )
}

export default DialogSignUpDemo
```

---

## Dialog 14 - Sign In

Dialog connexion avec social login.

```tsx
import { LogInIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const DialogSignInDemo = () => {
  return (
    <Dialog>
      <form>
        <DialogTrigger asChild>
          <Button variant='outline'>Sign In</Button>
        </DialogTrigger>
        <DialogContent className='to-card bg-gradient-to-b from-sky-100 to-40% sm:max-w-sm dark:from-sky-900'>
          <DialogHeader className='items-center'>
            <div className='mb-4 flex size-12 items-center justify-center rounded-full bg-sky-600/10'>
              <LogInIcon className='size-6 text-sky-600' />
            </div>
            <DialogTitle>Sign in with email</DialogTitle>
            <DialogDescription className='text-center'>Make a new doc to bring your words, data and teams together.</DialogDescription>
          </DialogHeader>
          <form className='flex flex-col gap-4'>
            <div className='grid gap-3'>
              <Label htmlFor='email'>Email</Label>
              <Input type='email' id='email' placeholder='example@gmail.com' />
            </div>
            <div className='grid gap-3'>
              <Label htmlFor='password'>Password</Label>
              <Input type='password' id='password' placeholder='Password' />
            </div>
          </form>
          <DialogFooter className='space-y-2 pt-4 sm:flex-col'>
            <Button className='bg-sky-600 text-white hover:bg-sky-600'>Get Started</Button>
            <div className='before:bg-border after:bg-border flex items-center gap-4 before:h-px before:flex-1 after:h-px after:flex-1'>
              <span className='text-muted-foreground text-xs'>Or sign in with</span>
            </div>
            <div className='flex flex-wrap items-center justify-center gap-4'>
              <Button variant='outline' className='flex-1'>
                <img src='https://cdn.shadcnstudio.com/ss-assets/brand-logo/google-icon.png' alt='Google' className='size-5' />
              </Button>
              <Button variant='outline' className='flex-1'>
                <img src='https://cdn.shadcnstudio.com/ss-assets/brand-logo/twitter-icon.png' alt='X' className='size-5 dark:invert' />
              </Button>
              <Button variant='outline' className='flex-1'>
                <img src='https://cdn.shadcnstudio.com/ss-assets/brand-logo/facebook-icon.png' alt='Facebook' className='size-5' />
              </Button>
              <Button variant='outline' className='flex-1'>
                <img src='https://cdn.shadcnstudio.com/ss-assets/brand-logo/github-icon.png' alt='GitHub' className='size-5 dark:invert' />
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  )
}

export default DialogSignInDemo
```

---

## Dialog 15 - Invite Friends

Dialog invitation avec liste d'amis.

```tsx
import { UserPlusIcon } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const friends = [
  { src: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-1.png', fallback: 'CP', name: 'Cristofer Press', mail: 'cristoferpress@gmail.com' },
  { src: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-2.png', fallback: 'Ck', name: 'Carla Korsgaard', mail: 'carlakorsgaard@gmail.com' },
  { src: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-3.png', fallback: 'HB', name: 'Hanna Baptista', mail: 'hannabaptista@gmail.com' },
]

const DialogInviteFriendsDemo = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant='outline'>Invite</Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader className='text-center'>
          <DialogTitle className='text-xl'>Invite new members</DialogTitle>
        </DialogHeader>
        <form className='flex gap-4 max-sm:flex-col'>
          <div className='grid gap-3'>
            <Label htmlFor='email'>Email</Label>
            <Input type='email' id='email' placeholder='example@gmail.com' required />
          </div>
          <Button type='submit' className='sm:self-end'>Send Invite</Button>
        </form>
        <p className='mt-2'>Invite Friends</p>
        <ul className='space-y-4'>
          {friends.map((item, index) => (
            <li key={index} className='flex items-center justify-between gap-3'>
              <div className='flex items-center gap-3'>
                <Avatar className='size-10'>
                  <AvatarImage src={item.src} alt={item.name} />
                  <AvatarFallback>{item.fallback}</AvatarFallback>
                </Avatar>
                <div className='flex flex-col'>
                  <span>{item.name}</span>
                  <span className='text-muted-foreground text-sm'>{item.mail}</span>
                </div>
              </div>
              <Button size='sm' className='bg-sky-600 text-white hover:bg-sky-600'>
                <UserPlusIcon />Invite
              </Button>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  )
}

export default DialogInviteFriendsDemo
```

---

## Dialog 16-23 - Position Variants

### Dialog 16 - Top Left Align

```tsx
<DialogContent className='sm:top-0 sm:left-0 sm:m-6 sm:max-w-[425px] sm:translate-x-0 sm:translate-y-0'>
```

### Dialog 17 - Top Align

```tsx
<DialogContent className='top-0 mt-6 translate-y-0 sm:max-w-[425px]'>
```

### Dialog 18 - Top Right Align

```tsx
<DialogContent className='sm:top-0 sm:right-0 sm:left-auto sm:m-6 sm:max-w-[425px] sm:translate-x-0 sm:translate-y-0'>
```

### Dialog 19 - Middle Left Align

```tsx
<DialogContent className='sm:left-0 sm:ml-6 sm:max-w-[425px] sm:translate-x-0'>
```

### Dialog 20 - Middle Right Align

```tsx
<DialogContent className='sm:right-0 sm:left-auto sm:mr-6 sm:max-w-[425px] sm:translate-x-0'>
```

### Dialog 21 - Bottom Left Align

```tsx
<DialogContent className='sm:top-auto sm:bottom-0 sm:left-0 sm:m-6 sm:max-w-[425px] sm:translate-x-0 sm:translate-y-0'>
```

### Dialog 22 - Bottom Align

```tsx
<DialogContent className='top-auto bottom-0 mb-6 translate-y-0 sm:max-w-[425px]'>
```

### Dialog 23 - Bottom Right Align

```tsx
<DialogContent className='sm:top-auto sm:right-0 sm:bottom-0 sm:left-auto sm:m-6 sm:max-w-[425px] sm:translate-x-0 sm:translate-y-0'>
```
