# Chinese Learning App Plan

## Product Goal

Build a focused Mandarin learning app around the supplied 2,500-character frequency dataset. Users learn characters with pinyin and English meanings, then unlock sentence practice after learning 20 characters. Local Qwen generates adaptive sentences using only the user's learned vocabulary.

## Current State

- Next.js 16, React 19, and TypeScript app already exist.
- `public/top_2500_characters.json` contains the canonical 2,500-character dataset.
- `app/page.tsx` loads vocabulary, restores learned IDs from `localStorage`, filters unlearned characters, and unlocks sentence practice at 20 learned IDs.
- `Flashcard`, `ProgressBar`, and `SentencePractice` components already exist.
- `/api/words` reads the vocabulary JSON.
- `/api/generate-sentence` currently returns unrestricted mock sentences. This is the main correctness gap.

## Phase 1: Vocabulary and Data Contract

1. Treat `public/top_2500_characters.json` as the canonical dataset.
2. Define a shared `Word` type with `id`, `character`, `pinyin`, and `english`.
3. Keep user progress separate from the canonical JSON. Do not mutate the dataset's `learned` field.
4. Validate loaded JSON at runtime.
5. Validate localStorage values by accepting only integer IDs that exist in the dataset.
6. Remove duplicate or corrupt saved IDs.
7. Use the term “characters” in the interface because the source contains individual Han characters, not multi-character words.

## Phase 2: Core Study Experience

### Flashcards

- Show one unlearned character at a time.
- Reveal pinyin and English meaning on demand.
- Mark a character learned exactly once and advance predictably.
- Reset the reveal state whenever the character changes.
- Handle loading, data errors, empty data, and all-characters-complete states.
- Add a way to review learned characters later, or explicitly document that the first release is forward-only.

### Progress

- Show learned count, total count, and percentage.
- Show progress toward the 20-character sentence-practice threshold.
- Show how many characters remain before sentence practice unlocks.
- Use a versioned localStorage key such as `chinese-learning-progress-v1`.
- Prevent hydration mismatch by reading localStorage in an effect and showing a stable loading state first.

### Sentence Practice

- Keep sentence practice locked below 20 learned characters.
- Unlock it at exactly 20 learned characters.
- Keep vocabulary review available after unlocking.
- Add loading, empty, error, retry, and successful-result states.
- Display the Chinese sentence, pinyin, and English translation.

## Phase 3: Sentence Generation API

### Request Contract

Use `POST /api/generate-sentence` with a request such as:

```json
{
	"learnedWordIds": [1, 2, 3]
}
```

Prefer IDs over trusting client-supplied word data. Resolve IDs against the canonical dataset on the server.

### Validation

- Require at least 20 valid learned IDs.
- Reject unknown IDs.
- Remove duplicate IDs.
- Reject oversized request bodies.
- Return structured HTTP 400 errors for invalid requests.

### Model Output

Require structured JSON containing:

```json
{
	"sentence": "...",
	"pinyin": "...",
	"translation": "..."
}
```

The sentence must be in simplified Chinese and use only the user's learned Chinese characters, plus explicitly allowed punctuation.

### Vocabulary Restriction

1. Resolve learned IDs to their characters.
2. Send only that character set to the local model.
3. Extract Han characters from the generated sentence.
4. Reject or regenerate if any Han character is not in the learned set.
5. Limit sentence length and retry count.
6. Never display an invalid sentence as a successful practice result.

### Local Qwen Integration

- Put model access behind a small server-side adapter such as `lib/sentence-generator.ts`.
- Configure `OLLAMA_BASE_URL` and `OLLAMA_MODEL` through environment variables.
- Support `qwen2.5:0.5b-instruct` or the exact locally installed Qwen2.5 model tag.
- Call Ollama only from the Next.js server route.
- Never expose private model configuration or unrestricted server access to the browser.
- Use a strict prompt requiring JSON output and restricting Chinese characters to the supplied learned set.
- Keep a deterministic development fallback behind an explicit development setting. Do not silently treat unrestricted mock text as valid practice.

## Phase 4: Application Structure

### Existing Files

