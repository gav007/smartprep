
'use client'; // Ensure this is a Client Component

import React from 'react'; // Import React
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import OhmsLawCalculator from "@/components/calculators/OhmsLawCalculator";
import SeriesParallelResistanceCalculator from "@/components/calculators/SeriesParallelResistanceCalculator";
import ACVoltageCalculator from "@/components/calculators/ACVoltageCalculator";
import RippleVoltageCalculator from "@/components/calculators/RippleVoltageCalculator";
import PowerCalculator from "@/components/calculators/PowerCalculator";
import ResistorToleranceCalculator from "@/components/calculators/ResistorToleranceCalculator";
import OpAmpGainCalculator from "@/components/calculators/OpAmpGainCalculator";
import BJTSolver from "@/components/calculators/BJTSolver";
import { Calculator, RotateCcw } from "lucide-react";
import { Button } from '@/components/ui/button'; // Import Button

export default function CalculatorPage() {

    // Note: A global reset would require lifting state up or using context/signals.
    // For now, each calculator manages its own state and reset.
    // A page-level "reset all" could potentially trigger reset functions on each
    // calculator if they expose such a function via refs, or by re-mounting them (less ideal).

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2">
          <Calculator className="h-8 w-8 text-primary" />
          Electronics Swiss Army Knife
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          A collection of common electronics calculation tools. Each tool includes its own reset button.
        </p>
        {/* Placeholder for a global reset if implemented later */}
        {/* <Button variant="outline" onClick={handleGlobalReset} className="mt-4">
             <RotateCcw className="mr-2 h-4 w-4" /> Reset All Calculators (Example)
         </Button> */}
      </div>

      {/* Grid Layout for Calculators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl mx-auto">
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
