// src/components/flashcards/FlashcardPlayer.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { FlashcardData } from '@/types/flashcards';
import Flashcard from './Flashcard';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertTriangle, Layers, Shuffle, ChevronLeft, ChevronRight, RotateCcw, Home, RefreshCw } from 'lucide-react'; // Used RefreshCw for flip
import { shuffleArray } from '@/lib/quiz-client';
import Link from 'next/link';

interface FlashcardPlayerProps {
  quizFilename: string;
  quizTitle: string;
}

const questionCountOptions = [5, 10, 20];

type PlayerState = 'selecting' | 'loading' | 'active' | 'error';

export default function FlashcardPlayer({ quizFilename, quizTitle }: FlashcardPlayerProps) {
  const [playerState, setPlayerState] = useState<PlayerState>('selecting');
  const [allCards, setAllCards] = useState<FlashcardData[]>([]);
  const [activeCards, setActiveCards] = useState<FlashcardData[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false); // State for card flip
  const [error, setError] = useState<string | null>(null);
  const [selectedCount, setSelectedCount] = useState<string>(questionCountOptions[1].toString());
  const [totalAvailableCards, setTotalAvailableCards] = useState(0);

  useEffect(() => {
    async function fetchFlashcards() {
      setPlayerState('loading'); // Set loading early
      try {
        const response = await fetch(`/data/${quizFilename}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch flashcard data (${quizFilename}): ${response.statusText}`);
        }
        const data: FlashcardData[] = await response.json();
        if (!Array.isArray(data) || data.some(card => typeof card.front !== 'string' || typeof card.back !== 'string')) {
          throw new Error('Invalid flashcard data format.');
        }
        setAllCards(data);
        setTotalAvailableCards(data.length);
        setPlayerState('selecting'); // Back to selecting after loading meta
      } catch (err) {
        console.error("Failed to load flashcards:", err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        setPlayerState('error');
      }
    }
    fetchFlashcards();
  }, [quizFilename]);

  const startSession = useCallback(() => {
    if (allCards.length === 0) {
        setError("No cards available to start the session.");
        setPlayerState('error');
        return;
    }
    setPlayerState('loading');
    const count = selectedCount === 'All' ? allCards.length : parseInt(selectedCount, 10);
    const numToDisplay = Math.min(count, allCards.length);
    
    const shuffled = shuffleArray(allCards);
    setActiveCards(shuffled.slice(0, numToDisplay));
    setCurrentCardIndex(0);
    setIsCardFlipped(false); // Ensure card starts unflipped
    setPlayerState('active');
  }, [allCards, selectedCount]);

  const handleNextCard = () => {
    if (currentCardIndex < activeCards.length - 1) {
        setCurrentCardIndex(prev => prev + 1);
        setIsCardFlipped(false); // Flip back to front for next card
    }
  };

  const handlePreviousCard = () => {
    if (currentCardIndex > 0) {
        setCurrentCardIndex(prev => prev - 1);
        setIsCardFlipped(false); // Flip back to front for previous card
    }
  };
  
  const handleShuffle = () => {
    if(activeCards.length > 1) {
      setActiveCards(prev => shuffleArray([...prev]));
      setCurrentCardIndex(0);
      setIsCardFlipped(false);
    }
  };

  const handleFlipCard = () => {
    setIsCardFlipped(prev => !prev);
  };

  const handleResetSession = () => {
    setPlayerState('selecting');
    setActiveCards([]);
    setCurrentCardIndex(0);
    setIsCardFlipped(false);
  };

  if (playerState === 'loading' && totalAvailableCards === 0) { // Only show full loading if meta is not yet fetched
    return (
      <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading Flashcard Data...</p>
      </div>
    );
  }

  if (playerState === 'error') {
    return (
      <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[60vh]">
        <Alert variant="destructive" className="max-w-lg mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button asChild variant="outline" className="mt-6"><Link href="/"><Home className="mr-2 h-4 w-4"/>Go Home</Link></Button>
      </div>
    );
  }

  if (playerState === 'selecting') {
    return (
      <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center">{quizTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {totalAvailableCards === 0 && !error ? ( // Show loading spinner for card count if not error
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                 <p className="ml-2 text-muted-foreground">Loading card info...</p>
              </div>
            ) : (
              <>
                <p className="text-center text-muted-foreground">{totalAvailableCards} cards available.</p>
                <div className="space-y-1">
                  <Label htmlFor="card-count">How many cards to review?</Label>
                  <Select value={selectedCount} onValueChange={setSelectedCount} disabled={totalAvailableCards === 0}>
                    <SelectTrigger id="card-count">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {questionCountOptions.map(count => (
                        count <= totalAvailableCards && <SelectItem key={count} value={count.toString()}>{count}</SelectItem>
                      ))}
                       {totalAvailableCards > 0 && <SelectItem value="All">All ({totalAvailableCards})</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            <Button onClick={startSession} className="w-full" size="lg" disabled={totalAvailableCards === 0 || playerState === 'loading'}>
              {playerState === 'loading' && selectedCount !== '' ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : <Layers className="mr-2 h-5 w-5" />}
              Start Session
            </Button>
             <Button asChild variant="outline" className="w-full">
                 <Link href="/"><Home className="mr-2 h-4 w-4"/>Back to Home</Link>
             </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (activeCards.length === 0) { // Active state but no cards (e.g., if user selected 0 somehow or error during start)
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground mb-4">No flashcards available for this session. Please select again.</p>
        <Button onClick={handleResetSession} variant="outline">
            <RotateCcw className="mr-2 h-4 w-4"/>
            Select Again
        </Button>
      </div>
    );
  }

  const currentCard = activeCards[currentCardIndex];

  return (
    <div className="container mx-auto px-4 py-8 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-2 text-center">{quizTitle}</h1>
      <p className="text-muted-foreground mb-6 text-center">Card {currentCardIndex + 1} of {activeCards.length}</p>
      
      <Flashcard card={currentCard} isFlipped={isCardFlipped} onFlip={handleFlipCard} />

      <div className="flex items-center justify-center gap-2 mt-8 flex-wrap w-full max-w-lg">
        <Button variant="outline" onClick={handlePreviousCard} disabled={currentCardIndex === 0} className="flex-1 min-w-[calc(25%-0.5rem)] sm:min-w-[calc(20%-0.5rem)]">
          <ChevronLeft className="mr-1 h-5 w-5" /> Prev
        </Button>
         <Button variant="secondary" onClick={handleFlipCard} className="flex-1 min-w-[calc(25%-0.5rem)] sm:min-w-[calc(20%-0.5rem)]">
            <RefreshCw className="mr-1 h-5 w-5" /> Flip
        </Button>
        <Button variant="outline" onClick={handleShuffle} disabled={activeCards.length <= 1} className="flex-1 min-w-[calc(25%-0.5rem)] sm:min-w-[calc(20%-0.5rem)]">
            <Shuffle className="mr-1 h-5 w-5" /> Shuffle
        </Button>
        <Button variant="default" onClick={handleNextCard} disabled={currentCardIndex === activeCards.length - 1} className="flex-1 min-w-[calc(25%-0.5rem)] sm:min-w-[calc(20%-0.5rem)]">
          Next <ChevronRight className="ml-1 h-5 w-5" />
        </Button>
      </div>
      <Button onClick={handleResetSession} variant="ghost" className="mt-6 text-sm text-muted-foreground hover:text-primary">
        <RotateCcw className="mr-2 h-4 w-4"/>
        New Session / Select Count
      </Button>
    </div>
  );
}
