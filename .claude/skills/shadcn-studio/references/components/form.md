# Form Components

Collection de 10 variantes de Form de shadcn-studio.

---

## 1. Radio Group Form

```tsx
'use client'

import { CheckCheckIcon } from 'lucide-react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { Alert, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

const RadioGroupFormDemo = () => {
  const FormSchema = z.object({
    selectedOption: z.string().nonempty({
      message: 'You must select an option.'
    })
  })

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: { selectedOption: '' }
  })

  function onSubmit(data: z.infer<typeof FormSchema>) {
    toast.custom(() => (
      <Alert className='border-green-600 text-green-600 dark:border-green-400 dark:text-green-400'>
        <CheckCheckIcon />
        <AlertTitle>Selected Option: {data.selectedOption}</AlertTitle>
      </Alert>
    ))
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='w-full max-w-xs space-y-6'>
        <FormField
          control={form.control}
          name='selectedOption'
          render={({ field }) => (
            <FormItem className='space-y-3'>
              <FormLabel>Manage data sharing preferences</FormLabel>
              <FormControl>
                <RadioGroup onValueChange={field.onChange} value={field.value}>
                  <div className='flex items-center space-x-2'>
                    <RadioGroupItem value='share data' id='share-option' />
                    <FormLabel htmlFor='share-option' className='font-normal'>
                      Share Data for Personalized Experience
                    </FormLabel>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <RadioGroupItem value='do not share' id='no-share-option' />
                    <FormLabel htmlFor='no-share-option' className='font-normal'>
                      Do Not Share Any Data
                    </FormLabel>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <RadioGroupItem value='customize' id='customize-option' />
                    <FormLabel htmlFor='customize-option' className='font-normal'>
                      Customize Data Sharing Preferences
                    </FormLabel>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormDescription>Please select one of the options to proceed.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type='submit'>Update Preferences</Button>
      </form>
    </Form>
  )
}

export default RadioGroupFormDemo
```

---

## 2. Checkbox Form

```tsx
'use client'

import { CheckCheckIcon } from 'lucide-react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { Alert, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'

const CheckboxFormDemo = () => {
  const FormSchema = z.object({
    acceptTerms: z.boolean().refine(val => val === true, {
      message: 'You must accept the terms and conditions.'
    })
  })

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: { acceptTerms: false }
  })

  function onSubmit() {
    toast.custom(() => (
      <Alert className='border-green-600 text-green-600 dark:border-green-400 dark:text-green-400'>
        <CheckCheckIcon />
        <AlertTitle>Welcome to the community!</AlertTitle>
      </Alert>
    ))
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='w-full max-w-xs space-y-6'>
        <FormField
          control={form.control}
          name='acceptTerms'
          render={({ field }) => (
            <FormItem>
              <div className='flex items-center space-x-2'>
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel>Agree to Join the Community</FormLabel>
              </div>
              <FormDescription>
                By clicking &apos;Join Now&apos;, you accept our Community Guidelines and Privacy Policy. We&apos;re
                excited to have you on board!
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type='submit'>Join Now</Button>
      </form>
    </Form>
  )
}

export default CheckboxFormDemo
```

---

## 3. Switch Form

```tsx
'use client'

import { CheckCheckIcon } from 'lucide-react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { Alert, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { Switch } from '@/components/ui/switch'

const SwitchFormDemo = () => {
  const FormSchema = z.object({
    stepTracker: z.boolean().refine(val => val === true, {
      message: 'You must enable step tracker to proceed.'
    })
  })

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: { stepTracker: false }
  })

  function onSubmit(data: z.infer<typeof FormSchema>) {
    toast.custom(() => (
      <Alert className='border-green-600 text-green-600 dark:border-green-400 dark:text-green-400'>
        <CheckCheckIcon />
        <AlertTitle>Step tracker is {data.stepTracker ? 'enabled' : 'disabled'} &quot;Go! Run&quot;.</AlertTitle>
      </Alert>
    ))
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='w-full max-w-xs space-y-6'>
        <FormField
          control={form.control}
          name='stepTracker'
          render={({ field }) => (
            <FormItem>
              <div className='flex items-center space-x-2'>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel>Enable Daily Step Tracker</FormLabel>
              </div>
              <FormDescription>Track your daily steps to help you reach your fitness goals.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type='submit'>Activate</Button>
      </form>
    </Form>
  )
}

export default SwitchFormDemo
```

