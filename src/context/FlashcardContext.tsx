import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  User, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  getDocs, 
  writeBatch 
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { Deck, Card, UserProfile, StudySession } from "../types";
import { calculateSM2 } from "../utils/sm2";

// Mandatory Error Handling schemas from Firestore skill section 3
export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
    },
    operationType,
    path
  };
  console.error("Firestore Permission/Quota Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface FlashcardContextType {
  user: User | null;
  authLoading: boolean;
  decks: Deck[];
  cards: Card[];
  profile: UserProfile | null;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  createDeck: (title: string, description: string, sourceName?: string) => Promise<Deck>;
  addCard: (deckId: string, front: string, back: string) => Promise<Card>;
  deleteDeck: (deckId: string) => Promise<void>;
  updateCardGrade: (cardId: string, grade: number) => Promise<{ interval: number; nextReviewDate: string }>;
  generateAIDeck: (
    title: string,
    description: string,
    contentText: string,
    cardCount: number
  ) => Promise<Deck>;
  addStudySession: (deckId: string, cardsReviewed: number, correctAnswers: number) => Promise<void>;
}

const FlashcardContext = createContext<FlashcardContextType | undefined>(undefined);

export const FlashcardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Authentication observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Authenticated - load from Firestore
        await syncUserInitialData(currentUser);
      } else {
        // Logged out - reset content states
        setDecks([]);
        setCards([]);
        setProfile(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch / register user profiles & fetch corresponding study elements
  const syncUserInitialData = async (activeUser: User) => {
    try {
      const profileRef = doc(db, "user_profiles", activeUser.uid);
      let profileSnap;
      try {
        profileSnap = await getDoc(profileRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `user_profiles/${activeUser.uid}`);
        return;
      }

      let currentProfile: UserProfile;

      if (!profileSnap.exists()) {
        // New User - register profile doc
        currentProfile = {
          userId: activeUser.uid,
          email: activeUser.email || "student@recall.ai",
          createdAt: new Date().toISOString(),
          streakCount: 0,
          lastStudyDate: "",
        };
        try {
          await setDoc(profileRef, currentProfile);
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `user_profiles/${activeUser.uid}`);
        }
      } else {
        currentProfile = profileSnap.data() as UserProfile;
      }
      setProfile(currentProfile);

      // Fetch study decks
      await fetchUserStudyMaterials(activeUser.uid);
    } catch (error) {
      console.error("Initialization Sync Error:", error);
    }
  };

  const fetchUserStudyMaterials = async (uid: string) => {
    const pathForDecks = "decks";
    try {
      const decksQuery = query(collection(db, pathForDecks), where("userId", "==", uid));
      const deckSnaps = await getDocs(decksQuery);
      const userDecks: Deck[] = [];
      const userCards: Card[] = [];

      for (const deckDoc of deckSnaps.docs) {
        const deckData = deckDoc.data() as Deck;
        userDecks.push(deckData);

        // Fetch cards inside this deck subcollection
        const cardsPath = `decks/${deckData.deckId}/cards`;
        try {
          const cardsSnap = await getDocs(collection(db, cardsPath));
          cardsSnap.forEach((cardDoc) => {
            userCards.push(cardDoc.data() as Card);
          });
        } catch (cardErr) {
          handleFirestoreError(cardErr, OperationType.LIST, cardsPath);
        }
      }

      setDecks(userDecks);
      setCards(userCards);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, pathForDecks);
    }
  };

  // Google sign in wrapper
  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Google Authenticate Pop-up Refused:", error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Logout Error:", err);
    }
  };

  // Create physical Firestore document in /decks/{deckId}
  const createDeck = async (title: string, description: string, sourceName = "Manual Entry"): Promise<Deck> => {
    if (!user) throw new Error("No active authenticated workspace.");

    const deckId = "deck_" + Math.random().toString(36).substring(2, 11);
    const newDeck: Deck = {
      deckId,
      userId: user.uid,
      title,
      description,
      cardCount: 0,
      sourceName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const pathForDeck = `decks/${deckId}`;
    try {
      await setDoc(doc(db, "decks", deckId), newDeck);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, pathForDeck);
    }
    console.log("Current user:", auth.currentUser?.uid);
    console.log("New deck:", newDeck);
    setDecks((prev) => [newDeck, ...prev]);
    return newDeck;
  };

  // Add Card document into the /decks/{deckId}/cards/{cardId} subcollection
  const addCard = async (deckId: string, front: string, back: string): Promise<Card> => {
    if (!user) throw new Error("No active authenticated session.");

    const cardId = "card_" + Math.random().toString(36).substring(2, 11);
    const newCard: Card = {
      cardId,
      deckId,
      userId: user.uid,
      front,
      back,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      repetition: 0,
      interval: 0,
      efactor: 2.5,
      nextReviewDate: new Date().toISOString(),
    };

    const cardPath = `decks/${deckId}/cards/${cardId}`;
    try {
      await setDoc(doc(db, "decks", deckId, "cards", cardId), newCard);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, cardPath);
    }

    // Increment Deck count synchronously
    const localDeck = decks.find((d) => d.deckId === deckId);
    if (localDeck) {
      const updatedCount = localDeck.cardCount + 1;
      const deckPath = `decks/${deckId}`;
      try {
        await updateDoc(doc(db, "decks", deckId), {
          cardCount: updatedCount,
          updatedAt: new Date().toISOString()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, deckPath);
      }

      setDecks((prev) =>
        prev.map((d) => (d.deckId === deckId ? { ...d, cardCount: updatedCount, updatedAt: new Date().toISOString() } : d))
      );
    }

    setCards((prev) => [...prev, newCard]);
    return newCard;
  };

  // Delete Deck and also nested cards records
  const deleteDeck = async (deckId: string): Promise<void> => {
    if (!user) return;

    // First, delete deck document
    const deckDocRef = doc(db, "decks", deckId);
    try {
      await deleteDoc(deckDocRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `decks/${deckId}`);
    }

    // Attempt subcollection cleanups
    const deckCards = cards.filter((c) => c.deckId === deckId);
    for (const card of deckCards) {
      const cardRef = doc(db, "decks", deckId, "cards", card.cardId);
      try {
        await deleteDoc(cardRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `decks/${deckId}/cards/${card.cardId}`);
      }
    }

    setDecks((prev) => prev.filter((d) => d.deckId !== deckId));
    setCards((prev) => prev.filter((c) => c.deckId !== deckId));
  };

  // Sm2 recall scoring schedules updater on subcollections
  const updateCardGrade = async (cardId: string, grade: number) => {
    if (!user) throw new Error("No authenticated session.");

    const cardRefLocal = cards.find((c) => c.cardId === cardId);
    if (!cardRefLocal) throw new Error("Target card not found.");

    const sm2Result = calculateSM2(
      grade,
      cardRefLocal.repetition,
      cardRefLocal.interval,
      cardRefLocal.efactor
    );

    const cardDocRef = doc(db, "decks", cardRefLocal.deckId, "cards", cardId);
    const updatedCardFields = {
      repetition: sm2Result.repetition,
      interval: sm2Result.interval,
      efactor: sm2Result.efactor,
      nextReviewDate: sm2Result.nextReviewDate,
      updatedAt: new Date().toISOString(),
    };

    try {
      await updateDoc(cardDocRef, updatedCardFields);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `decks/${cardRefLocal.deckId}/cards/${cardId}`);
    }

    setCards((prev) =>
      prev.map((c) => (c.cardId === cardId ? { ...c, ...updatedCardFields } : c))
    );

    return {
      interval: sm2Result.interval,
      nextReviewDate: sm2Result.nextReviewDate,
    };
  };

  // Ingest notes context and trigger server-side Gemini active-recall flashcard extraction
  const generateAIDeck = async (
    title: string,
    description: string,
    contentText: string,
    cardCount: number
  ): Promise<Deck> => {
    if (!user) throw new Error("Authenticate to generate cards.");

    const response = await fetch("/api/generate-cards", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        description,
        contentText,
        cardCount,
      }),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      throw new Error(data.error || "Failed to generate study pack.");
    }

    const { cards: aiCards } = data as { cards: Array<{ front: string; back: string }> };

    if (!Array.isArray(aiCards) || aiCards.length === 0) {
      throw new Error("Pristine study cards could not be generated. Please supply cohesive text.");
    }

    // 1. Write the Deck document
    const deckId = "deck_" + Math.random().toString(36).substring(2, 11);
    const newDeck: Deck = {
      deckId,
      userId: user.uid,
      title,
      description,
      cardCount: aiCards.length,
      sourceName: "AI Extracted Material",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, "decks", deckId), newDeck);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `decks/${deckId}`);
    }

    // 2. Batched write the Card documents in subcollection
    const batch = writeBatch(db);
    const parsedCards: Card[] = [];

    aiCards.forEach((c, idx) => {
      const cardId = `card_${deckId}_${idx}_${Math.random().toString(36).substring(2, 6)}`;
      const cardPayload: Card = {
        cardId,
        deckId,
        userId: user.uid,
        front: c.front,
        back: c.back,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        repetition: 0,
        interval: 0,
        efactor: 2.5,
        nextReviewDate: new Date().toISOString(),
      };

      const nestedDocRef = doc(db, "decks", deckId, "cards", cardId);
      batch.set(nestedDocRef, cardPayload);
      parsedCards.push(cardPayload);
    });

    try {
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `decks/${deckId}/cards`);
    }

    setDecks((prev) => [newDeck, ...prev]);
    setCards((prev) => [...prev, ...parsedCards]);

    return newDeck;
  };

  // Register local gamified streak tracking
  const addStudySession = async (deckId: string, cardsReviewed: number, correctAnswers: number) => {
    if (!user || !profile || cardsReviewed < 1) return;

    // Save session record
    const sessionId = "session_" + Math.random().toString(36).substring(2, 11);
    const sessionPayload: StudySession = {
      sessionId,
      userId: user.uid,
      deckId,
      startTime: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      endTime: new Date().toISOString(),
      cardsReviewed,
      correctAnswers,
    };

    try {
      await setDoc(doc(db, "study_sessions", sessionId), sessionPayload);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `study_sessions/${sessionId}`);
    }

    // Streak increment calculations on Profile
    if (cardsReviewed >= 5) {
      const todayISO = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
      const lastISO = profile.lastStudyDate;

      let nextStreak = profile.streakCount;

      if (lastISO !== todayISO) {
        if (!lastISO) {
          nextStreak = 1;
        } else {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayISO = yesterday.toISOString().split("T")[0];

          if (lastISO === yesterdayISO) {
            nextStreak += 1;
          } else {
            nextStreak = 1; // broken streak reset
          }
        }

        // Sync Profile changes directly to Firestore
        const profileUpdate = {
          streakCount: nextStreak,
          lastStudyDate: todayISO,
        };

        try {
          await updateDoc(doc(db, "user_profiles", user.uid), profileUpdate);
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `user_profiles/${user.uid}`);
        }

        setProfile((prev) => prev ? { ...prev, ...profileUpdate } : null);
      }
    }
  };

  return (
    <FlashcardContext.Provider
      value={{
        user,
        authLoading,
        decks,
        cards,
        profile,
        loginWithGoogle,
        logout,
        createDeck,
        addCard,
        deleteDeck,
        updateCardGrade,
        generateAIDeck,
        addStudySession,
      }}
    >
      {children}
    </FlashcardContext.Provider>
  );
};

export const useFlashcards = () => {
  const context = useContext(FlashcardContext);
  if (!context) {
    throw new Error("useFlashcards must be used within a FlashcardProvider");
  }
  return context;
};
