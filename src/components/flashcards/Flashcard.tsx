// src/components/flashcards/Flashcard.tsx
'use client';

import React, { useEffect } from 'react';
import type { FlashcardData } from '@/types/flashcards';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react'; // Icon for flip hint

interface FlashcardProps {
  card: FlashcardData;
  isFlipped: boolean;
  onFlip: () => void;
}

export default function Flashcard({ card, isFlipped, onFlip }: FlashcardProps) {
  // useEffect to reset flip state when card data changes is now handled by FlashcardPlayer

  const cardContainerVariants = {
    initial: { rotateY: 0 },
    flipped: { rotateY: 180 },
  };
  
  const faceContentVariants = {
    hidden: { opacity: 0, transition: { duration: 0.1 } },
    visible: { opacity: 1, transition: { duration: 0.1, delay: 0.2 } },
  };

  return (
    <div className="w-full max-w-lg h-80 [perspective:1000px]"> {/* Tailwind class for perspective */}
      <motion.div
        className="relative w-full h-full cursor-pointer"
        style={{ transformStyle: 'preserve-3d' }}
        onClick={onFlip} // Use passed onFlip handler
        initial="initial"
        animate={isFlipped ? 'flipped' : 'initial'}
        variants={cardContainerVariants}
        transition={{ duration: 0.6 }}
      >
        {/* Front of the card */}
        <motion.div
          className="absolute w-full h-full"
          style={{ backfaceVisibility: 'hidden' }}
          variants={faceContentVariants}
          animate={!isFlipped ? "visible" : "hidden"}
        >
          <Card className="w-full h-full flex flex-col items-center justify-center p-6 shadow-xl bg-card border border-primary/20">
            <CardContent className="text-center">
              <p className="text-xl md:text-2xl font-semibold text-foreground break-words"> {/* Added break-words */}
                {card.front}
              </p>
            </CardContent>
             {!isFlipped && (
                <div className="absolute bottom-2 right-2 text-muted-foreground opacity-50 text-xs flex items-center">
                    <RefreshCw size={12} className="mr-1" /> Tap to flip
                </div>
            )}
          </Card>
        </motion.div>

        {/* Back of the card */}
        <motion.div
          className="absolute w-full h-full"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          variants={faceContentVariants}
          animate={isFlipped ? "visible" : "hidden"}
        >
          <Card className="w-full h-full flex flex-col items-center justify-center p-6 shadow-xl bg-secondary border border-accent/30">
            <CardContent className="text-center">
              <p className="text-base md:text-lg text-secondary-foreground break-words"> {/* Added break-words */}
                {card.back}
              </p>
            </CardContent>
             {isFlipped && (
                <div className="absolute bottom-2 right-2 text-muted-foreground opacity-50 text-xs flex items-center">
                    <RefreshCw size={12} className="mr-1" /> Tap to flip
                </div>
            )}
          </Card>
        </motion.div>
      </motion.div>
      {/* "Flip Card" button is removed from here, will be in FlashcardPlayer controls */}
    </div>
  );
}
