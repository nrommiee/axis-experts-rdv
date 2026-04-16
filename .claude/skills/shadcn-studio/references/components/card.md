# Card Components

15 variants from ShadcnStudio. Select based on use case.

## Quick Reference

| # | Style | Features | Use Case |
|---|-------|----------|----------|
| 1 | Login | Form with inputs | Authentication |
| 2 | Meeting Notes | List + avatars | Team collaboration |
| 3 | Invite | Avatar grid | Team member invitation |
| 4 | Bottom Image | Image below content | Blog posts, articles |
| 5 | Top Image | Image above content | Product showcase |
| 6 | Horizontal | Side-by-side layout | Featured content |
| 7 | Overlay | Text over image | Hero cards, banners |
| 8 | Soft | Colored background | Highlighted content |
| 9 | Outline | Border only | Subtle emphasis |
| 10 | With Tabs | Tabbed content | Multi-section info |
| 11 | Tweet/Social | Social media style | Social feeds |
| 12 | Product | E-commerce style | Product listings |
| 13 | Testimonial | Review with rating | Customer reviews |
| 14 | Action/Dismissable | Close button | Notifications, CTAs |
| 15 | Group | Multiple cards | Card grids, galleries |

---

## 1. Login Card

Card with login form, inputs and buttons.

```tsx
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const CardDemo = () => {
  return (
    <Card className='w-full max-w-md'>
      <CardHeader>
        <CardTitle>Login to your account</CardTitle>
        <CardDescription>Enter your email below to login to your account</CardDescription>
      </CardHeader>
      <CardContent>
        <form>
          <div className='flex flex-col gap-6'>
            <div className='grid gap-2'>
              <Label htmlFor='email'>Email</Label>
              <Input id='email' type='email' placeholder='m@example.com' />
            </div>
            <div className='grid gap-2'>
              <div className='flex items-center'>
                <Label htmlFor='password'>Password</Label>
                <a href='#' className='ml-auto inline-block text-sm underline-offset-4 hover:underline'>
                  Forgot your password?
                </a>
              </div>
              <Input id='password' type='password' />
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className='flex-col gap-2'>
        <Button type='submit' className='w-full'>
          Login
        </Button>
        <Button variant='outline' className='w-full'>
          Continue with Google
        </Button>
        <div className='mt-4 text-center text-sm'>
          Don&apos;t have an account?{' '}
          <a href='#' className='underline underline-offset-4'>
            Sign up
          </a>
        </div>
      </CardFooter>
    </Card>
  )
}

export default CardDemo
```

---

## 2. Meeting Notes

Card with meeting notes and avatar stack.

```tsx
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

const avatars = [
  {
    src: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-3.png',
    fallback: 'OS',
    name: 'Olivia Sparks'
  },
  {
    src: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-6.png',
    fallback: 'HL',
    name: 'Howard Lloyd'
  },
  {
    src: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-5.png',
    fallback: 'HR',
    name: 'Hallie Richards'
  },
  {
    src: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-16.png',
    fallback: 'JW',
    name: 'Jenny Wilson'
  }
]

const CardMeetingNotesDemo = () => {
  return (
    <Card className='max-w-md'>
      <CardHeader>
        <CardTitle>Meeting Notes</CardTitle>
        <CardDescription>Transcript from the meeting with the client.</CardDescription>
      </CardHeader>
      <CardContent className='text-sm'>
        <p>Client requested dashboard redesign with focus on mobile responsiveness.</p>
        <ol className='mt-4 flex list-decimal flex-col gap-2 pl-6'>
          <li>New analytics widgets for daily/weekly metrics</li>
          <li>Simplified navigation menu</li>
          <li>Dark mode support</li>
          <li>Timeline: 6 weeks</li>
          <li>Follow-up meeting scheduled for next Tuesday</li>
        </ol>
      </CardContent>
      <CardFooter>
        <div className='flex -space-x-2 hover:space-x-1'>
          {avatars.map((avatar, index) => (
            <Avatar key={index} className='ring-background ring-2 transition-all duration-300 ease-in-out'>
              <AvatarImage src={avatar.src} alt={avatar.name} />
              <AvatarFallback className='text-xs'>{avatar.fallback}</AvatarFallback>
            </Avatar>
          ))}
        </div>
      </CardFooter>
    </Card>
  )
}

export default CardMeetingNotesDemo
```

