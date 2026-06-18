'use client'

import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function WorkoutTimer({ startedAt }: { startedAt: Date }) {
  const [elapsed, setElapsed] = useState(() =>
    Math.floor((Date.now() - startedAt.getTime()) / 1000)
  )

  useEffect(() => {
    const id = setInterval(() => setElapsed(s => s + 1), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <Clock className="h-3.5 w-3.5" />
      {formatElapsed(elapsed)}
    </span>
  )
}
