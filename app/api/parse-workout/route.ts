import { NextResponse } from 'next/server'
import { parseTranscript } from '@/lib/workout-parser'
import type { WeightUnit } from '@/lib/types'

// TODO: Replace parseTranscript with real Claude API call

interface RequestBody {
  transcript: string
  mode: 'routine' | 'free-form'
  exerciseName?: string
  weightUnit: WeightUnit
}

export async function POST(request: Request) {
  try {
    const body: RequestBody = await request.json()
    const { transcript, mode, exerciseName, weightUnit } = body

    if (!transcript?.trim()) {
      return NextResponse.json({ error: 'transcript_required' }, { status: 400 })
    }
    if (!['routine', 'free-form'].includes(mode)) {
      return NextResponse.json({ error: 'invalid_mode' }, { status: 400 })
    }
    if (!['lbs', 'kg'].includes(weightUnit)) {
      return NextResponse.json({ error: 'invalid_weight_unit' }, { status: 400 })
    }

    const exercise = parseTranscript(transcript, mode, exerciseName, weightUnit)
    return NextResponse.json({ exercises: [exercise] })
  } catch {
    return NextResponse.json({ error: 'parse_failed' }, { status: 500 })
  }
}
