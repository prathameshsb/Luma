import '@testing-library/jest-dom'

// Mock browser APIs not available in jsdom
global.SpeechRecognition = undefined as unknown as typeof SpeechRecognition
;(global as unknown as { webkitSpeechRecognition: unknown }).webkitSpeechRecognition = undefined

// Suppress console.error for known React test noise
const originalError = console.error
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    const msg = String(args[0])
    if (msg.includes('Warning:') || msg.includes('act(')) return
    originalError(...args)
  }
})
afterAll(() => { console.error = originalError })
