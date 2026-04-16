# Table Components

16 variants (1-16) from ShadcnStudio. Table components with various styles including borders, stripes, sticky headers, avatars, pagination, and more.

## Quick Reference

| # | Style | Dependencies | Use Case |
|---|-------|--------------|----------|
| 1 | Default | CSS only | Basic table with caption and footer |
| 2 | Bordered | CSS only | Table with outer border |
| 3 | Rounded Corner | CSS only | Table with rounded container |
| 4 | Vertical Lines | CSS only | Table with column separators |
| 5 | Without Border | CSS only | Borderless table with muted header |
| 6 | Striped Rows | CSS only | Alternating row colors |
| 7 | Striped Columns | CSS only | Alternating column colors |
| 8 | Highlighted Row | CSS only | Specific row highlighting |
| 9 | Overflow Scroll | CSS only | Scrollable table body |
| 10 | Sticky Header | CSS only | Fixed header on scroll |
| 11 | Sticky Column | CSS only | Fixed columns on horizontal scroll |
| 12 | Vertical Table | CSS only | Key-value pair layout |
| 13 | With Avatar | Avatar component | User table with profile images |
| 14 | With Pagination | Pagination component | Table with page navigation |
| 15 | Selectable Row | Checkbox component | Row selection with checkboxes |
| 16 | Product Table | Avatar, Checkbox, Button | Full-featured product listing |

---

## 1. Default

Basic table with caption and footer.

### Usage

```tsx
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'

const invoices = [
  { invoice: 'INV001', paymentStatus: 'Paid', totalAmount: '$250.00', paymentMethod: 'Credit Card' },
  { invoice: 'INV002', paymentStatus: 'Pending', totalAmount: '$150.00', paymentMethod: 'PayPal' },
  { invoice: 'INV003', paymentStatus: 'Unpaid', totalAmount: '$350.00', paymentMethod: 'Bank Transfer' },
  { invoice: 'INV004', paymentStatus: 'Paid', totalAmount: '$450.00', paymentMethod: 'Credit Card' },
  { invoice: 'INV005', paymentStatus: 'Paid', totalAmount: '$550.00', paymentMethod: 'PayPal' },
  { invoice: 'INV006', paymentStatus: 'Pending', totalAmount: '$200.00', paymentMethod: 'Bank Transfer' },
  { invoice: 'INV007', paymentStatus: 'Unpaid', totalAmount: '$300.00', paymentMethod: 'Credit Card' }
]

const TableDemo = () => {
  return (
    <Table>
      <TableCaption>Default table.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className='w-25'>Invoice</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Method</TableHead>
          <TableHead className='text-right'>Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map(invoice => (
          <TableRow key={invoice.invoice}>
            <TableCell className='font-medium'>{invoice.invoice}</TableCell>
            <TableCell>{invoice.paymentStatus}</TableCell>
            <TableCell>{invoice.paymentMethod}</TableCell>
            <TableCell className='text-right'>{invoice.totalAmount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={3}>Total</TableCell>
          <TableCell className='text-right'>$2,500.00</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  )
}

export default TableDemo
```

---

## 2. Bordered

Table with outer border.

### Usage

```tsx
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'

const TableBorderDemo = () => {
  return (
    <Table className='border'>
      <TableCaption>Bordered table.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className='w-25'>Invoice</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Method</TableHead>
          <TableHead className='text-right'>Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map(invoice => (
          <TableRow key={invoice.invoice}>
            <TableCell className='font-medium'>{invoice.invoice}</TableCell>
            <TableCell>{invoice.paymentStatus}</TableCell>
            <TableCell>{invoice.paymentMethod}</TableCell>
            <TableCell className='text-right'>{invoice.totalAmount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={3}>Total</TableCell>
          <TableCell className='text-right'>$2,500.00</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  )
}

export default TableBorderDemo
```

---

## 3. Rounded Corner

Table with rounded container border.

### Usage

```tsx
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'

const TableRoundedCornerDemo = () => {
  return (
    <div className='w-full'>
      <div className='overflow-hidden rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-25'>Invoice</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Method</TableHead>
              <TableHead className='text-right'>Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map(invoice => (
              <TableRow key={invoice.invoice}>
                <TableCell className='font-medium'>{invoice.invoice}</TableCell>
                <TableCell>{invoice.paymentStatus}</TableCell>
                <TableCell>{invoice.paymentMethod}</TableCell>
                <TableCell className='text-right'>{invoice.totalAmount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={3}>Total</TableCell>
              <TableCell className='text-right'>$2,500.00</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
      <p className='text-muted-foreground mt-4 text-center text-sm'>Rounded corner table</p>
    </div>
  )
}

export default TableRoundedCornerDemo
```