---

## 3. Invite Card

Card with team member grid for invitations.

```tsx
import { CircleFadingPlusIcon } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const CardInviteCardDemo = () => {
  return (
    <Card className='w-full max-w-lg'>
      <CardHeader>
        <CardTitle>Meeting Notes</CardTitle>
      </CardHeader>
      <CardContent className='grid gap-4 sm:grid-cols-2'>
        <div className='flex items-center gap-4'>
          <CircleFadingPlusIcon />
          <span className='text-sm font-semibold'>Invite Member </span>
        </div>
        <div className='flex items-center gap-4'>
          <Avatar>
            <AvatarImage src='https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-5.png' alt='Hallie Richards' />
            <AvatarFallback className='text-xs'>JA</AvatarFallback>
          </Avatar>
          <div className='flex flex-col'>
            <span className='text-sm font-semibold'>Jimmy Androson </span>
            <span className='text-muted-foreground text-sm'>UI Designer</span>
          </div>
        </div>
        <div className='flex items-center gap-4'>
          <Avatar>
            <AvatarImage src='https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-2.png' alt='Hallie Richards' />
            <AvatarFallback className='text-xs'>DA</AvatarFallback>
          </Avatar>
          <div className='flex flex-col'>
            <span className='text-sm font-semibold'>Dean Ambrose </span>
            <span className='text-muted-foreground text-sm'>UX Designer</span>
          </div>
        </div>
        <div className='flex items-center gap-4'>
          <Avatar>
            <AvatarImage src='https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-3.png' alt='Hallie Richards' />
            <AvatarFallback className='text-xs'>HR</AvatarFallback>
          </Avatar>
          <div className='flex flex-col'>
            <span className='text-sm font-semibold'>Anita John</span>
            <span className='text-muted-foreground text-sm'>Branding</span>
          </div>
        </div>
        <div></div>
        <div></div>
      </CardContent>
    </Card>
  )
}

export default CardInviteCardDemo
```

---

## 4. Bottom Image

Card with image at the bottom.

```tsx
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from '@/components/ui/card'

const CardBottomImageDemo = () => {
  return (
    <Card className='max-w-md pb-0'>
      <CardHeader>
        <CardTitle>Fluid Gradient Flow</CardTitle>
        <CardDescription>A vibrant and abstract background with smooth gradient curves.</CardDescription>
      </CardHeader>
      <CardContent className='px-0'>
        <img
          src='https://cdn.shadcnstudio.com/ss-assets/components/card/image-1.png?height=280&format=auto'
          alt='Banner'
          className='aspect-video h-70 rounded-b-xl object-cover'
        />
      </CardContent>
    </Card>
  )
}

export default CardBottomImageDemo
```

---

## 5. Top Image

Card with image at the top and action buttons.

```tsx
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardDescription, CardTitle, CardFooter } from '@/components/ui/card'

const CardTopImageDemo = () => {
  return (
    <Card className='max-w-md pt-0'>
      <CardContent className='px-0'>
        <img
          src='https://cdn.shadcnstudio.com/ss-assets/components/card/image-2.png?height=280&format=auto'
          alt='Banner'
          className='aspect-video h-70 rounded-t-xl object-cover'
        />
      </CardContent>
      <CardHeader>
        <CardTitle>Ethereal Swirl Gradient</CardTitle>
        <CardDescription>Smooth, flowing gradients blending rich reds and blues in an abstract swirl.</CardDescription>
      </CardHeader>
      <CardFooter className='gap-3 max-sm:flex-col max-sm:items-stretch'>
        <Button>Explore More</Button>
        <Button variant={'outline'}>Download Now</Button>
      </CardFooter>
    </Card>
  )
}

export default CardTopImageDemo
```

