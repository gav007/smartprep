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
import { Loader2, AlertTriangle, Layers, Shuffle, ChevronLeft, ChevronRight, RotateCcw, Home, RefreshCw } from 'lucide-react';
import { shuffleArray } from '@/lib/quiz-client';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

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
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCount, setSelectedCount] = useState<string>(questionCountOptions[1].toString()); // Default to 10 cards
  const [totalAvailableCards, setTotalAvailableCards] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchFlashcards() {
      setPlayerState('loading'); 
      try {
        const response = await fetch(`/data/${quizFilename}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch flashcard data (${quizFilename}): ${response.statusText}`);
        }
        const data: FlashcardData[] = await response.json();
        if (!Array.isArray(data) || data.some(card => typeof card.front !== 'string' || typeof card.back !== 'string')) {
          throw new Error('Invalid flashcard data format.');
        }
        console.log("Total cards fetched from JSON:", data.length, "for", quizFilename); // Debug log
        setAllCards(data);
        setTotalAvailableCards(data.length);
        // Automatically set selectedCount to "All" if total available is less than the default (10) or any specific option.
        // This ensures if a small deck is loaded, "All" is pre-selected if appropriate.
        if (data.length > 0 && data.length < Math.min(...questionCountOptions)) {
            setSelectedCount("All");
        } else if (data.length === 0) {
            setSelectedCount(questionCountOptions[1].toString()); // Revert to default if no cards
        }

        setPlayerState('selecting'); 
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
    const numToDisplay = Math.min(count, allCards.length); // Ensure not to exceed available
    
    const shuffledFullDeck = shuffleArray([...allCards]); // Shuffle the entire deck first
    const sessionCards = shuffledFullDeck.slice(0, numToDisplay); // Then take the slice
    setActiveCards(sessionCards); 
    console.log("Session started. Active cards count:", sessionCards.length, "Selected count:", selectedCount, "First card ID:", sessionCards[0]?.id); // Debug log

    setCurrentCardIndex(0);
    setIsCardFlipped(false); 
    setPlayerState('active');
  }, [allCards, selectedCount]);

  const handleNextCard = () => {
    if (currentCardIndex < activeCards.length - 1) {
        setCurrentCardIndex(prev => prev + 1);
        setIsCardFlipped(false); 
    }
  };

  const handlePreviousCard = () => {
    if (currentCardIndex > 0) {
        setCurrentCardIndex(prev => prev - 1);
        setIsCardFlipped(false); 
    }
  };
  
  const handleShuffle = () => {
    if (allCards.length === 0) return;

    const currentSessionSize = activeCards.length;
    if (currentSessionSize === 0) return; // Nothing to shuffle if no active cards

    let newActiveSet: FlashcardData[];

    // If "All" was selected for the session OR if the current active set is already the full deck,
    // shuffle the entire deck and use it.
    if (selectedCount === 'All' || currentSessionSize === allCards.length) {
      newActiveSet = shuffleArray([...allCards]); // Shuffle the entire deck
    } else {
      // If a specific count was selected for the session (and it's less than all available cards),
      // shuffle the entire deck and take a new random slice of the same size as the current session.
      const shuffledFullDeck = shuffleArray([...allCards]);
      newActiveSet = shuffledFullDeck.slice(0, currentSessionSize);
    }
    
    setActiveCards(newActiveSet);
    setCurrentCardIndex(0);
    setIsCardFlipped(false);
    console.log("Cards reshuffled. New first card ID:", newActiveSet[0]?.id); // Debug log
    toast({ title: "Cards Reshuffled!" });
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

  if (playerState === 'loading' && totalAvailableCards === 0) { 
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
            {totalAvailableCards === 0 && !error && playerState !== 'loading' ? ( // Show loading if fetch still in progress
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                 <p className="ml-2 text-muted-foreground">Loading card info...</p>
              </div>
            ) : (
              <>
                <p className="text-center text-muted-foreground">{totalAvailableCards} cards available.</p>
                <div className="space-y-1">
                  <Label htmlFor="card-count">How many cards to review?</Label>
                  <Select 
                    value={selectedCount} 
                    onValueChange={(value) => setSelectedCount(value)} 
                    disabled={totalAvailableCards === 0}
                  >
                    <SelectTrigger id="card-count">
                      <SelectValue placeholder="Select count" />
                    </SelectTrigger>
                    <SelectContent>
                      {questionCountOptions.map(count => (
                        // Only show option if total cards are >= count, or if it's the smallest option
                        (count <= totalAvailableCards || count === Math.min(...questionCountOptions)) && 
                        <SelectItem key={count} value={count.toString()}>{Math.min(count, totalAvailableCards)}</SelectItem>
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

  if (activeCards.length === 0 && playerState === 'active') { // Changed condition to check playerState
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
  if (!currentCard && playerState === 'active') { // Added check for playerState
    // This case might happen briefly if activeCards is being updated
    return (
        <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[60vh]">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg text-muted-foreground">Loading card...</p>
        </div>
    );
  }
  // Debug log for current card
  // console.log("Displaying card index:", currentCardIndex, "ID:", currentCard?.id, "Front:", currentCard?.front);


  return (
    <div className="container mx-auto px-4 py-8 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-2 text-center">{quizTitle}</h1>
      <p className="text-muted-foreground mb-6 text-center">Card {currentCardIndex + 1} of {activeCards.length}</p>
      
      {currentCard && <Flashcard card={currentCard} isFlipped={isCardFlipped} onFlip={handleFlipCard} />}

      <div className="flex items-center justify-center gap-2 mt-8 flex-wrap w-full max-w-lg">
        <Button variant="outline" onClick={handlePreviousCard} disabled={currentCardIndex === 0} className="flex-1 min-w-[calc(25%-0.5rem)] sm:min-w-[calc(20%-0.5rem)]">
          <ChevronLeft className="mr-1 h-5 w-5" /> Prev
        </Button>
         <Button variant="secondary" onClick={handleFlipCard} className="flex-1 min-w-[calc(25%-0.5rem)] sm:min-w-[calc(20%-0.5rem)]">
            <RefreshCw className="mr-1 h-5 w-5" /> Flip
        </Button>
        <Button variant="outline" onClick={handleShuffle} disabled={activeCards.length <= 1 && allCards.length <=1} className="flex-1 min-w-[calc(25%-0.5rem)] sm:min-w-[calc(20%-0.5rem)]">
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
