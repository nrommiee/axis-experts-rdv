# Sheet Components

7 variants from ShadcnStudio. Select based on use case.

## Quick Reference

| # | Style | Position | Use Case |
|---|-------|----------|----------|
| 1 | Default | Right | Basic edit profile form |
| 2 | Sides | Top/Right/Bottom/Left | Flexible positioning |
| 3 | No Overlay | Right | Non-modal interactions |
| 4 | Scrollable | Right | Long content, terms & conditions |
| 5 | Form | Right | Sign up / registration forms |
| 6 | Navigation | Left | Mobile navigation menu |
| 7 | Data Table | Right | Add data to table |

---

## 1. Default

Basic sheet with form fields sliding from the right.

```tsx
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet'

const SheetDemo = () => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant='outline'>Default</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit profile</SheetTitle>
          <SheetDescription>Make changes to your profile here. Click save when you&apos;re done.</SheetDescription>
        </SheetHeader>
        <div className='grid flex-1 auto-rows-min gap-6 px-4'>
          <div className='grid gap-3'>
            <Label htmlFor='sheet-demo-name'>Name</Label>
            <Input id='sheet-demo-name' defaultValue='Pedro Duarte' />
          </div>
          <div className='grid gap-3'>
            <Label htmlFor='sheet-demo-username'>Username</Label>
            <Input id='sheet-demo-username' defaultValue='@peduarte' />
          </div>
        </div>
        <SheetFooter>
          <Button type='submit'>Save changes</Button>
          <SheetClose asChild>
            <Button variant='outline'>Close</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export default SheetDemo
```

---

## 2. Sides

Sheet with all four position options: top, right, bottom, left.

```tsx
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet'

const SheetSidesDemo = () => {
  return (
    <div className='flex flex-wrap gap-2'>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant='outline'>Top</Button>
        </SheetTrigger>
        <SheetContent side='top'>
          <SheetHeader>
            <SheetTitle>Edit profile</SheetTitle>
            <SheetDescription>Make changes to your profile here. Click save when you&apos;re done.</SheetDescription>
          </SheetHeader>
          <div className='grid flex-1 auto-rows-min gap-6 px-4'>
            <div className='grid gap-3'>
              <Label htmlFor='sheet-demo-name'>Name</Label>
              <Input id='sheet-demo-name' defaultValue='Pedro Duarte' />
            </div>
            <div className='grid gap-3'>
              <Label htmlFor='sheet-demo-username'>Username</Label>
              <Input id='sheet-demo-username' defaultValue='@peduarte' />
            </div>
          </div>
          <SheetFooter>
            <Button type='submit'>Save changes</Button>
            <SheetClose asChild>
              <Button variant='outline'>Close</Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant='outline'>Right</Button>
        </SheetTrigger>
        <SheetContent side='right'>
          <SheetHeader>
            <SheetTitle>Edit profile</SheetTitle>
            <SheetDescription>Make changes to your profile here. Click save when you&apos;re done.</SheetDescription>
          </SheetHeader>
          <div className='grid flex-1 auto-rows-min gap-6 px-4'>
            <div className='grid gap-3'>
              <Label htmlFor='sheet-demo-name'>Name</Label>
              <Input id='sheet-demo-name' defaultValue='Pedro Duarte' />
            </div>
            <div className='grid gap-3'>
              <Label htmlFor='sheet-demo-username'>Username</Label>
              <Input id='sheet-demo-username' defaultValue='@peduarte' />
            </div>
          </div>
          <SheetFooter>
            <Button type='submit'>Save changes</Button>
            <SheetClose asChild>
              <Button variant='outline'>Close</Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant='outline'>Bottom</Button>
        </SheetTrigger>
        <SheetContent side='bottom'>
          <SheetHeader>
            <SheetTitle>Edit profile</SheetTitle>
            <SheetDescription>Make changes to your profile here. Click save when you&apos;re done.</SheetDescription>
          </SheetHeader>
          <div className='grid flex-1 auto-rows-min gap-6 px-4'>
            <div className='grid gap-3'>
              <Label htmlFor='sheet-demo-name'>Name</Label>
              <Input id='sheet-demo-name' defaultValue='Pedro Duarte' />
            </div>
            <div className='grid gap-3'>
              <Label htmlFor='sheet-demo-username'>Username</Label>
              <Input id='sheet-demo-username' defaultValue='@peduarte' />
            </div>
          </div>
          <SheetFooter>
            <Button type='submit'>Save changes</Button>
            <SheetClose asChild>
              <Button variant='outline'>Close</Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant='outline'>Left</Button>
        </SheetTrigger>
        <SheetContent side='left'>
          <SheetHeader>
            <SheetTitle>Edit profile</SheetTitle>
            <SheetDescription>Make changes to your profile here. Click save when you&apos;re done.</SheetDescription>
          </SheetHeader>
          <div className='grid flex-1 auto-rows-min gap-6 px-4'>
            <div className='grid gap-3'>
              <Label htmlFor='sheet-demo-name'>Name</Label>
              <Input id='sheet-demo-name' defaultValue='Pedro Duarte' />
            </div>
            <div className='grid gap-3'>
              <Label htmlFor='sheet-demo-username'>Username</Label>
              <Input id='sheet-demo-username' defaultValue='@peduarte' />
            </div>
          </div>
          <SheetFooter>
            <Button type='submit'>Save changes</Button>
            <SheetClose asChild>
              <Button variant='outline'>Close</Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}

export default SheetSidesDemo
```

