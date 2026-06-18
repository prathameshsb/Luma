'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Circle, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { VoiceButton } from '@/components/VoiceButton'
import { SetRow } from '@/components/SetRow'

export interface LiveSet {
  id: string
  weightLbs: number | null
  reps: number
  effort: 'easy' | 'medium' | 'hard'
}

interface ExerciseCardProps {
  exerciseName: string
  weightUnit: 'lbs' | 'kg'
  initialSets?: LiveSet[]
  mode: 'routine' | 'free-form'
  targetSets?: number | null
  targetReps?: number | null
  onComplete: (sets: LiveSet[]) => void
  onDelete: () => void
  defaultExpanded?: boolean
}

export function ExerciseCard({
  exerciseName, weightUnit, initialSets, mode,
  targetSets, targetReps, onComplete, onDelete, defaultExpanded,
}: ExerciseCardProps) {
  const [sets, setSets] = useState<LiveSet[]>(initialSets ?? [])
  const [completed, setCompleted] = useState(false)
  const [expanded, setExpanded] = useState(defaultExpanded ?? false)
  const [processing, setProcessing] = useState(false)

  const handleTranscript = async (text: string) => {
    setProcessing(true)
    try {
      const res = await fetch('/api/parse-workout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: text,
          mode,
          exerciseName,
          weightUnit,
        }),
      })
      if (!res.ok) return
      const data = await res.json()
      const parsed = data.exercises?.[0]?.sets?.[0]
      if (!parsed) return
      // API returns weight in user's display unit — convert to lbs for storage
      const weightLbs = parsed.weight === null
        ? null
        : weightUnit === 'kg'
          ? Math.round(parsed.weight / 0.453592 * 10) / 10
          : parsed.weight
      setSets(prev => [...prev, {
        id: Date.now().toString(),
        weightLbs,
        reps: parsed.reps,
        effort: parsed.effort,
      }])
    } catch {
      // silent fail — user can retry
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

          <span className={cn('flex-1 font-semibold text-sm truncate', completed && 'line-through text-muted-foreground')}>
            {exerciseName}
          </span>

          <div className="flex items-center gap-1">
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
            {/* Target */}
            {mode === 'routine' && (targetSets || targetReps) && (
              <p className="text-xs text-muted-foreground">
                Target: {targetSets ?? '?'} × {targetReps ?? '?'}
              </p>
            )}

            {/* Sets table */}
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

            {/* Separator + mic */}
            <div className="border-t border-border/50 pt-3">
              <VoiceButton
                onTranscript={handleTranscript}
                processing={processing}
                placeholder={sets.length === 0 ? 'Say weight, reps & effort…' : 'Add another set…'}
              />
            </div>

            {/* Mark complete */}
            {sets.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="w-full rounded-xl text-primary border-primary/30 hover:bg-primary/10"
                onClick={handleComplete}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Done with {exerciseName}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
