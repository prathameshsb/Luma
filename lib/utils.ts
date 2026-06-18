import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { WeightUnit } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function lbsToKg(lbs: number): number {
  return Math.round(lbs * 0.453592 * 10) / 10
}

export function kgToLbs(kg: number): number {
  return Math.round(kg * 2.20462 * 10) / 10
}

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

export function getDayOfWeek(): number {
  return new Date().getDay()
}

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