---

## 4. Vertical Lines

Table with column separators.

### Usage

```tsx
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'

const TableWithVerticalLinesDemo = () => {
  return (
    <Table>
      <TableCaption>Table with vertical lines.</TableCaption>
      <TableHeader>
        <TableRow className='*:border-border [&>:not(:last-child)]:border-r'>
          <TableHead className='w-25'>Invoice</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Method</TableHead>
          <TableHead className='text-right'>Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map(invoice => (
          <TableRow key={invoice.invoice} className='*:border-border [&>:not(:last-child)]:border-r'>
            <TableCell className='font-medium'>{invoice.invoice}</TableCell>
            <TableCell>{invoice.paymentStatus}</TableCell>
            <TableCell>{invoice.paymentMethod}</TableCell>
            <TableCell className='text-right'>{invoice.totalAmount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={3}>Total</TableCell>
          <TableCell className='text-right'>$2,500.00</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  )
}

export default TableWithVerticalLinesDemo
```

---

## 5. Without Border

Borderless table with muted header background.

### Usage

```tsx
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'

const TableWithOutBorderDemo = () => {
  return (
    <Table>
      <TableCaption>Table without border.</TableCaption>
      <TableHeader>
        <TableRow className='bg-muted/50 border-none'>
          <TableHead className='w-25'>Invoice</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Method</TableHead>
          <TableHead className='text-right'>Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map(invoice => (
          <TableRow key={invoice.invoice} className='border-none'>
            <TableCell className='font-medium'>{invoice.invoice}</TableCell>
            <TableCell>{invoice.paymentStatus}</TableCell>
            <TableCell>{invoice.paymentMethod}</TableCell>
            <TableCell className='text-right'>{invoice.totalAmount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter className='border-none'>
        <TableRow>
          <TableCell colSpan={3}>Total</TableCell>
          <TableCell className='text-right'>$2,500.00</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  )
}

export default TableWithOutBorderDemo
```

---

## 6. Striped Rows

Table with alternating row colors.

### Usage

```tsx
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'

const StripedRowsTableDemo = () => {
  return (
    <Table>
      <TableCaption>Striped rows table.</TableCaption>
      <TableHeader>
        <TableRow className='hover:bg-transparent'>
          <TableHead className='w-25'>Invoice</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Method</TableHead>
          <TableHead className='text-right'>Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map(invoice => (
          <TableRow key={invoice.invoice} className='odd:bg-muted/50 odd:hover:bg-muted/50 hover:bg-transparent'>
            <TableCell className='font-medium'>{invoice.invoice}</TableCell>
            <TableCell>{invoice.paymentStatus}</TableCell>
            <TableCell>{invoice.paymentMethod}</TableCell>
            <TableCell className='text-right'>{invoice.totalAmount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter className='bg-transparent'>
        <TableRow className='hover:bg-transparent'>
          <TableCell colSpan={3}>Total</TableCell>
          <TableCell className='text-right'>$2,500.00</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  )
}

export default StripedRowsTableDemo
```

---

## 7. Striped Columns

Table with alternating column colors.

### Usage

```tsx
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'

const StrippedColumnTableDemo = () => {
  return (
    <Table>
      <TableCaption>Striped columns table.</TableCaption>
      <TableHeader>
        <TableRow className='[&_th]:even:bg-muted/50 hover:bg-transparent'>
          <TableHead className='w-25'>Invoice</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Method</TableHead>
          <TableHead className='text-right'>Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map(invoice => (
          <TableRow key={invoice.invoice} className='[&_td]:even:bg-muted/50 hover:bg-transparent'>
            <TableCell className='font-medium'>{invoice.invoice}</TableCell>
            <TableCell>{invoice.paymentStatus}</TableCell>
            <TableCell>{invoice.paymentMethod}</TableCell>
            <TableCell className='text-right'>{invoice.totalAmount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter className='bg-transparent'>
        <TableRow className='hover:bg-transparent'>
          <TableCell colSpan={3}>Total</TableCell>
          <TableCell className='text-right'>$2,500.00</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  )
}

export default StrippedColumnTableDemo
```

---

## 8. Highlighted Row

Table with specific row highlighting (3rd row in this example).

### Usage

