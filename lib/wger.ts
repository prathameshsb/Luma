export interface WgerExercise {
  name: string
  exercise: number
}

let cachedExercises: WgerExercise[] | null = null

export async function fetchAllExercises(): Promise<WgerExercise[]> {
  if (cachedExercises) return cachedExercises
  try {
    const res = await fetch(
      'https://wger.de/api/v2/exercise-translation/?format=json&language=2&limit=2200'
    )
    if (!res.ok) return []
    const data = await res.json()
    cachedExercises = (data.results as { name: string; exercise: number }[])
      .filter(e => e.name?.trim())
      .sort((a, b) => a.name.localeCompare(b.name))
    return cachedExercises
  } catch {
    return []
  }
}

export function filterExercises(exercises: WgerExercise[], query: string): WgerExercise[] {
  if (!query.trim()) return []
  const q = query.toLowerCase()
  return exercises.filter(e => e.name.toLowerCase().includes(q)).slice(0, 8)
}
