import {
  LBS_PER_KG, KG_PER_LBS, WEIGHT_PRECISION,
  EFFORT_LEVELS, EFFORT_CONFIG,
  MAX_SETS_PER_TRANSCRIPT,
  DEFAULT_WEIGHT_UNIT, DEFAULT_EFFORT, DEFAULT_REPS,
  SPEECH_LANG,
} from '@/lib/constants'

describe('Weight constants', () => {
  it('LBS_PER_KG is approximately 0.453592', () => expect(LBS_PER_KG).toBeCloseTo(0.453592, 5))
  it('KG_PER_LBS is approximately 2.20462', () => expect(KG_PER_LBS).toBeCloseTo(2.20462, 4))
  it('LBS_PER_KG and KG_PER_LBS are reciprocals', () => {
    expect(LBS_PER_KG * KG_PER_LBS).toBeCloseTo(1, 4)
  })
  it('WEIGHT_PRECISION is 10 (one decimal place)', () => expect(WEIGHT_PRECISION).toBe(10))
})

describe('EFFORT_LEVELS', () => {
  it('has exactly three entries', () => expect(EFFORT_LEVELS).toHaveLength(3))
  it('contains easy, medium, hard', () => {
    expect(EFFORT_LEVELS).toContain('easy')
    expect(EFFORT_LEVELS).toContain('medium')
    expect(EFFORT_LEVELS).toContain('hard')
  })
})

describe('EFFORT_CONFIG', () => {
  it('has a config for every effort level', () => {
    EFFORT_LEVELS.forEach(level => {
      expect(EFFORT_CONFIG[level]).toBeDefined()
    })
  })
  it('each entry has label, pillClass, and textClass', () => {
    EFFORT_LEVELS.forEach(level => {
      const cfg = EFFORT_CONFIG[level]
      expect(typeof cfg.label).toBe('string')
      expect(typeof cfg.pillClass).toBe('string')
      expect(typeof cfg.textClass).toBe('string')
    })
  })
})

describe('Defaults', () => {
  it('DEFAULT_WEIGHT_UNIT is lbs', () => expect(DEFAULT_WEIGHT_UNIT).toBe('lbs'))
  it('DEFAULT_EFFORT is medium', () => expect(DEFAULT_EFFORT).toBe('medium'))
  it('DEFAULT_REPS is a positive integer', () => {
    expect(DEFAULT_REPS).toBeGreaterThan(0)
    expect(Number.isInteger(DEFAULT_REPS)).toBe(true)
  })
})

describe('Parsing limits', () => {
  it('MAX_SETS_PER_TRANSCRIPT is a positive integer', () => {
    expect(MAX_SETS_PER_TRANSCRIPT).toBeGreaterThan(0)
    expect(Number.isInteger(MAX_SETS_PER_TRANSCRIPT)).toBe(true)
  })
})

describe('SPEECH_LANG', () => {
  it('is a valid BCP 47 language tag', () => expect(SPEECH_LANG).toMatch(/^[a-z]{2}(-[A-Z]{2})?$/))
})
