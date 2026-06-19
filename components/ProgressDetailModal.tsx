'use client'

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Card, CardContent } from '@/components/ui/card'
import { lbsToKg } from '@/lib/utils'

export interface ExerciseSession {
  date: string
  maxWeightLbs: number | null
  totalSets: number
  totalReps: number
}

export interface ExerciseProgress {
  name: string
  sessions: ExerciseSession[]
  lastLoggedAt: string
}

function toDisplayValue(session: ExerciseSession, weightUnit: 'lbs' | 'kg'): number {
  if (session.maxWeightLbs === null) return session.totalReps
  return weightUnit === 'kg' ? lbsToKg(session.maxWeightLbs) : session.maxWeightLbs
}

function isBodyweight(exercise: ExerciseProgress): boolean {
  return exercise.sessions.every(s => s.maxWeightLbs === null)
}

const tooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  color: 'hsl(var(--foreground))',
  fontSize: '12px',
}

interface ProgressGridProps {
  exercises: ExerciseProgress[]
  weightUnit: 'lbs' | 'kg'
}

export function ProgressGrid({ exercises, weightUnit }: ProgressGridProps) {
  return (
    <div className="flex flex-col gap-4">
      {exercises.map(exercise => {
        const bodyweight = isBodyweight(exercise)
        const unit = bodyweight ? 'reps' : weightUnit

        const chartData = exercise.sessions.map(s => ({
          date: s.date.slice(5),
          value: toDisplayValue(s, weightUnit),
        }))

        return (
          <Card key={exercise.name} className="rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-baseline justify-between mb-3">
                <p className="font-semibold text-sm">{exercise.name}</p>
                <p className="text-xs text-muted-foreground">
                  {exercise.sessions.length} session{exercise.sessions.length !== 1 ? 's' : ''} · {unit}
                </p>
              </div>

              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} minTickGap={20} />
                  <YAxis width={32} tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value) => (typeof value === 'number' ? [`${value} ${unit}`, ''] : ['', ''])}
                    labelFormatter={label => `Date: ${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ r: 3, fill: 'hsl(var(--primary))' }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
