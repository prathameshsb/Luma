import {
  lbsToKg, kgToLbs,
  convertWeightToLbs, convertWeightFromLbs,
  formatWeightDisplay, parseWeightInput,
  displayVolume, formatDuration, formatDate, toTitleCase,
  getDayOfWeek, DAY_NAMES,
} from '@/lib/utils'

// ── lbsToKg ──────────────────────────────────────────────────────────────────

describe('lbsToKg', () => {
  it('converts 100 lbs to 45.4 kg', () => expect(lbsToKg(100)).toBe(45.4))
  it('converts 0 to 0', () => expect(lbsToKg(0)).toBe(0))
  it('converts 225 lbs and rounds to one decimal', () => expect(lbsToKg(225)).toBe(102.1))
  it('converts fractional lbs', () => expect(lbsToKg(2.5)).toBe(1.1))
})

// ── kgToLbs ──────────────────────────────────────────────────────────────────

describe('kgToLbs', () => {
  it('converts 100 kg to 220.5 lbs', () => expect(kgToLbs(100)).toBe(220.5))
  it('converts 0 to 0', () => expect(kgToLbs(0)).toBe(0))
  it('rounds to one decimal', () => expect(kgToLbs(45)).toBe(99.2))
})

// ── convertWeightToLbs ───────────────────────────────────────────────────────

describe('convertWeightToLbs', () => {
  it('keeps lbs unchanged when fromUnit is lbs', () => expect(convertWeightToLbs(185, 'lbs')).toBe(185))
  it('converts kg to lbs when fromUnit is kg', () => expect(convertWeightToLbs(100, 'kg')).toBe(220.5))
  it('returns 0 for 0', () => expect(convertWeightToLbs(0, 'kg')).toBe(0))
})

// ── convertWeightFromLbs ─────────────────────────────────────────────────────

describe('convertWeightFromLbs', () => {
  it('keeps lbs unchanged when toUnit is lbs', () => expect(convertWeightFromLbs(185, 'lbs')).toBe(185))
  it('converts lbs to kg when toUnit is kg', () => expect(convertWeightFromLbs(100, 'kg')).toBe(45.4))
})

// ── formatWeightDisplay ──────────────────────────────────────────────────────

describe('formatWeightDisplay', () => {
  it('returns empty string for null (bodyweight)', () => expect(formatWeightDisplay(null, 'lbs')).toBe(''))
  it('returns lbs value as string', () => expect(formatWeightDisplay(185, 'lbs')).toBe('185'))
  it('returns kg-converted value as string', () => expect(formatWeightDisplay(100, 'kg')).toBe('45.4'))
})

// ── parseWeightInput ─────────────────────────────────────────────────────────

describe('parseWeightInput', () => {
  it('returns null for empty string', () => expect(parseWeightInput('', 'lbs')).toBeNull())
  it('returns null for "bw" (case-insensitive)', () => {
    expect(parseWeightInput('bw', 'lbs')).toBeNull()
    expect(parseWeightInput('BW', 'lbs')).toBeNull()
  })
  it('returns null for negative values', () => expect(parseWeightInput('-5', 'lbs')).toBeNull())
  it('returns null for non-numeric input', () => expect(parseWeightInput('abc', 'lbs')).toBeNull())
  it('returns lbs value for lbs unit', () => expect(parseWeightInput('185', 'lbs')).toBe(185))
  it('converts kg input to lbs', () => expect(parseWeightInput('100', 'kg')).toBe(220.5))
  it('handles decimal input', () => expect(parseWeightInput('22.5', 'lbs')).toBe(22.5))
})

// ── displayVolume ─────────────────────────────────────────────────────────────

describe('displayVolume', () => {
  it('formats in lbs', () => expect(displayVolume(1000, 'lbs')).toBe('1,000 lbs'))
  it('formats in kg (converts and rounds)', () => expect(displayVolume(1000, 'kg')).toBe('454 kg'))
  it('handles 0', () => expect(displayVolume(0, 'lbs')).toBe('0 lbs'))
})

// ── formatDuration ────────────────────────────────────────────────────────────

describe('formatDuration', () => {
  it('shows seconds only for < 1 minute', () => expect(formatDuration(45)).toBe('45s'))
  it('shows minutes and seconds for < 1 hour', () => expect(formatDuration(125)).toBe('2m 5s'))
  it('shows hours and minutes for >= 1 hour', () => expect(formatDuration(3661)).toBe('1h 1m'))
  it('handles exactly 1 minute', () => expect(formatDuration(60)).toBe('1m 0s'))
  it('handles exactly 1 hour', () => expect(formatDuration(3600)).toBe('1h 0m'))
})

// ── formatDate ────────────────────────────────────────────────────────────────

describe('formatDate', () => {
  it('accepts a Date object and returns a non-empty string', () => {
    // Use local noon to avoid UTC-to-local date shifts
    const d = new Date(2025, 0, 15, 12, 0, 0)
    const result = formatDate(d, { month: 'long', day: 'numeric' })
    expect(result).toContain('15')
    expect(result).toContain('January')
  })
  it('accepts an ISO string and returns a non-empty string', () => {
    const result = formatDate('2025-06-18T12:00:00', { month: 'short', day: 'numeric' })
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })
})

// ── toTitleCase ───────────────────────────────────────────────────────────────

describe('toTitleCase', () => {
  it('capitalises first letter of each word', () => expect(toTitleCase('bench press')).toBe('Bench Press'))
  it('works for single word', () => expect(toTitleCase('squat')).toBe('Squat'))
  it('handles already-capitalised input', () => expect(toTitleCase('Bench Press')).toBe('Bench Press'))
  it('handles mixed case', () => expect(toTitleCase('bicep CURL')).toBe('Bicep CURL'))
})

// ── getDayOfWeek ──────────────────────────────────────────────────────────────

describe('getDayOfWeek', () => {
  it('returns a number between 0 and 6', () => {
    const day = getDayOfWeek()
    expect(day).toBeGreaterThanOrEqual(0)
    expect(day).toBeLessThanOrEqual(6)
  })
})

// ── DAY_NAMES ─────────────────────────────────────────────────────────────────

describe('DAY_NAMES', () => {
  it('has 7 entries', () => expect(DAY_NAMES).toHaveLength(7))
  it('starts with Sun and ends with Sat', () => {
    expect(DAY_NAMES[0]).toBe('Sun')
    expect(DAY_NAMES[6]).toBe('Sat')
  })
})
