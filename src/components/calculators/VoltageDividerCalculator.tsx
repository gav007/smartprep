// src/components/calculators/VoltageDividerCalculator.tsx
'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AlertCircle, Sigma, RotateCcw, HelpCircle, TrendingUp, TrendingDown, Eye, EyeOff } from 'lucide-react';
import CalculatorCard from './CalculatorCard';
import CalculatorInput from './CalculatorInput';
import type { Unit } from '@/lib/units';
import {
    voltageUnitOptions,
    resistanceUnitOptions,
    unitMultipliers,
    defaultUnits,
    formatResultValue
} from '@/lib/units';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';

interface StandardResults {
  totalResistance: number | null;
  current: number | null;
  voltageDropR1: number | null;
  voltageDropR2: number | null; // This is Vout
  voutToleranceMin: number | null;
  voutToleranceMax: number | null;
}

const initialVinUnit: Unit = defaultUnits.voltage;
const initialR1Unit: Unit = 'kΩ';
const initialR2Unit: Unit = 'kΩ';

const initialVinStr = '12';
const initialR1Str = '6';
const initialR2Str = '6';

const exampleValues = [
    { vin: '12', r1: '6', r2: '6', vout: '6.00', r1Unit: 'kΩ', r2Unit: 'kΩ', desc: "R1=R2, Vout=Vin/2" },
    { vin: '5', r1: '8', r2: '5', vout: '1.923', r1Unit: 'kΩ', r2Unit: 'kΩ', desc: "R1 > R2" },
    { vin: '9', r1: '1', r2: '2', vout: '6.00', r1Unit: 'kΩ', r2Unit: 'kΩ', desc: "R1 < R2" },
];

