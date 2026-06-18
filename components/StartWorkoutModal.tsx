'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Dumbbell, ChevronRight } from 'lucide-react'

interface StartWorkoutModalProps {
  open: boolean
  onClose: () => void
  routines: Array<{ id: string; name: string }>
  onSelectRoutine: (routineId: string) => void
  onFreeForm: () => void
}

export function StartWorkoutModal({ open, onClose, routines, onSelectRoutine, onFreeForm }: StartWorkoutModalProps) {
  const handleRoutine = (id: string) => { onSelectRoutine(id); onClose() }
  const handleFreeForm = () => { onFreeForm(); onClose() }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle>Start Workout</DialogTitle>
          {routines.length > 0 && (
            <DialogDescription>Pick a routine or go free-form.</DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-3">
          {routines.length > 0 ? (
            <>
              <div className="space-y-2">
                {routines.map(r => (
                  <button
                    key={r.id}
                    onClick={() => handleRoutine(r.id)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-muted hover:bg-accent transition-colors text-left"
                  >
                    <span className="font-medium text-sm">{r.name}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
              <Separator />
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-2">
              No routines yet — go to Routines tab to create one.
            </p>
          )}

          <div className="space-y-1">
            <Button variant="outline" className="w-full gap-2 rounded-xl h-12" onClick={handleFreeForm}>
              <Dumbbell className="h-4 w-4" />
              Start Free Workout
            </Button>
            <p className="text-xs text-muted-foreground text-center">Log exercises as you go</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
