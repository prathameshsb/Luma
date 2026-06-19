import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { parseTranscript } from '@/lib/workout-parser'
import type { WeightUnit } from '@/lib/types'
import type { EffortLevel } from '@/lib/types'

interface RequestBody {
  transcript: string
  mode: 'routine' | 'free-form'
  exerciseName?: string
  weightUnit: WeightUnit
}

interface ParsedSet {
  set_number: number
  weight: number | null
  reps: number
  effort: EffortLevel
}

const SYSTEM_PROMPT = `You are a workout logging assistant. Parse the user's spoken workout transcript into structured JSON.

Output ONLY valid JSON — no markdown, no explanation, no code fences.

Output schema:
{
  "exercises": [
    {
      "name": "string",
      "sets": [
        {
          "set_number": 1,
          "weight": number | null,
          "reps": number,
          "effort": "easy" | "medium" | "hard"
        }
      ]
    }
  ]
}

Rules:
- weight is in the user's unit (lbs or kg) as stated — do not convert. null means bodyweight.
- reps must be a positive integer. Default to 8 if not stated.
- effort: infer per-set from context. Default is "medium".
  - "easy", "light", "warm-up" → "easy"
  - "hard", "heavy", "tough", "brutal", "max effort" → "hard"
  - "first sets easy, last one hard" → easy/easy/.../hard per set
  - No mention → "medium" for all sets
- In routine mode the exercise name is provided — use it exactly, do not change it.
- In free-form mode extract the exercise name from the transcript. Use title case.
- If multiple exercises are mentioned, return one entry per exercise.
- If set count is not stated, return 1 set.`

async function parseWithGemini(
  transcript: string,
  mode: 'routine' | 'free-form',
  exerciseName: string | undefined,
  weightUnit: WeightUnit,
): Promise<{ exercises: Array<{ name: string; sets: ParsedSet[] }> }> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not set')

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: { responseMimeType: 'application/json' },
  })

  const userMessage = mode === 'routine'
    ? `Exercise: ${exerciseName}\nWeight unit: ${weightUnit}\nTranscript: "${transcript}"`
    : `Mode: free-form\nWeight unit: ${weightUnit}\nTranscript: "${transcript}"`

  const result = await model.generateContent(userMessage)
  const text = result.response.text().trim()
  const parsed = JSON.parse(text)

  // In routine mode, force the name to the provided exerciseName
  if (mode === 'routine' && exerciseName && parsed.exercises?.[0]) {
    parsed.exercises[0].name = exerciseName
  }

  return parsed
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

    // Try Gemini first; fall back to regex parser if unavailable
    try {
      const result = await parseWithGemini(transcript, mode, exerciseName, weightUnit)
      return NextResponse.json(result)
    } catch {
      const exercise = parseTranscript(transcript, mode, exerciseName, weightUnit)
      return NextResponse.json({ exercises: [exercise] })
    }
  } catch {
    return NextResponse.json({ error: 'parse_failed' }, { status: 500 })
  }
}
