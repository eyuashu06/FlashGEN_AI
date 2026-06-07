# Security Specification & Test Harness (Phase 0)

This document maps secure access invariants and outlines adversarial validation payloads (the "Dirty Dozen") to safeguard user study decks, cards, and session statistics.

## 1. Data Invariants
*   **User Identity Lock**: A user can only access, create, update, or delete profiles, decks, cards, and sessions belonging to their verified UID (`request.auth.uid`).
*   **Deck Integrity**: Cards belong securely to a parent Deck. A user cannot create or inspect cards in a deck they do not own.
*   **Immutability**: Crucial structural links (`userId`, `deckId`, `cardId`, `createdAt`) must remain untamped and unchanged during update operations.
*   **Temporal Integrity**: Timestamps (`createdAt`, `updatedAt`) must check against server-authoritative `request.time`.
*   **Data Size Boundaries**: Free-form inputs like text prompts or details are restricted in length to prevent resource exhaustion attacks.

---

## 2. The "Dirty Dozen" Vulnerability Payloads

The following payloads represent malicious state transitions or illegal identity requests that must return `PERMISSION_DENIED` at the Firestore security rule boundary:

1.  **PII Blanket Scan**: Unauthenticated `get` or listing of structural user profiles.
2.  **Identity Spoofing - Profile Injection**: Attempting to register or overwrite a `user_profiles/{userId}` write where `userId` != `request.auth.uid`.
3.  **Identity Spoofing - Deck Ownership Hijack**: Creating a study deck with high card capacity where `userId` is set to a victim's user ID.
4.  **Identity Spoofing - Card Injection**: Injecting a card directly into a deck owned by another user.
5.  **Relational Orphan Write**: Attempting to create a study card without verifying that its parent deck exists in the database.
6.  **Immutable Key Tampering - Card Shuffling**: Attempting to update a card's `deckId` or `userId` to point to a different user's workspace.
7.  **Immutable Key Tampering - Retroactive Timestamps**: Attempting to change `createdAt` on an existing deck.
8.  **Status Bypass**: Overwriting study stats or streak count without doing actual card repetitions.
9.  **Denial-of-Wallet String Injection**: Attempting to write a 2MB string inside the `front` or `back` of a card to exhaust storage quotas.
10. **Malicious ID Poisoning**: Specifying an illegal, 500-character junk string as `deckId` containing non-alphanumeric paths or special system keywords.
11. **Email Verification Bypass**: Attempting to modify deck databases using a self-assigned auth context where `email_verified == false`.
12. **Client-side Query Manipulation (Scraping)**: Relying on client queries to filter cards and issuing unfiltered read requests on the `/decks` collection without proving ownership.

---

## 3. Security Rule Integration Validation (Pseudo Test Harness)

Our rules are written to structurally fail if any of these actions are executed:

```typescript
// firestore.rules.test.ts (Validation logic for security enforcement matches)
describe("RecallAI Security Rules", () => {
  it("forces absolute identity bounds on Decks", async () => {
    // Malicious write of a deck to another user's path should fail
    await assertFails(
      setDoc(doc(db, "decks", "malicious-id"), {
        deckId: "malicious-id",
        userId: "victim-uid-123",
        title: "Smuggled Deck",
        cardCount: 1,
        createdAt: serverTimestamp()
      })
    );
  });
});
```