export default function VoltageDividerCalculator() {
  const [vinStandardStr, setVinStandardStr] = useState<string>(initialVinStr);
  const [vinStandardUnit, setVinStandardUnit] = useState<Unit>(initialVinUnit);
  const [r1StandardStr, setR1StandardStr] = useState<string>(initialR1Str);
  const [r1StandardUnit, setR1StandardUnit] = useState<Unit>(initialR1Unit);
  const [r2StandardStr, setR2StandardStr] = useState<string>(initialR2Str);
  const [r2StandardUnit, setR2StandardUnit] = useState<Unit>(initialR2Unit);
  const [standardResults, setStandardResults] = useState<StandardResults | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [activeAccordionItem, setActiveAccordionItem] = useState<string | undefined>(undefined);
  const [showSteps, setShowSteps] = useState<boolean>(false);
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  const calculationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleBlur = (fieldName: string) => {
    setTouchedFields(prev => ({ ...prev, [fieldName]: true }));
    if (vinStandardStr.trim() && r1StandardStr.trim() && r2StandardStr.trim()) {
        handleCalculateStandard();
    } else if (Object.values(touchedFields).filter(Boolean).length + (touchedFields[fieldName] ? 0 : 1) >= 2 && 
               (vinStandardStr.trim() || r1StandardStr.trim() || r2StandardStr.trim()) ) {
         setError('Enter valid numbers for Vin, R1, and R2.');
    }
  };

  const loadExample = useCallback((example: typeof exampleValues[0]) => {
    setVinStandardStr(example.vin);
    setR1StandardStr(example.r1);
    setR1StandardUnit(example.r1Unit as Unit);
    setR2StandardStr(example.r2);
    setR2StandardUnit(example.r2Unit as Unit);
    setVinStandardUnit('V'); 
    setError(null);
    setStandardResults(null);
    setShowSteps(true); 
    setActiveAccordionItem("item-rt"); 
    setTouchedFields({}); 
  }, []);

  const handleCalculateStandard = useCallback(() => {
    setError(null);

    const vinVal = parseFloat(vinStandardStr);
    const r1Val = parseFloat(r1StandardStr);
    const r2Val = parseFloat(r2StandardStr);
    
    const allInputsProvided = vinStandardStr.trim() !== '' && r1StandardStr.trim() !== '' && r2StandardStr.trim() !== '';

    if (isNaN(vinVal) || isNaN(r1Val) || isNaN(r2Val)) {
        if (allInputsProvided || Object.values(touchedFields).some(Boolean)) {
             setError('Enter valid numbers for Vin, R1, and R2.');
        }
        setStandardResults(null);
        return;
    }

    const vin = vinVal * unitMultipliers[vinStandardUnit];
    const r1 = r1Val * unitMultipliers[r1StandardUnit];
    const r2 = r2Val * unitMultipliers[r2StandardUnit];

    if (r1 <= 0) { setError('R1 must be positive.'); setStandardResults(null); return; }
    if (r2 < 0) { setError('R2 must be non-negative.'); setStandardResults(null); return; }

    const totalResistance = r1 + r2;
    if (totalResistance === 0 && vin !== 0) {
        setError('Total resistance (R1 + R2) cannot be zero if Vin is non-zero.');
        setStandardResults(null);
        return;
    }

    const current = vin === 0 && totalResistance === 0 ? 0 : vin / totalResistance; 
    const voltageDropR1 = current * r1;
    const voltageDropR2 = current * r2; 

    const r1TolHigh = r1 * 1.05; const r1TolLow = r1 * 0.95;
    const r2TolHigh = r2 * 1.05; const r2TolLow = r2 * 0.95;

    let voutTolMinCalc = (r1TolHigh + r2TolLow === 0 && vin !== 0) ? -Infinity : vin * (r2TolLow / (r1TolHigh + r2TolLow));
    let voutTolMaxCalc = (r1TolLow + r2TolHigh === 0 && vin !== 0) ? Infinity : vin * (r2TolHigh / (r1TolLow + r2TolHigh));
     if (r1TolHigh + r2TolLow === 0 && vin === 0) voutTolMinCalc = 0;
     if (r1TolLow + r2TolHigh === 0 && vin === 0) voutTolMaxCalc = 0;


    setStandardResults({
      totalResistance,
      current,
      voltageDropR1,
      voltageDropR2,
      voutToleranceMin: isFinite(voutTolMinCalc) ? voutTolMinCalc : null,
      voutToleranceMax: isFinite(voutTolMaxCalc) ? voutTolMaxCalc : null,
    });
    if (showSteps && !activeAccordionItem) setActiveAccordionItem("item-rt");
  }, [vinStandardStr, vinStandardUnit, r1StandardStr, r1StandardUnit, r2StandardStr, r2StandardUnit, showSteps, activeAccordionItem, touchedFields]);


  const handleReset = useCallback(() => {
    setVinStandardStr(initialVinStr); setVinStandardUnit(initialVinUnit);
    setR1StandardStr(initialR1Str); setR1StandardUnit(initialR1Unit);
    setR2StandardStr(initialR2Str); setR2StandardUnit(initialR2Unit);
    setStandardResults(null);
    setError(null);
    setShowSteps(false);
    setActiveAccordionItem(undefined);
    setTouchedFields({});
  }, []);

  useEffect(() => {
    if (calculationTimeoutRef.current) {
        clearTimeout(calculationTimeoutRef.current);
    }
    const inputsPresent = vinStandardStr.trim() && r1StandardStr.trim() && r2StandardStr.trim();
    if (inputsPresent) {
        calculationTimeoutRef.current = setTimeout(handleCalculateStandard, 300);
    } else {
        if (standardResults) setStandardResults(null);
        const someInputExists = vinStandardStr.trim() || r1StandardStr.trim() || r2StandardStr.trim();
        const enoughFieldsTouched = Object.values(touchedFields).filter(Boolean).length >= 2;
        if (error && error.startsWith("Enter valid numbers") && !someInputExists) {
             setError(null);
        } else if (someInputExists && !inputsPresent && enoughFieldsTouched && !error?.startsWith("Enter valid numbers")) {
            // If some input exists, not all required, and enough fields touched, then set the error.
            // setError('Enter valid numbers for Vin, R1, and R2.');
        }
    }
    return () => {
        if (calculationTimeoutRef.current) {
            clearTimeout(calculationTimeoutRef.current);
        }
    };
  }, [vinStandardStr, r1StandardStr, r2StandardStr, vinStandardUnit, r1StandardUnit, r2StandardUnit, handleCalculateStandard, standardResults, error, touchedFields]);


  const formatDisplay = (value: number | null, type: 'voltage' | 'current' | 'resistance', baseUnit?: Unit) => {
    const { displayValue, unit } = formatResultValue(value, type, baseUnit);
    return value === null || !isFinite(value) ? 'N/A' : `${displayValue} ${unit}`;
  };

  const formulaPreviewStandard = `Vout = Vin * (R2 / (R1 + R2))`;

  return (
    <CalculatorCard
      title="Voltage Divider Calculator"
      description="Analyze DC series resistor circuits. Vout is the voltage across R2."
      icon={Sigma} 
      className="w-full max-w-lg mx-auto"
    >
      <div className="my-4 p-3 bg-muted/30 rounded border text-center">
        <Image
          src="/images/voltage_divider_kvl.svg"
          alt="Voltage divider schematic: Vin source, R1, Node X (Vout), R2, Ground. Loop arrow indicates current."
          width={250} height={180}
          className="mx-auto mb-2 object-contain rounded dark:invert"
          data-ai-hint="voltage divider KVL circuit schematic resistors"
        />
        <p className="font-mono text-xs sm:text-sm font-semibold break-all">
          {formulaPreviewStandard}
        </p>
      </div>

       <div className="mb-4">
            <Label className="text-sm font-medium">Example Values:</Label>
            <div className="flex flex-wrap gap-2 mt-1">
                {exampleValues.map((ex, idx) => (
                <TooltipProvider key={idx} delayDuration={100}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => loadExample(ex)}>
                                Ex {idx + 1}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>{ex.desc}</p></TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                ))}
            </div>
        </div>

        <fieldset className="space-y-4 border-t pt-4">
          <legend className="text-sm font-medium text-muted-foreground sr-only">Inputs for Vout Calculation</legend>
          <CalculatorInput id="vinStd" label="Input Voltage (Vin)" value={vinStandardStr} onChange={setVinStandardStr} onBlur={() => handleBlur('vinStd')} unit={vinStandardUnit} unitOptions={voltageUnitOptions} onUnitChange={setVinStandardUnit} placeholder="e.g., 12" tooltip="Supply voltage (V, mV, kV)"/>
          <CalculatorInput id="r1Std" label="Resistor R1" value={r1StandardStr} onChange={setR1StandardStr}  onBlur={() => handleBlur('r1Std')} unit={r1StandardUnit} unitOptions={resistanceUnitOptions} onUnitChange={setR1StandardUnit} placeholder="e.g., 6" tooltip="Top resistor (Ω, kΩ, MΩ)" min="0"/>
          <CalculatorInput id="r2Std" label="Resistor R2" value={r2StandardStr} onChange={setR2StandardStr}  onBlur={() => handleBlur('r2Std')} unit={r2StandardUnit} unitOptions={resistanceUnitOptions} onUnitChange={setR2StandardUnit} placeholder="e.g., 6" tooltip="Bottom resistor (Ω, kΩ, MΩ) - Vout is across this" min="0"/>

          {error && (
            <Alert variant="destructive" className="mt-2">
              <AlertCircle className="h-4 w-4" /><AlertTitle>Input Error</AlertTitle><AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {standardResults && !error && (
            <div className="pt-4 mt-4 border-t">
                <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-lg">Calculated Output (Vout):</h4>
                    <div className="flex items-center space-x-2">
                        <Label htmlFor="show-steps-switch" className="text-xs text-muted-foreground">Show Steps</Label>
                        <Switch id="show-steps-switch" checked={showSteps} onCheckedChange={setShowSteps}
                            aria-label="Toggle step-by-step solution visibility"
                        />
                         {showSteps ? <Eye size={14} className="text-muted-foreground"/> : <EyeOff size={14} className="text-muted-foreground"/> }
                    </div>
                </div>
                <p className="text-2xl font-bold mb-3 text-center md:text-left">{formatDisplay(standardResults.voltageDropR2, 'voltage', vinStandardUnit)}</p>

                 {showSteps && (
                    <Accordion type="single" collapsible className="w-full" value={activeAccordionItem} onValueChange={setActiveAccordionItem}>
                    <AccordionItem value="item-rt">
                        <AccordionTrigger>Step 1: Total Resistance (RT = R1 + R2)</AccordionTrigger>
                        <AccordionContent className="text-lg font-semibold">{formatDisplay(standardResults.totalResistance, 'resistance', r1StandardUnit)}</AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-i">
                        <AccordionTrigger>Step 2: Circuit Current (I = Vin / RT)</AccordionTrigger>
                        <AccordionContent className="text-lg font-semibold">{formatDisplay(standardResults.current, 'current')}</AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-vr1">
                        <AccordionTrigger>Step 3: Voltage Drop across R1 (VR1 = I * R1)</AccordionTrigger>
                        <AccordionContent className="text-lg font-semibold">{formatDisplay(standardResults.voltageDropR1, 'voltage', vinStandardUnit)}</AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-vr2">
                        <AccordionTrigger>Step 4: Voltage Drop across R2 (VR2 = I * R2 = Vout)</AccordionTrigger>
                        <AccordionContent className="text-lg font-semibold">{formatDisplay(standardResults.voltageDropR2, 'voltage', vinStandardUnit)}</AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-vtol">
                        <AccordionTrigger>Step 5: Vout Range with Resistor Tolerance (R1 ±5%, R2 ±5%)</AccordionTrigger>
                        <AccordionContent className="space-y-1">
                        <p className="text-sm">Min Vout (R1 +5%, R2 -5%): <strong className={cn(standardResults.voutToleranceMin === null ? "text-muted-foreground" : "text-blue-600 dark:text-blue-400")}><TrendingDown size={12} className="inline mr-1"/>{formatDisplay(standardResults.voutToleranceMin, 'voltage', vinStandardUnit)}</strong></p>
                        <p className="text-sm">Max Vout (R1 -5%, R2 +5%): <strong className={cn(standardResults.voutToleranceMax === null ? "text-muted-foreground" : "text-red-600 dark:text-red-400")}><TrendingUp size={12} className="inline mr-1"/>{formatDisplay(standardResults.voutToleranceMax, 'voltage', vinStandardUnit)}</strong></p>
                        </AccordionContent>
                    </AccordionItem>
                    </Accordion>
                 )}
                 <p className="text-xs text-muted-foreground mt-2 italic">Vout formula: Vin * (R2 / (R1 + R2))</p>
            </div>
          )}
        </fieldset>

      <Button variant="outline" onClick={handleReset} className="w-full mt-6">
        <RotateCcw className="mr-2 h-4 w-4" /> Reset All Fields
      </Button>
    </CalculatorCard>
  );
}
