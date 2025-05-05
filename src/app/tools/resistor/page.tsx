'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react'; // Added useEffect
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Component, Palette } from 'lucide-react'; // Using Component icon
import { calculateResistorFromBands, findResistorBandsFromValue } from '@/lib/calculator-utils';
import type { ResistorBands, ResistorResult, ResistorBandColor } from '@/types/calculator';
import { ResistorColorMap } from '@/types/calculator';
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from 'lucide-react';


// Helper to get Tailwind background color class for a resistor color
const getBgColorClass = (color: ResistorBandColor | undefined): string => {
  if (!color) return 'bg-gray-300'; // Default for undefined/none
  switch (color) {
    case 'black': return 'bg-black';
    case 'brown': return 'bg-yellow-900'; // Using Tailwind's yellow-900 for brown
    case 'red': return 'bg-red-600';
    case 'orange': return 'bg-orange-500';
    case 'yellow': return 'bg-yellow-400';
    case 'green': return 'bg-green-600';
    case 'blue': return 'bg-blue-600';
    case 'violet': return 'bg-purple-600';
    case 'gray': return 'bg-gray-500';
    case 'white': return 'bg-white border border-gray-400'; // White needs border
    case 'gold': return 'bg-yellow-500'; // Using yellow-500 for gold
    case 'silver': return 'bg-gray-400'; // Using gray-400 for silver
    case 'none': return 'bg-transparent'; // Or bg-gray-200 if visible placeholder needed
    default: return 'bg-gray-300';
  }
};

// Band options based on position and number of bands
const bandOptions: Record<number, Record<string, ResistorBandColor[]>> = {
  4: {
    band1: ['brown', 'red', 'orange', 'yellow', 'green', 'blue', 'violet', 'gray', 'white'],
    band2: ['black', 'brown', 'red', 'orange', 'yellow', 'green', 'blue', 'violet', 'gray', 'white'],
    band3: ['black', 'brown', 'red', 'orange', 'yellow', 'green', 'blue', 'violet', 'gold', 'silver'], // Multiplier
    tolerance: ['brown', 'red', 'green', 'blue', 'violet', 'gray', 'gold', 'silver', 'none'], // Tolerance (Band 4) - Using 'tolerance' key
  },
  5: {
    band1: ['brown', 'red', 'orange', 'yellow', 'green', 'blue', 'violet', 'gray', 'white'],
    band2: ['black', 'brown', 'red', 'orange', 'yellow', 'green', 'blue', 'violet', 'gray', 'white'],
    band3: ['black', 'brown', 'red', 'orange', 'yellow', 'green', 'blue', 'violet', 'gray', 'white'],
    multiplier: ['black', 'brown', 'red', 'orange', 'yellow', 'green', 'blue', 'violet', 'gold', 'silver'], // Multiplier (Band 4)
    tolerance: ['brown', 'red', 'green', 'blue', 'violet', 'gray', 'gold', 'silver', 'none'], // Tolerance (Band 5)
  },
  6: {
     band1: ['brown', 'red', 'orange', 'yellow', 'green', 'blue', 'violet', 'gray', 'white'],
     band2: ['black', 'brown', 'red', 'orange', 'yellow', 'green', 'blue', 'violet', 'gray', 'white'],
     band3: ['black', 'brown', 'red', 'orange', 'yellow', 'green', 'blue', 'violet', 'gray', 'white'],
     multiplier: ['black', 'brown', 'red', 'orange', 'yellow', 'green', 'blue', 'violet', 'gold', 'silver'], // Multiplier (Band 4)
     tolerance: ['brown', 'red', 'green', 'blue', 'violet', 'gray', 'gold', 'silver'], // Tolerance (Band 5)
     tempCoefficient: ['brown', 'red', 'orange', 'yellow', 'blue', 'violet', 'gray'], // Temp Co (Band 6)
  },
};


