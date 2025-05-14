// src/app/tools/converter-game/page.tsx
'use client';

import React from 'react';
import ConverterGame from '@/components/tools/ConverterGame';
import CalculatorCard from '@/components/calculators/CalculatorCard';
import { Gem } from 'lucide-react'; 

export default function ConverterGamePage() {
  // Container and padding are handled by src/app/tools/layout.tsx
  return (
    <CalculatorCard
      title="Engineering Unit Converter Challenge"
      description="Test your skills converting values to various engineering notations. Score points for correct and timely answers!"
      icon={Gem} 
      className="w-full max-w-2xl mx-auto" 
    >
      <ConverterGame />
    </CalculatorCard>
  );
}