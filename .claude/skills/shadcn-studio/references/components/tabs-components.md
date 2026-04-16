# Tabs Components

26 variants (1-26) from ShadcnStudio. Tab navigation components with various styles including horizontal, vertical, underline, pills, and more.

## Quick Reference

| # | Style | Dependencies | Use Case |
|---|-------|--------------|----------|
| 1 | Default | CSS only | Basic tab navigation |
| 2 | Outlined | CSS only | Tabs with border container |
| 3 | With Icon | lucide-react | Tabs with icons beside text |
| 4 | With Badge | Badge component | Tabs showing counts |
| 5 | Vertical Icon | lucide-react | Stacked icon above text |
| 6 | Vertical Badge | Badge component | Stacked badge above text |
| 7 | With Tooltip | Tooltip component | Icon-only tabs with tooltips |
| 8 | Soft Pills | CSS only | Soft colored active state |
| 9 | Solid Pills | CSS only | Solid colored active state |
| 10 | Outlined Pills | CSS only | Border-only active state |
| 11 | Underline | CSS only | Bottom border indicator |
| 12 | Sharp | CSS only | Sharp underline style |
| 13 | Lifted | CSS only | Browser-like lifted tabs |
| 14 | Overflow Scroll | ScrollArea | Scrollable tab list |
| 15 | Vertical | CSS only | Side navigation tabs |
| 16 | Vertical Underline | CSS only | Side tabs with left border |
| 17 | Vertical Soft | CSS only | Side tabs soft colored |
| 18 | Vertical Solid | CSS only | Side tabs solid colored |
| 19 | Vertical Sharp | CSS only | Side tabs thick border |
| 20 | Vertical Lined | CSS only | Side tabs thin border |
| 21 | Vertical Tooltip | Tooltip component | Side icon tabs with tooltips |
| 22 | Vertical With Icon | lucide-react | Side tabs with icons |
| 23 | Vertical With Badge | Badge component | Side tabs with counts |
| 24 | Vertical Outline | CSS only | Side tabs outline style |
| 25 | Custom | CSS only | Custom hover transitions |
| 26 | Custom Underline | CSS only | Custom underline with hover |

---

## 1. Default

Basic tab navigation with default shadcn styling.

### Usage

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const tabs = [
  {
    name: 'Explore',
    value: 'explore',
    content: (
      <>
        Discover <span className='text-foreground font-semibold'>fresh ideas</span>, trending topics, and hidden gems
        curated just for you. Start exploring and let your curiosity lead the way!
      </>
    )
  },
  {
    name: 'Favorites',
    value: 'favorites',
    content: (
      <>
        All your <span className='text-foreground font-semibold'>favorites</span> are saved here. Revisit articles,
        collections, and moments you love, any time you want a little inspiration.
      </>
    )
  },
  {
    name: 'Surprise Me',
    value: 'surprise',
    content: (
      <>
        <span className='text-foreground font-semibold'>Surprise!</span> Here&apos;s something unexpected—a fun fact, a
        quirky tip, or a daily challenge. Come back for a new surprise every day!
      </>
    )
  }
]

