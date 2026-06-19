'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Play, ChevronRight, X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { RESUME_BANNER_BG } from '@/lib/constants'

interface ResumeBannerProps {
  draftId: string
  routineName: string | null
}

export function ResumeBanner({ draftId, routineName }: ResumeBannerProps) {
  const [visible, setVisible] = useState(true)
  const [, startTransition] = useTransition()
  const supabase = createClient()
  const router = useRouter()

  if (!visible) return null

  const dismiss = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setVisible(false)
    await supabase.from('workouts').delete().eq('id', draftId)
    startTransition(() => router.refresh())
  }

  return (
    <Link href={`/workout?resume=${draftId}`} className="block">
      <Card className="hover:opacity-90 transition-opacity" style={{ background: RESUME_BANNER_BG }}>
        <CardContent className="flex items-center justify-between py-3 px-4">
          <div className="flex items-center gap-2 min-w-0">
            <Play className="h-4 w-4 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-primary">Resume workout</p>
              <p className="text-xs text-muted-foreground truncate">
                {routineName ?? 'Free workout'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-2">
            <ChevronRight className="h-4 w-4 text-primary" />
            <button
              onClick={dismiss}
              className="p-1 rounded-full text-primary/50 hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
