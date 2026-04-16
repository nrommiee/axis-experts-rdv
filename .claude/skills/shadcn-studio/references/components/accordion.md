# Accordion Components

16 variants from ShadcnStudio. Select based on use case.

## Quick Reference

| # | Style | Icons | Use Case |
|---|-------|-------|----------|
| 1 | Default | Chevron | Basic FAQ |
| 2 | Split cards | Chevron | Separated items with shadow |
| 3 | Left icon | Custom + Chevron | Categorized FAQ |
| 4 | Plus/Minus | +/- animated | Modern FAQ |
| 5 | Active highlight | Chevron + color | Emphasize open item |
| 6 | Expand icon | + rotate 45° | Minimal modern |
| 7 | Avatar | Chevron | User profiles, team members |
| 8 | Icon + Subtitle | +/- | Categorized with descriptions |
| 9 | Outline | Chevron | Bordered individual items |
| 10 | Box | Chevron | All items in single border |
| 11 | Tabs | Chevron | Background highlight on open |
| 12 | Tabs outline | +/- | Border + shadow on open |
| 13 | Media content | Chevron | With images |
| 14 | Filled header | Chevron | Accent background on trigger |
| 15 | Multi-level | +/- + Chevron | Nested categories |
| 16 | Multi-level icon | Chevron + +/- | Nested with icons |

---

## 1. Default

Basic accordion with chevron icon.

```tsx
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

const items = [
  {
    title: 'How do I track my order?',
    content: `You can track your order by logging into your account and visiting the "Orders" section.`
  },
  // ... more items
]

const AccordionDemo = () => {
  return (
    <Accordion type='single' collapsible className='w-full' defaultValue='item-1'>
      {items.map((item, index) => (
        <AccordionItem key={index} value={`item-${index + 1}`}>
          <AccordionTrigger>{item.title}</AccordionTrigger>
          <AccordionContent className='text-muted-foreground'>{item.content}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
```

---

## 2. Split Cards

Separated items with rounded corners and shadow.

```tsx
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

const AccordionSplitDemo = () => {
  return (
    <Accordion type='single' collapsible className='w-full space-y-2' defaultValue='item-1'>
      {items.map((item, index) => (
        <AccordionItem
          key={index}
          value={`item-${index + 1}`}
          className='bg-card rounded-md border-b-0 shadow-md data-[state=open]:shadow-lg'
        >
          <AccordionTrigger className='px-5 [&>svg]:rotate-90 [&[data-state=open]>svg]:rotate-0'>
            {item.title}
          </AccordionTrigger>
          <AccordionContent className='text-muted-foreground px-5'>{item.content}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
```

---

## 3. Left Icon

Icon before title, categorized content.

```tsx
import { HeadsetIcon, PackageIcon, RefreshCwIcon } from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

const items = [
  {
    icon: PackageIcon,
    title: 'How do I track my order?',
    content: `You can track your order...`
  },
  {
    icon: RefreshCwIcon,
    title: 'What is your return policy?',
    content: 'We offer a 30-day return policy...'
  },
  {
    icon: HeadsetIcon,
    title: 'How can I contact customer support?',
    content: 'Our customer support team is available 24/7...'
  }
]

const AccordionLeftIconDemo = () => {
  return (
    <Accordion type='single' collapsible className='w-full' defaultValue='item-1'>
      {items.map((item, index) => (
        <AccordionItem key={index} value={`item-${index + 1}`}>
          <AccordionTrigger className='justify-start [&>svg]:order-first'>
            <span className='flex items-center gap-4'>
              <item.icon className='text-muted-foreground size-4 shrink-0' />
              <span>{item.title}</span>
            </span>
          </AccordionTrigger>
          <AccordionContent className='text-muted-foreground'>{item.content}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
```

---

## 4. Plus/Minus Icon

Animated plus to minus transition.