---

## 3. No Overlay

Non-modal sheet without background overlay. Uses `modal={false}`.

```tsx
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet'

const SheetWithNoOverlayDemo = () => {
  return (
    <Sheet modal={false}>
      <SheetTrigger asChild>
        <Button variant='outline'>No Overlay</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit profile</SheetTitle>
          <SheetDescription>Make changes to your profile here. Click save when you&apos;re done.</SheetDescription>
        </SheetHeader>
        <div className='grid flex-1 auto-rows-min gap-6 px-4'>
          <div className='grid gap-3'>
            <Label htmlFor='sheet-demo-name'>Name</Label>
            <Input id='sheet-demo-name' defaultValue='Pedro Duarte' />
          </div>
          <div className='grid gap-3'>
            <Label htmlFor='sheet-demo-username'>Username</Label>
            <Input id='sheet-demo-username' defaultValue='@peduarte' />
          </div>
        </div>
        <SheetFooter>
          <Button type='submit'>Save changes</Button>
          <SheetClose asChild>
            <Button variant='outline'>Close</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export default SheetWithNoOverlayDemo
```

---

## 4. Scrollable Content

Sheet with ScrollArea for long content like terms & conditions.

```tsx
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet'

const SheetWithScrollableContentDemo = () => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant='outline'>Scrollable Content</Button>
      </SheetTrigger>
      <SheetContent>
        <ScrollArea className='h-full'>
          <SheetHeader>
            <SheetTitle>Terms & Condition</SheetTitle>
            <SheetDescription>Make sure read the terms and conditions before proceeding.</SheetDescription>
          </SheetHeader>
          <div className='space-y-1 p-4 pt-0 text-sm'>
            <p className='mb-2 font-medium'>Last Updated: June 1, 2025</p>

            <h3>1. Introduction</h3>
            <p>
              Welcome to our platform. These Terms and Conditions outline the rules and regulations for the use of our
              services. By accessing or using our services, you agree to comply with these terms.
            </p>

            <h3>2. Acceptance of Terms</h3>
            <p>
              By using our services, you confirm that you have read, understood, and accepted these terms.
            </p>

            {/* ... more sections ... */}

            <h3>13. Contact Information</h3>
            <p>If you have any questions or concerns about these Terms and Conditions, please contact us at:</p>
            <p>Email: support@example.com</p>
            <p>Phone: +1 (800) 123-4567</p>
          </div>
          <SheetFooter>
            <SheetClose asChild>
              <Button type='submit'>Accept</Button>
            </SheetClose>
            <SheetClose asChild>
              <Button variant='outline'>Cancel</Button>
            </SheetClose>
          </SheetFooter>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

export default SheetWithScrollableContentDemo
```

---

## 5. With Form

Sheet with React Hook Form and Zod validation for sign up.

