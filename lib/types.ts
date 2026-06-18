export type WeightUnit = 'lbs' | 'kg'
export type EffortLevel = 'easy' | 'medium' | 'hard'

export interface UserProfile {
  id: string
  weight_unit: WeightUnit
  created_at: string
}

export interface Routine {
  id: string
  user_id: string
  name: string
  days_of_week: number[]
  created_at: string
  routine_exercises?: RoutineExercise[]
}

export interface RoutineExercise {
  id: string
  routine_id: string
  exercise_name: string
  wger_exercise_id: number | null
  position: number
  target_sets: number | null
  target_reps: number | null
}

export interface Workout {
  id: string
  user_id: string
  routine_id: string | null
  status: 'draft' | 'completed'
  started_at: string
  finished_at: string | null
  duration_seconds: number | null
  created_at: string
  workout_exercises?: WorkoutExercise[]
  routines?: { name: string } | null
}

export interface WorkoutExercise {
  id: string
  workout_id: string
  exercise_name: string
  wger_exercise_id: number | null
  status: 'completed' | 'skipped'
  position: number
  sets?: Set[]
}

export interface Set {
  id: string
  workout_exercise_id: string
  set_number: number
  weight_lbs: number | null
  reps: number
  effort: EffortLevel
  created_at: string
}
