// src/app/flashcards/[quizName]/page.tsx
'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import FlashcardPlayer from '@/components/flashcards/FlashcardPlayer';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const availableFlashcardSets = ['applied', 'ccna']; // Define available sets

export default function FlashcardPage() {
  const params = useParams();
  const quizName = typeof params.quizName === 'string' ? params.quizName.toLowerCase() : '';

  if (!quizName || !availableFlashcardSets.includes(quizName)) {
    return (
      <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Alert variant="destructive" className="max-w-lg mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Invalid Flashcard Set</AlertTitle>
          <AlertDescription>
            The requested flashcard set &quot;{params.quizName}&quot; is not available. Please select a valid set.
          </AlertDescription>
        </Alert>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/">Go Home</Link>
        </Button>
      </div>
    );
  }

  let jsonFilename = '';
  let pageTitle = '';

  if (quizName === 'applied') {
    jsonFilename = 'flash_applied.json';
    pageTitle = 'Applied Networking Flashcards';
  } else if (quizName === 'ccna') {
    jsonFilename = 'flash_CCNA.json';
    pageTitle = 'CCNA Flashcards';
  }

  return <FlashcardPlayer quizFilename={jsonFilename} quizTitle={pageTitle} />;
}