---

## 4. Input Form (Reset Password)

```tsx
'use client'

import { CheckCheckIcon } from 'lucide-react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { Alert, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

const FormSchema = z.object({
  email: z.string().min(1, 'Email is required').email({ message: 'Please enter a valid email address.' })
})

const InputFormDemo = () => {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: { email: '' }
  })

  const onSubmit = () => {
    toast.custom(() => (
      <Alert className='border-green-600 text-green-600 dark:border-green-400 dark:text-green-400'>
        <CheckCheckIcon />
        <AlertTitle>Reset password link sent to your email</AlertTitle>
      </Alert>
    ))
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='w-full max-w-xs space-y-6'>
        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reset Your Password:</FormLabel>
              <FormControl>
                <Input placeholder='Email address' {...field} />
              </FormControl>
              <FormDescription>Enter your email address to receive a reset link.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type='submit'>Send Link</Button>
      </form>
    </Form>
  )
}

export default InputFormDemo
```

---

## 5. Textarea Form

```tsx
'use client'

import { CheckCheckIcon } from 'lucide-react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { Alert, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'

const TextareaFormDemo = () => {
  // Validation schema
  const FormSchema = z.object({
    message: z
      .string()
      .min(50, 'Message must be at least 50 characters long.')
      .max(500, 'Message cannot exceed 500 characters.')
  })

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: { message: '' }
  })

  function onSubmit() {
    toast.custom(() => (
      <Alert className='border-green-600 text-green-600 sm:w-110 dark:border-green-400 dark:text-green-400'>
        <CheckCheckIcon />
        <AlertTitle>Your application is submitted. We will contact you soon.</AlertTitle>
      </Alert>
    ))
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='w-full max-w-xs space-y-6'>
        {/* Textarea Field */}
        <FormField
          control={form.control}
          name='message'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tell Us About Yourself</FormLabel>
              <FormControl>
                <Textarea placeholder="Why do you think you're the perfect fit for this position?" {...field} />
              </FormControl>
              <FormDescription>
                Please include your qualifications, skills, and experiences that make you stand out.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type='submit'>Submit</Button>
      </form>
    </Form>
  )
}

export default TextareaFormDemo
```

---

## 6. Select Form

```tsx
'use client'

import { CheckCheckIcon } from 'lucide-react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { Alert, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const SelectFormDemo = () => {
  const FormSchema = z.object({
    email: z
      .string({
        required_error: 'Please select an email.'
      })
      .email()
  })

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema)
  })

  function onSubmit() {
    toast.custom(() => (
      <Alert className='border-green-600 text-green-600 sm:w-110 dark:border-green-400 dark:text-green-400'>
        <CheckCheckIcon />
        <AlertTitle>Your account has been recovered</AlertTitle>
      </Alert>
    ))
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='w-full max-w-xs space-y-6'>
        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder='Enter your registered email' />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value='m@example.com'>user1@gmail.com</SelectItem>
                  <SelectItem value='m@google.com'>user007@gmail.com</SelectItem>
                  <SelectItem value='m@support.com'>user69@outlook.com</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>Recover Your Account</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type='submit'>Recover</Button>
      </form>
    </Form>
  )
}

export default SelectFormDemo
```

---

## 7. Combobox Form (Payment Method)

