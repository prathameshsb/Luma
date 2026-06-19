import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronRight, Dumbbell } from 'lucide-react'
import { formatDuration, displayVolume } from '@/lib/utils'
import type { WeightUnit } from '@/lib/types'

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles').select('weight_unit').eq('id', user.id).single()
  const weightUnit: WeightUnit = profile?.weight_unit ?? 'lbs'

  const { data: workouts } = await supabase
    .from('workouts')
    .select('id, started_at, duration_seconds, status, routines(name), workout_exercises(id, status)')
    .eq('user_id', user.id)
    .order('started_at', { ascending: false })

  return (
    <div className="p-4 pt-8 space-y-4">
      <h1 className="text-2xl font-bold">History</h1>

      {(!workouts || workouts.length === 0) ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-3">
          <Dumbbell className="h-10 w-10 opacity-40" />
          <p className="text-sm">No workouts yet. Start one to see your history.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {workouts.map(w => {
            const exercises = (w.workout_exercises ?? []) as { status: string }[]
            const completed = exercises.filter(e => e.status === 'completed').length
            const skipped = exercises.filter(e => e.status === 'skipped').length
            const routineName = (w.routines as unknown as { name: string } | null)?.name

            return (
              <Link key={w.id} href={`/history/${w.id}`} className="block">
                <Card className="hover:bg-accent/50 transition-colors">
                  <CardContent className="flex items-center justify-between py-3 px-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">
                          {routineName ?? 'Free Workout'}
                        </p>
                        {w.status === 'draft' && (
                          <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full shrink-0">Draft</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(w.started_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        {completed > 0 && ` · ${completed} exercise${completed !== 1 ? 's' : ''}`}
                        {skipped > 0 && ` · ${skipped} skipped`}
                        {w.duration_seconds && ` · ${formatDuration(w.duration_seconds)}`}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