```tsx
import { PlusIcon } from 'lucide-react'
import * as AccordionPrimitive from '@radix-ui/react-accordion'
import { Accordion, AccordionContent, AccordionItem } from '@/components/ui/accordion'

const AccordionPlusMinusIconDemo = () => {
  return (
    <Accordion type='single' collapsible className='w-full' defaultValue='item-1'>
      {items.map((item, index) => (
        <AccordionItem key={index} value={`item-${index + 1}`}>
          <AccordionPrimitive.Header className='flex'>
            <AccordionPrimitive.Trigger
              data-slot='accordion-trigger'
              className='focus-visible:border-ring focus-visible:ring-ring/50 flex flex-1 items-center justify-between gap-4 rounded-md py-4 text-left text-sm font-medium transition-all outline-none hover:underline focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&>svg>path:last-child]:origin-center [&>svg>path:last-child]:transition-all [&>svg>path:last-child]:duration-200 [&[data-state=open]>svg]:rotate-180 [&[data-state=open]>svg>path:last-child]:rotate-90 [&[data-state=open]>svg>path:last-child]:opacity-0'
            >
              {item.title}
              <PlusIcon className='text-muted-foreground pointer-events-none size-4 shrink-0 transition-transform duration-200' />
            </AccordionPrimitive.Trigger>
          </AccordionPrimitive.Header>
          <AccordionContent className='text-muted-foreground'>{item.content}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
```

---

## 5. Active Item Highlight

Color highlight on open item (amber theme).

```tsx
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

const AccordionActiveItemDemo = () => {
  return (
    <Accordion type='single' collapsible className='w-full' defaultValue='item-1'>
      {items.map((item, index) => (
        <AccordionItem
          key={index}
          value={`item-${index + 1}`}
          className='data-[state=open]:border-amber-600 not-last:data-[state=open]:border-b-2 dark:data-[state=open]:border-amber-400'
        >
          <AccordionTrigger className='data-[state=open]:text-amber-600 dark:data-[state=open]:text-amber-400 [&[data-state=open]>svg]:text-amber-600 dark:[&[data-state=open]>svg]:text-amber-400'>
            {item.title}
          </AccordionTrigger>
          <AccordionContent className='text-muted-foreground'>{item.content}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
```

---

## 6. Expand Icon (Plus 45° rotation)

Plus icon rotates 45° to become X.

```tsx
import { HeadsetIcon, PackageIcon, PlusIcon, RefreshCwIcon } from 'lucide-react'
import * as AccordionPrimitive from '@radix-ui/react-accordion'
import { Accordion, AccordionContent, AccordionItem } from '@/components/ui/accordion'

const items = [
  { icon: PackageIcon, title: 'How do I track my order?', content: '...' },
  { icon: RefreshCwIcon, title: 'What is your return policy?', content: '...' },
  { icon: HeadsetIcon, title: 'How can I contact customer support?', content: '...' }
]

const AccordionExpandIconDemo = () => {
  return (
    <Accordion type='single' collapsible className='w-full' defaultValue='item-1'>
      {items.map((item, index) => (
        <AccordionItem key={index} value={`item-${index + 1}`}>
          <AccordionPrimitive.Header className='flex'>
            <AccordionPrimitive.Trigger
              data-slot='accordion-trigger'
              className='focus-visible:border-ring focus-visible:ring-ring/50 flex flex-1 items-start justify-between gap-4 rounded-md py-4 text-left text-sm font-medium transition-all outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-45'
            >
              <span className='flex items-center gap-4'>
                <item.icon className='size-4 shrink-0' />
                <span>{item.title}</span>
              </span>
              <PlusIcon className='text-muted-foreground pointer-events-none size-4 shrink-0 transition-transform duration-200' />
            </AccordionPrimitive.Trigger>
          </AccordionPrimitive.Header>
          <AccordionContent className='text-muted-foreground'>{item.content}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
```

---

## 7. Avatar

With user avatar, name and email.

```tsx
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const items = [
  {
    name: 'Richard Payne',
    email: 'pwright@yahoo.com',
    avatarImage: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-1.png',
    content: 'Richard Payne is a remarkable individual...'
  },
  // ... more items
]

const AccordionAvatarDemo = () => {
  return (
    <Accordion type='single' collapsible className='w-full' defaultValue='item-1'>
      {items.map((item, index) => (
        <AccordionItem key={index} value={`item-${index + 1}`}>
          <AccordionTrigger className='items-center hover:no-underline'>
            <span className='flex items-center gap-4'>
              <Avatar className='size-10.5 rounded-sm'>
                <AvatarImage src={item.avatarImage} alt={item.name} className='rounded-sm' />
                <AvatarFallback className='rounded-sm text-xs'>
                  {item.name.split(/\s/).reduce((response, word) => (response += word.slice(0, 1)), '')}
                </AvatarFallback>
              </Avatar>
              <span className='flex flex-col space-y-0.5'>
                <span>{item.name}</span>
                <span className='text-muted-foreground font-normal'>{item.email}</span>
              </span>
            </span>
          </AccordionTrigger>
          <AccordionContent className='text-muted-foreground'>{item.content}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
```

