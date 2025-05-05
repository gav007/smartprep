import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator } from "lucide-react";

export default function CalculatorPage() {
  return (
    <div className="flex flex-col items-center justify-center pt-10">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
           <CardTitle className="flex items-center justify-center gap-2 text-2xl font-bold">
            <Calculator className="h-7 w-7 text-primary" />
             Electronics Calculator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This section will contain various electronics calculation tools, such as a subnet calculator, binary/hex converter, waveform generator, and resistor color code calculator.
          </p>
          <p className="mt-4 font-semibold text-primary">Coming Soon!</p>
        </CardContent>
      </Card>
    </div>
  );
}
