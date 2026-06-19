// Weight conversion factors
export const LBS_PER_KG = 0.453592
export const KG_PER_LBS = 2.20462
// Multiply then divide by this for one-decimal rounding: round(x * PRECISION) / PRECISION
export const WEIGHT_PRECISION = 10

// Effort levels — order matters (easy → medium → hard)
export const EFFORT_LEVELS = ['easy', 'medium', 'hard'] as const

export const EFFORT_CONFIG = {
  easy: {
    label: 'Easy',
    pillClass: 'bg-green-500/20 text-green-400 border-green-500/30',
    textClass: 'text-green-400',
  },
  medium: {
    label: 'Medium',
    pillClass: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    textClass: 'text-amber-400',
  },
  hard: {
    label: 'Hard',
    pillClass: 'bg-red-500/20 text-red-400 border-red-500/30',
    textClass: 'text-red-400',
  },
} as const

// Workout parsing limits
export const MAX_SETS_PER_TRANSCRIPT = 10

// Voice recognition
export const SPEECH_LANG = 'en-US'

// Defaults
export const DEFAULT_WEIGHT_UNIT = 'lbs' as const
export const DEFAULT_EFFORT = 'medium' as const
export const DEFAULT_REPS = 8

// Resume banner background (CSS color string)
export const RESUME_BANNER_BG = 'oklch(0.62 0.22 264 / 0.15)'

// Date format options used across multiple pages
export const DATE_FORMAT_SHORT: Intl.DateTimeFormatOptions = {
  weekday: 'short', month: 'short', day: 'numeric',
}
export const DATE_FORMAT_LONG: Intl.DateTimeFormatOptions = {
  weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
}
