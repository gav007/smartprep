'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Component, Palette } from 'lucide-react'; // Using Component icon
import { calculateResistorFromBands } from '@/lib/calculator-utils';
import type { ResistorBands, ResistorResult, ResistorBandColor } from '@/types/calculator';
import { ResistorColorMap } from '@/types/calculator';
import { cn } from "@/lib/utils";


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
    multiplier: ['brown', 'red', 'gold', 'silver', 'none'], // Tolerance (Band 4)
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
  const [resistanceInput, setResistanceInput] = useState<string>('');
  const [calculatedBands, setCalculatedBands] = useState<ResistorBands | null>(null);


  const handleBandChange = (bandName: keyof ResistorBands, color: string) => {
    // Ensure 'none' is treated correctly, maybe map to undefined or handle in calculation
    const newColor = color === 'none' ? undefined : color as ResistorBandColor;

    setBands(prev => {
        const updatedBands = { ...prev, [bandName]: newColor };

        // Logic for 4-band: band3 is multiplier, band4 (via multiplier field) is tolerance
        if (numBands === 4) {
           if (bandName === 'band3') { // This is the multiplier band
               // Clear the separate multiplier field if it exists from other modes
               delete updatedBands.multiplier;
               // The tolerance band color might be stored in the 'multiplier' key for 4-band UI consistency
           }
           // If changing the tolerance band (which uses the 'multiplier' key in the 4-band UI)
           if (bandName === 'multiplier') {
              // Ensure band3 (multiplier) is still set correctly
              if (!updatedBands.band3) { /* maybe set a default multiplier? */ }
           }
        }
        // Logic for 5/6 band (ensure band3 is digit, multiplier is separate)
        else {
             if (bandName === 'band3') {
                // Ensure multiplier field is set correctly if needed
             }
             if (bandName === 'multiplier') {
                 // Ensure band3 is set correctly
             }
        }

         // Reset tempCoefficient if switching away from 6 bands
         if (numBands !== 6 && updatedBands.tempCoefficient) {
            delete updatedBands.tempCoefficient;
         }
          // Reset tolerance/multiplier if switching from 5/6 to 4 bands and band3 becomes multiplier
         if (numBands === 4) {
             // If band3 is set, and tolerance was set (in tolerance field), clear tolerance field
             if (bandName === 'band3' && updatedBands.tolerance) delete updatedBands.tolerance;
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
              band3: bands.band3, // This is the multiplier for 4-band
              multiplier: bands.multiplier, // This holds the tolerance color for 4-band
          };
      } else if (numBands === 5) {
           bandsForCalc = {
              band1: bands.band1,
              band2: bands.band2,
              band3: bands.band3, // This is 3rd digit
              multiplier: bands.multiplier, // This is multiplier
              tolerance: bands.tolerance, // This is tolerance
          };
      } else { // 6 bands
           bandsForCalc = { ...bands }; // All fields are used directly
      }

     return calculateResistorFromBands(bandsForCalc);
   }, [bands, numBands]);


   // --- Value to Band Logic (Placeholder) ---
   const handleValueToBandCalculation = useCallback(() => {
       // TODO: Implement reverse lookup logic
       // This is complex: find standard E-series value, then find corresponding colors.
       setCalculatedBands(null); // Reset previous result
       if (!resistanceInput) return;

       // Example: Parse "4.7k", "220", "1M" etc.
       let valueOhms: number;
       const input = resistanceInput.toLowerCase().replace(/[^0-9.kmg]/g, ''); // Sanitize
       const multiplierMatch = input.match(/[kmg]$/);
       let numPart = parseFloat(input);

       if (isNaN(numPart)) {
           console.error("Invalid resistance input");
           // Show error to user
           return;
       }

       if (multiplierMatch) {
           const mult = multiplierMatch[0];
           if (mult === 'k') numPart *= 1e3;
           else if (mult === 'm') numPart *= 1e6;
           else if (mult === 'g') numPart *= 1e9;
       }
       valueOhms = numPart;

        // --- Reverse Lookup Logic ---
        // This needs a proper implementation based on E-series values and finding closest matches.
        // For now, a simple placeholder:
       if (valueOhms === 1000) {
           setCalculatedBands({ band1: 'brown', band2: 'black', band3: 'red', multiplier: 'gold'}); // 1kΩ 5% (4-band)
       } else if (valueOhms === 4700) {
            setCalculatedBands({ band1: 'yellow', band2: 'violet', band3: 'red', multiplier: 'gold'}); // 4.7kΩ 5% (4-band)
       }
       // ... add more cases or implement a real lookup
       else {
           setCalculatedBands(null); // Indicate no match found
            console.warn(`Reverse lookup for ${valueOhms}Ω not implemented yet.`);
       }

   }, [resistanceInput]);

    useEffect(() => {
        if (mode === 'valueToBand') {
            handleValueToBandCalculation();
        }
    }, [resistanceInput, mode, handleValueToBandCalculation]);
    // --- End Value to Band Logic ---


    const renderBandSelect = (bandName: keyof ResistorBands, label: string, optionsKey?: string) => {
       const currentOptions = bandOptions[numBands]?.[optionsKey || bandName] || [];
       // Ensure 'none' is an option for tolerance if applicable
       if ((bandName === 'tolerance' || (numBands === 4 && bandName === 'multiplier')) && !currentOptions.includes('none')) {
          // Add 'none' if the map defines a tolerance for it
           if(ResistorColorMap['none']?.tolerance !== undefined) {
               currentOptions.push('none');
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
                        <span className={cn("inline-block w-4 h-4 rounded-sm", getBgColorClass(color))}></span>
                        {color.charAt(0).toUpperCase() + color.slice(1)}
                        {/* Optional: Add value hints */}
                        {/* <span className="text-xs text-muted-foreground ml-auto">
                             {ResistorColorMap[color]?.digit ?? ResistorColorMap[color]?.multiplier ?? ResistorColorMap[color]?.tolerance ?? ResistorColorMap[color]?.tempCoefficient ?? ''}
                        </span> */}
                    </div>
                    </SelectItem>
                ))}
                </SelectContent>
            </Select>
            </div>
        );
    };

    const renderResistorVisual = (resBands: ResistorBands | null, bandCount: number) => {
       if (!resBands) return <div className="h-10 bg-gray-300 rounded flex items-center justify-center text-muted-foreground text-sm">Enter value</div>;

       const bandColors: (ResistorBandColor | undefined)[] = [];
       if (bandCount === 4) {
           bandColors.push(resBands.band1, resBands.band2, resBands.band3, resBands.multiplier); // multiplier holds tolerance color here
       } else if (bandCount === 5) {
           bandColors.push(resBands.band1, resBands.band2, resBands.band3, resBands.multiplier, resBands.tolerance);
       } else { // 6
           bandColors.push(resBands.band1, resBands.band2, resBands.band3, resBands.multiplier, resBands.tolerance, resBands.tempCoefficient);
       }

       return (
           <div className="relative h-10 bg-orange-100 rounded-full flex items-center px-8 my-4 shadow-inner">
               {/* Resistor Body */}
               {/* Bands */}
               <div className="absolute left-0 right-0 top-0 bottom-0 flex justify-around items-center px-4">
                   {bandColors.map((color, index) => (
                       <div
                           key={index}
                           className={cn(
                               "h-full w-2", // Base width
                               getBgColorClass(color),
                               index === bandColors.length - 1 ? 'mr-1' : 'mr-1', // Adjust spacing
                               // Make tolerance/tempco bands slightly wider?
                               ( (bandCount === 4 && index === 3) || (bandCount >=5 && index >= 4) ) && "w-3"
                           )}
                       ></div>
                   ))}
               </div>
                {/* Optional: Wire ends */}
                <div className="absolute left-0 top-1/2 -translate-x-4 -translate-y-1/2 w-5 h-0.5 bg-gray-400"></div>
                <div className="absolute right-0 top-1/2 translate-x-4 -translate-y-1/2 w-5 h-0.5 bg-gray-400"></div>
           </div>
       );
   };

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
                             <Select value={String(numBands)} onValueChange={(v) => setNumBands(parseInt(v) as 4 | 5 | 6)}>
                                 <SelectTrigger id="numBands">
                                     <SelectValue placeholder="Select Bands" />
                                 </SelectTrigger>
                                 <SelectContent>
                                     <SelectItem value="4">4 Bands</SelectItem>
                                     <SelectItem value="5">5 Bands</SelectItem>
                                     <SelectItem value="6">6 Bands</SelectItem>
                                 </SelectContent>
                             </Select>
                         </div>

                         {/* Resistor Visual */}
                          {renderResistorVisual(bands, numBands)}

                         <div className={`grid grid-cols-${numBands} gap-2 items-end`}>
                            {renderBandSelect('band1', 'Band 1 (Digit)')}
                            {renderBandSelect('band2', 'Band 2 (Digit)')}
                             {numBands >= 5 && renderBandSelect('band3', 'Band 3 (Digit)')}
                             {numBands === 4 && renderBandSelect('band3', 'Band 3 (Multiplier)', 'band3')}
                             {numBands >= 5 && renderBandSelect('multiplier', 'Band 4 (Multiplier)')}
                             {numBands === 4 && renderBandSelect('multiplier', 'Band 4 (Tolerance)', 'multiplier')}
                             {numBands >= 5 && renderBandSelect('tolerance', 'Band 5 (Tolerance)')}
                             {numBands === 6 && renderBandSelect('tempCoefficient', 'Band 6 (Temp Co.)')}
                         </div>

                         {resistorResult && (
                            <Card className="mt-6 bg-muted/50">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg">Result</CardTitle>
                                </CardHeader>
                                <CardContent className="text-center">
                                    <p className="text-2xl font-bold">{resistorResult.resistanceString}</p>
                                    {resistorResult.tolerance !== null && (
                                        <p className="text-muted-foreground">Tolerance: ±{resistorResult.tolerance}%</p>
                                    )}
                                    {resistorResult.tempCoefficient !== null && (
                                        <p className="text-muted-foreground">Temp Coefficient: {resistorResult.tempCoefficient} ppm/°C</p>
                                    )}
                                </CardContent>
                            </Card>
                         )}
                    </div>
                </TabsContent>

                 {/* Value to Band Tab */}
                <TabsContent value="valueToBand">
                    <div className="space-y-4">
                         <div>
                             <Label htmlFor="resistanceInput">Resistance Value (e.g., 4.7k, 220, 1M)</Label>
                             <Input
                                 id="resistanceInput"
                                 type="text"
                                 value={resistanceInput}
                                 onChange={(e) => setResistanceInput(e.target.value)}
                                 placeholder="Enter resistance"
                             />
                         </div>

                         {/* Resistor Visual (Calculated) */}
                          {calculatedBands ? renderResistorVisual(calculatedBands, 4) : // Assuming 4-band for now
                            <div className="h-10 bg-gray-300 rounded-full flex items-center justify-center text-muted-foreground text-sm my-4 shadow-inner">Waiting for input...</div>
                          }


                         {calculatedBands ? (
                            <Card className="mt-6 bg-muted/50">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg">Calculated Bands (4-Band Example)</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex justify-around items-center text-center text-xs mt-2">
                                         <div>Band 1 <div className={cn("w-5 h-5 mx-auto mt-1 rounded-sm", getBgColorClass(calculatedBands.band1))}></div> <span className="font-medium">{calculatedBands.band1}</span></div>
                                         <div>Band 2 <div className={cn("w-5 h-5 mx-auto mt-1 rounded-sm", getBgColorClass(calculatedBands.band2))}></div> <span className="font-medium">{calculatedBands.band2}</span></div>
                                         <div>Multiplier <div className={cn("w-5 h-5 mx-auto mt-1 rounded-sm", getBgColorClass(calculatedBands.band3))}></div> <span className="font-medium">{calculatedBands.band3}</span></div>
                                         <div>Tolerance <div className={cn("w-5 h-5 mx-auto mt-1 rounded-sm", getBgColorClass(calculatedBands.multiplier))}></div> <span className="font-medium">{calculatedBands.multiplier}</span></div>
                                    </div>
                                </CardContent>
                            </Card>
                         ) : (
                            resistanceInput && <p className="text-center text-muted-foreground mt-4">Could not find standard bands for this value (lookup logic is basic).</p>
                         )}

                        <p className="text-xs text-muted-foreground text-center pt-4">Note: Value-to-band calculation currently uses basic examples and does not support all standard values or tolerances.</p>
                    </div>
                </TabsContent>
            </Tabs>
         </CardContent>
        </Card>
    </div>
  );
}
