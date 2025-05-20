
// src/app/flashcards/[quizName]/page.tsx
'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import FlashcardPlayer from '@/components/flashcards/FlashcardPlayer';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const availableFlashcardSets = ['applied', 'ccna', 'database', 'cprogramming', 'operatingsystems', 'pythonnetworking'];

export default function FlashcardPage() {
  const params = useParams();
  // Ensure quizName is always a string and lowercase for consistent checks.
  // If params.quizName is an array (which it can be), take the first element or default.
  const rawQuizName = Array.isArray(params.quizName) ? params.quizName[0] : params.quizName;
  const quizName = typeof rawQuizName === 'string' ? rawQuizName.toLowerCase() : '';


  if (!quizName || !availableFlashcardSets.includes(quizName)) {
    return (
      <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Alert variant="destructive" className="max-w-lg mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Invalid Flashcard Set</AlertTitle>
          <AlertDescription>
            The requested flashcard set &quot;{params.quizName || 'undefined'}&quot; is not available. Please select a valid set.
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
    pageTitle = 'CCNA Concepts Flashcards';
  } else if (quizName === 'database') {
    jsonFilename = 'Flash_Database.json';
    pageTitle = 'Databases & Statistics Flashcards';
  } else if (quizName === 'cprogramming') {
    jsonFilename = 'C_flash.json';
    pageTitle = 'C Programming Language Flashcards';
  } else if (quizName === 'operatingsystems') {
    jsonFilename = 'Operating_S_Flash.json';
    pageTitle = 'Operating Systems Flashcards';
  } else if (quizName === 'pythonnetworking') {
    jsonFilename = 'python_flash.json';
    pageTitle = 'Python & Networking Flashcards';
  }
  // No need for an else here because the check above ensures quizName is valid.

  return <FlashcardPlayer quizFilename={jsonFilename} quizTitle={pageTitle} />;
}

