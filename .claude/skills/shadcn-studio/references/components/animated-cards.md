# Animated Card Components

2 variants from ShadcnStudio. Select based on use case.

## Quick Reference

| # | Style | Features | Use Case |
|---|-------|----------|----------|
| 1 | Spotlight | Glow effect following cursor | Featured content, CTAs |
| 2 | 3D Hover | Perspective tilt on hover | Product showcase, galleries |

---

## Animated Card 1 - Spotlight

```tsx
'use client'

import { useEffect } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const CardSpotlightDemo = () => {
  useEffect(() => {
    const all = document.querySelectorAll('.spotlight-card')

    const handleMouseMove = (ev: MouseEvent) => {
      all.forEach(e => {
        const blob = e.querySelector('.blob') as HTMLElement
        const fblob = e.querySelector('.fake-blob') as HTMLElement

        if (!blob || !fblob) return

        const rec = fblob.getBoundingClientRect()

        blob.style.opacity = '1'

        blob.animate(
          [
            {
              transform: `translate(${
                ev.clientX - rec.left - rec.width / 2
              }px, ${ev.clientY - rec.top - rec.height / 2}px)`
            }
          ],
          {
            duration: 300,
            fill: 'forwards'
          }
        )
      })
    }

    window.addEventListener('mousemove', handleMouseMove)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  return (
    <div className='h-max w-max'>
      <div className='spotlight-card group bg-border relative overflow-hidden rounded-xl p-px transition-all duration-300 ease-in-out'>
        <Card className='group-hover:bg-card/90 max-w-80 border-none transition-all duration-300 ease-in-out group-hover:backdrop-blur-[20px]'>
          <CardHeader>
            <CardTitle>Hover for the Glow-Up</CardTitle>
          </CardHeader>
          <CardContent>
            Glide your cursor here and watch magic unfold — an experience designed just for you.
          </CardContent>
        </Card>
        <div className='blob absolute top-0 left-0 size-20 rounded-full bg-sky-600/60 opacity-0 blur-2xl transition-all duration-300 ease-in-out dark:bg-sky-400/60' />
        <div className='fake-blob absolute top-0 left-0 size-20 rounded-full' />
      </div>
    </div>
  )
}

export default CardSpotlightDemo
```

---

## Animated Card 2 - 3D Hover

```tsx
'use client'

import { useEffect, useRef } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface CardTransform {
  rotateX: number
  rotateY: number
  scale: number
}

const Card3dDemo = () => {
  const cardRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const animationFrameRef = useRef<number | undefined>(undefined)
  const lastMousePosition = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const card = cardRef.current
    const image = imageRef.current

    if (!card || !image) return

    let rect: DOMRect
    let centerX: number
    let centerY: number

    const updateCardTransform = (mouseX: number, mouseY: number) => {
      if (!rect) {
        rect = card.getBoundingClientRect()
        centerX = rect.left + rect.width / 2
        centerY = rect.top + rect.height / 2
      }

      const relativeX = mouseX - centerX
      const relativeY = mouseY - centerY

      const cardTransform: CardTransform = {
        rotateX: -relativeY * 0.035,
        rotateY: relativeX * 0.035,
        scale: 1.025
      }

      const imageTransform: CardTransform = {
        rotateX: -relativeY * 0.025,
        rotateY: relativeX * 0.025,
        scale: 1.05
      }

      return { cardTransform, imageTransform }
    }

    const animate = () => {
      const { cardTransform, imageTransform } = updateCardTransform(
        lastMousePosition.current.x,
        lastMousePosition.current.y
      )

      card.style.transform = `perspective(1000px) rotateX(${cardTransform.rotateX}deg) rotateY(${cardTransform.rotateY}deg) scale3d(${cardTransform.scale}, ${cardTransform.scale}, ${cardTransform.scale})`
      card.style.boxShadow = '0 10px 35px rgba(0, 0, 0, 0.2)'

      image.style.transform = `perspective(1000px) rotateX(${imageTransform.rotateX}deg) rotateY(${imageTransform.rotateY}deg) scale3d(${imageTransform.scale}, ${imageTransform.scale}, ${imageTransform.scale})`

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    const handleMouseMove = (e: MouseEvent) => {
      lastMousePosition.current = { x: e.clientX, y: e.clientY }
    }

    const handleMouseEnter = () => {
      card.style.transition = 'transform 0.2s ease, box-shadow 0.2s ease'
      image.style.transition = 'transform 0.2s ease'
      animate()
    }

    const handleMouseLeave = () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }

      card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)'
      card.style.boxShadow = 'none'
      card.style.transition = 'transform 0.5s ease, box-shadow 0.5s ease'

      image.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)'
      image.style.transition = 'transform 0.5s ease'
    }

    card.addEventListener('mouseenter', handleMouseEnter)
    card.addEventListener('mousemove', handleMouseMove)
    card.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }

      card.removeEventListener('mouseenter', handleMouseEnter)
      card.removeEventListener('mousemove', handleMouseMove)
      card.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  return (
    <Card ref={cardRef} className='max-w-md'>
      <CardHeader>
        <CardTitle>Dynamic 3D Hover Card</CardTitle>
      </CardHeader>
      <CardContent className='space-y-6 text-sm'>
        <img
          ref={imageRef}
          src='https://cdn.shadcnstudio.com/ss-assets/components/card/image-10.png?width=350&format=auto'
          alt='Banner'
          className='aspect-video w-full rounded-md object-cover'
          width={500}
          height={500}
        />
        <p>
          Experience interactive depth and motion with this sleek 3D hover effect. Move your cursor to see it come
          alive!
        </p>
      </CardContent>
    </Card>
  )
}

export default Card3dDemo
```