export default function ResistorCalculatorPage() {
  const [mode, setMode] = useState<'bandToValue' | 'valueToBand'>('bandToValue');
  const [numBands, setNumBands] = useState<4 | 5 | 6>(4);
  const [bands, setBands] = useState<ResistorBands>({});
  // Value to Band state
  const [resistanceInput, setResistanceInput] = useState<string>('1k'); // Start with an example
  const [toleranceInput, setToleranceInput] = useState<number>(5); // Default tolerance %
  const [calculatedBands, setCalculatedBands] = useState<ResistorBands | null>(null);
  const [valueToBandError, setValueToBandError] = useState<string | null>(null);


  const handleBandChange = (bandName: keyof ResistorBands, color: string) => {
    const newColor = color === 'none' ? undefined : color as ResistorBandColor;

    setBands(prev => {
        const updatedBands = { ...prev, [bandName]: newColor };

         // Reset tempCoefficient if switching away from 6 bands
         if (numBands !== 6 && updatedBands.tempCoefficient) {
            delete updatedBands.tempCoefficient;
         }

         // Clear unnecessary bands when switching band count
         if (numBands === 4) {
             delete updatedBands.band3; // 4-band doesn't have 3rd digit band
             delete updatedBands.tempCoefficient;
             // 'tolerance' field is used for band 4 in 4-band mode
         } else if (numBands === 5) {
              delete updatedBands.tempCoefficient;
         }


        return updatedBands;
    });
  };


   const resistorResult: ResistorResult = useMemo(() => {
      // Pass the correct bands object based on numBands
      let bandsForCalc: ResistorBands = {};
      if (numBands === 4) {
          bandsForCalc = {
              band1: bands.band1,
              band2: bands.band2,
              multiplier: bands.multiplier, // Multiplier is band 3 for 4-band
              tolerance: bands.tolerance, // Tolerance is band 4 for 4-band
          };
      } else if (numBands === 5) {
           bandsForCalc = {
              band1: bands.band1,
              band2: bands.band2,
              band3: bands.band3, // Digit 3
              multiplier: bands.multiplier, // Multiplier (band 4)
              tolerance: bands.tolerance, // Tolerance (band 5)
          };
      } else { // 6 bands
           bandsForCalc = { ...bands }; // All fields are used directly
      }

     return calculateResistorFromBands(bandsForCalc, numBands);
   }, [bands, numBands]);


   // --- Value to Band Logic ---
   const handleValueToBandCalculation = useCallback(() => {
       setValueToBandError(null);
       setCalculatedBands(null);
       if (!resistanceInput) return;

       const result = findResistorBandsFromValue(resistanceInput, toleranceInput, [4, 5]); // Try 4 and 5 band first

        if (result.error) {
            setValueToBandError(result.error);
        } else if (result.bands) {
            setCalculatedBands(result.bands);
            // Optionally update numBands visual based on result?
        } else {
            setValueToBandError("Could not determine standard resistor bands for this value and tolerance.");
        }


   }, [resistanceInput, toleranceInput]);

    useEffect(() => {
        if (mode === 'valueToBand') {
            handleValueToBandCalculation();
        }
    }, [resistanceInput, toleranceInput, mode, handleValueToBandCalculation]);
    // --- End Value to Band Logic ---


    const renderBandSelect = (bandName: keyof ResistorBands, label: string, optionsKey?: string) => {
       const currentOptions = bandOptions[numBands]?.[optionsKey || bandName] || [];
       const actualBandName = optionsKey || bandName; // Use optionsKey if provided (for 4-band mapping)

       // Ensure 'none' is an option for tolerance if applicable
        const isToleranceBand = (bandName === 'tolerance' || (numBands === 4 && bandName === 'tolerance')); // In 4-band, 'tolerance' field holds band 4 color
        if (isToleranceBand && !currentOptions.includes('none')) {
          // Add 'none' if the map defines a tolerance for it
           if(ResistorColorMap['none']?.tolerance !== undefined) {
               // Check if 'none' is valid for this band count
               const noneValid = (numBands === 4 && bandOptions[4]?.tolerance?.includes('none')) ||
                                 (numBands === 5 && bandOptions[5]?.tolerance?.includes('none'));
               if (noneValid) {
                   currentOptions.push('none');
               }
           }
       }


        return (
            <div key={bandName} className="space-y-1">
            <Label htmlFor={bandName} className="text-xs">{label}</Label>
            <Select
                value={bands[bandName] || ''}
                onValueChange={(color) => handleBandChange(bandName, color)}
            >
                <SelectTrigger id={bandName} className={`h-8 border-none rounded-none ${getBgColorClass(bands[bandName])}`}>
                 <SelectValue placeholder="Select" className="sr-only" /> {/* Hide placeholder text visually */}
                </SelectTrigger>
                <SelectContent>
                {currentOptions.map(color => (
                    <SelectItem key={color} value={color} className="text-sm">
                    <div className="flex items-center gap-2">
                        <span className={cn("inline-block w-4 h-4 rounded-sm", getBgColorClass(color as ResistorBandColor))}></span>
                        {color.charAt(0).toUpperCase() + color.slice(1)}
                        {/* Optional: Add value hints */}
                         <span className="text-xs text-muted-foreground ml-auto">
                            {ResistorColorMap[color as ResistorBandColor]?.digit !== undefined ? `(${ResistorColorMap[color as ResistorBandColor]?.digit})` :
                             ResistorColorMap[color as ResistorBandColor]?.multiplier !== undefined ? `(x${ResistorColorMap[color as ResistorBandColor]?.multiplier})` :
                             ResistorColorMap[color as ResistorBandColor]?.tolerance !== undefined ? `(±${ResistorColorMap[color as ResistorBandColor]?.tolerance}%)` :
                             ResistorColorMap[color as ResistorBandColor]?.tempCoefficient !== undefined ? `(${ResistorColorMap[color as ResistorBandColor]?.tempCoefficient}ppm)` : ''}
                        </span>
                    </div>
                    </SelectItem>
                ))}
                </SelectContent>
            </Select>
            </div>
        );
    };

     const renderResistorVisual = (resBands: ResistorBands | null, bandCount: number, highlightError: boolean = false) => {
       const bandColors: (ResistorBandColor | undefined)[] = [];
       if (resBands) {
           if (bandCount === 4) {
               bandColors.push(resBands.band1, resBands.band2, resBands.multiplier, resBands.tolerance); // Band 3=Multiplier, Band 4=Tolerance
           } else if (bandCount === 5) {
               bandColors.push(resBands.band1, resBands.band2, resBands.band3, resBands.multiplier, resBands.tolerance);
           } else { // 6
               bandColors.push(resBands.band1, resBands.band2, resBands.band3, resBands.multiplier, resBands.tolerance, resBands.tempCoefficient);
           }
       }

       const isEmpty = bandColors.every(c => c === undefined);

       return (
           <div className={cn("relative h-10 bg-orange-100 rounded-full flex items-center px-8 my-4 shadow-inner", highlightError && "ring-2 ring-destructive")}>
               {/* Resistor Body */}
               {/* Bands */}
               <div className="absolute left-0 right-0 top-0 bottom-0 flex justify-around items-center px-4">
                   {Array.from({ length: bandCount }).map((_, index) => (
                       <div
                           key={index}
                           className={cn(
                               "h-full w-2", // Base width
                               getBgColorClass(bandColors[index]),
                               // Spacing adjustments
                               bandCount === 4 && index === 1 && "mr-3", // Gap between digit 2 and multiplier
                               bandCount === 5 && index === 2 && "mr-3", // Gap between digit 3 and multiplier
                               bandCount === 6 && index === 2 && "mr-2", // Smaller gap before multiplier
                               bandCount === 6 && index === 3 && "mr-2", // Smaller gap before tolerance

                               // Make tolerance/tempco bands slightly wider for visual distinction
                               ( (bandCount === 4 && index === 3) || (bandCount >=5 && index === bandCount - 1 ) || (bandCount === 6 && index === bandCount - 2) ) && "w-3"
                           )}
                       ></div>
                   ))}
               </div>
                {/* Optional: Wire ends */}
                <div className="absolute left-0 top-1/2 -translate-x-4 -translate-y-1/2 w-5 h-0.5 bg-gray-400"></div>
                <div className="absolute right-0 top-1/2 translate-x-4 -translate-y-1/2 w-5 h-0.5 bg-gray-400"></div>

                {/* Placeholder Text */}
                {isEmpty && !highlightError && (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-xs italic">Select bands above</div>
                )}
                {highlightError && (
                     <div className="absolute inset-0 flex items-center justify-center text-destructive text-xs italic font-semibold">Invalid Input</div>
                )}
           </div>
       );
   };

   // Determine the band count for the value-to-band visual
   const calculatedBandCount = calculatedBands?.tempCoefficient ? 6 : calculatedBands?.band3 ? 5 : 4;

  return (
    <div className="container mx-auto p-4 md:p-6">
        <Card className="w-full max-w-2xl mx-auto">
         <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
                <Component className="h-6 w-6 text-primary" />
                Resistor Color Code Calculator
            </CardTitle>
            <CardDescription>
                Calculate resistance from color bands or find colors for a value.
            </CardDescription>
         </CardHeader>
         <CardContent>
            <Tabs value={mode} onValueChange={(v) => setMode(v as any)}>
                <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="bandToValue">Band Colors to Value</TabsTrigger>
                    <TabsTrigger value="valueToBand">Value to Band Colors</TabsTrigger>
                </TabsList>

                {/* Band to Value Tab */}
                <TabsContent value="bandToValue">
                    <div className="space-y-4">
                         <div>
                             <Label htmlFor="numBands">Number of Bands</Label>
                             <Select value={String(numBands)} onValueChange={(v) => {
                                const newNumBands = parseInt(v) as 4 | 5 | 6;
                                setNumBands(newNumBands);
                                // Clear bands when changing count to avoid mismatches
                                setBands({});
                             }}>
                                 <SelectTrigger id="numBands">
                                     <SelectValue placeholder="Select Bands" />
                                 </SelectTrigger>
                                 <SelectContent>
                                     <SelectItem value="4">4 Bands (Digits, Multiplier, Tolerance)</SelectItem>
                                     <SelectItem value="5">5 Bands (Digits, Multiplier, Tolerance)</SelectItem>
                                     <SelectItem value="6">6 Bands (Digits, Multiplier, Tolerance, TempCo)</SelectItem>
                                 </SelectContent>
                             </Select>
                         </div>

                         {/* Resistor Visual */}
                          {renderResistorVisual(bands, numBands)}

                         <div className={`grid grid-cols-${numBands === 6 ? 6 : numBands === 5 ? 5 : 4} gap-2 items-end`}>
                            {/* Always show Digit 1 and 2 */}
                            {renderBandSelect('band1', 'Band 1 (Digit)')}
                            {renderBandSelect('band2', 'Band 2 (Digit)')}

                            {/* Band 3: Digit (5/6 band) or Multiplier (4 band) */}
                            {numBands >= 5 && renderBandSelect('band3', 'Band 3 (Digit)')}


                             {/* Multiplier Band: Band 3 (4-band) or Band 4 (5/6-band) */}
                             {numBands === 4 && renderBandSelect('multiplier', 'Band 3 (Multiplier)', 'band3')}
                             {numBands >= 5 && renderBandSelect('multiplier', 'Band 4 (Multiplier)')}


                             {/* Tolerance Band: Band 4 (4-band) or Band 5 (5/6-band) */}
                             {numBands === 4 && renderBandSelect('tolerance', 'Band 4 (Tolerance)', 'tolerance')}
                             {numBands >= 5 && renderBandSelect('tolerance', 'Band 5 (Tolerance)')}

                            {/* Temp Coefficient Band (6-band only) */}
                             {numBands === 6 && renderBandSelect('tempCoefficient', 'Band 6 (Temp Co.)')}
                         </div>

                         {resistorResult && (
                            <Card className="mt-6 bg-muted/50">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg">Result</CardTitle>
                                </CardHeader>
                                <CardContent className="text-center">
                                    {resistorResult.resistance !== null ? (
                                        <>
                                            <p className="text-2xl font-bold">{resistorResult.resistanceString}</p>
                                            {resistorResult.tolerance !== null && (
                                                <p className="text-muted-foreground">Tolerance: ±{resistorResult.tolerance}%</p>
                                            )}
                                            {numBands === 6 && resistorResult.tempCoefficient !== null && (
                                                <p className="text-muted-foreground">Temp Coefficient: {resistorResult.tempCoefficient} ppm/°C</p>
                                            )}
                                             {numBands === 6 && resistorResult.tempCoefficient === null && bands.tempCoefficient && (
                                                 <p className="text-destructive text-xs">Invalid TempCo Color</p>
                                             )}
                                        </>
                                    ) : (
                                        <p className="text-muted-foreground italic">Select valid bands to calculate.</p>
                                    )}
                                </CardContent>
                            </Card>
                         )}
                    </div>
                </TabsContent>

                 {/* Value to Band Tab */}
                <TabsContent value="valueToBand">
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                             <div>
                                <Label htmlFor="resistanceInput">Resistance Value (e.g., 4.7k, 220, 1M)</Label>
                                <Input
                                    id="resistanceInput"
                                    type="text"
                                    value={resistanceInput}
                                    onChange={(e) => setResistanceInput(e.target.value)}
                                    placeholder="Enter resistance"
                                    className={valueToBandError ? 'border-destructive' : ''}
                                />
                            </div>
                             <div>
                                <Label htmlFor="toleranceInput">Tolerance (%)</Label>
                                <Select value={String(toleranceInput)} onValueChange={(v) => setToleranceInput(parseFloat(v))}>
                                     <SelectTrigger id="toleranceInput">
                                         <SelectValue placeholder="Select Tolerance" />
                                     </SelectTrigger>
                                    <SelectContent>
                                        {/* Common E-series tolerances */}
                                        <SelectItem value="0.05">±0.05% (Gray)</SelectItem>
                                        <SelectItem value="0.1">±0.1% (Violet)</SelectItem>
                                        <SelectItem value="0.25">±0.25% (Blue)</SelectItem>
                                        <SelectItem value="0.5">±0.5% (Green)</SelectItem>
                                        <SelectItem value="1">±1% (Brown)</SelectItem>
                                        <SelectItem value="2">±2% (Red)</SelectItem>
                                        <SelectItem value="5">±5% (Gold)</SelectItem>
                                        <SelectItem value="10">±10% (Silver)</SelectItem>
                                        <SelectItem value="20">±20% (None)</SelectItem>
                                     </SelectContent>
                                </Select>
                             </div>
                        </div>


                         {/* Resistor Visual (Calculated) */}
                          {renderResistorVisual(calculatedBands, calculatedBandCount, !!valueToBandError)}


                          {valueToBandError && (
                             <Alert variant="destructive" className="mt-4">
                               <AlertTriangle className="h-4 w-4" />
                               <AlertTitle>Error</AlertTitle>
                               <AlertDescription>{valueToBandError}</AlertDescription>
                             </Alert>
                           )}


                         {calculatedBands && !valueToBandError && (
                            <Card className="mt-6 bg-muted/50">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg">Calculated Bands ({calculatedBandCount}-Band)</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className={`grid grid-cols-${calculatedBandCount} gap-2 text-center text-xs mt-2`}>
                                         {/* Dynamically display based on calculatedBandCount */}
                                         <div>Band 1 <div className={cn("w-5 h-5 mx-auto mt-1 rounded-sm", getBgColorClass(calculatedBands.band1))}></div> <span className="font-medium">{calculatedBands.band1}</span></div>
                                         <div>Band 2 <div className={cn("w-5 h-5 mx-auto mt-1 rounded-sm", getBgColorClass(calculatedBands.band2))}></div> <span className="font-medium">{calculatedBands.band2}</span></div>
                                         {calculatedBandCount >= 5 && <div>Band 3 <div className={cn("w-5 h-5 mx-auto mt-1 rounded-sm", getBgColorClass(calculatedBands.band3))}></div> <span className="font-medium">{calculatedBands.band3}</span></div>}
                                         <div>Multiplier <div className={cn("w-5 h-5 mx-auto mt-1 rounded-sm", getBgColorClass(calculatedBands.multiplier))}></div> <span className="font-medium">{calculatedBands.multiplier}</span></div>
                                         <div>Tolerance <div className={cn("w-5 h-5 mx-auto mt-1 rounded-sm", getBgColorClass(calculatedBands.tolerance))}></div> <span className="font-medium">{calculatedBands.tolerance || 'none'}</span></div>
                                         {calculatedBandCount === 6 && <div>Temp Co <div className={cn("w-5 h-5 mx-auto mt-1 rounded-sm", getBgColorClass(calculatedBands.tempCoefficient))}></div> <span className="font-medium">{calculatedBands.tempCoefficient}</span></div>}
                                    </div>
                                </CardContent>
                            </Card>
                         )}

                        {/* <p className="text-xs text-muted-foreground text-center pt-4">Note: Value-to-band calculation finds the best match for standard E-series values and the selected tolerance.</p> */}
                    </div>
                </TabsContent>
            </Tabs>
         </CardContent>
        </Card>
    </div>
  );
}
