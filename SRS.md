# Software Requirements Specification (SRS)

## AI-Powered Spaced-Repetition Flashcard Application

### 1. Introduction
This document defines the software requirements for the AI-Powered Flashcard Applet. The system uses the Google `@google/genai` TypeScript SDK to extract meaningful key-value knowledge cards (flashcards) from uploaded PDF documents or plain text. It organizes the cards into Study Decks and schedules reviews using a custom implementation of the SuperMemo-2 (SM-2) spaced repetition algorithm to optimize memory retention.

### 2. Functional Requirements

#### 2.1 Study Deck Management
*   **Deck Creation**: Users can create decks manually (providing a title and description) or generate them automatically by uploading a PDF (or pasting long text).
*   **Deck Listing**: Displays all created decks with metadata: card count, source document name, creation date, and current review status (cards due today).
*   **Deck Deletion**: Users can safely delete decks, which recursively deletes all associated flashcards and study history.

#### 2.2 AI Generation Engine (Google `@google/genai` SDK)
*   **PDF Parsing & Extraction**: Ingests files or long-form copy-pasted notes and extracts central concepts.
*   **Validation Validation**: Demands strict JSON responses conforming to a schema of `[{front: string, back: string}]` using `ai.models.generateContent` with a structured `responseSchema`.
*   **Model Selection**: Utilizes `'gemini-3.5-flash'` for lightweight, fast extraction and card generation.

#### 2.3 SuperMemo-2 (SM-2) Spaced Repetition Logic
Each flashcard tracks its cognitive state using the standard SuperMemo-2 mathematical parameters:
*   **Repetition ($r$)**: Integer starting at $0$. Number of consecutive successful reviews.
*   **Interval ($i$)**: Integer representing days before next review:
    *   If $r = 0$: $i = 1$ day
    *   If $r = 1$: $i = 6$ days
    *   If $r > 1$: $i = \text{round}(i_{\text{previous}} \times EF)$
*   **Easiness Factor ($EF$)**: Float starting at $2.5$. Adjusted based on user self-grading of card familiarity from $0$ to $5$:
    *   $EF_{\text{new}} = EF_{\text{old}} + (0.1 - (5 - q) \times (0.08 + (5 - q) \times 0.02))$
    *   If $EF_{\text{new}} < 1.3$, set $EF_{\text{new}} = 1.3$.
*   **Familiarity Scale ($q$)**:
    *   `5`: Perfect response (re-score correct, interval increases)
    *   `4`: Correct response after a hesitation
    *   `3`: Correct response with serious difficulty
    *   `2`: Incorrect response; where the correct one seemed easy to recall (interval reset)
    *   `1`: Incorrect response; the correct one remembered
    *   `0`: Complete blackout (interval reset)

#### 2.4 Gamification & Daily Streaks
*   Tracks user daily streak to motivate learning.
*   Triggers streak increments in Firebase `UserProfile` when at least 5 cards are successfully reviewed on consecutive calendar days.

---

### 3. System Architecture & Tech Stack

```
┌────────────────────────────────────────────────────────┐
│                      Client (SPA)                      │
│            React 19 / Tailwind CSS / Lucide            │
└───────────────────────────┬────────────────────────────┘
                            │ (JSON API over HTTP)
┌───────────────────────────▼────────────────────────────┐
│                    Express Backend                     │
│               Vite + TSX + Google GenAI                │
└───────────────────────────┬────────────────────────────┘
                            │ (Secure Client SDK)
┌───────────────────────────▼────────────────────────────┐
│                      Firebase DB                       │
│             Firestore Real-time Instances               │
└────────────────────────────────────────────────────────┘
```

*   **Frontend**: Single Screen Dashboard containing tabs for "My Decks", "Active Study Session", and "AI Generator Workspace". No unrequested frame clutter.
*   **Backend**: Node.js/Express server acting as the secure proxy for Gemini API calls to safeguard private credentials.
*   **Database**: Firebase Cloud Firestore holding real-time collections for user states.

---

### 4. Security Requirements
*   **No Client-Side Secrets**: Gemini API keys reside purely on the backend.
*   **Firestore Rules Enforcement**: All document edits are verified with `existing().ownerId == request.auth.uid`. No blanket permissions.
