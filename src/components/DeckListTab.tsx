import React, { useState } from "react";
import { useFlashcards } from "../context/FlashcardContext";
import { Plus, BookOpen, Clock, AlertTriangle, Trash2, PlusCircle, FileText, Check } from "lucide-react";
import { Deck } from "../types";

interface DeckListTabProps {
  onStartStudy: (deckId: string) => void;
}

export const DeckListTab: React.FC<DeckListTabProps> = ({ onStartStudy }) => {
  const { decks, cards, createDeck, addCard, deleteDeck } = useFlashcards();

  const [showAddDeckModal, setShowAddDeckModal] = useState(false);
  const [newDeckTitle, setNewDeckTitle] = useState("");
  const [newDeckDesc, setNewDeckDesc] = useState("");

  const [showAddCardModal, setShowAddCardModal] = useState<string | null>(null); // holds deckId
  const [cardFront, setCardFront] = useState("");
  const [cardBack, setCardBack] = useState("");

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const now = new Date();

  // Helper to count due cards in a deck
  const getDueCountInDeck = (deckId: string) => {
    return cards.filter((card) => {
      const isCardInDeck = card.deckId === deckId;
      const isCardDue = new Date(card.nextReviewDate) <= now;
      return isCardInDeck && isCardDue;
    }).length;
  };

  const handleCreateDeckSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeckTitle.trim()) return;

    createDeck(newDeckTitle.trim(), newDeckDesc.trim(), "Manual Input");
    setNewDeckTitle("");
    setNewDeckDesc("");
    setShowAddDeckModal(false);
  };

  const handleAddCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAddCardModal || !cardFront.trim() || !cardBack.trim()) return;

    addCard(showAddCardModal, cardFront.trim(), cardBack.trim());
    setCardFront("");
    setCardBack("");
    setShowAddCardModal(null);
  };

  return (
    <div className="space-y-6">
      {/* Tab bar headers & manual actions */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Your Decks Library</h2>
          <p className="text-sm text-slate-500">
            Organize study materials and track scheduled spaced recall reviews.
          </p>
        </div>
        <button
          onClick={() => setShowAddDeckModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create Deck manually
        </button>
      </div>

      {/* Grid listing */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {decks.map((deck) => {
          const deckDueCount = getDueCountInDeck(deck.deckId);
          const isConfirmingDelete = confirmDeleteId === deck.deckId;

          return (
            <div
              key={deck.deckId}
              className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start gap-2 mb-2">
                  <h3 className="text-lg font-bold text-slate-800 line-clamp-1">{deck.title}</h3>
                  <span className="px-2 py-0.5 text-xs font-mono font-bold bg-slate-100 text-slate-600 rounded-full flex items-center gap-1">
                    <FileText className="w-3 h-3 text-slate-500" />
                    {deck.sourceName === "API Documentation" ? "Docs" : deck.sourceName}
                  </span>
                </div>
                <p className="text-sm text-slate-500 line-clamp-3 mb-4 h-12 leading-relaxed">
                  {deck.description || "No description provided for this study deck."}
                </p>

                <div className="flex gap-4 items-center mb-6">
                  <div className="text-xs bg-indigo-50/70 border border-indigo-100 text-indigo-700 px-3 py-1.5 rounded-xl font-medium">
                    <span className="font-extrabold mr-1">{deck.cardCount}</span> cards
                  </div>

                  {deckDueCount > 0 ? (
                    <div className="text-xs bg-rose-50 border border-rose-100 text-rose-600 px-3 py-1.5 rounded-xl font-medium flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-rose-500" />
                      <span className="font-extrabold">{deckDueCount}</span> due today
                    </div>
                  ) : (
                    <div className="text-xs bg-emerald-50 border border-emerald-100 text-emerald-600 px-3 py-1.5 rounded-xl font-medium flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      Full recall clean
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-100 mt-auto justify-between">
                <div className="flex gap-1.5">
                  <button
                    onClick={() => onStartStudy(deck.deckId)}
                    className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                    Study Now
                  </button>
                  <button
                    onClick={() => setShowAddCardModal(deck.deckId)}
                    className="px-3 py-2 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border border-slate-250 hover:border-indigo-200 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                  >
                    Add Cards
                  </button>
                </div>

                {!isConfirmingDelete ? (
                  <button
                    onClick={() => setConfirmDeleteId(deck.deckId)}
                    className="p-2 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Delete Deck"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        deleteDeck(deck.deckId);
                        setConfirmDeleteId(null);
                      }}
                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] uppercase font-mono font-bold tracking-tight cursor-pointer"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] uppercase font-mono font-bold cursor-pointer"
                    >
                      No
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {decks.length === 0 && (
          <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white space-y-3">
            <AlertTriangle className="w-10 h-10 text-slate-400 mx-auto" />
            <h4 className="text-lg font-semibold text-slate-700">No study decks in library</h4>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              Ready to learn? Generate study card decks by dropping in standard PDFs, lecture slides or notes in the "AI Generator Workspace" tab!
            </p>
          </div>
        )}
      </div>

      {/* Manual New Deck Dialog */}
      {showAddDeckModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
          <form
            onSubmit={handleCreateDeckSubmit}
            className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl border border-slate-100 relative"
          >
            <h3 className="text-lg font-bold text-slate-800 mb-1">Create New Study Deck</h3>
            <p className="text-xs text-slate-400 mb-4">Add a container deck to house flashcards manually.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">
                  Deck Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Immunology Midterm Review"
                  value={newDeckTitle}
                  onChange={(e) => setNewDeckTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">
                  Description
                </label>
                <textarea
                  placeholder="e.g., Focus areas on antigen recognition structures"
                  value={newDeckDesc}
                  onChange={(e) => setNewDeckDesc(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-indigo-500 font-medium"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-6 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddDeckModal(false)}
                className="px-4 py-2 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold cursor-pointer"
              >
                Create Deck
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add individual Card Dialog */}
      {showAddCardModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
          <form
            onSubmit={handleAddCardSubmit}
            className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl border border-slate-100"
          >
            <h3 className="text-lg font-bold text-slate-800 mb-1 font-sans">Add Card Manually</h3>
            <p className="text-xs text-slate-400 mb-4 font-mono uppercase">
              Deck Reference: {showAddCardModal}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">
                  Front Side (Question, formula or concept) *
                </label>
                <textarea
                  required
                  placeholder="The query displayed to trigger active recall..."
                  value={cardFront}
                  onChange={(e) => setCardFront(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">
                  Back Side (Core answer definition or details) *
                </label>
                <textarea
                  required
                  placeholder="Keep this precise and atomic for quick memory consolidation."
                  value={cardBack}
                  onChange={(e) => setCardBack(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-indigo-500 font-medium"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-6 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowAddCardModal(null);
                  setCardFront("");
                  setCardBack("");
                }}
                className="px-4 py-2 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold cursor-pointer"
              >
                Add Card
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
