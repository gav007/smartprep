// src/app/tools/waveform/page.tsx
'use client';

import React from 'react';
import WaveformGenerator from '@/components/waveform/WaveformGenerator';
import CalculatorCard from '@/components/calculators/CalculatorCard'; 
import { Waves } from 'lucide-react'; 

export default function WaveformPage() {
  return (
    <CalculatorCard
      title="Interactive Waveform Viewer & Analyzer"
      description="Visualize and analyze Sine, Square, Triangle, and Sawtooth waveforms. Calculate key parameters like ω, T, and v(t) for exam-focused study. Supports frequencies up to 500 kHz."
      icon={Waves} 
      className="w-full max-w-5xl mx-auto" // Increased max-width for better plot visibility
    >
      <WaveformGenerator />
    </CalculatorCard>
  );
}
