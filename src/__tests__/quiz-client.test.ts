
import { shuffleArray, normalizeQuestion } from '../lib/quiz-client';
import type { RawQuestion } from '../types/quiz';

describe('shuffleArray', () => {
  test('should return an array of the same length', () => {
    const originalArray = [1, 2, 3, 4, 5];
    const shuffledArray = shuffleArray(originalArray);
    expect(shuffledArray.length).toBe(originalArray.length);
  });

  test('should contain the same elements as the original array', () => {
    const originalArray = [1, 2, 3, 4, 5];
    const shuffledArray = shuffleArray(originalArray);
    originalArray.forEach(item => {
      expect(shuffledArray).toContain(item);
    });
    shuffledArray.forEach(item => {
      expect(originalArray).toContain(item);
    });
  });

  test('should not be the same as the original array (usually)', () => {
    const originalArray = Array.from({ length: 50 }, (_, i) => i); // Larger array
    const shuffledArray = shuffleArray(originalArray);
    // This test might occasionally fail by chance, but it's highly unlikely for a large array
    expect(shuffledArray).not.toEqual(originalArray);
  });

  test('should handle empty arrays', () => {
    const originalArray: number[] = [];
    const shuffledArray = shuffleArray(originalArray);
    expect(shuffledArray).toEqual([]);
  });

  test('should handle arrays with one element', () => {
    const originalArray = [42];
    const shuffledArray = shuffleArray(originalArray);
    expect(shuffledArray).toEqual([42]);
  });
});


describe('normalizeQuestion', () => {
  const validRawQuestion: RawQuestion = {
    question: 'What is the capital of France?',
    options: { A: 'Berlin', B: 'Madrid', C: 'Paris', D: 'Rome' },
    answer: 'C',
    feedback: 'Paris is the capital of France.',
  };

  test('should normalize a valid raw question', () => {
    const normalized = normalizeQuestion(validRawQuestion, 0);
    expect(normalized).not.toBeNull();
    expect(normalized?.id).toMatch(/^q-0-/); // Check ID format
    expect(normalized?.question).toBe(validRawQuestion.question);
    expect(normalized?.options).toEqual([
      { key: 'A', label: 'Berlin' },
      { key: 'B', label: 'Madrid' },
      { key: 'C', label: 'Paris' },
      { key: 'D', label: 'Rome' },
    ]);
    expect(normalized?.answer).toBe('C');
    expect(normalized?.feedback).toBe(validRawQuestion.feedback);
  });

  test('should return null for missing question text', () => {
    const invalidQuestion = { ...validRawQuestion, question: undefined } as any;
    expect(normalizeQuestion(invalidQuestion, 1)).toBeNull();
  });

   test('should return null for missing options object', () => {
     const invalidQuestion = { ...validRawQuestion, options: undefined } as any;
     expect(normalizeQuestion(invalidQuestion, 1)).toBeNull();
   });

   test('should return null for empty options object', () => {
      const invalidQuestion = { ...validRawQuestion, options: {} } as RawQuestion;
      expect(normalizeQuestion(invalidQuestion, 2)).toBeNull();
   });

  test('should return null for missing answer', () => {
    const invalidQuestion = { ...validRawQuestion, answer: undefined } as any;
    expect(normalizeQuestion(invalidQuestion, 3)).toBeNull();
  });

   test('should return null for missing feedback', () => {
      const invalidQuestion = { ...validRawQuestion, feedback: undefined } as any;
      expect(normalizeQuestion(invalidQuestion, 4)).toBeNull();
   });

   test('should return null if answer key does not exist in options', () => {
      const invalidQuestion = { ...validRawQuestion, answer: 'E' } as RawQuestion;
      expect(normalizeQuestion(invalidQuestion, 5)).toBeNull();
   });

    test('should handle optional "type" field gracefully', () => {
      const rawWithType: RawQuestion = {
        type: "MC",
        ...validRawQuestion,
      };
      const normalized = normalizeQuestion(rawWithType, 6);
      expect(normalized).not.toBeNull();
      // Ensure 'type' field is not part of the normalized Question interface
      expect(normalized).not.toHaveProperty('type');
    });
});

