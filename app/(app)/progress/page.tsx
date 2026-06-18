import { redirect } from 'next/navigation'
import { Dumbbell } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ProgressGrid, type ExerciseProgress, type ExerciseSession } from '@/components/ProgressDetailModal'

function toTitleCase(name: string): string {
  return name.replace(/\b\w/g, c => c.toUpperCase())
}

export default async function ProgressPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('weight_unit')
    .eq('id', user.id)
    .single()
  const weightUnit = profile?.weight_unit ?? 'lbs'

  // Step 1: get completed workouts for this user
  const { data: completedWorkouts } = await supabase
    .from('workouts')
    .select('id, started_at')
    .eq('user_id', user.id)
    .eq('status', 'completed')

  const workoutIds = (completedWorkouts ?? []).map(w => w.id)
  const startedAtById = Object.fromEntries((completedWorkouts ?? []).map(w => [w.id, w.started_at as string]))

  // Step 2: get all sets for those workouts via workout_exercises
  const { data: exerciseRows } = workoutIds.length > 0
    ? await supabase
        .from('workout_exercises')
        .select('exercise_name, workout_id, sets(weight_lbs, reps)')
        .in('workout_id', workoutIds)
        .eq('status', 'completed')
    : { data: [] }

  // Group by exercise name (case-insensitive), then by session date
  const exerciseMap = new Map<string, {
    displayName: string
    sessionMap: Map<string, { weights: (number | null)[]; sets: number; reps: number }>
    lastLoggedAt: string
  }>()

  for (const ex of exerciseRows ?? []) {
    const startedAt = startedAtById[ex.workout_id] ?? ''
    const date = startedAt.slice(0, 10)
    const key = ex.exercise_name.toLowerCase()

    if (!exerciseMap.has(key)) {
      exerciseMap.set(key, { displayName: toTitleCase(ex.exercise_name), sessionMap: new Map(), lastLoggedAt: startedAt })
    }
    const entry = exerciseMap.get(key)!
    if (startedAt > entry.lastLoggedAt) entry.lastLoggedAt = startedAt
    if (!entry.sessionMap.has(date)) entry.sessionMap.set(date, { weights: [], sets: 0, reps: 0 })

    const session = entry.sessionMap.get(date)!
    for (const s of (ex.sets as { weight_lbs: number | null; reps: number }[]) ?? []) {
      session.sets += 1
      session.reps += s.reps ?? 0
      session.weights.push(s.weight_lbs != null ? Number(s.weight_lbs) : null)
    }
  }

  const exercises: ExerciseProgress[] = []
  for (const [, entry] of exerciseMap) {
    const sessions: ExerciseSession[] = []
    for (const [date, s] of entry.sessionMap) {
      const valid = s.weights.filter((w): w is number => w !== null)
      sessions.push({
        date,
        maxWeightLbs: valid.length > 0 ? Math.max(...valid) : null,
        totalSets: s.sets,
        totalReps: s.reps,
      })
    }
    sessions.sort((a, b) => a.date.localeCompare(b.date))
    exercises.push({ name: entry.displayName, sessions, lastLoggedAt: entry.lastLoggedAt })
  }
  exercises.sort((a, b) => b.lastLoggedAt.localeCompare(a.lastLoggedAt))

  return (
    <div className="p-4 pt-8 space-y-6">
      <h1 className="text-2xl font-bold">Progress</h1>

      {exercises.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-3">
          <Dumbbell className="h-10 w-10 opacity-40" />
          <p className="text-sm text-center">No exercises logged yet.<br />Complete a workout to see your progress.</p>
        </div>
      ) : (
        <ProgressGrid exercises={exercises} weightUnit={weightUnit} />
      )}
    </div>
  )
}