```tsx
'use client'

import { CheckCheckIcon } from 'lucide-react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { Alert, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet'

const SheetWithFormDemo = () => {
  const FormSchema = z.object({
    firstName: z.string().min(1, 'First name is required').min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(1, 'Last name is required').min(2, 'Last name must be at least 2 characters'),
    email: z.string().min(1, 'Email is required').email({ message: 'Please enter a valid email address.' }),
    mobileNumber: z
      .number({ required_error: 'Mobile number is required', invalid_type_error: 'Please enter a valid number' })
      .int('Mobile number must be a whole number')
      .positive('Mobile number must be positive')
      .refine(val => val.toString().length === 10, 'Mobile number must be exactly 10 digits'),
    password: z.string().min(1, 'Password is required').min(8, 'Password must be at least 8 characters')
  })

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      mobileNumber: undefined,
      password: ''
    }
  })

  const onSubmit = () => {
    toast.custom(() => (
      <Alert className='border-green-600 text-green-600 dark:border-green-400 dark:text-green-400'>
        <CheckCheckIcon />
        <AlertTitle>Account created successfully!</AlertTitle>
      </Alert>
    ))
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant='outline'>Sign Up</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className='text-center text-xl font-bold'>Sign Up</SheetTitle>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='w-full'>
            <div className='space-y-4 p-4 pt-0'>
              <FormField
                control={form.control}
                name='firstName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder='First name' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='lastName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder='Last name' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                name='mobileNumber'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile Number</FormLabel>
                    <FormControl>
                      <Input
                        type='tel'
                        placeholder='8585858585'
                        value={field.value ? field.value.toString() : ''}
                        onChange={e => {
                          const value = e.target.value.replace(/[^\d]/g, '')
                          const limitedValue = value.slice(0, 10)
                          const numValue = limitedValue === '' ? undefined : parseInt(limitedValue, 10)
                          field.onChange(numValue)
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='password'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type='password' placeholder='Password' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <SheetFooter>
              <Button type='submit'>Create Account</Button>
              <SheetClose asChild>
                <Button variant='outline'>Close</Button>
              </SheetClose>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}

export default SheetWithFormDemo
```

---

## 6. Navigation Menu

Sheet with collapsible navigation menu for mobile sidebar.

```tsx
import type { ForwardRefExoticComponent, RefAttributes } from 'react'

import {
  BookTextIcon,
  CalendarDaysIcon,
  ChevronRightIcon,
  CircleSmallIcon,
  HeartPlusIcon,
  HomeIcon,
  LayoutPanelTopIcon,
  LogInIcon,
  LogOutIcon,
  MailIcon,
  MessageSquareTextIcon,
  PanelTopIcon,
  ShoppingCartIcon,
  type LucideProps
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

type NavigationItem = {
  name: string
  icon: ForwardRefExoticComponent<Omit<LucideProps, 'ref'> & RefAttributes<SVGSVGElement>>
} & (
  | { type: 'page'; children?: never }
  | { type: 'category'; children: NavigationItem[] }
)

const navigationMenu: NavigationItem[] = [
  { name: 'Dashboard', icon: HomeIcon, type: 'page' },
  {
    name: 'Layouts',
    icon: LayoutPanelTopIcon,
    type: 'category',
    children: [
      { name: 'Content Navbar', icon: LayoutPanelTopIcon, type: 'page' },
      { name: 'Horizontal', icon: LayoutPanelTopIcon, type: 'page' },
      { name: 'Without Menu', icon: LayoutPanelTopIcon, type: 'page' }
    ]
  },
  // ... more items
]

const NavigationMenu = ({ item, level }: { level: number; item: NavigationItem }) => {
  if (item.type === 'page') {
    return (
      <div
        className='focus-visible:ring-ring/50 flex items-center gap-2 rounded-md p-1 outline-none focus-visible:ring-[3px]'
        style={{ paddingLeft: `${level === 0 ? 0.25 : 1.75}rem` }}
      >
        {level === 0 ? <item.icon className='size-4 shrink-0' /> : <CircleSmallIcon className='size-4 shrink-0' />}
        <span className='text-sm'>{item.name}</span>
      </div>
    )
  }

  return (
    <Collapsible className='flex flex-col gap-1.5' style={{ paddingLeft: `${level === 0 ? 0 : 1.5}rem` }}>
      <CollapsibleTrigger className='focus-visible:ring-ring/50 flex items-center gap-2 rounded-md p-1 outline-none focus-visible:ring-[3px]'>
        {level === 0 ? <item.icon className='size-4 shrink-0' /> : <CircleSmallIcon className='size-4 shrink-0' />}
        <span className='flex-1 text-start text-sm'>{item.name}</span>
        <ChevronRightIcon className='size-4 shrink-0 transition-transform [[data-state="open"]>&]:rotate-90' />
      </CollapsibleTrigger>
      <CollapsibleContent className='data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down flex flex-col gap-1.5 overflow-hidden transition-all duration-300'>
        {item.children.map(item => (
          <NavigationMenu key={item.name} item={item} level={level + 1} />
        ))}
      </CollapsibleContent>
    </Collapsible>
  )
}

const SheetWithNavigationMenuDemo = () => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant='outline'>Navigation Menu</Button>
      </SheetTrigger>
      <SheetContent side='left' className='w-75'>
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <div className='flex flex-col gap-2.5 p-4 pt-0'>
          {navigationMenu.map(item => (
            <NavigationMenu key={item.name} item={item} level={0} />
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default SheetWithNavigationMenuDemo
```

