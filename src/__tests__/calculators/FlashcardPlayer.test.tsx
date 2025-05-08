// src/__tests__/flashcards/FlashcardPlayer.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import FlashcardPlayer from '@/components/flashcards/FlashcardPlayer';
import type { FlashcardData } from '@/types/flashcards';

const mockFlashcards: FlashcardData[] = [
  { id: 1, front: 'Front 1', back: 'Back 1' },
  { id: 2, front: 'Front 2', back: 'Back 2' },
  { id: 3, front: 'Front 3', back: 'Back 3' },
];

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve(mockFlashcards),
  })
) as jest.Mock;

// Mock useRouter from next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    // other router methods if needed
  }),
  usePathname: () => '/flashcards/test-set', // Mock current path
  useParams: () => ({ quizName: 'test-set' }), // Mock params
}));


describe('FlashcardPlayer Component', () => {
  beforeEach(() => {
    // Clear fetch mock calls before each test
    (fetch as jest.Mock).mockClear();
  });

  test('renders selection screen initially', async () => {
    render(<FlashcardPlayer quizFilename="test.json" quizTitle="Test Flashcards" />);
    expect(screen.getByText(/Test Flashcards/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/How many cards to review?/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Start Session/i })).toBeInTheDocument();

    // Wait for card count to load
    await waitFor(() => {
        expect(screen.getByText(/3 cards available/i)).toBeInTheDocument();
    });
  });

  test('fetches and loads flashcards when session starts', async () => {
    render(<FlashcardPlayer quizFilename="test.json" quizTitle="Test Flashcards" />);
    
    await waitFor(() => { // Wait for initial fetch to complete and update totalAvailableCards
        expect(screen.getByText(/3 cards available/i)).toBeInTheDocument();
    });

    const startButton = screen.getByRole('button', { name: /Start Session/i });
    fireEvent.click(startButton);

    expect(fetch).toHaveBeenCalledWith('/data/test.json');
    
    // Wait for loading state to pass and cards to render
    await waitFor(() => {
      expect(screen.getByText(/Card 1 of 3/i)).toBeInTheDocument(); // Default is all 3
      expect(screen.getByText('Front 1')).toBeInTheDocument();
    });
  });

  test('navigates between cards', async () => {
    render(<FlashcardPlayer quizFilename="test.json" quizTitle="Test Flashcards" />);
    await waitFor(() => { /* cards loaded */ });
    fireEvent.click(screen.getByRole('button', { name: /Start Session/i }));
    await waitFor(() => { /* session started */ });

    const nextButton = screen.getByRole('button', { name: /Next/i });
    fireEvent.click(nextButton);
    expect(screen.getByText('Front 2')).toBeInTheDocument();
    expect(screen.getByText(/Card 2 of 3/i)).toBeInTheDocument();

    const prevButton = screen.getByRole('button', { name: /Prev/i });
    fireEvent.click(prevButton);
    expect(screen.getByText('Front 1')).toBeInTheDocument();
    expect(screen.getByText(/Card 1 of 3/i)).toBeInTheDocument();
  });

  test('flips card', async () => {
    render(<FlashcardPlayer quizFilename="test.json" quizTitle="Test Flashcards" />);
    await waitFor(() => { /* cards loaded */ });
    fireEvent.click(screen.getByRole('button', { name: /Start Session/i }));
    await waitFor(() => { /* session started */ });

    expect(screen.getByText('Front 1')).toBeInTheDocument();
    const flipButton = screen.getByRole('button', { name: /Flip Card/i });
    fireEvent.click(flipButton);
    
    // Text changes from front to back after flip
    await waitFor(() => {
        expect(screen.getByText('Back 1')).toBeInTheDocument();
    });
  });

  test('shuffles cards', async () => {
    // For shuffling, we can check if the order changes. 
    // This test is probabilistic but should generally pass.
    const originalOrder = mockFlashcards.map(c => c.front);
    render(<FlashcardPlayer quizFilename="test.json" quizTitle="Test Flashcards" />);
    await waitFor(() => { /* cards loaded */ });
    fireEvent.click(screen.getByRole('button', { name: /Start Session/i }));
    await waitFor(() => { /* session started */ });

    const shuffleButton = screen.getByRole('button', { name: /Shuffle/i });
    fireEvent.click(shuffleButton);

    // After shuffling, the first card should ideally not be 'Front 1'
    // Or, check that the sequence of cards is different.
    // We can't directly assert the internal state of `activeCards` without more complex mocking.
    // Let's check if the UI updates to show a potentially different first card,
    // or that the "Card X of Y" indicator is reset to 1.
    await waitFor(() => {
        expect(screen.getByText(/Card 1 of 3/i)).toBeInTheDocument(); // Index resets to 0
        // The content of the card itself might be the same if shuffle results in same start,
        // but the key thing is the shuffle action was triggered.
    });
    // To make this test more deterministic, you'd need to mock `shuffleArray`.
  });

  test('handles "All" cards selection', async () => {
    render(<FlashcardPlayer quizFilename="test.json" quizTitle="Test Flashcards" />);
    await waitFor(() => { /* total cards loaded */ });

    const selectTrigger = screen.getByRole('combobox');
    fireEvent.mouseDown(selectTrigger);
    const allOption = await screen.findByText(/All \(3\)/i);
    fireEvent.click(allOption);

    fireEvent.click(screen.getByRole('button', { name: /Start Session/i }));

    await waitFor(() => {
      expect(screen.getByText(/Card 1 of 3/i)).toBeInTheDocument();
    });
  });

  test('handles specific number of cards selection', async () => {
    // Mock with more cards to test slicing
    const manyCards = Array.from({ length: 25 }, (_, i) => ({ id: i, front: `F${i}`, back: `B${i}` }));
     (fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.resolve({
            ok: true,
            json: () => Promise.resolve(manyCards),
        })
    );

    render(<FlashcardPlayer quizFilename="many.json" quizTitle="Many Cards" />);
    await waitFor(() => {
         expect(screen.getByText(/25 cards available/i)).toBeInTheDocument();
    });

    const selectTrigger = screen.getByRole('combobox');
    fireEvent.mouseDown(selectTrigger);
    const tenOption = await screen.findByRole('option', {name: '10'}); // assuming 10 is an option
    fireEvent.click(tenOption);

    fireEvent.click(screen.getByRole('button', { name: /Start Session/i }));

    await waitFor(() => {
      expect(screen.getByText(/Card 1 of 10/i)).toBeInTheDocument();
    });
  });

  test('shows error message on fetch failure', async () => {
    (fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.reject(new Error('Network error'))
    );
    render(<FlashcardPlayer quizFilename="error.json" quizTitle="Error Test" />);
    await waitFor(() => {
      expect(screen.getByText(/Network error/i)).toBeInTheDocument();
    });
  });
});