const TabsDemo = () => {
  return (
    <div className='w-full max-w-md'>
      <Tabs defaultValue='explore'>
        <TabsList>
          {tabs.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map(tab => (
          <TabsContent key={tab.value} value={tab.value}>
            <p className='text-muted-foreground text-sm'>{tab.content}</p>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

export default TabsDemo
```

---

## 2. Outlined

Tabs with border container and primary colored active state.

### Usage

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const TabsOutlinedDemo = () => {
  return (
    <div className='w-full max-w-md'>
      <Tabs defaultValue='explore' className='gap-4'>
        <TabsList className='bg-background gap-1 border p-1'>
          {tabs.map(tab => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className='data-[state=active]:bg-primary dark:data-[state=active]:bg-primary data-[state=active]:text-primary-foreground dark:data-[state=active]:text-primary-foreground dark:data-[state=active]:border-transparent'
            >
              {tab.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map(tab => (
          <TabsContent key={tab.value} value={tab.value}>
            <p className='text-muted-foreground text-sm'>{tab.content}</p>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

export default TabsOutlinedDemo
```

---

## 3. With Icon

Tabs with icons displayed beside the text label.

### Dependencies

```bash
npm install lucide-react
```

### Usage

```tsx
import { BookIcon, GiftIcon, HeartIcon } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const tabs = [
  { name: 'Explore', value: 'explore', icon: BookIcon, content: '...' },
  { name: 'Favorites', value: 'favorites', icon: HeartIcon, content: '...' },
  { name: 'Surprise', value: 'surprise', icon: GiftIcon, content: '...' }
]

const TabsWithIconDemo = () => {
  return (
    <div className='w-full max-w-md'>
      <Tabs defaultValue='explore' className='gap-4'>
        <TabsList>
          {tabs.map(({ icon: Icon, name, value }) => (
            <TabsTrigger key={value} value={value} className='flex items-center gap-1 px-2.5 sm:px-3'>
              <Icon />
              {name}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map(tab => (
          <TabsContent key={tab.value} value={tab.value}>
            <p className='text-muted-foreground text-sm'>{tab.content}</p>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

export default TabsWithIconDemo
```

---

## 4. With Badge

Tabs displaying count badges next to the label.

### Usage

```tsx
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const tabs = [
  { name: 'Explore', value: 'explore', count: 8, content: '...' },
  { name: 'Favorites', value: 'favorites', count: 3, content: '...' },
  { name: 'Surprise', value: 'surprise', count: 6, content: '...' }
]

const TabsWithBadgeDemo = () => {
  return (
    <div className='w-full max-w-md'>
      <Tabs defaultValue='explore' className='gap-4'>
        <TabsList>
          {tabs.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value} className='flex items-center gap-1 px-2.5 sm:px-3'>
              {tab.name}
              <Badge className='h-5 min-w-5 px-1 tabular-nums'>{tab.count}</Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map(tab => (
          <TabsContent key={tab.value} value={tab.value}>
            <p className='text-muted-foreground text-sm'>{tab.content}</p>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

export default TabsWithBadgeDemo
```

---

## 5. Vertical Icon

Tabs with icon stacked above the text label.

### Usage

```tsx
import { BookIcon, GiftIcon, HeartIcon } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const TabsWithVerticalIconDemo = () => {
  return (
    <div className='w-full max-w-md'>
      <Tabs defaultValue='explore' className='gap-4'>
        <TabsList className='h-full'>
          {tabs.map(({ icon: Icon, name, value }) => (
            <TabsTrigger key={value} value={value} className='flex flex-col items-center gap-1 px-2.5 sm:px-3'>
              <Icon />
              {name}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map(tab => (
          <TabsContent key={tab.value} value={tab.value}>
            <p className='text-muted-foreground text-sm'>{tab.content}</p>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

export default TabsWithVerticalIconDemo
```

---

## 6. Vertical Badge

Tabs with badge stacked above the text label.

### Usage

```tsx
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const TabsWithVerticalBadgeDemo = () => {
  return (
    <div className='w-full max-w-md'>
      <Tabs defaultValue='explore' className='gap-4'>
        <TabsList className='h-full'>
          {tabs.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value} className='flex flex-col items-center gap-1 px-2.5 sm:px-3'>
              <Badge className='h-5 min-w-5 px-1 tabular-nums'>{tab.count}</Badge>
              {tab.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map(tab => (
          <TabsContent key={tab.value} value={tab.value}>
            <p className='text-muted-foreground text-sm'>{tab.content}</p>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

export default TabsWithVerticalBadgeDemo
```

---

## 7. With Tooltip

Icon-only tabs with tooltips showing the label on hover.

### Usage

```tsx
import { BookIcon, GiftIcon, HeartIcon } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const TabsWithTooltipDemo = () => {
  return (
    <div className='w-full max-w-md'>
      <Tabs defaultValue='explore' className='gap-4'>
        <TabsList className='h-full'>
          {tabs.map(({ icon: Icon, name, value }) => (
            <Tooltip key={value}>
              <TooltipTrigger asChild>
                <span>
                  <TabsTrigger
                    value={value}
                    className='flex flex-col items-center gap-1 px-2.5 sm:px-3'
                    aria-label='tab-trigger'
                  >
                    <Icon />
                  </TabsTrigger>
                </span>
              </TooltipTrigger>
              <TooltipContent className='px-2 py-1 text-xs'>{name}</TooltipContent>
            </Tooltip>
          ))}
        </TabsList>

        {tabs.map(tab => (
          <TabsContent key={tab.value} value={tab.value}>
            <p className='text-muted-foreground text-sm'>{tab.content}</p>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

export default TabsWithTooltipDemo
```

---

## 8. Soft Pills

Tabs with soft/transparent colored active state.

### Usage

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const TabsSoftPillsDemo = () => {
  return (
    <div className='w-full max-w-md'>
      <Tabs defaultValue='explore' className='gap-4'>
        <TabsList className='bg-background'>
          {tabs.map(tab => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className='data-[state=active]:bg-primary/20 data-[state=active]:text-primary dark:data-[state=active]:text-primary dark:data-[state=active]:bg-primary/20 data-[state=active]:shadow-none dark:data-[state=active]:border-transparent'
            >
              {tab.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map(tab => (
          <TabsContent key={tab.value} value={tab.value}>
            <p className='text-muted-foreground text-sm'>{tab.content}</p>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

export default TabsSoftPillsDemo
```

---

## 9. Solid Pills

Tabs with solid colored active state.

### Usage

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const TabsSolidPillsDemo = () => {
  return (
    <div className='w-full max-w-md'>
      <Tabs defaultValue='explore' className='gap-4'>
        <TabsList className='bg-background'>
          {tabs.map(tab => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className='data-[state=active]:bg-primary dark:data-[state=active]:bg-primary data-[state=active]:text-primary-foreground dark:data-[state=active]:text-primary-foreground dark:data-[state=active]:border-transparent'
            >
              {tab.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map(tab => (
          <TabsContent key={tab.value} value={tab.value}>
            <p className='text-muted-foreground text-sm'>{tab.content}</p>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

export default TabsSolidPillsDemo
```

---

## 10. Outlined Pills

Tabs with border-only active state.

### Usage

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const TabsOutlinedPillsDemo = () => {
  return (
    <div className='w-full max-w-md'>
      <Tabs defaultValue='explore' className='gap-4'>
        <TabsList className='bg-background'>
          {tabs.map(tab => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className='data-[state=active]:border-border data-[state=active]:shadow-none'
            >
              {tab.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map(tab => (
          <TabsContent key={tab.value} value={tab.value}>
            <p className='text-muted-foreground text-sm'>{tab.content}</p>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

export default TabsOutlinedPillsDemo
```

---

## 11. Underline

Tabs with bottom border indicator.

### Usage

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const TabsUnderlineDemo = () => {
  return (
    <div className='w-full max-w-md'>
      <Tabs defaultValue='explore' className='gap-4'>
        <TabsList className='bg-background rounded-none border-b p-0'>
          {tabs.map(tab => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className='bg-background data-[state=active]:border-primary dark:data-[state=active]:border-primary h-full rounded-none border-0 border-b-2 border-transparent data-[state=active]:shadow-none'
            >
              {tab.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map(tab => (
          <TabsContent key={tab.value} value={tab.value}>
            <p className='text-muted-foreground text-sm'>{tab.content}</p>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

export default TabsUnderlineDemo
```

---

## 12. Sharp

Tabs with sharp underline style (similar to underline but with different spacing).

### Usage

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const TabsSharpDemo = () => {
  return (
    <div className='w-full max-w-md'>
      <Tabs defaultValue='explore' className='gap-4'>
        <TabsList className='bg-background rounded-none border-b p-0'>
          {tabs.map(tab => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className='bg-background data-[state=active]:border-primary dark:data-[state=active]:border-primary h-full rounded-none border-b-2 border-transparent data-[state=active]:shadow-none'
            >
              {tab.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map(tab => (
          <TabsContent key={tab.value} value={tab.value}>
            <p className='text-muted-foreground text-sm'>{tab.content}</p>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

export default TabsSharpDemo
```

---

## 13. Lifted

Browser-like lifted tabs with connected border.

### Usage

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const TabsLiftedDemo = () => {
  return (
    <div>
      <Tabs defaultValue='explore' className='gap-4'>
        <TabsList className='bg-background justify-start rounded-none border-b p-0'>
          {tabs.map(tab => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className='bg-background border-b-border dark:data-[state=active]:bg-background data-[state=active]:border-border data-[state=active]:border-b-background h-full rounded-none rounded-t border border-transparent data-[state=active]:-mb-0.5 data-[state=active]:shadow-none dark:border-b-0 dark:data-[state=active]:-mb-0.5'
            >
              {tab.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map(tab => (
          <TabsContent key={tab.value} value={tab.value}>
            <p className='text-muted-foreground text-sm'>{tab.content}</p>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

export default TabsLiftedDemo
```

---

## 14. Overflow Scroll

Scrollable tab list for many tabs.

### Usage

```tsx
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const tabs = [
  { name: 'Explore', value: 'explore', content: '...' },
  { name: 'Favorites', value: 'favorites', content: '...' },
  { name: 'Surprise Me', value: 'surprise', content: '...' },
  { name: 'Trending', value: 'trending', content: '...' },
  { name: 'Events', value: 'events', content: '...' },
  { name: 'News', value: 'news', content: '...' },
  { name: 'Community', value: 'community', content: '...' },
  { name: 'Rewards', value: 'rewards', content: '...' },
  { name: 'Profile', value: 'profile', content: '...' }
]

const TabsOverflowDemo = () => {
  return (
    <div className='w-full max-w-md'>
      <Tabs defaultValue='explore' className='gap-1'>
        <ScrollArea>
          <TabsList className='mb-3'>
            {tabs.map(tab => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.name}
              </TabsTrigger>
            ))}
          </TabsList>
          <ScrollBar orientation='horizontal' />
        </ScrollArea>

        {tabs.map(tab => (
          <TabsContent key={tab.value} value={tab.value}>
            <p className='text-muted-foreground text-sm'>{tab.content}</p>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

export default TabsOverflowDemo
```

---

## 15. Vertical

Side navigation tabs layout.

### Usage

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const TabsVerticalDemo = () => {
  return (
    <div className='w-full max-w-md'>
      <Tabs defaultValue='explore' className='flex-row'>
        <TabsList className='h-full flex-col'>
          {tabs.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value} className='w-full'>
              {tab.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map(tab => (
          <TabsContent key={tab.value} value={tab.value}>
            <p className='text-muted-foreground text-sm'>{tab.content}</p>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

export default TabsVerticalDemo
```

---

## 16. Vertical Underline

Side tabs with left border indicator.

### Usage

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const TabsVerticalUnderlineDemo = () => {
  return (
    <div className='w-full max-w-md'>
      <Tabs defaultValue='explore' className='flex-row'>
        <TabsList className='bg-background h-full flex-col rounded-none border-l p-0'>
          {tabs.map(tab => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className='bg-background data-[state=active]:border-primary dark:data-[state=active]:border-primary h-full w-full justify-start rounded-none border-0 border-l-2 border-transparent data-[state=active]:shadow-none'
            >
              {tab.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map(tab => (
          <TabsContent key={tab.value} value={tab.value}>
            <p className='text-muted-foreground text-sm'>{tab.content}</p>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

export default TabsVerticalUnderlineDemo
```

---

## 17. Vertical Soft

Side tabs with soft colored active state.

### Usage

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const TabsVerticalSoftDemo = () => {
  return (
    <div className='w-full max-w-md'>
      <Tabs defaultValue='explore' className='flex-row'>
        <TabsList className='bg-background h-full flex-col'>
          {tabs.map(tab => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className='data-[state=active]:bg-primary/20 data-[state=active]:text-primary dark:data-[state=active]:text-primary dark:data-[state=active]:bg-primary/20 w-full data-[state=active]:shadow-none dark:data-[state=active]:border-transparent'
            >
              {tab.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map(tab => (
          <TabsContent key={tab.value} value={tab.value}>
            <p className='text-muted-foreground text-sm'>{tab.content}</p>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

export default TabsVerticalSoftDemo
```

---

## 18. Vertical Solid

Side tabs with solid colored active state.

### Usage

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const TabsVerticalSolidDemo = () => {
  return (
    <div className='w-full max-w-md'>
      <Tabs defaultValue='explore' className='flex-row'>
        <TabsList className='bg-background h-full flex-col'>
          {tabs.map(tab => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className='data-[state=active]:bg-primary dark:data-[state=active]:bg-primary data-[state=active]:text-primary-foreground dark:data-[state=active]:text-primary-foreground w-full dark:data-[state=active]:border-transparent'
            >
              {tab.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map(tab => (
          <TabsContent key={tab.value} value={tab.value}>
            <p className='text-muted-foreground text-sm'>{tab.content}</p>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

export default TabsVerticalSolidDemo
```

---

## 19. Vertical Sharp

Side tabs with thick left border indicator.

### Usage

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const TabsVerticalSharpDemo = () => {
  return (
    <div className='w-full max-w-md'>
      <Tabs defaultValue='explore' className='flex-row'>
        <TabsList className='bg-background h-full flex-col rounded-none border-l p-0'>
          {tabs.map(tab => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className='bg-background data-[state=active]:border-primary dark:data-[state=active]:border-primary h-full w-full justify-start rounded-none border-l-3 border-transparent data-[state=active]:shadow-none'
            >
              {tab.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map(tab => (
          <TabsContent key={tab.value} value={tab.value}>
            <p className='text-muted-foreground text-sm'>{tab.content}</p>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

export default TabsVerticalSharpDemo
```

---

## 20. Vertical Lined

Side tabs with thin left border indicator (no container border).

### Usage

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const TabsVerticalLinedDemo = () => {
  return (
    <div className='w-full max-w-md'>
      <Tabs defaultValue='explore' className='flex-row'>
        <TabsList className='bg-background h-full flex-col rounded-none p-0'>
          {tabs.map(tab => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className='bg-background data-[state=active]:border-primary dark:data-[state=active]:border-primary h-full w-full justify-start rounded-none border-0 border-l-2 border-transparent data-[state=active]:shadow-none'
            >
              {tab.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map(tab => (
          <TabsContent key={tab.value} value={tab.value}>
            <p className='text-muted-foreground text-sm'>{tab.content}</p>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

export default TabsVerticalLinedDemo
```

---

## 21. Vertical With Tooltip

Side icon-only tabs with tooltips.

### Usage

```tsx
import { BookIcon, GiftIcon, HeartIcon } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const TabsVerticalWithTooltipDemo = () => {
  return (
    <div className='w-full max-w-md'>
      <Tabs defaultValue='explore' className='flex-row gap-4'>
        <TabsList className='h-full flex-col gap-2'>
          {tabs.map(({ icon: Icon, name, value }) => (
            <Tooltip key={value}>
              <TooltipTrigger asChild>
                <span>
                  <TabsTrigger
                    value={value}
                    className='flex w-full flex-col items-center gap-1'
                    aria-label='tab-trigger'
                  >
                    <Icon />
                  </TabsTrigger>
                </span>
              </TooltipTrigger>
              <TooltipContent className='px-2 py-1 text-xs' side='left'>
                {name}
              </TooltipContent>
            </Tooltip>
          ))}
        </TabsList>

        {tabs.map(tab => (
          <TabsContent key={tab.value} value={tab.value}>
            <p className='text-muted-foreground text-sm'>{tab.content}</p>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

export default TabsVerticalWithTooltipDemo
```

---

## 22. Vertical With Icon

Side tabs with icons beside text.

### Usage

```tsx
import { BookIcon, GiftIcon, HeartIcon } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const TabsVerticalWithIconDemo = () => {
  return (
    <div className='w-full max-w-md'>
      <Tabs defaultValue='explore' className='flex-row'>
        <TabsList className='h-full flex-col'>
          {tabs.map(({ icon: Icon, name, value }) => (
            <TabsTrigger
              key={value}
              value={value}
              className='flex w-full items-center justify-start gap-1.5 px-2.5 sm:px-3'
            >
              <Icon />
              {name}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map(tab => (
          <TabsContent key={tab.value} value={tab.value}>
            <p className='text-muted-foreground text-sm'>{tab.content}</p>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

export default TabsVerticalWithIconDemo
```

---

## 23. Vertical With Badge

Side tabs with count badges.

### Usage

```tsx
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const TabsVerticalWithBadgeDemo = () => {
  return (
    <div className='w-full max-w-md'>
      <Tabs defaultValue='explore' className='flex-row'>
        <TabsList className='h-full flex-col gap-1.5'>
          {tabs.map(tab => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className='flex w-full items-center justify-start gap-1.5 px-2.5 sm:px-3'
            >
              {tab.name}
              <Badge className='h-5 min-w-5 px-1 tabular-nums'>{tab.count}</Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map(tab => (
          <TabsContent key={tab.value} value={tab.value}>
            <p className='text-muted-foreground text-sm'>{tab.content}</p>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

export default TabsVerticalWithBadgeDemo
```

---

## 24. Vertical Outline

Side tabs with outline/border active style.

### Usage

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const TabsVerticalOutlineDemo = () => {
  return (
    <div className='w-full max-w-md'>
      <Tabs defaultValue='explore' className='flex-row'>
        <TabsList className='bg-background h-full flex-col'>
          {tabs.map(tab => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className='data-[state=active]:border-border w-full data-[state=active]:shadow-none'
            >
              {tab.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map(tab => (
          <TabsContent key={tab.value} value={tab.value}>
            <p className='text-muted-foreground text-sm'>{tab.content}</p>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

export default TabsVerticalOutlineDemo
```

---

## 25. Custom

Custom styled tabs with hover transitions.

### Usage

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const TabsCustomDemo = () => {
  return (
    <div className='w-full max-w-md'>
      <Tabs defaultValue='explore' className='gap-4'>
        <TabsList className='bg-background gap-1'>
          {tabs.map(tab => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className='data-[state=active]:bg-primary dark:data-[state=active]:bg-primary data-[state=active]:text-primary-foreground dark:data-[state=active]:text-primary-foreground text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-300 hover:border dark:data-[state=active]:border-transparent'
            >
              {tab.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map(tab => (
          <TabsContent key={tab.value} value={tab.value}>
            <p className='text-muted-foreground text-sm'>{tab.content}</p>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

export default TabsCustomDemo
```

---

## 26. Custom Underline

Custom underline tabs with hover effects.

### Usage

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const TabsCustomUnderlineDemo = () => {
  return (
    <div className='w-full max-w-md'>
      <Tabs defaultValue='explore' className='gap-4'>
        <TabsList className='bg-background rounded-none border-b p-0'>
          {tabs.map(tab => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className='bg-background data-[state=active]:border-primary dark:data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-foreground hover:border-muted-foreground/30 h-full rounded-none border-0 border-b-2 border-transparent data-[state=active]:shadow-none'
            >
              {tab.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map(tab => (
          <TabsContent key={tab.value} value={tab.value}>
            <p className='text-muted-foreground text-sm'>{tab.content}</p>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

export default TabsCustomUnderlineDemo
```
