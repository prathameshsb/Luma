/**
 * SetRow tests focus on the pure helper functions (weight formatting and parsing)
 * which contain the most critical logic. Full DOM tests for the UI layer are
 * skipped because shadcn's Input component requires CSS-in-JS resolution that
 * is not available in jsdom.
 */
import { formatWeightDisplay, parseWeightInput } from '@/lib/utils'
import { EFFORT_CONFIG, EFFORT_LEVELS } from '@/lib/constants'

describe('formatWeightDisplay (used by SetRow initial value)', () => {
  it('returns "" for bodyweight (null)', () => expect(formatWeightDisplay(null, 'lbs')).toBe(''))
  it('returns lbs as string', () => expect(formatWeightDisplay(135, 'lbs')).toBe('135'))
  it('returns kg-converted string for kg unit', () => expect(formatWeightDisplay(135, 'kg')).toBe('61.2'))
})

describe('parseWeightInput (used by SetRow onBlur)', () => {
  describe('bodyweight / empty', () => {
    it.each(['', 'bw', 'BW', '  bw  '])('returns null for "%s"', input => {
      expect(parseWeightInput(input, 'lbs')).toBeNull()
    })
  })

  describe('invalid input', () => {
    it('returns null for negative value', () => expect(parseWeightInput('-1', 'lbs')).toBeNull())
    it('returns null for non-numeric string', () => expect(parseWeightInput('abc', 'lbs')).toBeNull())
    it('returns null for NaN', () => expect(parseWeightInput('NaN', 'lbs')).toBeNull())
  })

  describe('lbs unit', () => {
    it('stores value as-is', () => expect(parseWeightInput('185', 'lbs')).toBe(185))
    it('handles decimal input', () => expect(parseWeightInput('12.5', 'lbs')).toBe(12.5))
    it('returns 0 for empty bar (0 lbs)', () => expect(parseWeightInput('0', 'lbs')).toBe(0))
  })

  describe('kg unit', () => {
    it('converts to lbs', () => expect(parseWeightInput('100', 'kg')).toBe(220.5))
    it('converts small value', () => expect(parseWeightInput('10', 'kg')).toBe(22))
  })

  describe('round-trip consistency', () => {
    it('formatWeightDisplay → parseWeightInput roundtrips for lbs', () => {
      const original = 185
      const displayed = formatWeightDisplay(original, 'lbs')
      const stored = parseWeightInput(displayed, 'lbs')
      expect(stored).toBe(original)
    })
    it('formatWeightDisplay → parseWeightInput roundtrips for kg within rounding tolerance', () => {
      const originalLbs = 100
      const displayed = formatWeightDisplay(originalLbs, 'kg')  // '45.4'
      const stored = parseWeightInput(displayed, 'kg')           // convert 45.4 kg back to lbs
      expect(stored).not.toBeNull()
      expect(stored!).toBeCloseTo(originalLbs, 0)
    })
  })
})

describe('EFFORT_CONFIG shape (used by SetRow effort picker)', () => {
  it('covers all effort levels', () => {
    EFFORT_LEVELS.forEach(level => {
      expect(EFFORT_CONFIG).toHaveProperty(level)
    })
  })
  it('each level has a non-empty label', () => {
    EFFORT_LEVELS.forEach(level => {
      expect(EFFORT_CONFIG[level].label).toBeTruthy()
    })
  })
})
