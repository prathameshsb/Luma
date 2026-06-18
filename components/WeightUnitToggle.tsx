'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface WeightUnitToggleProps {
  initialUnit: 'lbs' | 'kg'
}

export function WeightUnitToggle({ initialUnit }: WeightUnitToggleProps) {
  const [unit, setUnit] = useState<'lbs' | 'kg'>(initialUnit)
  const router = useRouter()

  const handleToggle = async (newUnit: 'lbs' | 'kg') => {
    if (newUnit === unit) return
    setUnit(newUnit)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('user_profiles').update({ weight_unit: newUnit }).eq('id', user.id)
    router.refresh()
  }

  return (
    <div className="flex gap-2">
      {(['lbs', 'kg'] as const).map(option => (
        <button
          key={option}
          onClick={() => handleToggle(option)}
          className={cn(
            'px-6 py-2 rounded-full text-sm font-semibold transition-colors',
            unit === option
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80',
          )}
        >
          {option}
        </button>
      ))}
    </div>
  )
}
