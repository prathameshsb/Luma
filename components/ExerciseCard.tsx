'use client'

import { useState, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Circle, Trash2, ChevronDown, ChevronUp, Pencil } from 'lucide-react'
import { cn, convertWeightToLbs } from '@/lib/utils'
import { VoiceButton } from '@/components/VoiceButton'
import { SetRow } from '@/components/SetRow'
import { isGenericExerciseName } from '@/lib/workout-parser'
import type { ParsedSet } from '@/lib/workout-parser'
import { toast } from 'sonner'
import type { WeightUnit } from '@/lib/types'
import type { EffortLevel } from '@/lib/types'

export interface LiveSet {
  id: string
  weightLbs: number | null
  reps: number
  effort: EffortLevel
}

interface ExerciseCardProps {
  exerciseName: string
  weightUnit: WeightUnit
  initialSets?: LiveSet[]
  mode: 'routine' | 'free-form'
  targetSets?: number | null
  targetReps?: number | null
  onComplete: (sets: LiveSet[]) => void
  onDelete: () => void
  onNameChange?: (name: string) => void
  defaultExpanded?: boolean
}

export function ExerciseCard({
  exerciseName, weightUnit, initialSets, mode,
  targetSets, targetReps, onComplete, onDelete, onNameChange, defaultExpanded,
}: ExerciseCardProps) {
  const [sets, setSets] = useState<LiveSet[]>(initialSets ?? [])
  const [completed, setCompleted] = useState(false)
  const [expanded, setExpanded] = useState(defaultExpanded ?? false)
  const [processing, setProcessing] = useState(false)
  const [localName, setLocalName] = useState(exerciseName)
  const [editingName, setEditingName] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)

  const commitName = (value: string) => {
    const trimmed = value.trim() || localName
    setLocalName(trimmed)
    setEditingName(false)
    onNameChange?.(trimmed)
  }

  const handleTranscript = async (text: string) => {
    setProcessing(true)
    try {
      const res = await fetch('/api/parse-workout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: text, mode, exerciseName: localName, weightUnit }),
      })
      if (!res.ok) {
        toast.error("Couldn't parse that — please try again")
        return
      }
      const data = await res.json()

      const parsedSets: ParsedSet[] =
        data.exercises?.[0]?.sets ?? []
      if (parsedSets.length === 0) return

      if (mode === 'free-form') {
        const returnedName: string | undefined = data.exercises?.[0]?.name
        if (returnedName && !isGenericExerciseName(returnedName) && returnedName !== localName) {
          setLocalName(returnedName)
          onNameChange?.(returnedName)
        }
      }

      const newSets: LiveSet[] = parsedSets.map((parsed, i) => ({
        id: `${Date.now()}-${i}`,
        weightLbs: parsed.weight === null ? null : convertWeightToLbs(parsed.weight, weightUnit),
        reps: parsed.reps,
        effort: parsed.effort,
      }))

      setSets(prev => [...prev, ...newSets])
    } catch {
      toast.error("Couldn't reach the server — please try again")
    } finally {
      setProcessing(false)
    }
  }

  const handleComplete = () => {
    setCompleted(true)
    setExpanded(false)
    onComplete(sets)
  }

  const updateSet = (id: string, updates: Partial<LiveSet>) => {
    setSets(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s))
  }

  const deleteSet = (id: string) => {
    setSets(prev => prev.filter(s => s.id !== id))
  }

  const voicePlaceholder =
    mode === 'free-form' && sets.length === 0
      ? 'Say exercise + weight, reps & effort…'
      : sets.length === 0
        ? 'Say weight, reps & effort…'
        : 'Add another set…'

  return (
    <Card className={cn('gradient-card transition-opacity', completed && 'opacity-60')}>
      <CardContent className="p-4">
        {/* Header */}
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => !completed && setExpanded(e => !e)}
        >
          <button
            onClick={e => { e.stopPropagation(); if (!completed) handleComplete() }}
            className="shrink-0 transition-colors"
          >
            {completed
              ? <CheckCircle2 className="h-5 w-5 text-primary" />
              : <Circle className="h-5 w-5 text-muted-foreground" />
            }
          </button>

          {mode === 'free-form' && !completed && editingName ? (
            <input
              ref={nameInputRef}
              autoFocus
              value={localName}
              onChange={e => setLocalName(e.target.value)}
              onBlur={e => commitName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') commitName(localName)
                if (e.key === 'Escape') { setLocalName(exerciseName); setEditingName(false) }
              }}
              onClick={e => e.stopPropagation()}
              className="flex-1 bg-transparent text-sm font-semibold outline-none border-b border-primary/60 pb-0.5 min-w-0"
            />
          ) : (
            <span className={cn('flex-1 font-semibold text-sm truncate', completed && 'line-through text-muted-foreground')}>
              {localName}
            </span>
          )}

          <div className="flex items-center gap-1">
            {mode === 'free-form' && !completed && !editingName && (
              <button
                onClick={e => { e.stopPropagation(); setEditingName(true) }}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
                title="Rename exercise"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={e => { e.stopPropagation(); onDelete() }}
              className="text-muted-foreground hover:text-destructive transition-colors p-1"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            {!completed && (
              expanded
                ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                : <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Expanded body */}
        {expanded && !completed && (
          <div className="mt-4 space-y-3">
            {mode === 'routine' && (targetSets != null || targetReps != null) && (
              <p className="text-xs text-muted-foreground">
                Target: {targetSets ?? '?'} × {targetReps ?? '?'}
              </p>
            )}

            {sets.length > 0 && (
              <div>
                <div className="flex items-center gap-2 px-0 mb-1">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider w-5 text-center">#</span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider flex-1">Weight</span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider w-14">Reps</span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider w-16">Effort</span>
                  <span className="w-6" />
                </div>
                <div className="divide-y divide-border/50">
                  {sets.map((s, i) => (
                    <SetRow
                      key={s.id}
                      setNumber={i + 1}
                      weightLbs={s.weightLbs}
                      reps={s.reps}
                      effort={s.effort}
                      weightUnit={weightUnit}
                      onChange={updates => updateSet(s.id, updates)}
                      onDelete={() => deleteSet(s.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-border/50 pt-3">
              <VoiceButton
                onTranscript={handleTranscript}
                processing={processing}
                placeholder={voicePlaceholder}
              />
            </div>

            {sets.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="w-full rounded-xl text-primary border-primary/30 hover:bg-primary/10"
                onClick={handleComplete}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Done with {localName}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
