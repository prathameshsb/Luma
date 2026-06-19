import type { WeightUnit } from './types'
import type { EffortLevel } from './types'
import { DEFAULT_EFFORT, DEFAULT_REPS, MAX_SETS_PER_TRANSCRIPT } from './constants'

// ── Exercise name patterns ────────────────────────────────────────────────────

export const EXERCISE_PATTERNS: readonly [RegExp, string][] = [
  [/bench\s*press/i,                          'Bench Press'],
  [/incline\s*bench/i,                        'Incline Bench Press'],
  [/deadlift/i,                               'Deadlift'],
  [/romanian\s*deadlift|\brdl\b/i,            'Romanian Deadlift'],
  [/squat/i,                                  'Squat'],
  [/overhead\s*press|shoulder\s*press|\bohp\b/i, 'Overhead Press'],
  [/pull[\s-]?up/i,                           'Pull Up'],
  [/chin[\s-]?up/i,                           'Chin Up'],
  [/push[\s-]?up/i,                           'Push Up'],
  [/bicep\s*curl|barbell\s*curl|dumbbell\s*curl/i, 'Bicep Curl'],
  [/tricep|skull\s*crusher/i,                 'Tricep Pushdown'],
  [/lat\s*pull[\s-]?down/i,                   'Lat Pulldown'],
  [/cable\s*row|seated\s*row|barbell\s*row/i, 'Cable Row'],
  [/leg\s*press/i,                            'Leg Press'],
  [/leg\s*curl/i,                             'Leg Curl'],
  [/leg\s*extension/i,                        'Leg Extension'],
  [/lunge/i,                                  'Lunge'],
  [/calf\s*raise/i,                           'Calf Raise'],
  [/plank/i,                                  'Plank'],
  [/crunch/i,                                 'Crunch'],
  [/dumbbell\s*fly|cable\s*fly/i,             'Chest Fly'],
  [/face\s*pull/i,                            'Face Pull'],
  [/lateral\s*raise|side\s*raise/i,           'Lateral Raise'],
  [/front\s*raise/i,                          'Front Raise'],
  [/hip\s*thrust/i,                           'Hip Thrust'],
]

/**
 * Scans a transcript for a known exercise name.
 * Returns the display name or null if nothing matched.
 */
export function extractExerciseName(transcript: string): string | null {
  for (const [pattern, name] of EXERCISE_PATTERNS) {
    if (pattern.test(transcript)) return name
  }
  return null
}

// ── Transcript parsing ────────────────────────────────────────────────────────

export interface ParsedSet {
  set_number: number
  weight: number | null
  reps: number
  effort: EffortLevel
}

export interface ParsedExercise {
  name: string
  sets: ParsedSet[]
}

/**
 * Lightweight regex-based parser used until Claude is integrated.
 * Handles weight, reps, effort keywords, set counts, and exercise names.
 */
export function parseTranscript(
  transcript: string,
  mode: 'routine' | 'free-form',
  exerciseName: string | undefined,
  weightUnit: WeightUnit,
): ParsedExercise {
  const lower = transcript.toLowerCase()

  const weightMatch =
    lower.match(/(\d+(?:\.\d+)?)\s*(?:lbs?|pounds?)/) ??
    lower.match(/(\d+(?:\.\d+)?)\s*kg/)
  const weight = weightMatch ? parseFloat(weightMatch[1]) : null

  const repsMatch = lower.match(/(\d+)\s*reps?/)
  const reps = repsMatch ? parseInt(repsMatch[1], 10) : DEFAULT_REPS

  const effort: EffortLevel =
    /easy|light/.test(lower)              ? 'easy'   :
    /hard|heavy|tough|brutal/.test(lower) ? 'hard'   :
    DEFAULT_EFFORT

  const setsMatch = lower.match(/(\d+)\s*sets?/) ?? lower.match(/x\s*(\d+)/)
  const numSets = setsMatch
    ? Math.min(parseInt(setsMatch[1], 10), MAX_SETS_PER_TRANSCRIPT)
    : 1

  const sets: ParsedSet[] = Array.from({ length: numSets }, (_, i) => ({
    set_number: i + 1,
    weight,
    reps,
    effort,
  }))

  const name =
    mode === 'free-form'
      ? (extractExerciseName(transcript) ?? exerciseName ?? 'Exercise')
      : (exerciseName ?? 'Exercise')

  return { name, sets }
}

/** Returns true when a name looks like the placeholder we assign before parsing. */
export function isGenericExerciseName(name: string): boolean {
  return /^exercise\s*\d*$/i.test(name)
}
