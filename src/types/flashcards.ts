// src/types/flashcards.ts
export interface FlashcardData {
  id: number | string; // Allow string IDs if JSON uses them
  front: string;
  back: string;
}
