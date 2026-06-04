/**
 * SuperMemo SM-2 Spaced Repetition Algorithm
 * 
 * Grades (quality):
 * 5 - Perfect response (excellent recall)
 * 4 - Correct response after a hesitation
 * 3 - Correct response with difficulty
 * 2 - Incorrect response; where the correct one seemed easy to recall
 * 1 - Incorrect response; the correct one remembered
 * 0 - Complete blackout
 */
export function calculateSM2(
  quality: number, // 0 to 5
  prevRepetition: number,
  prevInterval: number,
  prevEfactor: number
): { repetition: number; interval: number; efactor: number; nextReviewDate: string } {
  let repetition = prevRepetition;
  let interval = prevInterval;
  let efactor = prevEfactor;

  if (quality >= 3) {
    if (repetition === 0) {
      interval = 1; // 1 day
    } else if (repetition === 1) {
      interval = 6; // 6 days
    } else {
      interval = Math.ceil(prevInterval * efactor);
    }
    repetition += 1;
  } else {
    // Incorrect: reset repetition counter and schedule review for tomorrow (1 day)
    repetition = 0;
    interval = 1;
  }

  // Adjust EF according to SM-2 formula
  const efFactorChange = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
  efactor = prevEfactor + efFactorChange;

  // Minimum E-Factor is 1.3
  if (efactor < 1.3) {
    efactor = 1.3;
  }

  // Determine next review date in days from now
  const nextReview = new Date(Date.now() + interval * 24 * 60 * 60 * 1000);

  return {
    repetition,
    interval,
    efactor,
    nextReviewDate: nextReview.toISOString(),
  };
}
