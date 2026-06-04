import React from "react";
import { useFlashcards } from "../context/FlashcardContext";
import { Flame, Award, BookOpen, Clock, Calendar, CheckSquare } from "lucide-react";

export const StatsOverview: React.FC = () => {
  const { decks, cards, profile } = useFlashcards();

  const now = new Date();

  // Due details
  const dueCards = cards.filter((card) => {
    return new Date(card.nextReviewDate) <= now;
  });

  // Learned details (repetition count > 0)
  const learnedCards = cards.filter((card) => card.repetition > 0);
  const newCardsCount = cards.length - learnedCards.length;

  // Average easiness factor
  const avgEF =
    cards.length > 0
      ? (cards.reduce((sum, card) => sum + card.efactor, 0) / cards.length).toFixed(2)
      : "2.50";

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {/* Dynamic Daily Streak */}
      <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 text-white shadow-sm flex items-center justify-between">
        <div>
          <span className="text-amber-100 text-xs font-semibold uppercase tracking-wider block mb-1">
            Daily Study Streak
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold tracking-tight">
              {profile ? profile.streakCount : 0}
            </span>
            <span className="text-sm font-medium text-amber-100">days</span>
          </div>
          <p className="text-xs text-amber-100/90 mt-2 font-mono">
            {profile && profile.lastStudyDate ? `Last: ${profile.lastStudyDate}` : "Start studying today!"}
          </p>
        </div>
        <div className="p-3 bg-white/10 rounded-xl relative overflow-hidden backdrop-blur-sm animate-pulse">
          <Flame className="w-8 h-8 text-amber-100 fill-amber-100" />
        </div>
      </div>

      {/* Due reviews status card */}
      <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-sm flex items-center justify-between">
        <div>
          <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block mb-1">
            Reviews Due
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold tracking-tight text-teal-400">
              {dueCards.length}
            </span>
            <span className="text-sm font-medium text-slate-400">cards</span>
          </div>
          <p className="text-xs text-slate-400 mt-2 flex items-center gap-1 font-mono">
            <Clock className="w-3.5 h-3.5 text-teal-400" />
            Needs cognitive refresh
          </p>
        </div>
        <div className="p-3 bg-slate-800 rounded-xl">
          <Clock className="w-8 h-8 text-teal-400" />
        </div>
      </div>

      {/* Total Library */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block mb-1">
            Total Flashcards
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold tracking-tight text-slate-900">
              {cards.length}
            </span>
            <span className="text-sm font-medium text-slate-500">
              in {decks.length} {decks.length === 1 ? "deck" : "decks"}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block"></span>
            <span className="text-xs text-slate-500">{learnedCards.length} reviewable</span>
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500 inline-block"></span>
            <span className="text-xs text-slate-500">{newCardsCount} unstudied</span>
          </div>
        </div>
        <div className="p-3 bg-slate-50 rounded-xl">
          <BookOpen className="w-8 h-8 text-indigo-500" />
        </div>
      </div>

      {/* Mastery index card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block mb-1">
            Recall Mastery Index
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold tracking-tight text-emerald-600">
              {avgEF}
            </span>
            <span className="text-sm font-medium text-emerald-600/80">EF</span>
          </div>
          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1 font-mono">
            <Award className="w-3.5 h-3.5 text-emerald-500" />
            Cognitive ease scaling
          </p>
        </div>
        <div className="p-3 bg-slate-50 rounded-xl">
          <Award className="w-8 h-8 text-emerald-500" />
        </div>
      </div>
    </div>
  );
};
