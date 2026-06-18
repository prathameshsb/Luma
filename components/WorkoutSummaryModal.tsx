'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Clock, Dumbbell, CheckCircle2, SkipForward } from 'lucide-react'
import { formatDuration, displayVolume } from '@/lib/utils'

interface WorkoutSummaryModalProps {
  open: boolean
  durationSeconds: number
  totalVolumeLbs: number
  weightUnit: 'lbs' | 'kg'
  completedExercises: string[]
  skippedExercises: string[]
  onSave: () => void
  onContinue: () => void
  onRemove: () => void
}

export function WorkoutSummaryModal({
  open, durationSeconds, totalVolumeLbs, weightUnit,
  completedExercises, skippedExercises, onSave, onContinue, onRemove,
}: WorkoutSummaryModalProps) {
  const volume = displayVolume(totalVolumeLbs, weightUnit)

  return (
    <Dialog open={open} onOpenChange={v => !v && onContinue()}>
      <DialogContent className="rounded-2xl max-w-sm">
        <DialogHeader>
          <DialogTitle>Workout Summary</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Stats */}
          <div className="flex gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-primary" />
              <span className="font-semibold">{formatDuration(durationSeconds)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Dumbbell className="h-4 w-4 text-primary" />
              <span className="font-semibold">{volume}</span>
            </div>
          </div>

          {/* Completed */}
          {completedExercises.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Completed</p>
              {completedExercises.map(name => (
                <div key={name} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
                  <span>{name}</span>
                </div>
              ))}
            </div>
          )}

          {/* Skipped */}
          {skippedExercises.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Skipped</p>
              {skippedExercises.map(name => (
                <div key={name} className="flex items-center gap-2 text-sm">
                  <SkipForward className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">{name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Button className="w-full rounded-xl" onClick={onSave}>Save Workout</Button>
          <Button variant="outline" className="w-full rounded-xl" onClick={onContinue}>Continue Workout</Button>
          <Button variant="ghost" className="w-full rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10" onClick={onRemove}>
            Remove Workout
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