- `app/page.tsx`: study state, persistence, mode switching, and top-level loading/error handling.
- `app/components/Flashcard.tsx`: reveal and learned actions.
- `app/components/ProgressBar.tsx`: progress and unlock messaging.
- `app/components/SentencePractice.tsx`: sentence request lifecycle and practice display.
- `app/api/words/route.ts`: canonical vocabulary loading boundary.
- `app/api/generate-sentence/route.ts`: request validation, model calls, retries, and response validation.
- `public/top_2500_characters.json`: canonical dataset.

### Files to Add or Refine

- `lib/types.ts`: shared TypeScript types.
- `lib/vocabulary.ts`: dataset loading and ID validation.
- `lib/progress.ts`: local progress sanitization and unlock calculations.
- `lib/sentence-generator.ts`: Ollama/Qwen provider adapter.
- `lib/sentence-validation.ts`: Han-character restriction and response validation.
- `.env.local.example`: Ollama URL and model configuration documentation.
- Tests for utilities, API routes, and interactive components.

## Phase 5: UI and Accessibility

1. Replace starter styling with a distinctive, calm visual system suitable for repeated study sessions.
2. Use semantic headings and labeled controls.
3. Provide visible keyboard focus states.
4. Meet readable contrast requirements.
5. Announce generated sentences and errors with `aria-live`.
6. Make flashcards usable with keyboard and touch.
7. Keep card dimensions stable so reveal content does not shift the layout.
8. Support narrow mobile screens and wide desktop screens.
9. Respect `prefers-reduced-motion`.
10. Add clear navigation between vocabulary study and sentence practice after unlock.
11. Reserve space for future pronunciation playback without adding audio functionality yet.

## Phase 6: Testing and Verification

### Unit Tests

- Progress percentage calculation.
- 20-character unlock logic.
- LocalStorage ID sanitization.
- Duplicate and unknown ID handling.
- Vocabulary lookup.
- Sentence character restriction.
- Model response parsing.

### API Tests

Test:

- Fewer than 20 learned IDs.
- Unknown IDs.
- Duplicate IDs.
- Valid learned vocabulary.
- Model output containing an unknown Han character.
- Malformed model JSON.
- Ollama timeout or unavailable service.
- Retry exhaustion.

### Component Tests

- Flashcard reveal and hide.
- Reveal reset when the card changes.
- Marking a character learned.
- Progress display.
- Locked state at 19 learned characters.
- Unlocked state at exactly 20 learned characters.
- Loading, retry, error, and completion states.

### Manual Checks

1. Refresh preserves learning progress.
2. Corrupt localStorage does not break the app.
3. Sentence practice remains locked at 19 characters.
4. Sentence practice unlocks at 20 characters.
5. Generated sentences contain no unlearned Han characters.
6. Ollama failures produce a clear retryable error.
7. The app works on mobile and desktop layouts.

Run these commands from `Chinese_learning_App`:

```bash
npm run lint
npm run build
```

## Implementation Order

1. Add shared types and vocabulary/progress validation.
2. Refine localStorage persistence and unlock behavior.
3. Fix the sentence API request and response contracts.
4. Add strict sentence validation and the Ollama/Qwen adapter.
5. Update sentence UI and preserve vocabulary review after unlock.
6. Improve responsive styling and accessibility.
7. Add focused tests.
8. Run lint, build, and manual smoke checks.

## Scope Boundaries

### Included Now

- Next.js web frontend.
- Browser-local learning progress.
- 2,500-character dataset.
- Flashcard learning flow.
- Sentence practice unlocked at 20 characters.
- Local Ollama/Qwen sentence generation.
- Strict learned-vocabulary validation.
- Responsive accessible interface.
- Tests and build verification.

### Deferred

- User accounts and cloud synchronization.
- Speech recognition.
- Audio generation and pronunciation playback.
- Multiplayer features.
- External hosted AI.
- Advanced spaced repetition scheduling.

Vocalization will be added later through a provider interface and playback control after sentence generation is stable.

## Decisions and Assumptions

- Next.js API routes replace a separate FastAPI service for the first release.
- Browser localStorage is the source of truth for progress.
- Ollama is the initial local runtime for Qwen2.5.
- The app teaches the 2,500 supplied Han characters, not 2,500 multi-character vocabulary words.
- Sentence generation fails closed: any sentence containing unknown Han characters is invalid and must not be shown as successful practice.
