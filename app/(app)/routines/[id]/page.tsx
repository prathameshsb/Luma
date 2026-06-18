import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RoutineForm } from '@/components/RoutineForm'

export default async function EditRoutinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: routine } = await supabase
    .from('routines')
    .select('id, name, days_of_week, routine_exercises(exercise_name, wger_exercise_id, position, target_sets, target_reps)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!routine) notFound()

  return <RoutineForm routine={routine} />
}
