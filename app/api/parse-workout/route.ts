// TODO: Replace mock with real Claude API call

import { NextResponse } from 'next/server'

interface RequestBody {
  transcript: string
  mode: 'routine' | 'free-form'
  exerciseName?: string
  weightUnit: 'lbs' | 'kg'
}

function parseMock(transcript: string, exerciseName: string | undefined) {
  const lower = transcript.toLowerCase()

  const weightMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:lbs?|pounds?)/) || lower.match(/(\d+(?:\.\d+)?)\s*kg/)
  const weight = weightMatch ? parseFloat(weightMatch[1]) : null

  const repsMatch = lower.match(/(\d+)\s*reps?/)
  const reps = repsMatch ? parseInt(repsMatch[1]) : 8

  const effort: 'easy' | 'medium' | 'hard' =
    /easy|light/.test(lower) ? 'easy' :
    /hard|heavy|tough|brutal/.test(lower) ? 'hard' :
    'medium'

  return {
    name: exerciseName ?? 'Exercise',
    sets: [{ set_number: 1, weight, reps, effort }],
  }
}

export async function POST(request: Request) {
  try {
    const body: RequestBody = await request.json()
    const { transcript, exerciseName } = body

    if (!transcript?.trim()) {
      return NextResponse.json({ error: 'transcript_required' }, { status: 400 })
    }

    const exercise = parseMock(transcript, exerciseName)
    return NextResponse.json({ exercises: [exercise] })
  } catch {
    return NextResponse.json({ error: 'parse_failed' }, { status: 500 })
  }
}
