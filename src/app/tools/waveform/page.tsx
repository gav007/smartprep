// src/app/tools/waveform/page.tsx
'use client';

import React from 'react';
import WaveformGenerator from '@/components/waveform/WaveformGenerator';
import CalculatorCard from '@/components/calculators/CalculatorCard'; // Reusing CalculatorCard for consistent styling
import { Waves } from 'lucide-react'; // Changed to Waves

export default function WaveformPage() {
  // Container and padding are handled by src/app/tools/layout.tsx
  return (
    <CalculatorCard
      title="Interactive Waveform Viewer"
      description="Generate and visualize common electronic waveforms. Adjust parameters to see real-time changes."
      icon={Waves} // Using Waves icon
      className="w-full max-w-4xl mx-auto" // Allow more width for the graph
    >
      <WaveformGenerator />
    </CalculatorCard>
  );
}
