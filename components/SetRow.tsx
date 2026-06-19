'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { formatWeightDisplay, parseWeightInput } from '@/lib/utils'
import { EFFORT_CONFIG } from '@/lib/constants'
import type { WeightUnit } from '@/lib/types'
import type { EffortLevel } from '@/lib/types'

interface SetRowProps {
  setNumber: number
  weightLbs: number | null
  reps: number
  effort: EffortLevel
  weightUnit: WeightUnit
  onChange: (updates: Partial<{ weightLbs: number | null; reps: number; effort: EffortLevel }>) => void
  onDelete: () => void
}

const MIN_REPS = 1

export function SetRow({ setNumber, weightLbs, reps, effort, weightUnit, onChange, onDelete }: SetRowProps) {
  const [showEffortPicker, setShowEffortPicker] = useState(false)
  const [weightInput, setWeightInput] = useState(() => formatWeightDisplay(weightLbs, weightUnit))

  const handleWeightBlur = () => {
    onChange({ weightLbs: parseWeightInput(weightInput, weightUnit) })
  }

  const handleRepsChange = (raw: string) => {
    const parsed = parseInt(raw, 10)
    onChange({ reps: Math.max(MIN_REPS, isNaN(parsed) ? MIN_REPS : parsed) })
  }

  const handleEffortSelect = (e: EffortLevel) => {
    onChange({ effort: e })
    setShowEffortPicker(false)
  }

  return (
    <div className="flex items-center gap-2 py-1.5 relative">
      {/* Set number */}
      <span className="text-xs text-muted-foreground w-5 text-center shrink-0">{setNumber}</span>

      {/* Weight */}
      <div className="flex items-center gap-1 flex-1 min-w-0">
        <Input
          type="text"
          inputMode="decimal"
          value={weightInput}
          onChange={e => setWeightInput(e.target.value)}
          onBlur={handleWeightBlur}
          placeholder="BW"
          className="h-8 text-sm text-center px-1"
        />
        <span className="text-[10px] text-muted-foreground shrink-0">{weightUnit}</span>
      </div>

      {/* Reps */}
      <div className="flex items-center gap-1 w-14 shrink-0">
        <Input
          type="number"
          min={MIN_REPS}
          value={reps}
          onChange={e => handleRepsChange(e.target.value)}
          className="h-8 text-sm text-center px-1"
        />
      </div>

      {/* Effort picker */}
      <div className="relative shrink-0">
        <button
          onClick={() => setShowEffortPicker(p => !p)}
          className={cn(
            'h-7 px-2 rounded-full text-[11px] font-semibold border transition-colors',
            EFFORT_CONFIG[effort].pillClass,
          )}
        >
          {EFFORT_CONFIG[effort].label}
        </button>
        {showEffortPicker && (
          <div className="absolute bottom-full right-0 mb-1 bg-card border border-border rounded-xl shadow-lg z-20 overflow-hidden">
            {(Object.entries(EFFORT_CONFIG) as [EffortLevel, typeof EFFORT_CONFIG[EffortLevel]][]).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => handleEffortSelect(key)}
                className={cn(
                  'block w-full px-4 py-2 text-sm font-medium text-left hover:bg-accent transition-colors',
                  key === effort && 'bg-accent',
                )}
              >
                <span className={cn('font-semibold', cfg.textClass)}>{cfg.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Delete */}
      <button onClick={onDelete} className="text-muted-foreground hover:text-destructive transition-colors shrink-0 p-1">
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