---

## 8. Icon with Subtitle

Circular icon badge with title and subtitle.

```tsx
import { HeadsetIcon, PackageIcon, PlusIcon, RefreshCwIcon } from 'lucide-react'
import * as AccordionPrimitive from '@radix-ui/react-accordion'
import { Accordion, AccordionContent, AccordionItem } from '@/components/ui/accordion'

const items = [
  {
    icon: PackageIcon,
    title: 'How do I track my order?',
    subtitle: 'Shipping & Delivery',
    content: '...'
  },
  {
    icon: RefreshCwIcon,
    title: 'What is your return policy?',
    subtitle: 'Returns & Refunds',
    content: '...'
  },
  {
    icon: HeadsetIcon,
    title: 'How can I contact customer support?',
    subtitle: 'Help & Support',
    content: '...'
  }
]

const AccordionIconSubtitleDemo = () => {
  return (
    <Accordion type='single' collapsible className='w-full' defaultValue='item-1'>
      {items.map((item, index) => (
        <AccordionItem key={index} value={`item-${index + 1}`}>
          <AccordionPrimitive.Header className='flex'>
            <AccordionPrimitive.Trigger
              data-slot='accordion-trigger'
              className='focus-visible:border-ring focus-visible:ring-ring/50 flex flex-1 items-center justify-between gap-4 rounded-md py-4 text-left text-sm font-medium transition-all outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&>svg>path:last-child]:origin-center [&>svg>path:last-child]:transition-all [&>svg>path:last-child]:duration-200 [&[data-state=open]>svg]:rotate-180 [&[data-state=open]>svg>path:last-child]:rotate-90 [&[data-state=open]>svg>path:last-child]:opacity-0'
            >
              <span className='flex items-center gap-4'>
                <span
                  className='flex size-10 shrink-0 items-center justify-center rounded-full border'
                  aria-hidden='true'
                >
                  <item.icon className='size-4' />
                </span>
                <span className='flex flex-col space-y-0.5'>
                  <span>{item.title}</span>
                  <span className='text-muted-foreground font-normal'>{item.subtitle}</span>
                </span>
              </span>
              <PlusIcon className='text-muted-foreground pointer-events-none size-4 shrink-0 transition-transform duration-200' />
            </AccordionPrimitive.Trigger>
          </AccordionPrimitive.Header>
          <AccordionContent className='text-muted-foreground'>{item.content}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
```

---

## 9. Outline

Individual bordered items with spacing.

```tsx
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

const AccordionOutlineDemo = () => {
  return (
    <Accordion type='single' collapsible className='w-full space-y-2' defaultValue='item-1'>
      {items.map((item, index) => (
        <AccordionItem key={index} value={`item-${index + 1}`} className='rounded-md border!'>
          <AccordionTrigger className='px-5'>{item.title}</AccordionTrigger>
          <AccordionContent className='text-muted-foreground px-5'>{item.content}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
```

---

## 10. Box

All items in single bordered container.

```tsx
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

const AccordionBoxDemo = () => {
  return (
    <Accordion type='single' collapsible className='w-full rounded-md border' defaultValue='item-1'>
      {items.map((item, index) => (
        <AccordionItem key={index} value={`item-${index + 1}`}>
          <AccordionTrigger className='px-5'>{item.title}</AccordionTrigger>
          <AccordionContent className='text-muted-foreground px-5'>{item.content}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
```

---

## 11. Tabs Style

Background highlight on open item.

```tsx
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

const AccordionTabsDemo = () => {
  return (
    <Accordion type='single' collapsible className='w-full' defaultValue='item-1'>
      {items.map((item, index) => (
        <AccordionItem
          key={index}
          value={`item-${index + 1}`}
          className='data-[state=open]:bg-accent rounded-md border-none px-5 transition-colors duration-200'
        >
          <AccordionTrigger>{item.title}</AccordionTrigger>
          <AccordionContent className='text-muted-foreground'>{item.content}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
```

