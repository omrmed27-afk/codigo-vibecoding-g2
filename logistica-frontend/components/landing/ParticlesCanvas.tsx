"use client"

import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
}

// Reduced count + distance for better perf on mid-range hardware
const COUNT = 75
const MAX_DIST = 100
const MOUSE_DIST = 130
const MAX_SPEED = 1.2

export default function ParticlesCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: -9999, y: -9999 })
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio, 2)

    const resize = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.scale(dpr, dpr)
    }
    resize()
    window.addEventListener('resize', resize)

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
    }
    window.addEventListener('mousemove', onMouseMove, { passive: true })

    const w = () => window.innerWidth
    const h = () => window.innerHeight

    const particles: Particle[] = Array.from({ length: COUNT }, () => ({
      x: Math.random() * w(),
      y: Math.random() * h(),
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      radius: Math.random() * 1.2 + 0.4,
    }))

    const draw = () => {
      const width = w()
      const height = h()
      ctx.clearRect(0, 0, width, height)
      const mouse = mouseRef.current

      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > width) p.vx *= -1
        if (p.y < 0 || p.y > height) p.vy *= -1

        const dx = p.x - mouse.x
        const dy = p.y - mouse.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < MOUSE_DIST && dist > 0) {
          const force = ((MOUSE_DIST - dist) / MOUSE_DIST) * 0.012
          p.vx += (dx / dist) * force
          p.vy += (dy / dist) * force
          const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
          if (speed > MAX_SPEED) {
            p.vx = (p.vx / speed) * MAX_SPEED
            p.vy = (p.vy / speed) * MAX_SPEED
          }
        }

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(59,130,246,0.5)'
        ctx.fill()
      }

      // Draw connections — O(n²) but n is small (75)
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const distSq = dx * dx + dy * dy
          if (distSq < MAX_DIST * MAX_DIST) {
            const alpha = (1 - Math.sqrt(distSq) / MAX_DIST) * 0.2
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(59,130,246,${alpha})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }

      rafRef.current = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMouseMove)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 1 }}
      aria-hidden="true"
    />
  )
}
