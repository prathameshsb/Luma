import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

import { Dumbbell, Flame, ChevronRight } from 'lucide-react'
import { formatDuration, displayVolume, getDayOfWeek } from '@/lib/utils'
import type { WeightUnit } from '@/lib/types'
import { ResumeBanner } from '@/components/ResumeBanner'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch user profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('weight_unit')
    .eq('id', user.id)
    .single()

  const weightUnit: WeightUnit = profile?.weight_unit ?? 'lbs'

  // Most recent draft workout
  const { data: draft } = await supabase
    .from('workouts')
    .select('id, started_at, routines(name)')
    .eq('user_id', user.id)
    .eq('status', 'draft')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // Workouts completed this week
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  weekStart.setHours(0, 0, 0, 0)

  const { data: weekWorkouts } = await supabase
    .from('workouts')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .gte('created_at', weekStart.toISOString())

  const weekCount = weekWorkouts?.length ?? 0

  // Total volume this week
  const { data: weekSets } = await supabase
    .from('sets')
    .select('weight_lbs, reps, workout_exercises!inner(workouts!inner(user_id, status, created_at))')
    .eq('workout_exercises.workouts.user_id', user.id)
    .eq('workout_exercises.workouts.status', 'completed')
    .gte('workout_exercises.workouts.created_at', weekStart.toISOString())

  const totalVolumeLbs = (weekSets ?? []).reduce(
    (sum, s) => sum + (s.weight_lbs ?? 0) * s.reps, 0
  )

  // Today's scheduled routine
  const today = getDayOfWeek()
  const { data: todayRoutine } = await supabase
    .from('routines')
    .select('id, name')
    .eq('user_id', user.id)
    .contains('days_of_week', [today])
    .limit(1)
    .single()

  // Last 3 completed workouts (drafts shown separately in banner above)
  const { data: recentWorkouts } = await supabase
    .from('workouts')
    .select('id, started_at, duration_seconds, routines(name), workout_exercises(exercise_name, status)')
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(3)

  return (
    <div className="p-4 pt-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{getGreeting()} 💪</h1>
        <p className="text-muted-foreground text-sm mt-0.5">{user.email}</p>
      </div>

      {/* Draft banner */}
      {draft && (
        <ResumeBanner
          draftId={draft.id}
          routineName={(draft.routines as { name: string } | null)?.name ?? null}
        />
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="gradient-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Flame className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">This week</span>
            </div>
            <p className="text-3xl font-bold">{weekCount}</p>
            <p className="text-xs text-muted-foreground mt-0.5">workouts</p>
          </CardContent>
        </Card>
        <Card className="gradient-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Dumbbell className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Volume</span>
            </div>
            <p className="text-2xl font-bold">{displayVolume(totalVolumeLbs, weightUnit)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">lifted this week</p>
          </CardContent>
        </Card>
      </div>

      {/* Start Workout CTA */}
      <div className="space-y-2">
        <Link href="/workout">
          <Button size="lg" className="w-full h-14 text-base font-semibold rounded-2xl">
            Start Workout
          </Button>
        </Link>
        {todayRoutine && (
          <Link href={`/workout?routine=${todayRoutine.id}`}>
            <Button variant="outline" className="w-full rounded-2xl" size="lg">
              Start {todayRoutine.name} →
            </Button>
          </Link>
        )}
      </div>

      {/* Recent workouts */}
      {recentWorkouts && recentWorkouts.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Recent
          </h2>
          <div className="space-y-2">
            {recentWorkouts.map((w) => {
              const exercises = (w.workout_exercises ?? []) as { exercise_name: string; status: string }[]
              const completed = exercises.filter(e => e.status === 'completed')
              const routineName = (w.routines as { name: string } | null)?.name

              return (
                <Link key={w.id} href={`/history/${w.id}`}>
                  <Card className="hover:bg-accent/50 transition-colors">
                    <CardContent className="flex items-center justify-between py-2 px-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{routineName ?? 'Free Workout'}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(w.started_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          {completed.length > 0 && ` · ${completed.length} exercises`}
                          {w.duration_seconds && ` · ${formatDuration(w.duration_seconds)}`}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {(!recentWorkouts || recentWorkouts.length === 0) && (
        <div className="text-center py-12">
          <Dumbbell className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No workouts yet.</p>
          <p className="text-muted-foreground text-xs mt-1">Tap Start Workout to begin.</p>
        </div>
      )}
    </div>
  )
}
