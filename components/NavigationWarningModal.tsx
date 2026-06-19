'use client'

import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface NavigationWarningModalProps {
  open: boolean
  onLoseWorkout: () => void
  onSaveDraft: () => void
  onCancel: () => void
  navLoading?: boolean
}

export function NavigationWarningModal({ open, onLoseWorkout, onSaveDraft, onCancel, navLoading = false }: NavigationWarningModalProps) {
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
          <Button className="w-full gap-2" onClick={onSaveDraft} disabled={navLoading}>
            {navLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Draft
          </Button>
          <Button variant="outline" className="w-full" onClick={onCancel} disabled={navLoading}>Cancel</Button>
          <Button variant="ghost" className="w-full text-destructive hover:text-destructive gap-2" onClick={onLoseWorkout} disabled={navLoading}>
            {navLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Lose Workout
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