---

## 6. Horizontal

Card with horizontal layout (image left, content right).

```tsx
import { Card, CardContent, CardHeader, CardDescription, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const CardHorizontalDemo = () => {
  return (
    <Card className='max-w-lg py-0 sm:flex-row sm:gap-0'>
      <CardContent className='grow-1 px-0'>
        <img
          src='https://cdn.shadcnstudio.com/ss-assets/components/card/image-3.png'
          alt='Banner'
          className='size-full rounded-l-xl'
        />
      </CardContent>
      <div className='sm:min-w-54'>
        <CardHeader className='pt-6'>
          <CardTitle>Dreamy Colorwave Gradient</CardTitle>
          <CardDescription>A smooth blend of vibrant pinks, purples, and blues for a magical touch.</CardDescription>
        </CardHeader>
        <CardFooter className='gap-3 py-6'>
          <Button className='bg-transparent bg-gradient-to-br from-purple-500 to-pink-500 text-white focus-visible:ring-pink-600/20'>
            Explore More
          </Button>
        </CardFooter>
      </div>
    </Card>
  )
}

export default CardHorizontalDemo
```

---

## 7. Overlay

Card with text overlay on image.

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const CardOverlayDemo = () => {
  return (
    <Card className='before:bg-primary/70 relative max-w-md py-0 before:absolute before:size-full before:rounded-xl'>
      <CardContent className='px-0'>
        <img
          src='https://cdn.shadcnstudio.com/ss-assets/components/card/image-8.png?widht=448&height=280&format=auto'
          alt='Banner'
          className='h-70 w-112 rounded-xl'
        />
      </CardContent>
      <div className='absolute'>
        <CardHeader className='text-primary-foreground w-full pt-6'>
          <CardTitle>Creative Catalyst</CardTitle>
        </CardHeader>
        <CardContent className='text-primary-foreground/80'>
          Step into a world where imagination takes the lead and every pixel tells a story. This is a space designed to
          unleash your creative potential without boundaries or time constraints. Explore bold ideas, experiment with
          vibrant concepts, and craft visuals that inspire and captivate.
        </CardContent>
      </div>
    </Card>
  )
}

export default CardOverlayDemo
```

---

## 8. Soft Background

Card with colored/soft background.

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const CardSoftDemo = () => {
  return (
    <Card className='bg-primary/20 max-w-md gap-0'>
      <CardHeader>
        <CardTitle>Design Throwdown</CardTitle>
      </CardHeader>
      <CardContent>
        Where passion, pressure, and pixels collide—push your creativity to the edge and show what you are made of.
      </CardContent>
    </Card>
  )
}

export default CardSoftDemo
```

---

## 9. Outline

Card with border only, no background.

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const CardOutlineDemo = () => {
  return (
    <Card className='border-primary max-w-md gap-0 bg-transparent shadow-none'>
      <CardHeader>
        <CardTitle>Creative Clash</CardTitle>
      </CardHeader>
      <CardContent>
        Step into a space where design skills are tested, ideas come alive, and only the boldest concepts win the
        spotlight.
      </CardContent>
    </Card>
  )
}

export default CardOutlineDemo
```

---

## 10. With Tabs

Card with tabbed content inside.

```tsx
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const tabs = [
  {
    name: 'Home',
    value: 'home',
    content:
      'Welcome to the Home tab! Here, you can explore the latest updates, news, and highlights. Stay informed about what&apos;s happening and never miss out on important announcements.'
  },
  {
    name: 'Profile',
    value: 'profile',
    content:
      'This is your Profile tab. Manage your personal information, update your account details, and customize your settings to make your experience unique.'
  },
  {
    name: 'Messages',
    value: 'messages',
    content:
      'Messages: Check your recent messages, start new conversations, and stay connected with your friends and contacts. Manage your chat history and keep the communication flowing.'
  }
]

