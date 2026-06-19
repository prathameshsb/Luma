/**
 * VoiceButton tests cover the voice-state machine logic and text-input path.
 * SpeechRecognition is mocked since jsdom does not implement it.
 */
import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { VoiceButton } from '@/components/VoiceButton'
import { SPEECH_LANG } from '@/lib/constants'

// ── SpeechRecognition mock ────────────────────────────────────────────────────

interface MockRecognition {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((e: unknown) => void) | null
  onerror: ((e: unknown) => void) | null
  onend: (() => void) | null
  start: jest.Mock
  stop: jest.Mock
}

let mockRecognitionInstance: MockRecognition

const MockSR = jest.fn().mockImplementation((): MockRecognition => {
  mockRecognitionInstance = {
    continuous: false,
    interimResults: false,
    lang: '',
    onresult: null,
    onerror: null,
    onend: null,
    start: jest.fn(),
    stop: jest.fn(),
  }
  return mockRecognitionInstance
})

beforeEach(() => {
  jest.clearAllMocks()
  Object.defineProperty(window, 'SpeechRecognition', { value: MockSR, writable: true })
})

afterEach(() => {
  Object.defineProperty(window, 'SpeechRecognition', { value: undefined, writable: true })
})

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderVoiceButton(overrides: Partial<React.ComponentProps<typeof VoiceButton>> = {}) {
  const onTranscript = jest.fn()
  const { rerender } = render(
    <VoiceButton onTranscript={onTranscript} processing={false} {...overrides} />,
  )
  return { onTranscript, rerender }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('text input path', () => {
  it('calls onTranscript when Enter is pressed', async () => {
    const { onTranscript } = renderVoiceButton()
    const input = screen.getByRole('textbox')
    await userEvent.type(input, 'bench press 185 lbs{Enter}')
    expect(onTranscript).toHaveBeenCalledWith('bench press 185 lbs')
  })

  it('calls onTranscript when Send button is clicked', async () => {
    const { onTranscript } = renderVoiceButton()
    await userEvent.type(screen.getByRole('textbox'), 'squat 225')
    await userEvent.click(screen.getByRole('button', { name: /^send$/i }))
    expect(onTranscript).toHaveBeenCalledWith('squat 225')
  })

  it('does not call onTranscript for empty input', async () => {
    const { onTranscript } = renderVoiceButton()
    await userEvent.click(screen.getByRole('button', { name: /send/i }))
    expect(onTranscript).not.toHaveBeenCalled()
  })

  it('clears text input after submission', async () => {
    renderVoiceButton()
    const input = screen.getByRole('textbox') as HTMLInputElement
    await userEvent.type(input, 'deadlift{Enter}')
    expect(input.value).toBe('')
  })

  it('is disabled when processing is true', async () => {
    const { onTranscript } = renderVoiceButton({ processing: true })
    const input = screen.getByRole('textbox')
    expect(input).toBeDisabled()
    expect(onTranscript).not.toHaveBeenCalled()
  })
})

describe('mic / speech recognition path', () => {
  it('starts recognition when mic button is clicked', async () => {
    renderVoiceButton()
    const micBtn = screen.getByRole('button', { name: /start recording/i })
    await userEvent.click(micBtn)
    expect(mockRecognitionInstance.start).toHaveBeenCalledTimes(1)
  })

  it('sets correct language on recognition', async () => {
    renderVoiceButton()
    await userEvent.click(screen.getByRole('button', { name: /start recording/i }))
    expect(mockRecognitionInstance.lang).toBe(SPEECH_LANG)
  })

  it('stops recognition on second click and calls onTranscript', async () => {
    const { onTranscript } = renderVoiceButton()
    const micBtn = screen.getAllByRole('button')[0]

    // Start
    await userEvent.click(micBtn)
    expect(mockRecognitionInstance.start).toHaveBeenCalledTimes(1)

    // Simulate speech result
    act(() => {
      mockRecognitionInstance.onresult?.({
        resultIndex: 0,
        results: [{ isFinal: true, 0: { transcript: 'bench press 185 lbs' } }],
      })
    })

    // Stop (second click — button label has now changed to "Stop recording")
    const stopBtn = screen.getByRole('button', { name: /stop recording/i })
    await userEvent.click(stopBtn)
    expect(mockRecognitionInstance.stop).toHaveBeenCalledTimes(1)

    // Fire onend (recognition has stopped)
    act(() => { mockRecognitionInstance.onend?.() })

    await waitFor(() => {
      expect(onTranscript).toHaveBeenCalledWith('bench press 185 lbs')
    })
  })

  it('resets to idle on recognition error', async () => {
    renderVoiceButton()
    await userEvent.click(screen.getByRole('button', { name: /start recording/i }))

    act(() => { mockRecognitionInstance.onerror?.({}) })

    // After error the "Tap to stop…" label should be gone
    expect(screen.queryByText(/tap to stop/i)).toBeNull()
  })
})
