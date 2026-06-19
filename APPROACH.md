# VoiceLift — Approach & Design Decisions

## What I Built

VoiceLift is a voice-first workout tracker. The core idea: instead of tapping through weight/reps/effort fields after every set, you just speak — "bench press, three sets, 185 pounds, last one was hard" — and the app parses that into structured data and logs it instantly.

Every existing workout app treats logging as a form-filling exercise. VoiceLift treats it as a conversation.

---

## Where AI Does Real Work

The central AI feature is the workout transcript parser: `POST /api/parse-workout`.

The user speaks (or types) a free-form description of what they just did. The API sends that transcript to Gemini 2.5 Flash with a structured JSON output schema and gets back a fully parsed workout — exercise name, set count, weight, reps, and effort level per set.

**Why this is non-trivial:**

- **Per-set effort inference**: "first two sets were easy, last one was brutal" → `[easy, easy, hard]`. A regex can't do this; it needs to understand the sentence structure and map it to an ordered list of sets.
- **Natural language weight/reps**: "four plates each side", "two-twenty-five", "bodyweight" all need to resolve correctly.
- **Multi-exercise transcripts**: "bench press three sets 185, then cable rows 120 for four" produces two separate exercise entries in one call.
- **Routine vs free-form modes**: In routine mode the exercise name is already known, so the model only needs to parse sets/weight/reps/effort. In free-form mode it also extracts the exercise name from the transcript.

**Model choice — Gemini 2.5 Flash:**

Gemini 2.5 Flash with `responseMimeType: 'application/json'` gives deterministic structured output without needing to parse fenced code blocks or handle formatting variation. It's fast enough for real-time feel (sub-second on most transcripts), and the free tier covers the volume this app needs at launch.

**Fallback:** if the Gemini API is unavailable or the key is missing, the route falls back to a regex-based parser (`lib/workout-parser.ts`) that handles the common cases. The app never breaks — it degrades gracefully.

---

## Architecture Decisions

### Voice input: Web Speech API + text fallback

The browser's `SpeechRecognition` API handles transcription client-side — no streaming infrastructure needed, no cost per character. The mic records continuously until the user taps stop, accumulates interim results, then sends the full transcript to the API.

Text input is always visible below the mic button. On browsers without speech support (or when the user prefers typing) it works identically — the same API call, the same parsing.

### AI boundary: server-side only

The Gemini call happens in a Next.js route handler, never in the browser. This keeps the API key off the client and means the parsing logic can be swapped (different model, different provider) without touching any UI code.

### Weight storage: always lbs in the DB

Users pick a display unit (lbs or kg) on signup. Every weight value is stored in lbs in the database. Conversion happens on the frontend at render time using `convertWeightToLbs` / `convertWeightFromLbs`. This means:

- Historical data stays correct if the user changes their unit preference
- Queries and volume calculations always work on the same unit
- No ambiguity about what's in the DB

### Pure functions for testability

All parsing logic lives in `lib/workout-parser.ts` as pure functions — no network calls, no side effects. The route handler is ~100 lines and just wires inputs to outputs. This made it possible to write 120 unit tests covering every branch of the parsing, weight conversion, and formatting logic without needing to mock the API or a database.

### Error handling strategy

Every async DB path has try/catch. Success toasts fire inside the try block, not after it — so the user only sees "Saved!" when the data is actually on the server. Loading states are propagated to every button that triggers async work so double-submit is structurally impossible, not just guarded by a flag.

---

## What I'd Do Next

**Adaptive coaching engine**: VoiceLift already captures something almost no other workout app does — effort per set, as a first-class field. That data is the foundation of a real AI coaching layer.

The pipeline: a nightly job computes the 3-session trend for each exercise per user. If weight or reps are flat or declining, call the model with the last 5 sessions of `[date, weight, reps, effort]` tuples and ask it to diagnose *why* — not just flag that a stall occurred.

The effort field is what makes the diagnosis meaningful. A stall at 185 lbs reads completely differently depending on effort:
- Easy → Hard over 3 sessions: accumulating fatigue, likely needs a deload
- Consistently Hard at the same weight: at a technique or recovery ceiling, not just a strength one
- Effort stayed Easy/Medium throughout: undertrained, just needs a push

The output is an insight card on the Dashboard — not "your bench press hasn't moved" but "your bench press has stalled for 3 sessions. Your effort ratings show you're consistently hitting Hard by set 2 — this is a recovery signal, not a strength ceiling. Consider a deload week at 80% before pushing to 190." Actionable, personalized, grounded in the user's own data.

**Progressive overload suggestions**: before each exercise in routine mode, show what the user did last session alongside their effort rating. If last effort was Easy or Medium, suggest +5 lbs. If Hard, hold or microload. One query, shown inline on the exercise card before the user speaks — they start with a concrete target, not just their memory.

**PR detection**: the data is already there — max weight per exercise per session is computed for the progress charts. Compare today's max to the all-time max; if it's a new record, fire a celebration on the workout summary screen. Simple, high emotional impact.

**Rest timer**: after a set is logged, auto-start a configurable countdown (60s / 90s / 2min, set per exercise in the routine). No infrastructure needed — just a timer component and a notification permission. Huge practical value in the gym where you're not staring at the screen between sets.

**Streaming voice feedback**: show a live transcript as the user speaks rather than waiting for them to tap stop. The Web Speech API supports `interimResults` — wiring that to a live preview would make the mic feel more responsive.

**Progressive Web App**: add a service worker and manifest so users can install VoiceLift to their home screen and use it in the gym without opening a browser tab. Offline set-logging with a sync queue when connectivity returns.

**Exercise autocomplete**: the wger API is wired up but only used in the routine builder. Free-form mode could suggest known exercises as the user speaks, reducing name variation in the history ("Bench Press" vs "Bench" vs "Flat Bench").