```tsx
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'

const TableHighlightedRowDemo = () => {
  return (
    <Table>
      <TableCaption>Highlight row table.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className='w-25'>Invoice</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Method</TableHead>
          <TableHead className='text-right'>Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map(invoice => (
          <TableRow
            key={invoice.invoice}
            className='nth-3:bg-sky-600/10 nth-3:hover:bg-sky-600/20 nth-3:dark:bg-sky-400/10 nth-3:dark:hover:bg-sky-400/20'
          >
            <TableCell className='font-medium'>{invoice.invoice}</TableCell>
            <TableCell>{invoice.paymentStatus}</TableCell>
            <TableCell>{invoice.paymentMethod}</TableCell>
            <TableCell className='text-right'>{invoice.totalAmount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={3}>Total</TableCell>
          <TableCell className='text-right'>$2,500.00</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  )
}

export default TableHighlightedRowDemo
```

---

## 9. Overflow Scroll

Scrollable table body with fixed height.

### Usage

```tsx
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'

const OverflowScrollTableDemo = () => {
  return (
    <div className='w-full'>
      <div className='grid [&>div]:max-h-70 [&>div]:rounded-sm [&>div]:border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-25'>Invoice</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Method</TableHead>
              <TableHead className='text-right'>Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map(invoice => (
              <TableRow key={invoice.invoice}>
                <TableCell className='font-medium'>{invoice.invoice}</TableCell>
                <TableCell>{invoice.paymentStatus}</TableCell>
                <TableCell>{invoice.paymentMethod}</TableCell>
                <TableCell className='text-right'>{invoice.totalAmount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={3}>Total</TableCell>
              <TableCell className='text-right'>$2,500.00</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
      <p className='text-muted-foreground mt-4 text-center text-sm'>Overflow scroll table</p>
    </div>
  )
}

export default OverflowScrollTableDemo
```

---

## 10. Sticky Header

Table with fixed header on scroll.

### Usage

```tsx
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'

const StickyHeaderTableDemo = () => {
  return (
    <div className='w-full'>
      <div className='[&>div]:max-h-70 [&>div]:rounded-sm [&>div]:border'>
        <Table>
          <TableHeader>
            <TableRow className='bg-background sticky top-0'>
              <TableHead className='w-25'>Invoice</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Method</TableHead>
              <TableHead className='text-right'>Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map(invoice => (
              <TableRow key={invoice.invoice}>
                <TableCell className='font-medium'>{invoice.invoice}</TableCell>
                <TableCell>{invoice.paymentStatus}</TableCell>
                <TableCell>{invoice.paymentMethod}</TableCell>
                <TableCell className='text-right'>{invoice.totalAmount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={3}>Total</TableCell>
              <TableCell className='text-right'>$2,500.00</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
      <p className='text-muted-foreground mt-4 text-center text-sm'>Sticky header table</p>
    </div>
  )
}

export default StickyHeaderTableDemo
```

---

## 11. Sticky Column

Table with fixed columns on horizontal scroll.

### Usage

```tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const employees = [
  { id: 1, name: 'Alice Smith', occupation: 'Software Engineer', employer: 'Alpha Tech', email: 'alice@example.com', location: 'United States', lastaccess: '12/16/2021', salary: '$120,000' },
  { id: 2, name: 'Bob Johnson', occupation: 'Marketing Manager', employer: 'Beta Corp', email: 'bob@example.com', location: 'Canada', lastaccess: '11/05/2021', salary: '$100,000' },
  // ... more employees
]

const StickyColumnTableDemo = () => {
  return (
    <div className='w-full'>
      <div className='mx-auto max-w-2xl [&>div]:rounded-sm [&>div]:border'>
        <Table>
          <TableHeader>
            <TableRow className='hover:bg-transparent'>
              <TableHead className='bg-background sticky left-0'>ID</TableHead>
              <TableHead className='bg-background sticky left-7.5'>Name</TableHead>
              <TableHead>Occupation</TableHead>
              <TableHead>Employer</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Last Access</TableHead>
              <TableHead>Salary</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map(employee => (
              <TableRow key={employee.id} className='hover:bg-transparent'>
                <TableCell className='bg-background sticky left-0 font-medium'>{employee.id}</TableCell>
                <TableCell className='bg-background sticky left-7.5'>{employee.name}</TableCell>
                <TableCell>{employee.occupation}</TableCell>
                <TableCell>{employee.employer}</TableCell>
                <TableCell>{employee.email}</TableCell>
                <TableCell>{employee.location}</TableCell>
                <TableCell>{employee.lastaccess}</TableCell>
                <TableCell>{employee.salary}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className='text-muted-foreground mt-4 text-center text-sm'>Sticky column table</p>
    </div>
  )
}

export default StickyColumnTableDemo
```

