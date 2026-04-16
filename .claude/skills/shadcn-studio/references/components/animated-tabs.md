# Animated Tabs Components

3 variants from ShadcnStudio. Select based on use case.

## Quick Reference

| # | Style | Animation | Use Case |
|---|-------|-----------|----------|
| 1 | Custom Tabs | Spring highlight + blur content | Full custom tabs with Motion |
| 2 | Expandable | Width expansion on active | Compact icon tabs |
| 3 | Underline | Animated underline indicator | Classic tab navigation |

---

## 1. Custom Animated Tabs

Full custom tabs component with spring-animated highlight and blur transitions on content.

```tsx
'use client'

import * as React from 'react'

import { motion, type Transition, type HTMLMotionProps } from 'motion/react'

import { cn } from '@/lib/utils'
import { MotionHighlight, MotionHighlightItem } from '@/components/ui/motion-highlight'

type TabsContextType<T extends string> = {
  activeValue: T
  handleValueChange: (value: T) => void
  registerTrigger: (value: T, node: HTMLElement | null) => void
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TabsContext = React.createContext<TabsContextType<any> | undefined>(undefined)

function useTabs<T extends string = string>(): TabsContextType<T> {
  const context = React.useContext(TabsContext)

  if (!context) {
    throw new Error('useTabs must be used within a TabsProvider')
  }

  return context
}

type BaseTabsProps = React.ComponentProps<'div'> & {
  children: React.ReactNode
}

type UnControlledTabsProps<T extends string = string> = BaseTabsProps & {
  defaultValue?: T
  value?: never
  onValueChange?: never
}

type ControlledTabsProps<T extends string = string> = BaseTabsProps & {
  value: T
  onValueChange?: (value: T) => void
  defaultValue?: never
}

type TabsProps<T extends string = string> = UnControlledTabsProps<T> | ControlledTabsProps<T>

function Tabs<T extends string = string>({
  defaultValue,
  value,
  onValueChange,
  children,
  className,
  ...props
}: TabsProps<T>) {
  const [activeValue, setActiveValue] = React.useState<T | undefined>(defaultValue ?? undefined)
  const triggersRef = React.useRef(new Map<string, HTMLElement>())
  const initialSet = React.useRef(false)
  const isControlled = value !== undefined

  React.useEffect(() => {
    if (!isControlled && activeValue === undefined && triggersRef.current.size > 0 && !initialSet.current) {
      const firstTab = Array.from(triggersRef.current.keys())[0]

      setActiveValue(firstTab as T)
      initialSet.current = true
    }
  }, [activeValue, isControlled])

  const registerTrigger = (value: string, node: HTMLElement | null) => {
    if (node) {
      triggersRef.current.set(value, node)

      if (!isControlled && activeValue === undefined && !initialSet.current) {
        setActiveValue(value as T)
        initialSet.current = true
      }
    } else {
      triggersRef.current.delete(value)
    }
  }

  const handleValueChange = (val: T) => {
    if (!isControlled) setActiveValue(val)
    else onValueChange?.(val)
  }

  return (
    <TabsContext.Provider
      value={{
        activeValue: (value ?? activeValue)!,
        handleValueChange,
        registerTrigger
      }}
    >
      <div data-slot='tabs' className={cn('flex flex-col gap-2', className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

type TabsListProps = React.ComponentProps<'div'> & {
  children: React.ReactNode
  activeClassName?: string
  transition?: Transition
}

function TabsList({
  children,
  className,
  activeClassName,
  transition = {
    type: 'spring',
    stiffness: 200,
    damping: 25
  },
  ...props
}: TabsListProps) {
  const { activeValue } = useTabs()

  return (
    <MotionHighlight
      controlledItems
      className={cn('bg-background rounded-sm shadow-sm', activeClassName)}
      value={activeValue}
      transition={transition}
    >
      <div
        role='tablist'
        data-slot='tabs-list'
        className={cn(
          'bg-muted text-muted-foreground inline-flex h-10 w-fit items-center justify-center rounded-lg p-[4px]',
          className
        )}
        {...props}
      >
        {children}
      </div>
    </MotionHighlight>
  )
}

type TabsTriggerProps = HTMLMotionProps<'button'> & {
  value: string
  children: React.ReactNode
}

function TabsTrigger({ ref, value, children, className, ...props }: TabsTriggerProps) {
  const { activeValue, handleValueChange, registerTrigger } = useTabs()

  const localRef = React.useRef<HTMLButtonElement | null>(null)

  React.useImperativeHandle(ref, () => localRef.current as HTMLButtonElement)

  React.useEffect(() => {
    registerTrigger(value, localRef.current)

    return () => registerTrigger(value, null)
  }, [value, registerTrigger])

  return (
    <MotionHighlightItem value={value} className='size-full'>
      <motion.button
        ref={localRef}
        data-slot='tabs-trigger'
        role='tab'
        onClick={() => handleValueChange(value)}
        data-state={activeValue === value ? 'active' : 'inactive'}
        className={cn(
          'ring-offset-background focus-visible:ring-ring data-[state=active]:text-foreground z-[1] inline-flex size-full cursor-pointer items-center justify-center rounded-sm px-2 py-1 text-sm font-medium whitespace-nowrap transition-transform focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
          className
        )}
        {...props}
      >
        {children}
      </motion.button>
    </MotionHighlightItem>
  )
}

type TabsContentsProps = React.ComponentProps<'div'> & {
  children: React.ReactNode
  transition?: Transition
}

function TabsContents({
  children,
  className,
  transition = {
    type: 'spring',
    stiffness: 300,
    damping: 30,
    bounce: 0,
    restDelta: 0.01
  },
  ...props
}: TabsContentsProps) {
  const { activeValue } = useTabs()
  const childrenArray = React.Children.toArray(children)

  const activeIndex = childrenArray.findIndex(
    (child): child is React.ReactElement<{ value: string }> =>
      React.isValidElement(child) &&
      typeof child.props === 'object' &&
      child.props !== null &&
      'value' in child.props &&
      child.props.value === activeValue
  )

  return (
    <div data-slot='tabs-contents' className={cn('overflow-hidden', className)} {...props}>
      <motion.div className='-mx-2 flex' animate={{ x: activeIndex * -100 + '%' }} transition={transition}>
        {childrenArray.map((child, index) => (
          <div key={index} className='w-full shrink-0 px-2'>
            {child}
          </div>
        ))}
      </motion.div>
    </div>
  )
}

type TabsContentProps = HTMLMotionProps<'div'> & {
  value: string
  children: React.ReactNode
}

function TabsContent({ children, value, className, ...props }: TabsContentProps) {
  const { activeValue } = useTabs()
  const isActive = activeValue === value

  return (
    <motion.div
      role='tabpanel'
      data-slot='tabs-content'
      className={cn('overflow-hidden', className)}
      initial={{ filter: 'blur(0px)' }}
      animate={{ filter: isActive ? 'blur(0px)' : 'blur(2px)' }}
      exit={{ filter: 'blur(0px)' }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContents,
  TabsContent,
  useTabs,
  type TabsContextType,
  type TabsProps,
  type TabsListProps,
  type TabsTriggerProps,
  type TabsContentsProps,
  type TabsContentProps
}
```

