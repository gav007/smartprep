
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import OhmsLawCalculator from "@/components/calculators/OhmsLawCalculator";
import SeriesParallelResistanceCalculator from "@/components/calculators/SeriesParallelResistanceCalculator";
import ACVoltageCalculator from "@/components/calculators/ACVoltageCalculator";
import RippleVoltageCalculator from "@/components/calculators/RippleVoltageCalculator";
import PowerCalculator from "@/components/calculators/PowerCalculator";
import ResistorToleranceCalculator from "@/components/calculators/ResistorToleranceCalculator";
import OpAmpGainCalculator from "@/components/calculators/OpAmpGainCalculator";
import BJTSolver from "@/components/calculators/BJTSolver";
import { Calculator } from "lucide-react";

// Remove the old 'tools' array and link-based dashboard approach

export default function CalculatorPage() {
  return (
    <div className="flex flex-col items-center pt-10">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2">
          <Calculator className="h-8 w-8 text-primary" />
          Electronics Swiss Army Knife
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          A collection of common electronics calculation tools.
        </p>
      </div>

      {/* Grid Layout for Calculators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
        <OhmsLawCalculator />
        <PowerCalculator /> {/* Added Power Calculator */}
        <SeriesParallelResistanceCalculator />
        <ResistorToleranceCalculator /> {/* Added Tolerance Calculator */}
        <ACVoltageCalculator />
        <RippleVoltageCalculator />
        <OpAmpGainCalculator />
        <BJTSolver /> {/* Placeholder/Coming Soon Component */}
        {/* Add more calculator components here as they are created */}
      </div>

        {/* Remove the old tool selection cards */}
    </div>
  );
}
