// src/app/calculator/page.tsx
'use client';

import React from 'react';
import { Card, CardContent } from "@/components/ui/card"; // Use Card for consistency if needed
import OhmsLawCalculator from "@/components/calculators/OhmsLawCalculator";
import SeriesParallelResistanceCalculator from "@/components/calculators/SeriesParallelResistanceCalculator";
import ACVoltageCalculator from "@/components/calculators/ACVoltageCalculator";
import RippleVoltageCalculator from "@/components/calculators/RippleVoltageCalculator";
import PowerCalculator from "@/components/calculators/PowerCalculator";
import ResistorToleranceCalculator from "@/components/calculators/ResistorToleranceCalculator";
import OpAmpGainCalculator from "@/components/calculators/OpAmpGainCalculator";
import BJTSolver from "@/components/calculators/BJTSolver";
import { Calculator as CalculatorIcon } from "lucide-react"; // Rename imported icon

export default function CalculatorPage() {
  // Container and padding are handled by src/app/tools/layout.tsx
  // Or add here if this page has a unique layout need
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2">
          <CalculatorIcon className="h-8 w-8 text-primary" />
          Electronics Calculators
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          A collection of common electronics calculation tools. Each tool includes its own reset button.
        </p>
      </div>

      {/* Grid Layout for Calculators - Use 1 or 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full max-w-6xl mx-auto">
        {/* Each calculator is wrapped, potentially in its own Card if CalculatorCard isn't used inside */}
        <div id="ohms">
            <OhmsLawCalculator />
        </div>
        <div id="power">
            <PowerCalculator />
        </div>
        <div id="series-parallel">
            <SeriesParallelResistanceCalculator />
        </div>
        <div id="tolerance">
            <ResistorToleranceCalculator />
        </div>
        <div id="ac-voltage">
            <ACVoltageCalculator />
        </div>
        <div id="ripple-voltage">
            <RippleVoltageCalculator />
        </div>
         <div id="op-amp">
            <OpAmpGainCalculator />
        </div>
        <div id="bjt">
            <BJTSolver />
        </div>
      </div>
    </div>
  );
}