---

## 2. Expandable Tabs

Compact tabs with icons that expand to show label on active state.

```tsx
'use client'

import { useState } from 'react'

import { motion, AnimatePresence } from 'motion/react'
import { BookIcon, GiftIcon, HeartIcon } from 'lucide-react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { cn } from '@/lib/utils'

const tabs = [
  {
    name: 'Explore',
    value: 'explore',
    icon: BookIcon,
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
    icon: HeartIcon,
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
    icon: GiftIcon,
    content: (
      <>
        <span className='text-foreground font-semibold'>Surprise!</span> Here&apos;s something unexpected—a fun fact, a
        quirky tip, or a daily challenge. Come back for a new surprise every day!
      </>
    )
  }
]

const ExpandableTabsDemo = () => {
  const [activeTab, setActiveTab] = useState('explore')

  return (
    <div className='w-full max-w-md'>
      <Tabs value={activeTab} onValueChange={setActiveTab} className='gap-4'>
        <TabsList className='h-auto gap-2 rounded-xl p-1'>
          {tabs.map(({ icon: Icon, name, value }) => {
            const isActive = activeTab === value

            return (
              <motion.div
                key={value}
                layout
                className={cn(
                  'flex h-8 items-center justify-center overflow-hidden rounded-md',
                  isActive ? 'flex-1' : 'flex-none'
                )}
                onClick={() => setActiveTab(value)}
                initial={false}
                animate={{
                  width: isActive ? 120 : 32
                }}
                transition={{
                  type: 'tween',
                  stiffness: 400,
                  damping: 25
                }}
              >
                <TabsTrigger value={value} asChild>
                  <motion.div
                    className='flex h-8 w-full items-center justify-center'
                    animate={{ filter: 'blur(0px)' }}
                    exit={{ filter: 'blur(2px)' }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                  >
                    <Icon className='aspect-square size-4 shrink-0' />
                    <AnimatePresence initial={false}>
                      {isActive && (
                        <motion.span
                          className='font-medium max-sm:hidden'
                          initial={{ opacity: 0, scaleX: 0.8 }}
                          animate={{ opacity: 1, scaleX: 1 }}
                          transition={{ duration: 0.25, ease: 'easeOut' }}
                          style={{ originX: 0 }}
                        >
                          {name}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </TabsTrigger>
              </motion.div>
            )
          })}
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

export default ExpandableTabsDemo
```

---

## 3. Animated Underline Tabs

Classic tabs with animated underline indicator using spring physics.

```tsx
'use client'

import { useLayoutEffect, useRef, useState } from 'react'

import { motion } from 'motion/react'

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

const AnimatedUnderlineTabsDemo = () => {
  const [activeTab, setActiveTab] = useState('explore')
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [underlineStyle, setUnderlineStyle] = useState({ left: 0, width: 0 })

  useLayoutEffect(() => {
    const activeIndex = tabs.findIndex(tab => tab.value === activeTab)
    const activeTabElement = tabRefs.current[activeIndex]

    if (activeTabElement) {
      const { offsetLeft, offsetWidth } = activeTabElement

      setUnderlineStyle({
        left: offsetLeft,
        width: offsetWidth
      })
    }
  }, [activeTab])

  return (
    <div className='w-full max-w-md'>
      <Tabs value={activeTab} onValueChange={setActiveTab} className='gap-4'>
        <TabsList className='bg-background relative rounded-none border-b p-0'>
          {tabs.map((tab, index) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              ref={el => {
                tabRefs.current[index] = el
              }}
              className='bg-background dark:data-[state=active]:bg-background relative z-10 rounded-none border-0 data-[state=active]:shadow-none'
            >
              {tab.name}
            </TabsTrigger>
          ))}

          <motion.div
            className='bg-primary absolute bottom-0 z-20 h-0.5'
            layoutId='underline'
            style={{
              left: underlineStyle.left,
              width: underlineStyle.width
            }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 40
            }}
          />
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

export default AnimatedUnderlineTabsDemo
```