---

## 12. Vertical Table

Key-value pair layout table.

### Usage

```tsx
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'

const VerticalTableDemo = () => {
  return (
    <div className='mx-auto w-full max-w-lg'>
      <div className='overflow-hidden rounded-md border'>
        <Table>
          <TableBody>
            <TableRow className='*:border-border [&>:not(:last-child)]:border-r'>
              <TableCell className='bg-muted/50 py-2 font-medium'>Product Name</TableCell>
              <TableCell className='py-2'>Iphone 16 PRO</TableCell>
            </TableRow>
            <TableRow className='*:border-border [&>:not(:last-child)]:border-r'>
              <TableCell className='bg-muted/50 py-2 font-medium'>Serial Number</TableCell>
              <TableCell className='py-2'>DF121543309KU</TableCell>
            </TableRow>
            <TableRow className='*:border-border [&>:not(:last-child)]:border-r'>
              <TableCell className='bg-muted/50 py-2 font-medium'>Category</TableCell>
              <TableCell className='py-2'>Smartphone</TableCell>
            </TableRow>
            <TableRow className='*:border-border [&>:not(:last-child)]:border-r'>
              <TableCell className='bg-muted/50 py-2 font-medium'>Purchase Date</TableCell>
              <TableCell className='py-2'>15/06/2025</TableCell>
            </TableRow>
            <TableRow className='*:border-border [&>:not(:last-child)]:border-r'>
              <TableCell className='bg-muted/50 py-2 font-medium'>Warranty Expiry</TableCell>
              <TableCell className='py-2'>15/06/2026</TableCell>
            </TableRow>
            <TableRow className='*:border-border [&>:not(:last-child)]:border-r'>
              <TableCell className='bg-muted/50 py-2 font-medium'>Origin</TableCell>
              <TableCell className='py-2'>China</TableCell>
            </TableRow>
            <TableRow className='*:border-border [&>:not(:last-child)]:border-r'>
              <TableCell className='bg-muted/50 py-2 font-medium'>Assign User</TableCell>
              <TableCell className='py-2'>Alice Johnson</TableCell>
            </TableRow>
            <TableRow className='*:border-border [&>:not(:last-child)]:border-r'>
              <TableCell className='bg-muted/50 py-2 font-medium'>Value</TableCell>
              <TableCell className='py-2'>$1,120.0</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
      <p className='text-muted-foreground mt-4 text-center text-sm'>Vertical table</p>
    </div>
  )
}

export default VerticalTableDemo
```

---

## 13. With Avatar

User table with profile images.

### Usage

```tsx
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const items = [
  { id: '1', name: 'Philip George', src: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-1.png', fallback: 'PG', email: 'philipgeorge20@gmail.com', location: 'Mumbai, India', status: 'Active', balance: '$10,696.00' },
  { id: '2', name: 'Tiana Curtis', src: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-2.png', fallback: 'TC', email: 'tiana12@yahoo.com', location: 'New York, US', status: 'applied', balance: '$0.00' },
  // ... more items
]

const TableWithAvatarDemo = () => {
  return (
    <div className='w-full'>
      <div className='[&>div]:rounded-sm [&>div]:border'>
        <Table>
          <TableHeader>
            <TableRow className='hover:bg-transparent'>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className='text-right'>Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map(item => (
              <TableRow key={item.id}>
                <TableCell>
                  <div className='flex items-center gap-3'>
                    <Avatar>
                      <AvatarImage src={item.src} alt={item.fallback} />
                      <AvatarFallback className='text-xs'>{item.fallback}</AvatarFallback>
                    </Avatar>
                    <div className='font-medium'>{item.name}</div>
                  </div>
                </TableCell>
                <TableCell>{item.email}</TableCell>
                <TableCell>{item.location}</TableCell>
                <TableCell>{item.status}</TableCell>
                <TableCell className='text-right'>{item.balance}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className='text-muted-foreground mt-4 text-center text-sm'>Table with avatar</p>
    </div>
  )
}

export default TableWithAvatarDemo
```

---

## 14. With Pagination

Table with page navigation.

### Usage

