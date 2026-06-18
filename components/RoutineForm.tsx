'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { ChevronUp, ChevronDown, X, Trash2 } from 'lucide-react'
import { cn, DAY_NAMES } from '@/lib/utils'
import { BackButton } from '@/components/BackButton'
import { fetchAllExercises, filterExercises, type WgerExercise } from '@/lib/wger'

interface ExerciseEntry {
  exercise_name: string
  wger_exercise_id?: number | null
  target_sets?: number | null
  target_reps?: number | null
}

interface RoutineData {
  id: string
  name: string
  days_of_week: number[]
  routine_exercises: {
    exercise_name: string
    wger_exercise_id: number | null
    position: number
    target_sets: number | null
    target_reps: number | null
  }[]
}

export function RoutineForm({ routine }: { routine?: RoutineData }) {
  const router = useRouter()
  const supabase = createClient()

  const [name, setName] = useState(routine?.name ?? '')
  const [selectedDays, setSelectedDays] = useState<number[]>(routine?.days_of_week ?? [])
  const [exercises, setExercises] = useState<ExerciseEntry[]>(
    (routine?.routine_exercises ?? [])
      .sort((a, b) => a.position - b.position)
      .map(e => ({
        exercise_name: e.exercise_name,
        wger_exercise_id: e.wger_exercise_id,
        target_sets: e.target_sets,
        target_reps: e.target_reps,
      }))
  )
  const [allExercises, setAllExercises] = useState<WgerExercise[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<WgerExercise[]>([])
  const [searching, setSearching] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const toggleDay = (day: number) =>
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    )

  const loadExercises = useCallback(async () => {
    if (allExercises.length > 0) return
    setSearching(true)
    const exercises = await fetchAllExercises()
    setAllExercises(exercises)
    setSearching(false)
  }, [allExercises.length])

  const handleSearch = useCallback((query: string, exercises: WgerExercise[]) => {
    setSearchQuery(query)
    setSearchResults(filterExercises(exercises, query))
  }, [])

  const addExercise = (e: WgerExercise) => {
    setExercises(prev => [...prev, { exercise_name: e.name, wger_exercise_id: e.exercise }])
    setSearchQuery('')
    setSearchResults([])
  }

  const removeExercise = (i: number) => setExercises(prev => prev.filter((_, idx) => idx !== i))

  const moveUp = (i: number) => {
    if (i === 0) return
    setExercises(prev => { const a = [...prev]; [a[i - 1], a[i]] = [a[i], a[i - 1]]; return a })
  }
  const moveDown = (i: number) => {
    setExercises(prev => {
      if (i === prev.length - 1) return prev
      const a = [...prev]; [a[i], a[i + 1]] = [a[i + 1], a[i]]; return a
    })
  }

  const setTarget = (i: number, field: 'target_sets' | 'target_reps', val: string) => {
    const num = val ? parseInt(val) : null
    setExercises(prev => prev.map((x, idx) => idx === i ? { ...x, [field]: num } : x))
  }

  const handleSave = async () => {
    if (!name.trim() || exercises.length === 0) return
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      let routineId = routine?.id

      if (routineId) {
        await supabase.from('routines').update({ name: name.trim(), days_of_week: selectedDays }).eq('id', routineId)
        await supabase.from('routine_exercises').delete().eq('routine_id', routineId)
      } else {
        const { data, error } = await supabase.from('routines').insert({
          user_id: user.id,
          name: name.trim(),
          days_of_week: selectedDays,
        }).select('id').single()
        if (error || !data) throw error
        routineId = data.id
      }

      await supabase.from('routine_exercises').insert(
        exercises.map((e, i) => ({
          routine_id: routineId,
          exercise_name: e.exercise_name,
          wger_exercise_id: e.wger_exercise_id ?? null,
          position: i,
          target_sets: e.target_sets ?? null,
          target_reps: e.target_reps ?? null,
        }))
      )

      toast.success(routine ? 'Routine saved' : 'Routine created')
      router.push('/routines')
      router.refresh()
    } catch {
      toast.error('Failed to save — try again')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!routine) return
    try {
      await supabase.from('routines').delete().eq('id', routine.id)
      toast.success('Routine deleted')
      router.push('/routines')
      router.refresh()
    } catch {
      toast.error('Failed to delete')
    }
  }

  const canSave = name.trim().length > 0 && exercises.length > 0

  return (
    <div className="p-4 pt-8 space-y-6 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BackButton href="/routines" />
          <h1 className="text-2xl font-bold">{routine ? 'Edit Routine' : 'New Routine'}</h1>
        </div>
        {routine && (
          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Name */}
      <div className="space-y-2">
        <Label>Name</Label>
        <Input placeholder="e.g. Push Day" value={name} onChange={e => setName(e.target.value)} />
      </div>

      {/* Days */}
      <div className="space-y-2">
        <Label>Schedule <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
        <div className="flex gap-1.5">
          {DAY_NAMES.map((day, i) => (
            <button
              key={i}
              onClick={() => toggleDay(i)}
              className={cn(
                'flex-1 py-2.5 rounded-xl text-[11px] font-semibold transition-colors',
                selectedDays.includes(i)
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      {/* Exercises */}
      <div className="space-y-2">
        <Label>Exercises</Label>
        {exercises.length === 0 && (
          <p className="text-sm text-muted-foreground py-2">Search and add exercises below</p>
        )}
        <div className="space-y-2">
          {exercises.map((ex, i) => (
            <Card key={i} className="gradient-card">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className="flex flex-col">
                    <button onClick={() => moveUp(i)} disabled={i === 0} className="text-muted-foreground disabled:opacity-20 p-0.5">
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => moveDown(i)} disabled={i === exercises.length - 1} className="text-muted-foreground disabled:opacity-20 p-0.5">
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="flex-1 font-medium text-sm">{ex.exercise_name}</p>
                  <button onClick={() => removeExercise(i)} className="text-muted-foreground hover:text-destructive p-1">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex gap-2 mt-2 ml-8">
                  <div className="flex-1 space-y-1">
                    <p className="text-[10px] text-muted-foreground">Target sets</p>
                    <Input
                      type="number"
                      min="1"
                      placeholder="—"
                      className="h-8 text-sm text-center"
                      value={ex.target_sets ?? ''}
                      onChange={e => setTarget(i, 'target_sets', e.target.value)}
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-[10px] text-muted-foreground">Target reps</p>
                    <Input
                      type="number"
                      min="1"
                      placeholder="—"
                      className="h-8 text-sm text-center"
                      value={ex.target_reps ?? ''}
                      onChange={e => setTarget(i, 'target_reps', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="space-y-2 relative">
        <Label>Add exercise</Label>
        <Input
          placeholder="Search (e.g. Bench Press)"
          value={searchQuery}
          onFocus={loadExercises}
          onChange={e => handleSearch(e.target.value, allExercises)}
          autoComplete="off"
        />
        {(searchResults.length > 0 || searching) && (
          <Card className="absolute z-10 w-full shadow-lg">
            <CardContent className="p-0">
              {searching && <p className="text-sm text-muted-foreground p-3">Searching…</p>}
              {searchResults.map((r, i) => (
                <button
                  key={i}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-accent transition-colors border-b border-border last:border-0"
                  onClick={() => addExercise(r)}
                >
                  <span className="font-medium">{r.name}</span>
                </button>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Save CTA */}
      <div className="fixed bottom-20 left-0 right-0 px-4 max-w-lg mx-auto">
        <Button className="w-full h-12 font-semibold rounded-2xl" disabled={!canSave || saving} onClick={handleSave}>
          {saving ? 'Saving…' : routine ? 'Save Changes' : 'Create Routine'}
        </Button>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This can't be undone. Past workouts using this routine won't be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
