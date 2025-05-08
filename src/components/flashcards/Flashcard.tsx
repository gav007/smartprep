// src/components/flashcards/Flashcard.tsx
'use client';

import React, { useState, useEffect } from 'react';
import type { FlashcardData } from '@/types/flashcards';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CornerDownLeft, CornerDownRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FlashcardProps {
  card: FlashcardData;
}

export default function Flashcard({ card }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  // Reset flip state when card data changes
  useEffect(() => {
    setIsFlipped(false);
  }, [card]);

  const cardContainerVariants = {
    initial: { rotateY: 0 },
    flipped: { rotateY: 180 },
  };
  
  // Variants for the content wrapper of each face to control opacity after flip.
  // This helps avoid text being visible during the flip itself.
  const faceContentVariants = {
    hidden: { opacity: 0, transition: { duration: 0.1 } }, // Fast hide
    visible: { opacity: 1, transition: { duration: 0.1, delay: 0.2 } }, // Delay appearance slightly after flip animation starts
  };


  return (
    <div className="w-full max-w-lg h-80" style={{ perspective: '1000px' }}>
      <motion.div
        className="relative w-full h-full cursor-pointer"
        style={{ transformStyle: 'preserve-3d' }}
        onClick={() => setIsFlipped(!isFlipped)}
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
              <p className="text-xl md:text-2xl font-semibold text-foreground">
                {card.front}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Back of the card */}
        {/* The back face is rotated 180deg initially to be hidden. 
            The main animation on motion.div will rotate the entire container. */}
        <motion.div
          className="absolute w-full h-full"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          variants={faceContentVariants}
          animate={isFlipped ? "visible" : "hidden"}
        >
          <Card className="w-full h-full flex flex-col items-center justify-center p-6 shadow-xl bg-secondary border border-accent/30">
            <CardContent className="text-center">
              <p className="text-base md:text-lg text-secondary-foreground">
                {card.back}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <div className="flex justify-center mt-4">
        <Button variant="outline" onClick={(e) => { e.stopPropagation(); setIsFlipped(!isFlipped); }} aria-label="Flip card">
          {isFlipped ? <CornerDownRight className="mr-2 h-4 w-4" /> : <CornerDownLeft className="mr-2 h-4 w-4" />}
          Flip Card
        </Button>
      </div>
    </div>
  );
}

