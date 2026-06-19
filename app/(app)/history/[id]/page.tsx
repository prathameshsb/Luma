import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { BackButton } from '@/components/BackButton'
import { Clock, Dumbbell, SkipForward } from 'lucide-react'
import { formatDuration, displayVolume, formatWeightDisplay, formatDate } from '@/lib/utils'
import { EFFORT_CONFIG, DATE_FORMAT_LONG, DEFAULT_WEIGHT_UNIT } from '@/lib/constants'
import type { WeightUnit } from '@/lib/types'

export default async function WorkoutDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles').select('weight_unit').eq('id', user.id).single()
  const weightUnit: WeightUnit = profile?.weight_unit ?? DEFAULT_WEIGHT_UNIT

  const { data: workout } = await supabase
    .from('workouts')
    .select('id, started_at, finished_at, duration_seconds, status, routines(name)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!workout) notFound()

  const { data: exercises } = await supabase
    .from('workout_exercises')
    .select('id, exercise_name, status, position, sets(id, set_number, weight_lbs, reps, effort)')
    .eq('workout_id', id)
    .order('position')

  // Compute total volume
  const totalVolumeLbs = (exercises ?? []).flatMap(e =>
    (e.sets as { weight_lbs: number | null; reps: number }[] ?? [])
      .map(s => (s.weight_lbs ?? 0) * s.reps)
  ).reduce((a, b) => a + b, 0)

  const routineName = (workout.routines as unknown as { name: string } | null)?.name

  return (
    <div className="p-4 pt-8 space-y-5 pb-24">
      {/* Header */}
      <div className="flex items-center gap-2">
        <BackButton href="/history" />
        <div>
          <h1 className="text-xl font-bold leading-tight">{routineName ?? 'Free Workout'}</h1>
          <p className="text-xs text-muted-foreground">
            {formatDate(workout.started_at, DATE_FORMAT_LONG)}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="gradient-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Duration</span>
            </div>
            <p className="text-2xl font-bold">
              {workout.duration_seconds ? formatDuration(workout.duration_seconds) : '—'}
            </p>
          </CardContent>
        </Card>
        <Card className="gradient-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Dumbbell className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Volume</span>
            </div>
            <p className="text-2xl font-bold">{displayVolume(totalVolumeLbs, weightUnit)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Exercises */}
      <div className="space-y-3">
        {(exercises ?? []).map(ex => {
          const sets = ex.sets as { id: string; set_number: number; weight_lbs: number | null; reps: number; effort: string }[] ?? []

          if (ex.status === 'skipped') {
            return (
              <div key={ex.id} className="flex items-center gap-2 px-4 py-3 rounded-xl bg-muted/50 opacity-60">
                <SkipForward className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm line-through text-muted-foreground">{ex.exercise_name}</span>
              </div>
            )
          }

          return (
            <Card key={ex.id} className="rounded-2xl">
              <CardContent className="p-4">
                <p className="font-semibold text-sm mb-3">{ex.exercise_name}</p>

                {sets.length > 0 ? (
                  <div>
                    <div className="grid grid-cols-4 gap-2 mb-1">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider text-center">#</span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Weight</span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider text-center">Reps</span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider text-center">Effort</span>
                    </div>
                    <div className="divide-y divide-border/50">
                      {sets.map(s => {
                        const effortCfg = EFFORT_CONFIG[s.effort as keyof typeof EFFORT_CONFIG]
                        const displayWeight = s.weight_lbs === null
                          ? 'BW'
                          : `${formatWeightDisplay(s.weight_lbs, weightUnit)} ${weightUnit}`
                        return (
                          <div key={s.id} className="grid grid-cols-4 gap-2 py-2 text-sm">
                            <span className="text-center text-muted-foreground">{s.set_number}</span>
                            <span>{displayWeight}</span>
                            <span className="text-center">{s.reps}</span>
                            <span className={`text-center text-xs font-medium ${effortCfg?.textClass ?? ''}`}>
                              {effortCfg?.label ?? s.effort}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No sets logged</p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