const CardWithTabsDemo = () => {
  return (
    <Card className='w-max'>
      <CardContent>
        <Tabs defaultValue={tabs[0].value} className='w-full max-w-sm'>
          <TabsList className='bg-background w-full justify-start rounded-none border-b p-0'>
            {tabs.map(tab => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className='bg-background data-[state=active]:border-b-primary h-full rounded-none border-b-2 border-transparent data-[state=active]:shadow-none'
              >
                {tab.name}
              </TabsTrigger>
            ))}
          </TabsList>
          {tabs.map(tab => (
            <TabsContent key={tab.value} value={tab.value}>
              <p className='text-muted-foreground p-4 text-sm'>{tab.content}</p>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default CardWithTabsDemo
```

---

## 11. Tweet/Social

Social media style card with interactions.

```tsx
'use client'

import { useState } from 'react'

import {
  BadgeCheckIcon,
  EllipsisIcon,
  HeartIcon,
  MessageCircleIcon,
  RepeatIcon,
  SendIcon,
  UserPlusIcon
} from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

import { cn } from '@/lib/utils'

const CardTweetDemo = () => {
  const [liked, setLiked] = useState<boolean>(true)

  return (
    <Card className='max-w-md'>
      <CardHeader className='flex items-center justify-between gap-3'>
        <div className='flex items-center gap-3'>
          <Avatar className='ring-ring ring-2'>
            <AvatarImage src='https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-5.png' alt='Hallie Richards' />
            <AvatarFallback className='text-xs'>PG</AvatarFallback>
          </Avatar>
          <div className='flex flex-col gap-0.5'>
            <CardTitle className='flex items-center gap-1 text-sm'>
              Philip George <BadgeCheckIcon className='size-4 fill-sky-600 stroke-white dark:fill-sky-400' />
            </CardTitle>
            <CardDescription>@philip20</CardDescription>
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <Button variant='outline' size='sm'>
            <UserPlusIcon />
            Follow
          </Button>
          <Button variant='ghost' size='icon' aria-label='Toggle menu'>
            <EllipsisIcon />
          </Button>
        </div>
      </CardHeader>
      <CardContent className='space-y-6 text-sm'>
        <img
          src='https://cdn.shadcnstudio.com/ss-assets/components/card/image-6.png?width=350&format=auto'
          alt='Banner'
          className='aspect-video w-full rounded-md object-cover'
        />
        <p>
          Lost in the colors of the night 🌌✨ Sometimes the blur reveals more than clarity.{' '}
          <a href='#' className='text-sky-600 dark:text-sky-400'>
            #AbstractVibes
          </a>{' '}
          <a href='#' className='text-sky-600 dark:text-sky-400'>
            #Dreamscape
          </a>{' '}
          <a href='#' className='text-sky-600 dark:text-sky-400'>
            #VisualPoetry
          </a>
        </p>
      </CardContent>
      <CardFooter className='flex items-center gap-1'>
        <Button variant='ghost' size='sm' onClick={() => setLiked(!liked)}>
          <HeartIcon className={cn(liked && 'fill-destructive stroke-destructive')} />
          2.1K
        </Button>
        <Button variant='ghost' size='sm'>
          <MessageCircleIcon />
          1.4K
        </Button>
        <Button variant='ghost' size='sm'>
          <RepeatIcon />
          669
        </Button>
        <Button variant='ghost' size='sm'>
          <SendIcon />
          1.1K
        </Button>
      </CardFooter>
    </Card>
  )
}

export default CardTweetDemo
```

---

## 12. Product

E-commerce product card with like button.

```tsx
'use client'

import { useState } from 'react'

import { HeartIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardDescription, CardTitle, CardFooter, CardContent } from '@/components/ui/card'

import { cn } from '@/lib/utils'

const CardProductDemo = () => {
  const [liked, setLiked] = useState<boolean>(false)

  return (
    <div className='relative max-w-md rounded-xl bg-gradient-to-r from-neutral-600 to-violet-300 pt-0 shadow-lg'>
      <div className='flex h-60 items-center justify-center'>
        <img
          src='https://cdn.shadcnstudio.com/ss-assets/components/card/image-11.png?width=300&format=auto'
          alt='Shoes'
          className='w-75'
        />
      </div>
      <Button
        size='icon'
        onClick={() => setLiked(!liked)}
        className='bg-primary/10 hover:bg-primary/20 absolute top-4 right-4 rounded-full'
      >
        <HeartIcon className={cn(liked ? 'fill-destructive stroke-destructive' : 'stroke-white')} />
        <span className='sr-only'>Like</span>
      </Button>
      <Card className='border-none'>
        <CardHeader>
          <CardTitle>Nike Jordan Air Rev</CardTitle>
          <CardDescription className='flex items-center gap-2'>
            <Badge variant='outline' className='rounded-sm'>
              EU38
            </Badge>
            <Badge variant='outline' className='rounded-sm'>
              Black and White
            </Badge>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>
            Crossing hardwood comfort with off-court flair. &apos;80s-Inspired construction, bold details and
            nothin&apos;-but-net style.
          </p>
        </CardContent>
        <CardFooter className='justify-between gap-3 max-sm:flex-col max-sm:items-stretch'>
          <div className='flex flex-col'>
            <span className='text-sm font-medium uppercase'>Price</span>
            <span className='text-xl font-semibold'>$69.99</span>
          </div>
          <Button size='lg'>Add to cart</Button>
        </CardFooter>
      </Card>
    </div>
  )
}

export default CardProductDemo
```

---

## 13. Testimonial

Review card with star rating.

```tsx
import { StarIcon } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardFooter, CardContent, CardTitle, CardDescription } from '@/components/ui/card'

const CardTestimonialDemo = () => {
  return (
    <Card className='max-w-md border-none'>
      <CardContent>
        <p>
          Incredible time-saver! shadcn/studio has made UI development a breeze. The pre build components are not only{' '}
          <span className='bg-primary/10'>visually appealing but also highly customizable</span>, fitting seamlessly
          into my projects. With a wide array of options to choose from, I can easily match.
        </p>
      </CardContent>
      <CardFooter className='justify-between gap-3 max-sm:flex-col max-sm:items-stretch'>
        <div className='flex items-center gap-3'>
          <Avatar className='ring-ring ring-2'>
            <AvatarImage src='https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-5.png' alt='Hallie Richards' />
            <AvatarFallback className='text-xs'>SG</AvatarFallback>
          </Avatar>
          <div className='flex flex-col gap-0.5'>
            <CardTitle className='flex items-center gap-1 text-sm'>Sam Green</CardTitle>
            <CardDescription>@SamG11</CardDescription>
          </div>
        </div>
        <div className='flex items-center gap-1'>
          <StarIcon className='size-5 fill-amber-500 stroke-amber-500 dark:fill-amber-400 dark:stroke-amber-400'></StarIcon>
          <StarIcon className='size-5 fill-amber-500 stroke-amber-500 dark:fill-amber-400 dark:stroke-amber-400'></StarIcon>
          <StarIcon className='size-5 fill-amber-500 stroke-amber-500 dark:fill-amber-400 dark:stroke-amber-400'></StarIcon>
          <StarIcon className='size-5 fill-amber-500 stroke-amber-500 dark:fill-amber-400 dark:stroke-amber-400'></StarIcon>
          <StarIcon className='size-5 stroke-amber-500 dark:stroke-amber-400'></StarIcon>
        </div>
      </CardFooter>
    </Card>
  )
}

export default CardTestimonialDemo
```

---

## 14. Action/Dismissable

Card with close button for notifications or CTAs.

```tsx
'use client'

import { useState } from 'react'

import { XIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const CardActionDemo = () => {
  const [isActive, setIsActive] = useState(true)

  if (!isActive) return null

  return (
    <Card className='relative max-w-lg shadow-none'>
      <Button
        variant='ghost'
        size='icon'
        onClick={() => setIsActive(false)}
        className='absolute top-2 right-2 rounded-full'
      >
        <XIcon />
        <span className='sr-only'>Close</span>
      </Button>
      <CardHeader>
        <CardTitle className='text-center'>Have a project in mind</CardTitle>
      </CardHeader>
      <CardContent className='flex flex-col gap-4 text-center'>
        <p>Let&apos;s discuss! Our Assistant team is excited to hear about your projects, ideas and questions. </p>
        <Button>Contact Our Team</Button>
      </CardContent>
    </Card>
  )
}

export default CardActionDemo
```

---

## 15. Card Group

Multiple cards displayed together.

```tsx
import { Card, CardContent, CardHeader, CardDescription, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const CardGroupDemo = () => {
  return (
    <div className='flex *:rounded-none *:shadow-none max-xl:flex-col max-xl:*:not-last:border-b-0 max-xl:*:first:rounded-t-xl max-xl:*:last:rounded-b-xl xl:*:not-last:border-r-0 xl:*:first:rounded-l-xl xl:*:last:rounded-r-xl'>
      <Card className='overflow-hidden pt-0'>
        <CardContent className='px-0'>
          <img
            src='https://cdn.shadcnstudio.com/ss-assets/components/card/image-7.png?width=368&format=auto'
            alt='Banner'
            className='aspect-video w-92 object-cover'
          />
        </CardContent>
        <CardHeader>
          <CardTitle>Mystical Blue Swirl</CardTitle>
          <CardDescription>
            Dive into the depths of an enchanting swirl where vibrant blues and soft pinks merge seamlessly, creating a
            mesmerizing flow of colors.
          </CardDescription>
        </CardHeader>
        <CardFooter className='gap-3 max-sm:flex-col max-sm:items-stretch'>
          <Button>Explore More</Button>
          <Button variant={'outline'}>Download Now</Button>
        </CardFooter>
      </Card>
      <Card className='overflow-hidden pt-0'>
        <CardContent className='px-0'>
          <img
            src='https://cdn.shadcnstudio.com/ss-assets/components/card/image-4.png?width=368&format=auto'
            alt='Banner'
            className='aspect-video w-92 object-cover'
          />
        </CardContent>
        <CardHeader>
          <CardTitle>Fiery Sunset Gradient</CardTitle>
          <CardDescription>
            Experience the warmth of a radiant sunset with flowing gradients of red, orange, and yellow blending
            effortlessly in an abstract glow.
          </CardDescription>
        </CardHeader>
        <CardFooter className='gap-3 max-sm:flex-col max-sm:items-stretch'>
          <Button>Explore More</Button>
          <Button variant={'outline'}>Download Now</Button>
        </CardFooter>
      </Card>
      <Card className='overflow-hidden pt-0'>
        <CardContent className='px-0'>
          <img
            src='https://cdn.shadcnstudio.com/ss-assets/components/card/image-5.png?width=368&format=auto'
            alt='Banner'
            className='aspect-video w-92 object-cover'
          />
        </CardContent>
        <CardHeader>
          <CardTitle>Cosmic Blue Waves</CardTitle>
          <CardDescription>
            Explore the mysteries of the cosmos with deep, swirling waves of blue and purple, evoking a sense of depth
            and infinite space.
          </CardDescription>
        </CardHeader>
        <CardFooter className='gap-3 max-sm:flex-col max-sm:items-stretch'>
          <Button>Explore More</Button>
          <Button variant={'outline'}>Download Now</Button>
        </CardFooter>
      </Card>
    </div>
  )
}

export default CardGroupDemo
```