---

## 12. Tabs Outline

Border and shadow on open item.

```tsx
import { PlusIcon } from 'lucide-react'
import * as AccordionPrimitive from '@radix-ui/react-accordion'
import { Accordion, AccordionContent, AccordionItem } from '@/components/ui/accordion'

const AccordionTabsOutlineDemo = () => {
  return (
    <Accordion type='single' collapsible className='w-full' defaultValue='item-1'>
      {items.map((item, index) => (
        <AccordionItem
          key={index}
          value={`item-${index + 1}`}
          className='data-[state=open]:border-border rounded-md border border-transparent px-5 transition-colors duration-200 data-[state=open]:border data-[state=open]:shadow-md'
        >
          <AccordionPrimitive.Header className='flex'>
            <AccordionPrimitive.Trigger
              data-slot='accordion-trigger'
              className='focus-visible:border-ring focus-visible:ring-ring/50 flex flex-1 items-center justify-between gap-4 rounded-md py-4 text-left text-sm font-medium transition-all outline-none hover:underline focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&>svg>path:last-child]:origin-center [&>svg>path:last-child]:transition-all [&>svg>path:last-child]:duration-200 [&[data-state=open]>svg]:rotate-180 [&[data-state=open]>svg>path:last-child]:rotate-90 [&[data-state=open]>svg>path:last-child]:opacity-0'
            >
              {item.title}
              <PlusIcon className='text-muted-foreground pointer-events-none size-4 shrink-0 transition-transform duration-200' />
            </AccordionPrimitive.Trigger>
          </AccordionPrimitive.Header>
          <AccordionContent className='text-muted-foreground'>{item.content}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
```

---

## 13. Media Content

With images in content area.

```tsx
import { HeadsetIcon, PackageIcon, RefreshCwIcon } from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

const items = [
  {
    icon: PackageIcon,
    title: 'How do I track my order?',
    content: "You'll receive tracking information via email once your order ships.",
    media: 'https://cdn.shadcnstudio.com/ss-assets/components/accordion/image-1.jpg?width=520&format=auto'
  },
  // ... more items
]

const AccordionMediaContentDemo = () => {
  return (
    <Accordion type='single' collapsible className='w-full' defaultValue='item-1'>
      {items.map((item, index) => (
        <AccordionItem key={index} value={`item-${index + 1}`}>
          <AccordionTrigger>
            <span className='flex items-center gap-4'>
              <item.icon className='size-4 shrink-0' />
              <span>{item.title}</span>
            </span>
          </AccordionTrigger>
          <AccordionContent className='space-y-4'>
            <p className='text-muted-foreground'>{item.content}</p>
            <img src={item.media} alt={item.title} className='w-full rounded-md' />
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
```

---

## 14. Filled Header

Accent background on trigger.

```tsx
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

const AccordionFilledDemo = () => {
  return (
    <Accordion type='single' collapsible className='w-full space-y-2' defaultValue='item-1'>
      {items.map((item, index) => (
        <AccordionItem key={index} value={`item-${index + 1}`} className='rounded-md border!'>
          <AccordionTrigger className='bg-accent px-5 data-[state=open]:rounded-b-none'>{item.title}</AccordionTrigger>
          <AccordionContent className='text-muted-foreground px-5 pt-4'>{item.content}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
```

---

## 15. Multi-level

Nested accordions with categories.