```tsx
'use client'

import { useState } from 'react'

import { CheckCheckIcon, CheckIcon, ChevronsUpDownIcon } from 'lucide-react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { Alert, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

import { cn } from '@/lib/utils'

const paymentMethod = [
  { value: 'credit-card', label: 'Credit Card' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'apple-pay', label: 'Apple Pay' },
  { value: 'google-pay', label: 'Google Pay' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'bitcoin', label: 'Bitcoin' },
  { value: 'cash-on-delivery', label: 'Cash on Delivery' }
]

const FormSchema = z.object({
  method: z.string({ required_error: 'Payment method is required.' })
})

const ComboboxFormDemo = () => {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema)
  })

  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')

  function onSubmit() {
    toast.custom(() => (
      <Alert className='border-green-600 text-green-600 dark:border-green-400 dark:text-green-400'>
        <CheckCheckIcon />
        <AlertTitle>You select &quot;{value}&quot; for payment</AlertTitle>
      </Alert>
    ))
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='w-full max-w-md space-y-6'>
        <FormField
          control={form.control}
          name='method'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Select your payment method</FormLabel>
              <Popover open={open} onOpenChange={setOpen}>
                <FormControl>
                  <PopoverTrigger asChild>
                    <Button
                      variant='outline'
                      role='combobox'
                      aria-expanded={open}
                      className='w-full max-w-xs justify-between'
                      aria-label='Payment method combobox'
                    >
                      {field.value ? (
                        paymentMethod.find(method => method.value === field.value)?.label
                      ) : (
                        <span className='text-muted-foreground'>Select a payment method...</span>
                      )}
                      <ChevronsUpDownIcon className='opacity-50' />
                    </Button>
                  </PopoverTrigger>
                </FormControl>
                <PopoverContent className='w-(--radix-popper-anchor-width) p-0'>
                  <Command>
                    <CommandInput placeholder='Search payment method...' />
                    <CommandList>
                      <CommandEmpty>No payment method found.</CommandEmpty>
                      <CommandGroup>
                        {paymentMethod.map(method => (
                          <CommandItem
                            key={method.value}
                            value={method.value}
                            onSelect={() => {
                              setValue(method.value)
                              field.onChange(method.value)
                              setOpen(false)
                            }}
                          >
                            {method.label}
                            <CheckIcon
                              className={cn('ml-auto', value === method.value ? 'opacity-100' : 'opacity-0')}
                            />
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormDescription>Select your preferred payment method.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type='submit'>Continue</Button>
      </form>
    </Form>
  )
}

export default ComboboxFormDemo
```

---

## 8. Date Picker Form

```tsx
'use client'

import { CalendarIcon, CheckCheckIcon } from 'lucide-react'

import { format } from 'date-fns'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { Alert, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

import { cn } from '@/lib/utils'

const FormSchema = z.object({
  dob: z.date({
    required_error: 'A date of birth is required.'
  })
})

const DatePickerFormDemo = () => {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema)
  })

  function onSubmit() {
    toast.custom(() => (
      <Alert className='border-green-600 text-green-600 sm:w-100 dark:border-green-400 dark:text-green-400'>
        <CheckCheckIcon />
        <AlertTitle>Great we send you a personalized outfit suggestion!</AlertTitle>
      </Alert>
    ))
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='w-full max-w-xs space-y-6'>
        <FormField
          control={form.control}
          name='dob'
          render={({ field }) => (
            <FormItem className='flex flex-col'>
              <FormLabel>Timeless Trends for You</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={'outline'}
                      className={cn('pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
                    >
                      {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                      <CalendarIcon className='ml-auto opacity-50' />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0' align='start'>
                  <Calendar
                    mode='single'
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={date => date > new Date() || date < new Date('1900-01-01')}
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>
                Enter your birth date to reveal styles and outfits tailored to your fashion journey.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type='submit'>Submit</Button>
      </form>
    </Form>
  )
}

export default DatePickerFormDemo
```

---

## 9. Contact Us / Report Issue Form

