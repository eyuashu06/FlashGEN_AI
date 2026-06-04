export interface UserProfile {
  userId: string;
  email: string;
  createdAt: string;
  streakCount: number;
  lastStudyDate: string; // YYYY-MM-DD
}

export interface Deck {
  deckId: string;
  userId: string;
  title: string;
  description: string;
  cardCount: number;
  sourceName: string; // e.g. "manual" or "Chapter4.pdf"
  createdAt: string;
  updatedAt: string;
}

export interface Card {
  cardId: string;
  deckId: string;
  userId: string;
  front: string;
  back: string;
  createdAt: string;
  updatedAt: string;
  // SuperMemo SM-2 parameters:
  repetition: number;      // Number of consecutive successful repetitions
  interval: number;        // Interval before next review in days
  efactor: number;         // Easiness factor (defaults to 2.5)
  nextReviewDate: string;  // ISO timestamp when card is due
}

export interface StudySession {
  sessionId: string;
  userId: string;
  deckId: string;
  startTime: string;
  endTime: string;
  cardsReviewed: number;
  correctAnswers: number;
}