```tsx
import { ChevronDownIcon, HeadsetIcon, PackageIcon, PlusIcon, RefreshCwIcon } from 'lucide-react'
import * as AccordionPrimitive from '@radix-ui/react-accordion'
import { Accordion, AccordionContent, AccordionItem } from '@/components/ui/accordion'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

const items = [
  {
    category: 'Shipping & Delivery',
    icon: PackageIcon,
    faqs: [
      { title: 'How do I track my order?', content: '...' },
      { title: 'What are your shipping options?', content: '...' },
      { title: 'Do you ship internationally?', content: '...' }
    ]
  },
  {
    category: 'Returns & Refunds',
    icon: RefreshCwIcon,
    faqs: [
      { title: 'What is your return policy?', content: '...' },
      { title: 'How long do refunds take to process?', content: '...' },
      { title: 'Do you offer exchanges?', content: '...' }
    ]
  },
  {
    category: 'Help & Support',
    icon: HeadsetIcon,
    faqs: [
      { title: 'How can I contact customer support?', content: '...' },
      { title: 'What are your business hours?', content: '...' },
      { title: 'How do I report a problem with my order?', content: '...' }
    ]
  }
]

const AccordionMultilevelDemo = () => {
  return (
    <Accordion type='single' collapsible className='w-full rounded-md border' defaultValue='item-1'>
      {items.map((item, index) => (
        <AccordionItem
          key={index}
          value={`item-${index + 1}`}
          className='has-focus-visible:border-ring has-focus-visible:ring-ring/50 outline-none first:rounded-t-md last:rounded-b-md has-focus-visible:z-10 has-focus-visible:ring-[3px]'
        >
          <AccordionPrimitive.Trigger
            data-slot='accordion-trigger'
            className='flex w-full flex-1 items-start justify-between gap-4 rounded-md px-5 py-4 text-left text-sm font-medium transition-all outline-none hover:underline disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-135'
          >
            <span className='flex items-center gap-4'>
              <item.icon className='size-4 shrink-0' />
              <span>{item.category}</span>
            </span>
            <PlusIcon className='text-muted-foreground pointer-events-none size-4 shrink-0 transition-transform duration-200' />
          </AccordionPrimitive.Trigger>
          <AccordionContent className='pb-0'>
            {item.faqs.map((faq, i) => (
              <Collapsible key={i} className='bg-accent border-t px-5' defaultOpen={i === 0}>
                <CollapsibleTrigger className='focus-visible:ring-ring/50 flex w-full items-center gap-4 rounded-sm py-4 font-medium outline-none focus-visible:z-10 focus-visible:ring-[3px] [&[data-state=open]>svg]:rotate-180'>
                  <ChevronDownIcon className='text-muted-foreground pointer-events-none size-4 shrink-0' />
                  {faq.title}
                </CollapsibleTrigger>
                <CollapsibleContent className='text-muted-foreground overflow-hidden pb-4'>
                  {faq.content}
                </CollapsibleContent>
              </Collapsible>
            ))}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
```

---

## 16. Multi-level with Icon

Nested accordions with plus/minus icons.

```tsx
import { PlusIcon } from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

const items = [
  {
    category: 'Shipping & Delivery',
    faqs: [
      { title: 'How do I track my order?', content: '...', open: true },
      { title: 'What are your shipping options?', content: '...' },
      { title: 'Do you ship internationally?', content: '...' }
    ]
  },
  // ... more categories
]

const AccordionMultilevelIconDemo = () => {
  return (
    <Accordion type='single' collapsible className='w-full rounded-md border' defaultValue='item-1'>
      {items.map((item, index) => (
        <AccordionItem
          key={index}
          value={`item-${index + 1}`}
          className='has-focus-visible:border-ring has-focus-visible:ring-ring/50 outline-none first:rounded-t-md last:rounded-b-md has-focus-visible:z-10 has-focus-visible:ring-[3px]'
        >
          <AccordionTrigger className='px-5 outline-none focus-visible:ring-0'>{item.category}</AccordionTrigger>
          <AccordionContent className='pb-0'>
            {item.faqs.map((faq, i) => (
              <Collapsible key={i} className='bg-muted border-t px-8' defaultOpen={faq.open}>
                <CollapsibleTrigger className='focus-visible:ring-ring/50 flex w-full items-center gap-4 rounded-sm py-4 font-medium outline-none focus-visible:z-10 focus-visible:ring-[3px] [&>svg>path:last-child]:origin-center [&[data-state=open]>svg]:rotate-180 [&[data-state=open]>svg>path:last-child]:rotate-90 [&[data-state=open]>svg>path:last-child]:opacity-0'>
                  <PlusIcon className='text-muted-foreground pointer-events-none size-4 shrink-0' />
                  {faq.title}
                </CollapsibleTrigger>
                <CollapsibleContent className='text-muted-foreground overflow-hidden pb-4'>
                  {faq.content}
                </CollapsibleContent>
              </Collapsible>
            ))}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
```
