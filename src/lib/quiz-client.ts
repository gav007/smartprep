'use client';

import type { Question, Option, RawQuestion } from '@/types/quiz';

// Function to shuffle an array (Fisher-Yates algorithm)
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Function to normalize raw question data
export function normalizeQuestion(rawQuestion: RawQuestion, index: number): Question | null {
  if (
    !rawQuestion ||
    typeof rawQuestion.question !== 'string' ||
    typeof rawQuestion.options !== 'object' ||
    rawQuestion.options === null ||
    typeof rawQuestion.answer !== 'string' ||
    typeof rawQuestion.feedback !== 'string'
  ) {
    console.warn(`Skipping invalid question at index ${index}: Missing required fields or invalid format.`);
    return null;
  }

  const optionsArray: Option[] = Object.entries(rawQuestion.options).map(([key, label]) => ({
    key,
    label,
  }));

  if (optionsArray.length === 0) {
     console.warn(`Skipping invalid question at index ${index}: No options provided.`);
     return null;
  }

  // Validate if the answer key exists in options
  if (!optionsArray.some(opt => opt.key === rawQuestion.answer)) {
    console.warn(`Skipping invalid question at index ${index}: Answer key "${rawQuestion.answer}" not found in options.`);
    return null;
  }


  return {
    // Use a more client-friendly ID generation if needed, Date.now() might collide in rapid succession
    // Consider using index + a prefix if uniqueness per load is sufficient.
    id: `q-${index}-${Math.random().toString(36).substring(2, 9)}`,
    question: rawQuestion.question,
    options: optionsArray,
    answer: rawQuestion.answer,
    feedback: rawQuestion.feedback,
  };
}