---

## 7. Data Table Integration

Sheet for adding new entries to a data table with TanStack Table.

```tsx
'use client'

import { useState } from 'react'

import { PlusIcon } from 'lucide-react'

import type { ColumnDef, ColumnFiltersState, SortingState, VisibilityState } from '@tanstack/react-table'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export type Payment = {
  id: string
  name: string
  amount: number
  status: 'pending' | 'processing' | 'success' | 'failed'
  email: string
}

const DataTableWithSheetDemo = () => {
  const [tableData, setTableData] = useState<Payment[]>(data)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    amount: '',
    status: 'pending' as Payment['status']
  })

  const handleAddUser = () => {
    if (!newUser.name || !newUser.email || !newUser.amount) return

    const newPayment: Payment = {
      id: String(tableData.length + 1),
      name: newUser.name,
      email: newUser.email,
      amount: parseFloat(newUser.amount),
      status: newUser.status
    }

    setTableData([...tableData, newPayment])
    setNewUser({ name: '', email: '', amount: '', status: 'pending' })
    setIsSheetOpen(false)
  }

  return (
    <div className='w-full'>
      <div className='flex justify-between gap-2 py-4'>
        <Input placeholder='Search all columns...' className='max-w-2xs' />
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button variant='outline'>
              <PlusIcon />
              Add Users
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Add New User</SheetTitle>
              <SheetDescription>Add a new user to the table. Fill in all the required information.</SheetDescription>
            </SheetHeader>
            <div className='grid flex-1 auto-rows-min gap-6 px-4'>
              <div className='grid gap-3'>
                <Label htmlFor='user-name'>Name</Label>
                <Input
                  id='user-name'
                  value={newUser.name}
                  onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder='Enter user name'
                />
              </div>
              <div className='grid gap-3'>
                <Label htmlFor='user-email'>Email</Label>
                <Input
                  id='user-email'
                  type='email'
                  value={newUser.email}
                  onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder='Enter email address'
                />
              </div>
              <div className='grid gap-3'>
                <Label htmlFor='user-amount'>Amount</Label>
                <Input
                  id='user-amount'
                  type='number'
                  value={newUser.amount}
                  onChange={e => setNewUser({ ...newUser, amount: e.target.value })}
                  placeholder='Enter amount'
                />
              </div>
              <div className='grid gap-3'>
                <Label htmlFor='user-status'>Status</Label>
                <Select
                  value={newUser.status}
                  onValueChange={(value: Payment['status']) => setNewUser({ ...newUser, status: value })}
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder='Select status' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='pending'>Pending</SelectItem>
                    <SelectItem value='processing'>Processing</SelectItem>
                    <SelectItem value='success'>Success</SelectItem>
                    <SelectItem value='failed'>Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <SheetFooter>
              <Button type='button' onClick={handleAddUser}>
                Add User
              </Button>
              <SheetClose asChild>
                <Button variant='outline'>Cancel</Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
      {/* ... Table component ... */}
    </div>
  )
}

export default DataTableWithSheetDemo
```
