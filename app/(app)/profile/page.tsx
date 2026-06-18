import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { WeightUnitToggle } from '@/components/WeightUnitToggle'
import { SignOutButton } from '@/components/SignOutButton'

function toTitleCase(str: string): string {
  return str.replace(/\b\w/g, c => c.toUpperCase())
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('weight_unit')
    .eq('id', user.id)
    .single()

  const { count: totalWorkouts } = await supabase
    .from('workouts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'completed')

  const { data: exerciseRows } = await supabase
    .from('workout_exercises')
    .select('exercise_name, workouts!inner(user_id, status)')
    .eq('workouts.user_id', user.id)
    .eq('workouts.status', 'completed')

  const counts: Record<string, number> = {}
  for (const row of exerciseRows ?? []) {
    const name = row.exercise_name.toLowerCase()
    counts[name] = (counts[name] ?? 0) + 1
  }
  const topExercise = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
  const weightUnit = profile?.weight_unit ?? 'lbs'

  return (
    <div className="p-4 pt-8 space-y-6">
      <h1 className="text-2xl font-bold">Profile</h1>

      {/* Account */}
      <Card className="rounded-2xl">
        <CardContent className="p-5 space-y-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Account</p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Email</span>
            <span className="text-sm text-muted-foreground truncate ml-4">{user.email}</span>
          </div>
          <Separator />
          <SignOutButton />
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card className="rounded-2xl">
        <CardContent className="p-5 space-y-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Preferences</p>
          <div className="flex items-center justify-between">
            <span className="text-sm">Weight unit</span>
            <WeightUnitToggle initialUnit={weightUnit} />
          </div>
        </CardContent>
      </Card>

      {/* Lifetime stats */}
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-3">Lifetime stats</p>
        <div className="grid grid-cols-2 gap-3">
          <Card className="gradient-card">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Workouts</p>
              <p className="text-3xl font-bold">{totalWorkouts ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-0.5">completed</p>
            </CardContent>
          </Card>
          <Card className="gradient-card">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Top exercise</p>
              <p className="text-lg font-bold leading-tight mt-1">
                {topExercise ? toTitleCase(topExercise) : '—'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">most logged</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
