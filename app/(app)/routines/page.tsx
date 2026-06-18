import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Dumbbell, ChevronRight, Play } from 'lucide-react'
import { DAY_NAMES } from '@/lib/utils'

export default async function RoutinesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: routines } = await supabase
    .from('routines')
    .select('id, name, days_of_week, routine_exercises(id)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="p-4 pt-8 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Routines</h1>
        <Link href="/routines/new">
          <Button size="sm" className="rounded-xl gap-1.5">
            <Plus className="h-4 w-4" />
            New
          </Button>
        </Link>
      </div>

      {(!routines || routines.length === 0) ? (
        <div className="text-center py-16">
          <Dumbbell className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No routines yet.</p>
          <p className="text-muted-foreground text-xs mt-1 mb-6">Create one to get started.</p>
          <Link href="/routines/new">
            <Button className="rounded-xl">Create your first routine</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {routines.map(r => {
            const days = (r.days_of_week as number[]) ?? []
            const exerciseCount = (r.routine_exercises as { id: string }[])?.length ?? 0
            return (
              <Card key={r.id} className="gradient-card">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{r.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}
                        {days.length > 0 && ` · ${days.sort().map(d => DAY_NAMES[d]).join(', ')}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Link href={`/workout?routine=${r.id}`}>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-primary">
                          <Play className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/routines/${r.id}`}>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
