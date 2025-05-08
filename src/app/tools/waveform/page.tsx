// src/app/tools/waveform/page.tsx
'use client';

import React from 'react';
import WaveformGenerator from '@/components/waveform/WaveformGenerator';
import CalculatorCard from '@/components/calculators/CalculatorCard'; 
import { Waves } from 'lucide-react'; 

export default function WaveformPage() {
  return (
    <CalculatorCard
      title="Interactive Waveform Viewer"
      description="Generate and visualize Sine, Square, Triangle, and Sawtooth waveforms. Adjust parameters to see real-time changes up to 1 MHz."
      icon={Waves} 
      className="w-full max-w-5xl mx-auto" // Increased max-width for better plot visibility
    >
      <WaveformGenerator />
    </CalculatorCard>
  );
}
