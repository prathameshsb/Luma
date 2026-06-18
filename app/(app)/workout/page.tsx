'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Plus, Flag, X, ChevronLeft } from 'lucide-react'
import { WorkoutTimer } from '@/components/WorkoutTimer'
import { ExerciseCard, type LiveSet } from '@/components/ExerciseCard'
import { StartWorkoutModal } from '@/components/StartWorkoutModal'
import { NavigationWarningModal } from '@/components/NavigationWarningModal'
import { WorkoutSummaryModal } from '@/components/WorkoutSummaryModal'
import { toast } from 'sonner'

interface RoutineExercise {
  id: string
  exercise_name: string
  wger_exercise_id: number | null
  position: number
  target_sets: number | null
  target_reps: number | null
}

interface LiveExercise {
  id: string            // workout_exercise id (set after save) or temp id
  exercise_name: string
  wger_exercise_id?: number | null
  position: number
  target_sets?: number | null
  target_reps?: number | null
  sets: LiveSet[]
  completed: boolean
  skipped: boolean
}

interface Routine { id: string; name: string }

export default function WorkoutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  // Core state
  const [workoutId, setWorkoutId] = useState<string | null>(null)
  const [startedAt, setStartedAt] = useState<Date | null>(null)
  const [mode, setMode] = useState<'routine' | 'free-form' | null>(null)
  const [routine, setRoutine] = useState<Routine | null>(null)
  const [exercises, setExercises] = useState<LiveExercise[]>([])
  const [weightUnit, setWeightUnit] = useState<'lbs' | 'kg'>('lbs')

  // Modal state
  const [showStartModal, setShowStartModal] = useState(false)
  const [showNavWarning, setShowNavWarning] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [routines, setRoutines] = useState<Routine[]>([])

  // Navigation intent — where user was trying to go when warning triggered
  const navIntentRef = useRef<string>('/')
  const workoutIdRef = useRef<string | null>(null)

  // Sync workoutId to ref for use in event handlers
  useEffect(() => { workoutIdRef.current = workoutId }, [workoutId])

  // Load user profile + routines on mount
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }

      const [profileRes, routinesRes] = await Promise.all([
        supabase.from('user_profiles').select('weight_unit').eq('id', user.id).single(),
        supabase.from('routines').select('id, name').eq('user_id', user.id).order('created_at', { ascending: false }),
      ])
      if (profileRes.data) setWeightUnit(profileRes.data.weight_unit ?? 'lbs')
      if (routinesRes.data) setRoutines(routinesRes.data)

      const resumeId = searchParams.get('resume')
      const routineId = searchParams.get('routine')

      if (resumeId) {
        await resumeDraft(resumeId)
      } else if (routineId) {
        await startRoutineWorkout(routineId)
      } else {
        setShowStartModal(true)
      }
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // browser back/refresh warning
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (workoutIdRef.current) { e.preventDefault(); e.returnValue = '' }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [])

  // --- Workout init helpers ---

  const resumeDraft = async (id: string) => {
    const { data: workout } = await supabase
      .from('workouts')
      .select('id, started_at, routine_id, routines(id, name), workout_exercises(id, exercise_name, wger_exercise_id, position, status, sets(id, weight_lbs, reps, effort, set_number))')
      .eq('id', id)
      .single()

    if (!workout) return
    setWorkoutId(workout.id)
    setStartedAt(new Date(workout.started_at))

    const rt = workout.routines as unknown as Routine | null
    if (rt) { setRoutine(rt); setMode('routine') }
    else setMode('free-form')

    const exs = (workout.workout_exercises as unknown as Array<{
      id: string; exercise_name: string; wger_exercise_id: number | null
      position: number; status: string
      sets: Array<{ id: string; weight_lbs: number | null; reps: number; effort: string; set_number: number }>
    }>)
      .sort((a, b) => a.position - b.position)
      .map(ex => ({
        id: ex.id,
        exercise_name: ex.exercise_name,
        wger_exercise_id: ex.wger_exercise_id,
        position: ex.position,
        sets: ex.sets.sort((a, b) => a.set_number - b.set_number).map(s => ({
          id: s.id,
          weightLbs: s.weight_lbs,
          reps: s.reps,
          effort: s.effort as 'easy' | 'medium' | 'hard',
        })),
        completed: ex.status === 'completed',
        skipped: ex.status === 'skipped',
      }))
    setExercises(exs)
  }

  const startRoutineWorkout = async (routineId: string) => {
    const { data: rt } = await supabase
      .from('routines')
      .select('id, name, routine_exercises(id, exercise_name, wger_exercise_id, position, target_sets, target_reps)')
      .eq('id', routineId)
      .single()
    if (!rt) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const now = new Date()
    const { data: workout } = await supabase.from('workouts').insert({
      user_id: user.id,
      routine_id: routineId,
      status: 'draft',
      started_at: now.toISOString(),
    }).select('id').single()

    if (!workout) return
    setWorkoutId(workout.id)
    setStartedAt(now)
    setRoutine({ id: rt.id, name: rt.name })
    setMode('routine')

    const exList = (rt.routine_exercises as unknown as RoutineExercise[])
      .sort((a, b) => a.position - b.position)
      .map((ex, i) => ({
        id: `temp-${i}`,
        exercise_name: ex.exercise_name,
        wger_exercise_id: ex.wger_exercise_id,
        position: i,
        target_sets: ex.target_sets,
        target_reps: ex.target_reps,
        sets: [],
        completed: false,
        skipped: false,
      }))
    setExercises(exList)
  }

  const startFreeFormWorkout = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const now = new Date()
    const { data: workout } = await supabase.from('workouts').insert({
      user_id: user.id,
      status: 'draft',
      started_at: now.toISOString(),
    }).select('id').single()

    if (!workout) return
    setWorkoutId(workout.id)
    setStartedAt(now)
    setMode('free-form')
  }

  // --- Exercise management ---

  const addFreeFormExercise = () => {
    const tempId = `temp-${Date.now()}`
    setExercises(prev => [...prev, {
      id: tempId,
      exercise_name: `Exercise ${prev.length + 1}`,
      position: prev.length,
      sets: [],
      completed: false,
      skipped: false,
    }])
  }

  const handleExerciseComplete = useCallback((id: string, sets: LiveSet[]) => {
    setExercises(prev => prev.map(ex => ex.id === id ? { ...ex, sets, completed: true } : ex))
  }, [])

  const handleExerciseDelete = useCallback((id: string) => {
    setExercises(prev => prev.filter(ex => ex.id !== id))
  }, [])

  const handleSkip = useCallback((id: string) => {
    setExercises(prev => prev.map(ex => ex.id === id ? { ...ex, skipped: true, completed: false } : ex))
  }, [])

  // --- Save helpers ---

  const leaveWorkout = () => {
    // Clear the ref BEFORE navigating so beforeunload handler doesn't fire
    workoutIdRef.current = null
    router.push('/')
  }

  const removeWorkout = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('workouts').delete().eq('user_id', user.id).eq('status', 'draft')
    } else if (workoutId) {
      await supabase.from('workouts').delete().eq('id', workoutId)
    }
    leaveWorkout()
  }

  const saveDraft = async () => {
    if (!workoutId) return
    await saveExercisesToDB(workoutId)
    toast.success('Draft saved')
    leaveWorkout()
  }

  const saveCompleted = async () => {
    if (!workoutId || !startedAt) return
    const durationSeconds = Math.floor((Date.now() - startedAt.getTime()) / 1000)
    await saveExercisesToDB(workoutId)
    await supabase.from('workouts').update({
      status: 'completed',
      finished_at: new Date().toISOString(),
      duration_seconds: durationSeconds,
    }).eq('id', workoutId)
    toast.success('Workout saved!')
    leaveWorkout()
  }

  const saveExercisesToDB = async (wid: string) => {
    // Delete existing workout_exercises to replace with current state
    await supabase.from('workout_exercises').delete().eq('workout_id', wid)

    for (const ex of exercises) {
      if (ex.skipped) {
        await supabase.from('workout_exercises').insert({
          workout_id: wid,
          exercise_name: ex.exercise_name,
          wger_exercise_id: ex.wger_exercise_id ?? null,
          status: 'skipped',
          position: ex.position,
        })
        continue
      }
      if (ex.sets.length === 0 && !ex.completed) continue

      const { data: weRow } = await supabase.from('workout_exercises').insert({
        workout_id: wid,
        exercise_name: ex.exercise_name,
        wger_exercise_id: ex.wger_exercise_id ?? null,
        status: 'completed',
        position: ex.position,
      }).select('id').single()

      if (!weRow) continue
      await supabase.from('sets').insert(
        ex.sets.map((s, i) => ({
          workout_exercise_id: weRow.id,
          set_number: i + 1,
          weight_lbs: s.weightLbs,
          reps: s.reps,
          effort: s.effort,
        }))
      )
    }
  }

  // --- Navigation warning ---

  const handleNavAttempt = (href: string) => {
    if (!workoutId) { router.push(href); return }
    navIntentRef.current = href
    setShowNavWarning(true)
  }

  // --- Summary data ---

  const totalVolumeLbs = exercises.reduce(
    (sum, ex) => sum + ex.sets.reduce((s2, s) => s2 + (s.weightLbs ?? 0) * s.reps, 0), 0
  )
  const completedNames = exercises.filter(e => e.completed && e.sets.length > 0).map(e => e.exercise_name)
  const skippedNames = exercises.filter(e => e.skipped).map(e => e.exercise_name)
  const durationSeconds = startedAt ? Math.floor((Date.now() - startedAt.getTime()) / 1000) : 0

  // --- Render ---

  if (!mode && !showStartModal) return null

  return (
    <div className="flex flex-col min-h-screen pb-6">
      {/* Header */}
      <div className="sticky top-0 bg-background/80 backdrop-blur border-b border-border z-10 px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 -ml-1 text-muted-foreground hover:text-foreground"
              onClick={() => {
                if (workoutId) {
                  navIntentRef.current = '/'
                  setShowNavWarning(true)
                } else {
                  window.location.href = '/'
                }
              }}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <p className="font-semibold text-sm leading-tight">
                {routine ? routine.name : 'Free Workout'}
              </p>
              {startedAt && <WorkoutTimer startedAt={startedAt} />}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 rounded-xl border-primary/40 text-primary hover:bg-primary/10"
              onClick={() => setShowSummary(true)}
              disabled={!workoutId}
            >
              <Flag className="h-3.5 w-3.5" />
              Finish
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl"
              onClick={() => {
                if (workoutId) {
                  navIntentRef.current = '/'
                  setShowNavWarning(true)
                } else {
                  window.location.href = '/'
                }
              }}
              title="Remove workout"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Exercise list */}
      <div className="flex-1 px-4 pt-4 space-y-3 max-w-lg mx-auto w-full">
        {exercises.map(ex => (
          <div key={ex.id}>
            {ex.skipped ? (
              <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-muted opacity-50">
                <span className="text-sm line-through text-muted-foreground">{ex.exercise_name}</span>
                <span className="text-xs text-muted-foreground">Skipped</span>
              </div>
            ) : (
              <div className="space-y-1">
                <ExerciseCard
                  exerciseName={ex.exercise_name}
                  weightUnit={weightUnit}
                  initialSets={ex.sets}
                  mode={mode ?? 'free-form'}
                  targetSets={ex.target_sets}
                  targetReps={ex.target_reps}
                  onComplete={(sets) => handleExerciseComplete(ex.id, sets)}
                  onDelete={() => handleExerciseDelete(ex.id)}
                  defaultExpanded={mode === 'free-form' && ex.sets.length === 0}
                />
                {mode === 'routine' && !ex.completed && (
                  <button
                    onClick={() => handleSkip(ex.id)}
                    className="text-xs text-muted-foreground hover:text-foreground px-4 transition-colors"
                  >
                    Skip exercise
                  </button>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Free-form: Add exercise button */}
        {mode === 'free-form' && (
          <Button
            variant="outline"
            className="w-full rounded-xl gap-2 border-dashed"
            onClick={addFreeFormExercise}
          >
            <Plus className="h-4 w-4" />
            Add Exercise
          </Button>
        )}

        {/* Empty state for free-form */}
        {mode === 'free-form' && exercises.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">Tap "Add Exercise" to start logging</p>
          </div>
        )}
      </div>

      {/* Modals */}
      <StartWorkoutModal
        open={showStartModal}
        onClose={() => { setShowStartModal(false); if (!workoutId) router.replace('/') }}
        routines={routines}
        onSelectRoutine={id => { setShowStartModal(false); startRoutineWorkout(id) }}
        onFreeForm={() => { setShowStartModal(false); startFreeFormWorkout() }}
      />

      <NavigationWarningModal
        open={showNavWarning}
        onCancel={() => setShowNavWarning(false)}
        onSaveDraft={() => { setShowNavWarning(false); saveDraft() }}
        onLoseWorkout={() => { setShowNavWarning(false); removeWorkout() }}
      />

      <WorkoutSummaryModal
        open={showSummary}
        durationSeconds={durationSeconds}
        totalVolumeLbs={totalVolumeLbs}
        weightUnit={weightUnit}
        completedExercises={completedNames}
        skippedExercises={skippedNames}
        onSave={() => { setShowSummary(false); saveCompleted() }}
        onContinue={() => setShowSummary(false)}
        onRemove={() => { setShowSummary(false); removeWorkout() }}
      />
    </div>
  )
}
