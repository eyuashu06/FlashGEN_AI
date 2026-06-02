import React, { useState } from "react";
import { FlashcardProvider, useFlashcards } from "./context/FlashcardContext";
import { StatsOverview } from "./components/StatsOverview";
import { DeckListTab } from "./components/DeckListTab";
import { GenerateDeckTab } from "./components/GenerateDeckTab";
import { StudySessionTab } from "./components/StudySessionTab";
import { 
  Brain, 
  Sparkles, 
  BookOpen, 
  Flame, 
  User, 
  Info, 
  ArrowRight, 
  LogOut, 
  ShieldCheck, 
  Cpu, 
  ArrowUpRight 
} from "lucide-react";

function AppContent() {
  const { 
    user, 
    authLoading, 
    profile, 
    cards, 
    loginWithGoogle, 
    logout 
  } = useFlashcards();

  const [activeTab, setActiveTab] = useState<"library" | "generate">("library");
  const [activeStudyDeckId, setActiveStudyDeckId] = useState<string | null>(null);

  const now = new Date();
  const totalDueCount = cards.filter((card) => new Date(card.nextReviewDate) <= now).length;

  // 1. Loading State
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="relative w-12 h-12 mb-4">
          <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-sm font-semibold text-slate-500 font-mono tracking-widest uppercase">
          Restoring Space recall states...
        </p>
      </div>
    );
  }

  // 2. Unauthenticated State (Landing screen with Google login)
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col justify-between selection:bg-indigo-100">
        {/* Welcome Header */}
        <header className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-sm">
              <Brain className="w-5.5 h-5.5" />
            </div>
            <div>
              <span className="text-lg font-black text-slate-900 tracking-tight block leading-tight">
                RecallAI
              </span>
              <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">
                SM-2 Active Learning
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <span>DATABASE ENABLED</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>
        </header>

        {/* Hero Section with balanced negative space */}
        <main className="max-w-4xl mx-auto px-4 py-12 sm:py-20 text-center space-y-10">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold rounded-full uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500 fill-indigo-500" />
              Secure Cognitive Flashcard Extraction
            </span>
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Master complex topics with <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-teal-500">spaced repetition</span>.
            </h1>
            <p className="text-md sm:text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
              Drop study notes, outlines, or textbook PDFs into our intelligence extraction workspace. We'll automatically build active-recall decks backed by secure Firestore databases.
            </p>
          </div>

          {/* Core App Features Display */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left max-w-3xl mx-auto">
            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-3xs space-y-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Brain className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">SuperMemo-2 Scaling</h3>
              <p className="text-xs text-slate-400 leading-normal">
                Optimized reviews scheduled according to retention difficulty logs.
              </p>
            </div>

            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-3xs space-y-2">
              <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">Zero-Trust Rules</h3>
              <p className="text-xs text-slate-400 leading-normal">
                Your flashcard collections remain secure with private owner keys in Cloud Firestore.
              </p>
            </div>

            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-3xs space-y-2">
              <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center text-rose-500">
                <Flame className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">Consistent Streaks</h3>
              <p className="text-xs text-slate-400 leading-normal">
                Build study consistency habits with cloud gamified streak calendar metrics.
              </p>
            </div>
          </div>

          {/* Action Trigger button */}
          <div className="pt-2">
            <button
              onClick={loginWithGoogle}
              className="inline-flex items-center gap-2.5 px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer group"
            >
              Sign In with Google
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="text-[11px] text-slate-400 mt-3 font-mono">
              Secure Cloud authentication popup. No credit cards required.
            </p>
          </div>
        </main>

        <footer className="h-16 py-4 text-center text-xs text-slate-400 border-t border-slate-100 flex items-center justify-center">
          <p>© 2026 RecallAI. Developed with server-side Google Gemini models.</p>
        </footer>
      </div>
    );
  }

  // 3. Authenticated Workspace
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-indigo-100">
      {/* Top Main Navigation Bar */}
      <header className="sticky top-0 bg-white/85 backdrop-blur-md border-b border-slate-200/80 z-10 shadow-3xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo Brand */}
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-xs text-white">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-black text-slate-900 tracking-tight block leading-tight font-sans">
                RecallAI
              </span>
              <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">
                SM-2 Spaced Recall
              </span>
            </div>
          </div>

          {/* Nav Links */}
          {!activeStudyDeckId && (
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setActiveTab("library")}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${
                  activeTab === "library"
                    ? "bg-white text-slate-900 font-extrabold shadow-sm"
                    : "text-slate-500 hover:text-slate-850"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                Library
                {totalDueCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-rose-500 text-white rounded-full text-[9px] font-extrabold animate-pulse">
                    {totalDueCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("generate")}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${
                  activeTab === "generate"
                    ? "bg-white text-slate-900 font-extrabold shadow-sm"
                    : "text-slate-500 hover:text-slate-850"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                AI Generator
              </button>
            </div>
          )}

          {/* Profile pill info & Logout */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-slate-800 truncate max-w-[150px]">
                {profile?.email || user.email}
              </span>
              <span className="text-[9px] text-slate-400 font-mono uppercase tracking-tight">
                Recall Strategist
              </span>
            </div>
            
            <button
              onClick={logout}
              className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeStudyDeckId ? (
          /* Active Interactive slide player study tab */
          <StudySessionTab
            deckId={activeStudyDeckId}
            onExit={() => {
              setActiveStudyDeckId(null);
              setActiveTab("library");
            }}
          />
        ) : (
          /* Main application stats dashboard + tab selectors */
          <div className="space-y-6">
            {/* Metric widgets block */}
            <StatsOverview />

            {/* Quick alert helper details */}
            <div className="bg-blue-50 border border-blue-100 p-3.5 rounded-2xl flex items-start gap-2.5 text-slate-700">
              <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
              <p className="text-xs leading-relaxed font-sans font-medium text-slate-600">
                <span className="font-bold text-slate-800">Spacing Science Tip:</span> Cards scored <span className="font-extrabold text-slate-800">3</span> difficulty or higher are successfully review-scheduled for spaced multiplication intervals. Anything less than <span className="font-extrabold text-slate-800">3</span> resets repetition cycles and schedules reviews immediately for tomorrow to ensure retention. All your modifications sync in real time with Cloud Firestore.
              </p>
            </div>

            {/* Content Tabs switcher */}
            {activeTab === "library" ? (
              <DeckListTab onStartStudy={(deckId) => setActiveStudyDeckId(deckId)} />
            ) : (
              <GenerateDeckTab
                onDeckGenerated={(deckId) => {
                  setActiveStudyDeckId(deckId); // Open flashcards study session directly
                }}
              />
            )}
          </div>
        )}
      </main>

      {/* Static Humanized Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-16 text-center text-xs text-slate-400 font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 RecallAI. Cognitive spaced active-recall engine.</p>
          <div className="flex gap-4 font-mono text-[10px] uppercase">
            <span className="flex items-center gap-1">
              Cloud Status: <b className="text-emerald-500">● Synced</b>
            </span>
            <span>|</span>
            <span>Google AI Studio Powered</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <FlashcardProvider>
      <AppContent />
    </FlashcardProvider>
  );
}
