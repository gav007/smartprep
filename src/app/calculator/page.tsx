
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import OhmsLawCalculator from "@/components/calculators/OhmsLawCalculator";
import SeriesParallelResistanceCalculator from "@/components/calculators/SeriesParallelResistanceCalculator";
import ACVoltageCalculator from "@/components/calculators/ACVoltageCalculator";
import RippleVoltageCalculator from "@/components/calculators/RippleVoltageCalculator";
import PowerCalculator from "@/components/calculators/PowerCalculator";
import ResistorToleranceCalculator from "@/components/calculators/ResistorToleranceCalculator";
import OpAmpGainCalculator from "@/components/calculators/OpAmpGainCalculator";
import BJTSolver from "@/components/calculators/BJTSolver";
// Resistor Color Code tool is now under /tools/resistor
import { Calculator } from "lucide-react";

export default function CalculatorPage() {
  return (
    <div className="container mx-auto px-4 py-8">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl mx-auto">
        {/* Wrap each calculator in a div with an ID for linking */}
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
