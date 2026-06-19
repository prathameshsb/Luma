import {
  extractExerciseName,
  parseTranscript,
  isGenericExerciseName,
  EXERCISE_PATTERNS,
} from '@/lib/workout-parser'
import { MAX_SETS_PER_TRANSCRIPT, DEFAULT_EFFORT, DEFAULT_REPS } from '@/lib/constants'

// ── extractExerciseName ───────────────────────────────────────────────────────

describe('extractExerciseName', () => {
  it('extracts "Bench Press"', () => expect(extractExerciseName('bench press 185 lbs 8 reps')).toBe('Bench Press'))
  it('extracts "Deadlift"', () => expect(extractExerciseName('I did deadlifts today')).toBe('Deadlift'))
  it('extracts "Squat"', () => expect(extractExerciseName('squat 225 lbs')).toBe('Squat'))
  it('extracts "Bicep Curl"', () => expect(extractExerciseName('bicep curl 30 lbs 12 reps')).toBe('Bicep Curl'))
  it('extracts "Overhead Press" from "OHP"', () => expect(extractExerciseName('ohp 135 lbs 5 reps')).toBe('Overhead Press'))
  it('extracts "Romanian Deadlift" from "RDL"', () => expect(extractExerciseName('rdl 185 lbs')).toBe('Romanian Deadlift'))
  it('extracts "Pull Up"', () => expect(extractExerciseName('10 pull ups')).toBe('Pull Up'))
  it('returns null for unknown exercise', () => expect(extractExerciseName('185 lbs 8 reps')).toBeNull())
  it('returns null for empty string', () => expect(extractExerciseName('')).toBeNull())
  it('is case-insensitive', () => expect(extractExerciseName('BENCH PRESS')).toBe('Bench Press'))
  it('covers all patterns in EXERCISE_PATTERNS', () => {
    expect(EXERCISE_PATTERNS.length).toBeGreaterThan(0)
    // Every pattern should be a pair of [RegExp, string]
    EXERCISE_PATTERNS.forEach(([pattern, name]) => {
      expect(pattern).toBeInstanceOf(RegExp)
      expect(typeof name).toBe('string')
      expect(name.length).toBeGreaterThan(0)
    })
  })
})

// ── parseTranscript ───────────────────────────────────────────────────────────

describe('parseTranscript — weight parsing', () => {
  it('parses weight in lbs', () => {
    const result = parseTranscript('185 lbs 8 reps', 'routine', 'Bench Press', 'lbs')
    expect(result.sets[0].weight).toBe(185)
  })
  it('parses weight in kg', () => {
    const result = parseTranscript('100 kg 8 reps', 'routine', 'Squat', 'kg')
    expect(result.sets[0].weight).toBe(100)
  })
  it('leaves weight null when not mentioned', () => {
    const result = parseTranscript('10 reps', 'routine', 'Pull Up', 'lbs')
    expect(result.sets[0].weight).toBeNull()
  })
})

describe('parseTranscript — reps parsing', () => {
  it('parses explicit rep count', () => {
    const result = parseTranscript('185 lbs 5 reps', 'routine', 'Bench Press', 'lbs')
    expect(result.sets[0].reps).toBe(5)
  })
  it(`defaults to ${DEFAULT_REPS} reps when not mentioned`, () => {
    const result = parseTranscript('185 lbs', 'routine', 'Bench Press', 'lbs')
    expect(result.sets[0].reps).toBe(DEFAULT_REPS)
  })
})

describe('parseTranscript — effort inference', () => {
  it.each([
    ['easy',   'felt easy',   'easy'],
    ['easy',   'light set',   'easy'],
    ['hard',   'was hard',    'hard'],
    ['hard',   'it was tough','hard'],
    ['hard',   'brutal',      'hard'],
    ['medium', '185 lbs',     DEFAULT_EFFORT],
  ] as const)('infers "%s" effort from "%s"', (_label, transcript, expected) => {
    const result = parseTranscript(transcript, 'routine', 'Bench Press', 'lbs')
    expect(result.sets[0].effort).toBe(expected)
  })
})

describe('parseTranscript — set count', () => {
  it('creates one set by default', () => {
    const result = parseTranscript('185 lbs 8 reps', 'routine', 'Bench Press', 'lbs')
    expect(result.sets).toHaveLength(1)
  })
  it('creates multiple sets when "N sets" is mentioned', () => {
    const result = parseTranscript('3 sets 185 lbs 8 reps', 'routine', 'Bench Press', 'lbs')
    expect(result.sets).toHaveLength(3)
  })
  it('creates multiple sets from "x3" notation', () => {
    const result = parseTranscript('185 lbs 8 reps x3', 'routine', 'Bench Press', 'lbs')
    expect(result.sets).toHaveLength(3)
  })
  it(`caps at ${MAX_SETS_PER_TRANSCRIPT} sets`, () => {
    const result = parseTranscript('99 sets 100 lbs', 'routine', 'Bench Press', 'lbs')
    expect(result.sets).toHaveLength(MAX_SETS_PER_TRANSCRIPT)
  })
  it('assigns sequential set_number starting from 1', () => {
    const result = parseTranscript('3 sets 185 lbs 8 reps', 'routine', 'Bench Press', 'lbs')
    expect(result.sets.map(s => s.set_number)).toEqual([1, 2, 3])
  })
})

describe('parseTranscript — exercise name', () => {
  it('uses provided exerciseName in routine mode', () => {
    const result = parseTranscript('185 lbs 8 reps', 'routine', 'Bench Press', 'lbs')
    expect(result.name).toBe('Bench Press')
  })
  it('extracts name from transcript in free-form mode', () => {
    const result = parseTranscript('bench press 185 lbs 8 reps', 'free-form', undefined, 'lbs')
    expect(result.name).toBe('Bench Press')
  })
  it('falls back to provided exerciseName in free-form when no match', () => {
    const result = parseTranscript('185 lbs 8 reps', 'free-form', 'My Custom Exercise', 'lbs')
    expect(result.name).toBe('My Custom Exercise')
  })
  it('falls back to "Exercise" when nothing is available (free-form)', () => {
    const result = parseTranscript('185 lbs 8 reps', 'free-form', undefined, 'lbs')
    expect(result.name).toBe('Exercise')
  })
  it('falls back to "Exercise" in routine mode when no exerciseName provided', () => {
    const result = parseTranscript('185 lbs 8 reps', 'routine', undefined, 'lbs')
    expect(result.name).toBe('Exercise')
  })
})

// ── isGenericExerciseName ─────────────────────────────────────────────────────

describe('isGenericExerciseName', () => {
  it.each(['Exercise', 'Exercise 1', 'exercise 2', 'EXERCISE'])(
    'returns true for "%s"', name => expect(isGenericExerciseName(name)).toBe(true),
  )
  it.each(['Bench Press', 'Squat', 'My Drill', ''])(
    'returns false for "%s"', name => expect(isGenericExerciseName(name)).toBe(false),
  )
})