```tsx
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'

const TableWithPaginationDemo = () => {
  return (
    <div className='w-full'>
      <div className='overflow-hidden rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-25'>Invoice</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Method</TableHead>
              <TableHead className='text-right'>Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map(invoice => (
              <TableRow key={invoice.invoice}>
                <TableCell className='font-medium'>{invoice.invoice}</TableCell>
                <TableCell>{invoice.paymentStatus}</TableCell>
                <TableCell>{invoice.paymentMethod}</TableCell>
                <TableCell className='text-right'>{invoice.totalAmount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={3}>Total</TableCell>
              <TableCell className='text-right'>$2,500.00</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
      <Pagination className='mt-4'>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href='#' />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href='#'>1</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href='#' isActive>
              2
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href='#'>3</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext href='#' />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
      <p className='text-muted-foreground mt-4 text-center text-sm'>Table with pagination</p>
    </div>
  )
}

export default TableWithPaginationDemo
```

---

## 15. Selectable Row

Row selection with checkboxes.

### Usage

```tsx
import { useId } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'

const items = [
  { id: '1', name: 'Philip George', email: 'philipgeorge20@gmail.com', location: 'Mumbai, India', status: 'Active', balance: '$10,696.00' },
  { id: '2', name: 'Sarah Chen', email: 'sarah.c@company.com', location: 'Singapore', status: 'Active', balance: '$600.00' },
  // ... more items
]

const TableSelectableRowDemo = () => {
  const id = useId()

  return (
    <div className='w-full'>
      <div className='overflow-hidden rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow className='hover:bg-transparent'>
              <TableHead>
                <Checkbox id={id} aria-label='select-all' />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className='text-right'>Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map(item => (
              <TableRow key={item.id} className='has-data-[state=checked]:bg-muted/50'>
                <TableCell>
                  <Checkbox id={`table-checkbox-${item.id}`} aria-label={`user-checkbox-${item.id}`} />
                </TableCell>
                <TableCell className='font-medium'>{item.name}</TableCell>
                <TableCell>{item.email}</TableCell>
                <TableCell>{item.location}</TableCell>
                <TableCell>{item.status}</TableCell>
                <TableCell className='text-right'>{item.balance}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter className='bg-transparent'>
            <TableRow className='hover:bg-transparent'>
              <TableCell colSpan={5}>Total</TableCell>
              <TableCell className='text-right'>$2,500.00</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
      <p className='text-muted-foreground mt-4 text-center text-sm'>Table with row selection</p>
    </div>
  )
}

export default TableSelectableRowDemo
```

---

## 16. Product Table

Full-featured product listing with avatars, checkboxes, and action buttons.

### Usage

```tsx
import { useId } from 'react'
import { ArchiveIcon, PencilIcon, Trash2Icon } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const items = [
  { id: '1', productName: 'Chair', model: 'Wooden Garden Chair', src: 'https://cdn.shadcnstudio.com/ss-assets/products/product-1.png', fallback: 'WGC', color: 'Black', category: 'Furniture', price: '$269.09' },
  { id: '2', productName: 'Nike Shoes', model: 'Jordan 1 Retro OG', src: 'https://cdn.shadcnstudio.com/ss-assets/products/product-2.png', fallback: 'J1R', color: 'Red', category: 'Sneakers', price: '$150.00' },
  // ... more items
]

const ProductTableDemo = () => {
  const id = useId()

  return (
    <div className='w-full'>
      <div className='[&>div]:rounded-sm [&>div]:border'>
        <Table>
          <TableHeader>
            <TableRow className='hover:bg-transparent'>
              <TableHead>
                <Checkbox id={id} aria-label='select-all' />
              </TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Color</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead className='w-0'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map(item => (
              <TableRow key={item.id} className='has-data-[state=checked]:bg-muted/50'>
                <TableCell>
                  <Checkbox id={`table-checkbox-${item.id}`} aria-label={`product-checkbox-${item.id}`} />
                </TableCell>
                <TableCell>
                  <div className='flex items-center gap-3'>
                    <Avatar className='rounded-sm'>
                      <AvatarImage src={item.src} alt={item.model} />
                      <AvatarFallback className='text-xs'>{item.fallback}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className='font-medium'>{item.productName}</div>
                      <span className='text-muted-foreground mt-0.5 text-xs'>{item.model}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{item.color}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>{item.price}</TableCell>
                <TableCell className='flex items-center gap-1'>
                  <Button variant='ghost' size='icon' className='rounded-full' aria-label={`product-${item.id}-edit`}>
                    <PencilIcon />
                  </Button>
                  <Button variant='ghost' size='icon' className='rounded-full' aria-label={`product-${item.id}-remove`}>
                    <Trash2Icon />
                  </Button>
                  <Button variant='ghost' size='icon' className='rounded-full' aria-label={`product-${item.id}-archive`}>
                    <ArchiveIcon />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className='text-muted-foreground mt-4 text-center text-sm'>Product Table</p>
    </div>
  )
}

export default ProductTableDemo
```
