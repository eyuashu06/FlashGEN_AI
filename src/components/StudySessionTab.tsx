import React, { useState, useEffect } from "react";
import { useFlashcards } from "../context/FlashcardContext";
import { Card, Deck } from "../types";
import { ArrowLeft, ChevronRight, CheckSquare, Award, AlertCircle, RefreshCw, Calendar, Sparkles } from "lucide-react";

interface StudySessionTabProps {
  deckId: string;
  onExit: () => void;
}

export const StudySessionTab: React.FC<StudySessionTabProps> = ({ deckId, onExit }) => {
  const { decks, cards, updateCardGrade, addStudySession } = useFlashcards();

  const [studyAll, setStudyAll] = useState(true); // Toggle between studying due cards vs practicing all cards
  const [sessionCards, setSessionCards] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Statistics
  const [cardsCorrect, setCardsCorrect] = useState(0);
  const [totalReviewed, setTotalReviewed] = useState(0);

  const activeDeck = decks.find((d) => d.deckId === deckId);
  const now = new Date();

  // Populate cards queue and reset session when deck or study mode changes
  useEffect(() => {
    const deckCards = cards.filter((c) => c.deckId === deckId);
    const queue = studyAll
      ? deckCards
      : deckCards.filter((c) => new Date(c.nextReviewDate) <= now);

    setSessionCards(queue);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsCompleted(false);
    setCardsCorrect(0);
    setTotalReviewed(0);
  }, [deckId, studyAll]);

  if (!activeDeck) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500 font-semibold">Deck not found.</p>
        <button onClick={onExit} className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl">
          Return to Library
        </button>
      </div>
    );
  }

  const currentCard: Card | undefined = sessionCards[currentIndex];

  const handleGradeCard = (grade: number) => {
    if (!currentCard) return;

    // Track if answer was success (grade in SM-2 >= 3 is considered successful)
    if (grade >= 3) {
      setCardsCorrect((prev) => prev + 1);
    }

    setTotalReviewed((prev) => prev + 1);

    // SM-2 database state update
    updateCardGrade(currentCard.cardId, grade);

    // Slide transition behavior helper
    if (currentIndex < sessionCards.length - 1) {
      setIsFlipped(false);
      // Wait for simple transition duration
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
      }, 200);
    } else {
      setIsCompleted(true);
      // Synchronize study history with local profile tracker
      addStudySession(deckId, totalReviewed + 1, cardsCorrect + (grade >= 3 ? 1 : 0));
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header controls */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Library
        </button>

        <div className="text-right">
          <h3 className="text-sm font-bold text-slate-800 line-clamp-1">{activeDeck.title}</h3>
          <p className="text-[10px] text-slate-400 font-mono">Spaced Learning Engine</p>
        </div>
      </div>

      {sessionCards.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-4">
          <CheckSquare className="w-12 h-12 text-emerald-500 mx-auto" />
          <div>
            <h4 className="text-lg font-bold text-slate-800">No review cards scheduled!</h4>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
              You are completely caught up with scheduled reviews for this deck. Would you like to practice all cards anyway?
            </p>
          </div>

          <div className="flex justify-center gap-3 pt-3">
            <button
              onClick={() => setStudyAll(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
            >
              Practice All {activeDeck.cardCount} Cards
            </button>
            <button
              onClick={onExit}
              className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Back to Library
            </button>
          </div>
        </div>
      ) : isCompleted ? (
        /* Study Session complete splash screen */
        <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-6 shadow-xs">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-500 border border-emerald-100 animate-bounce">
            <Award className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-bold text-slate-800">Session Completed!</h3>
            <p className="text-sm text-slate-500">
              Cognitive recall tracks recorded. SuperMemo schedules have been updated.
            </p>
          </div>

          {/* Stats layout block */}
          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Reviewed
              </span>
              <span className="text-2xl font-extrabold text-slate-800">{totalReviewed}</span>
              <span className="text-xs text-slate-400 ml-1">cards</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Accuracy Index
              </span>
              <span className="text-2xl font-extrabold text-indigo-600">
                {totalReviewed > 0 ? Math.round((cardsCorrect / totalReviewed) * 100) : 0}%
              </span>
            </div>
          </div>

          <div className="flex gap-2 justify-center pt-4">
            <button
              onClick={() => {
                setCurrentIndex(0);
                setIsCompleted(false);
                setIsFlipped(false);
                setCardsCorrect(0);
                setTotalReviewed(0);
              }}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-sm font-semibold transition-all cursor-pointer flex items-center gap-1"
            >
              <RefreshCw className="w-4 h-4" />
              Retake practice
            </button>
            <button
              onClick={onExit}
              className="px-5 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-all cursor-pointer"
            >
              Continue to Library
            </button>
          </div>
        </div>
      ) : (
        /* Card studying views */
        <div className="space-y-6">
          {/* Practice toggle mode */}
          <div className="bg-slate-100 p-1 rounded-xl flex max-w-xs mx-auto border border-slate-200">
            <button
              onClick={() => setStudyAll(false)}
              className={`flex-1 py-1 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                !studyAll ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Spaced Due Only
            </button>
            <button
              onClick={() => setStudyAll(true)}
              className={`flex-1 py-1 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                studyAll ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Practice All ({sessionCards.length})
            </button>
          </div>

          {/* Card Flashing Presentation Wrapper */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-400 font-mono px-1">
              <span>ACTIVE PRACTICE QUEUE</span>
              <span>
                Card {currentIndex + 1} of {sessionCards.length}
              </span>
            </div>

            {/* Flipper widget */}
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className={`min-h-[280px] w-full p-8 rounded-3xl bg-white border cursor-pointer select-none transition-all duration-300 flex flex-col justify-between items-center text-center relative overflow-hidden group shadow-xs ${
                isFlipped
                  ? "border-teal-400 shadow-md ring-1 ring-teal-400/20"
                  : "border-slate-200 hover:border-slate-350 hover:shadow-xs"
              }`}
            >
              {/* Decorative side badge */}
              <div className="absolute top-4 left-4">
                <span
                  className={`text-[9px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full ${
                    isFlipped ? "bg-teal-50 text-teal-600" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {isFlipped ? "BAck Side (Answer)" : "Front Side (Question)"}
                </span>
              </div>

              {/* Dynamic review sched info display */}
              {currentCard && (
                <div className="absolute top-4 right-4 flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                  <Calendar className="w-3.5 h-3.5" />
                  Due: {new Date(currentCard.nextReviewDate).toLocaleDateString()}
                </div>
              )}

              {/* Content text */}
              <div className="my-auto py-6 max-w-lg w-full flex items-center justify-center">
                {currentCard ? (
                  !isFlipped ? (
                    <p className="text-xl font-bold tracking-tight text-slate-800 leading-snug font-sans">
                      {currentCard.front}
                    </p>
                  ) : (
                    <div className="w-full text-left bg-slate-50 p-5 rounded-2xl border border-slate-100 max-h-[180px] overflow-y-auto">
                      <p className="text-sm text-slate-700 leading-relaxed font-sans whitespace-pre-line">
                        {currentCard.back}
                      </p>
                    </div>
                  )
                ) : (
                  <p className="text-slate-400">Loading cards...</p>
                )}
              </div>

              {/* Action tap guide */}
              <div className="text-[10px] text-indigo-400/80 font-mono animate-pulse uppercase tracking-wider flex items-center gap-1.5 pt-2">
                <RefreshCw className="w-3 h-3" />
                Click anywhere to flip and reveal
              </div>
            </div>
          </div>

          {/* SM-2 grading console */}
          {isFlipped && (
            <div className="space-y-3 bg-white border border-slate-200 p-5 rounded-3xl animate-fadeIn">
              <div className="text-center">
                <h4 className="text-xs font-bold text-slate-600 uppercase tracking-widest font-mono">
                  Grade Your Recall Quality
                </h4>
                <p className="text-[11px] text-slate-400">
                  Select how effectively you triggered this answer from memory.
                </p>
              </div>

              {/* Grading Buttons Scale */}
              <div className="grid grid-cols-6 gap-2">
                {[
                  { val: 0, title: "Blackout", desc: "No recall", color: "hover:bg-red-50 hover:border-red-400 border-slate-200 hover:text-red-700 bg-white" },
                  { val: 1, title: "Almost", desc: "Hard mistake", color: "hover:bg-orange-50 hover:border-orange-400 border-slate-200 hover:text-orange-700 bg-white" },
                  { val: 2, title: "Incorrect", desc: "Slight slip", color: "hover:bg-amber-50 hover:border-amber-400 border-slate-200 hover:text-amber-700 bg-white" },
                  { val: 3, title: "Struggle", desc: "Heavy effort", color: "hover:bg-yellow-50 hover:border-yellow-400 border-slate-200 hover:text-yellow-700 bg-white" },
                  { val: 4, title: "Hesitant", desc: "Good recall", color: "hover:bg-teal-50 hover:border-teal-400 border-slate-200 hover:text-teal-700 bg-white" },
                  { val: 5, title: "Perfect", desc: "Instant ease", color: "hover:bg-indigo-50 hover:border-indigo-400 border-slate-200 hover:text-indigo-700 bg-white" },
                ].map((grade) => (
                  <button
                    key={grade.val}
                    onClick={() => handleGradeCard(grade.val)}
                    className={`p-2.5 border rounded-2xl flex flex-col items-center justify-between transition-all cursor-pointer text-center group ${grade.color}`}
                  >
                    <span className="text-lg font-extrabold group-hover:scale-110 transition-transform">
                      {grade.val}
                    </span>
                    <span className="text-[9px] font-bold mt-1 uppercase line-clamp-1 truncate">
                      {grade.title}
                    </span>
                    <span className="text-[8px] text-slate-400 line-clamp-1">{grade.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
