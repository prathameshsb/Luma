'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type Effort = 'easy' | 'medium' | 'hard'

interface SetRowProps {
  setNumber: number
  weightLbs: number | null
  reps: number
  effort: Effort
  weightUnit: 'lbs' | 'kg'
  onChange: (updates: Partial<{ weightLbs: number | null; reps: number; effort: Effort }>) => void
  onDelete: () => void
}

const EFFORT_CONFIG = {
  easy:   { label: 'Easy',   className: 'bg-green-500/20 text-green-400 border-green-500/30' },
  medium: { label: 'Medium', className: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  hard:   { label: 'Hard',   className: 'bg-red-500/20 text-red-400 border-red-500/30' },
}

function toDisplay(weightLbs: number | null, unit: 'lbs' | 'kg'): string {
  if (weightLbs === null) return ''
  if (unit === 'kg') return String(Math.round(weightLbs * 0.453592 * 10) / 10)
  return String(weightLbs)
}

function toStoredLbs(value: string, unit: 'lbs' | 'kg'): number | null {
  const num = parseFloat(value)
  if (isNaN(num) || num < 0) return null
  return unit === 'kg' ? Math.round(num / 0.453592 * 10) / 10 : num
}

export function SetRow({ setNumber, weightLbs, reps, effort, weightUnit, onChange, onDelete }: SetRowProps) {
  const [showEffortPicker, setShowEffortPicker] = useState(false)
  const [weightInput, setWeightInput] = useState(toDisplay(weightLbs, weightUnit))

  const handleWeightBlur = () => {
    if (weightInput.trim() === '' || weightInput.toLowerCase() === 'bw') {
      onChange({ weightLbs: null })
    } else {
      const stored = toStoredLbs(weightInput, weightUnit)
      onChange({ weightLbs: stored })
    }
  }

  const handleEffortSelect = (e: Effort) => {
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
          min={1}
          value={reps}
          onChange={e => onChange({ reps: Math.max(1, parseInt(e.target.value) || 1) })}
          className="h-8 text-sm text-center px-1"
        />
      </div>

      {/* Effort picker */}
      <div className="relative shrink-0">
        <button
          onClick={() => setShowEffortPicker(p => !p)}
          className={cn(
            'h-7 px-2 rounded-full text-[11px] font-semibold border transition-colors',
            EFFORT_CONFIG[effort].className
          )}
        >
          {EFFORT_CONFIG[effort].label}
        </button>
        {showEffortPicker && (
          <div className="absolute bottom-full right-0 mb-1 bg-card border border-border rounded-xl shadow-lg z-20 overflow-hidden">
            {(Object.entries(EFFORT_CONFIG) as [Effort, typeof EFFORT_CONFIG[Effort]][]).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => handleEffortSelect(key)}
                className={cn(
                  'block w-full px-4 py-2 text-sm font-medium text-left hover:bg-accent transition-colors',
                  key === effort && 'bg-accent'
                )}
              >
                <span className={cn('font-semibold', cfg.className.split(' ').find(c => c.startsWith('text-')))}>{cfg.label}</span>
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
