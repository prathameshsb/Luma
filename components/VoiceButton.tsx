'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Mic, Loader2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { SPEECH_LANG } from '@/lib/constants'

interface VoiceButtonProps {
  onTranscript: (text: string) => void
  processing: boolean
  disabled?: boolean
  placeholder?: string
}

type VoiceState = 'idle' | 'listening' | 'processing'

export function VoiceButton({
  onTranscript,
  processing,
  disabled = false,
  placeholder = 'or type weight, reps...',
}: VoiceButtonProps) {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle')
  const [textInput, setTextInput] = useState('')
  const [speechSupported, setSpeechSupported] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const accumulatedRef = useRef('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SR = window.SpeechRecognition || (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition
      setSpeechSupported(!!SR)
    }
  }, [])

  useEffect(() => {
    if (!processing && voiceState === 'processing') setVoiceState('idle')
  }, [processing, voiceState])

  const stopAndSubmit = useCallback(() => {
    if (!recognitionRef.current) return
    recognitionRef.current.onend = () => {
      const transcript = accumulatedRef.current.trim()
      accumulatedRef.current = ''
      recognitionRef.current = null
      if (transcript) {
        setVoiceState('processing')
        onTranscript(transcript)
      } else {
        setVoiceState('idle')
      }
    }
    try { recognitionRef.current.stop() } catch { /* ignore */ }
  }, [onTranscript])

  const startListening = useCallback(() => {
    if (typeof window === 'undefined') return
    const SR = window.SpeechRecognition || (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition
    if (!SR) return

    const recognition = new SR()
    recognition.continuous = true
    recognition.interimResults = false
    recognition.lang = SPEECH_LANG
    accumulatedRef.current = ''

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          accumulatedRef.current += event.results[i][0].transcript + ' '
        }
      }
    }
    recognition.onerror = () => {
      accumulatedRef.current = ''
      recognitionRef.current = null
      setVoiceState('idle')
    }

    recognitionRef.current = recognition
    recognition.start()
    setVoiceState('listening')
  }, [])

  const handleMicClick = useCallback(() => {
    if (disabled || processing) return
    if (voiceState === 'listening') {
      stopAndSubmit()
    } else if (voiceState === 'idle') {
      startListening()
    }
  }, [voiceState, disabled, processing, startListening, stopAndSubmit])

  const handleTextSubmit = useCallback(() => {
    const trimmed = textInput.trim()
    if (!trimmed || processing || disabled) return
    setTextInput('')
    onTranscript(trimmed)
  }, [textInput, processing, disabled, onTranscript])

  const isMicDisabled = disabled || processing || voiceState === 'processing'

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      {speechSupported && (
        <div className="flex flex-col items-center gap-1.5">
          <div className="relative flex items-center justify-center">
            {/* Ripple rings when listening */}
            {voiceState === 'listening' && (
              <>
                <span className="absolute inset-0 rounded-full bg-red-500/25 animate-ping" />
                <span className="absolute -inset-2 rounded-full bg-red-500/10 animate-ping [animation-delay:150ms]" />
              </>
            )}
            <button
              type="button"
              aria-label={voiceState === 'listening' ? 'Stop recording' : 'Start recording'}
              onClick={handleMicClick}
              disabled={isMicDisabled}
              className={cn(
                'relative z-10 flex items-center justify-center rounded-full w-14 h-14 border transition-all duration-200',
                voiceState === 'idle' && 'bg-primary/10 border-primary/30 hover:bg-primary/20 hover:border-primary/50 active:scale-95 cursor-pointer',
                voiceState === 'listening' && 'bg-red-500/15 border-red-500/50 cursor-pointer scale-105',
                voiceState === 'processing' && 'bg-muted border-muted-foreground/20 cursor-not-allowed opacity-60',
              )}
            >
              {voiceState === 'processing'
                ? <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                : <Mic className={cn('w-5 h-5', voiceState === 'listening' ? 'text-red-500' : 'text-primary')} />
              }
            </button>
          </div>
          <span className={cn('text-xs font-medium h-4 transition-opacity', voiceState === 'idle' && 'opacity-0')} aria-live="polite">
            {voiceState === 'listening' && <span className="text-red-500">Tap to stop…</span>}
            {voiceState === 'processing' && <span className="text-muted-foreground">Parsing…</span>}
          </span>
        </div>
      )}
      <div className="flex w-full gap-2">
        <Input
          value={textInput}
          onChange={e => setTextInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleTextSubmit()}
          placeholder={placeholder}
          disabled={disabled || processing}
          className="flex-1"
        />
        <Button
          type="button"
          size="icon"
          variant="outline"
          aria-label="Send"
          onClick={handleTextSubmit}
          disabled={disabled || processing || !textInput.trim()}
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
