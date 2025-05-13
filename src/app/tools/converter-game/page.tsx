// src/app/tools/converter-game/page.tsx
'use client';

import React from 'react';
import ConverterGame from '@/components/tools/ConverterGame';
import CalculatorCard from '@/components/calculators/CalculatorCard';
import { Gem } from 'lucide-react'; // Using Gem as a placeholder icon, can be changed

export default function ConverterGamePage() {
  // Container and padding are handled by src/app/tools/layout.tsx
  return (
    <CalculatorCard
      title="Unit Converter Challenge"
      description="Test your skills converting engineering units! Score points for correct answers."
      icon={Gem} // Replace with a more fitting icon if available
      className="w-full max-w-2xl mx-auto" // Adjust width as needed
    >
      <ConverterGame />
    </CalculatorCard>
  );
}
