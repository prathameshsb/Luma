import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { WeightUnit } from "./types"
import { LBS_PER_KG, KG_PER_LBS, WEIGHT_PRECISION } from "./constants"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ── Weight conversions ────────────────────────────────────────────────────────

export function lbsToKg(lbs: number): number {
  return Math.round(lbs * LBS_PER_KG * WEIGHT_PRECISION) / WEIGHT_PRECISION
}

export function kgToLbs(kg: number): number {
  return Math.round(kg * KG_PER_LBS * WEIGHT_PRECISION) / WEIGHT_PRECISION
}

/** Converts a display-unit weight value to stored lbs. */
export function convertWeightToLbs(value: number, fromUnit: WeightUnit): number {
  if (fromUnit === 'kg') return Math.round(value * KG_PER_LBS * WEIGHT_PRECISION) / WEIGHT_PRECISION
  return value
}

/** Converts a stored-lbs value to the user's display unit. */
export function convertWeightFromLbs(valueLbs: number, toUnit: WeightUnit): number {
  return toUnit === 'kg' ? lbsToKg(valueLbs) : valueLbs
}

/**
 * Formats a weight stored in lbs for display in the user's unit.
 * Returns empty string for bodyweight (null).
 */
export function formatWeightDisplay(weightLbs: number | null, unit: WeightUnit): string {
  if (weightLbs === null) return ''
  return String(convertWeightFromLbs(weightLbs, unit))
}

/**
 * Parses a raw weight input string into stored lbs.
 * Accepts numeric strings in the user's display unit.
 * Returns null for bodyweight ("" or "bw") or invalid input.
 */
export function parseWeightInput(raw: string, unit: WeightUnit): number | null {
  const trimmed = raw.trim().toLowerCase()
  if (trimmed === '' || trimmed === 'bw') return null
  const num = parseFloat(trimmed)
  if (isNaN(num) || num < 0) return null
  return convertWeightToLbs(num, unit)
}

// ── Display formatting ────────────────────────────────────────────────────────

export function displayVolume(totalLbs: number, unit: WeightUnit): string {
  const value = unit === 'kg' ? lbsToKg(totalLbs) : totalLbs
  return `${Math.round(value).toLocaleString()} ${unit}`
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

export function formatDate(date: string | Date, options: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', options)
}

export function toTitleCase(str: string): string {
  return str.replace(/\b\w/g, c => c.toUpperCase())
}

// ── Dates ─────────────────────────────────────────────────────────────────────

export function getDayOfWeek(): number {
  return new Date().getDay()
}

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