```tsx
'use client'

import { CheckCheckIcon } from 'lucide-react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { Alert, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

const ContactUSFormDemo = () => {
  const FormSchema = z.object({
    email: z.string().min(1, 'Email is required').email({ message: 'Please enter a valid email address.' }),
    issue: z.string().min(1, {
      message: 'Kindly select an issue.'
    }),
    selectedOption: z.string().nonempty({
      message: 'Selection of an option is required.'
    }),
    message: z.string().min(50, 'Describe your issue using at least 50 characters.')
  })

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: { email: '', issue: '', selectedOption: '', message: '' }
  })

  const onSubmit = () => {
    toast.custom(() => (
      <Alert className='border-green-600 text-green-600 sm:w-122 dark:border-green-400 dark:text-green-400'>
        <CheckCheckIcon />
        <AlertTitle>Issue submitted successfully! Our team will reach out to you shortly.</AlertTitle>
      </Alert>
    ))
  }

  return (
    <Card className='w-full max-w-sm shadow-none'>
      <CardHeader>
        <CardTitle>Report Issue</CardTitle>
        <CardDescription>Describe the issue you&apos;re facing; our team will help you.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='w-full max-w-xs space-y-6'>
            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder='Email address' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='issue'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Issue</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className='w-full'>
                        <SelectValue placeholder='Issue you are facing' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='damaged'>Product is Damaged</SelectItem>
                      <SelectItem value='got-different'>Received wrong product</SelectItem>
                      <SelectItem value='not-like'>Not as expectation</SelectItem>
                      <SelectItem value='other'>Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='selectedOption'
              render={({ field }) => (
                <FormItem className='space-y-3'>
                  <FormLabel>How can we help you?</FormLabel>
                  <FormControl>
                    <RadioGroup onValueChange={field.onChange} value={field.value}>
                      <div className='flex items-center space-x-2'>
                        <RadioGroupItem value='replace' id='want-replace' />
                        <FormLabel htmlFor='want-replace' className='font-normal'>
                          Need a product replacement
                        </FormLabel>
                      </div>
                      <div className='flex items-center space-x-2'>
                        <RadioGroupItem value='refund' id='want-refund' />
                        <FormLabel htmlFor='want-refund' className='font-normal'>
                          Need a refund
                        </FormLabel>
                      </div>
                      <div className='flex items-center space-x-2'>
                        <RadioGroupItem value='support' id='want-support' />
                        <FormLabel htmlFor='want-support' className='font-normal'>
                          Need guidance or support
                        </FormLabel>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='message'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Please describe your issue</FormLabel>
                  <FormControl>
                    <Textarea placeholder='Provide detailed information about your issue' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type='submit'>Submit</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

export default ContactUSFormDemo
```

---

## 10. Input OTP Form

```tsx
'use client'

import { CheckCheckIcon } from 'lucide-react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { Alert, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@/components/ui/input-otp'

const FormSchema = z.object({
  pin: z.string().min(6, {
    message: 'Your one-time password must be 6 characters.'
  })
})

const InputOTPFormDemo = () => {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      pin: ''
    }
  })

  function onSubmit() {
    toast.custom(() => (
      <Alert className='border-green-600 text-green-600 sm:w-100 dark:border-green-400 dark:text-green-400'>
        <CheckCheckIcon />
        <AlertTitle>Your verification is complete. You can now proceed.</AlertTitle>
      </Alert>
    ))
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='w-full max-w-xs space-y-6'>
        <FormField
          control={form.control}
          name='pin'
          render={({ field }) => (
            <FormItem>
              <FormLabel>One-Time Password</FormLabel>
              <FormControl>
                <InputOTP maxLength={6} {...field}>
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
              </FormControl>
              <FormDescription>Please enter the 6-digit OTP sent to your phone.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type='submit'>Submit</Button>
      </form>
    </Form>
  )
}

export default InputOTPFormDemo
```

---

## Dépendances Requises

```bash
npm install @hookform/resolvers zod react-hook-form sonner date-fns
```

## Composants UI Utilisés

- Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage
- Input, Textarea, Select, RadioGroup, Checkbox, Switch
- Button, Calendar, Popover, Command, InputOTP
- Card, Alert
