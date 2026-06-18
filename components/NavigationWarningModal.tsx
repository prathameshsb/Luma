'use client'

import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

interface NavigationWarningModalProps {
  open: boolean
  onLoseWorkout: () => void
  onSaveDraft: () => void
  onCancel: () => void
}

export function NavigationWarningModal({ open, onLoseWorkout, onSaveDraft, onCancel }: NavigationWarningModalProps) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="rounded-2xl max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Leave workout?</AlertDialogTitle>
          <AlertDialogDescription>
            Your progress will be lost unless you save a draft.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          <Button className="w-full" onClick={onSaveDraft}>Save Draft</Button>
          <Button variant="outline" className="w-full" onClick={onCancel}>Cancel</Button>
          <Button variant="ghost" className="w-full text-destructive hover:text-destructive" onClick={onLoseWorkout}>
            Lose Workout
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
