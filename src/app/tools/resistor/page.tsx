'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Palette, Sigma, Thermometer } from 'lucide-react'; // Using Palette icon
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { calculateResistorFromBands, valueToResistorBands } from '@/lib/calculator-utils';
import type { ResistorBands, ResistorResult, ResistorBandColor } from '@/types/calculator';
import { ResistorColorMap } from '@/types/calculator';
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";


// Define available colors for each band type
const digitColors: ResistorBandColor[] = ['black', 'brown', 'red', 'orange', 'yellow', 'green', 'blue', 'violet', 'gray', 'white'];
const multiplierColors: ResistorBandColor[] = ['black', 'brown', 'red', 'orange', 'yellow', 'green', 'blue', 'violet', 'gray', 'white', 'gold', 'silver'];
const toleranceColors: ResistorBandColor[] = ['brown', 'red', 'green', 'blue', 'violet', 'gray', 'gold', 'silver', 'none'];
const tempCoColors: ResistorBandColor[] = ['brown', 'red', 'orange', 'yellow', 'blue', 'violet', 'gray']; // Based on common values


const getBandStyle = (color?: ResistorBandColor) => {
    if (!color || color === 'none') return { backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))', border: '1px dashed hsl(var(--border))' };

    // Map colors to HSL values or Tailwind classes for better theme support
    const colorStyleMap: Record<ResistorBandColor, string> = {
        black: 'bg-black text-white',
        brown: 'bg-yellow-800 text-white', // Tailwind uses 'yellow'/'amber'/'orange', adjust as needed
        red: 'bg-red-600 text-white',
        orange: 'bg-orange-500 text-white',
        yellow: 'bg-yellow-400 text-black',
        green: 'bg-green-600 text-white',
        blue: 'bg-blue-600 text-white',
        violet: 'bg-violet-600 text-white',
        gray: 'bg-gray-500 text-white',
        white: 'bg-white text-black border border-gray-300',
        gold: 'bg-yellow-500 text-black', // Using yellow as gold
        silver: 'bg-gray-400 text-black', // Using gray as silver
        none: 'bg-transparent text-muted-foreground'
    };
     // Use Tailwind classes directly for simplicity if preferred theme integration isn't critical
     // return colorStyleMap[color] || 'bg-gray-200'; // Fallback

    // Using CSS Variables (example, needs actual variables defined in globals.css or similar)
     const variableStyleMap: Record<ResistorBandColor, React.CSSProperties> = {
         black: { backgroundColor: '#000000', color: '#ffffff' },
         brown: { backgroundColor: '#a52a2a', color: '#ffffff' }, // Brown
         red: { backgroundColor: '#ff0000', color: '#ffffff' }, // Red
         orange: { backgroundColor: '#ffa500', color: '#000000' }, // Orange
         yellow: { backgroundColor: '#ffff00', color: '#000000' }, // Yellow
         green: { backgroundColor: '#008000', color: '#ffffff' }, // Green
         blue: { backgroundColor: '#0000ff', color: '#ffffff' }, // Blue
         violet: { backgroundColor: '#ee82ee', color: '#000000' }, // Violet
         gray: { backgroundColor: '#808080', color: '#ffffff' }, // Gray
         white: { backgroundColor: '#ffffff', color: '#000000', border: '1px solid #ccc' }, // White
         gold: { backgroundColor: '#ffd700', color: '#000000' }, // Gold
         silver: { backgroundColor: '#c0c0c0', color: '#000000' }, // Silver
         none: { backgroundColor: 'transparent', color: 'hsl(var(--muted-foreground))' }
     };
     return variableStyleMap[color];
};


export default function ResistorCalculatorPage() {
    const [mode, setMode] = useState<'bandToValue' | 'valueToBand'>('bandToValue');
    const [numBands, setNumBands] = useState<4 | 5 | 6>(4);

    // State for Band -> Value mode
    // Default to 4-band 1k 5% (Brown, Black, Red, Gold)
    const [bands, setBands] = useState<ResistorBands>({
        band1: 'brown', band2: 'black', band3: 'red', multiplier: 'gold'
    });


    // State for Value -> Band mode
    const [resistanceInput, setResistanceInput] = useState<string>('1k');
    const [toleranceInput, setToleranceInput] = useState<number | null>(5); // Default 5%
    const [calculatedBands, setCalculatedBands] = useState<ResistorBands | null>(null);
    const [valueToBandError, setValueToBandError] = useState<string | null>(null);
     const [valueToBandNumBands, setValueToBandNumBands] = useState<4 | 5 | 6>(4);


    const { toast } = useToast();

    // --- Band to Value Calculation ---
    const bandToValueResult = useMemo<ResistorResult>(() => {
        // Filter out undefined bands before passing to calculation
        // The calculation function needs the correct band assignments based on numBands
        return calculateResistorFromBands(bands, numBands);
    }, [bands, numBands]);


    const handleBandChange = (bandName: keyof ResistorBands, color: ResistorBandColor | 'select') => {
         const newColor = (color === 'select' || color === 'none')
            ? ( (bandName === 'tolerance' || bandName === 'tempCoefficient' || (numBands === 4 && bandName === 'multiplier')) ? undefined : bands[bandName]) // Allow deselecting optional/tolerance bands
            : color;

         setBands(prev => {
            const updatedBands = { ...prev, [bandName]: newColor };
            // Clean up unused bands based on numBands
            if (numBands === 4) {
                delete updatedBands.band3; // Digit 3 is not used
                delete updatedBands.tolerance; // Tolerance role is taken by 'multiplier' field
                delete updatedBands.tempCoefficient;
            } else if (numBands === 5) {
                // band3 is used, multiplier is multiplier, tolerance is tolerance
                delete updatedBands.tempCoefficient;
            }
            // 6 bands use all fields as defined semantically
             return updatedBands;
         });
    };


    // Reset bands when numBands changes
     useEffect(() => {
        let defaultBands: ResistorBands = {};
        if (numBands === 4) {
             // Brown, Black, Red, Gold (1k 5%)
            defaultBands = { band1: 'brown', band2: 'black', band3: 'red', multiplier: 'gold'}; // band3 = multiplier, multiplier = tolerance
        } else if (numBands === 5) {
             // Brown, Black, Black, Red, Brown (1k 1%)
            defaultBands = { band1: 'brown', band2: 'black', band3: 'black', multiplier: 'red', tolerance: 'brown' };
        } else { // 6 bands
             // Brown, Black, Black, Red, Brown, Brown (1k 1% 100ppm)
            defaultBands = { band1: 'brown', band2: 'black', band3: 'black', multiplier: 'red', tolerance: 'brown', tempCoefficient: 'brown' };
        }
         setBands(defaultBands);
     }, [numBands]);


    // --- Value to Band Calculation ---
     const handleValueToBandCalculation = useCallback(() => {
        setValueToBandError(null);
        setCalculatedBands(null);

        if (!resistanceInput) {
            // Don't show error if input is empty
            return;
        }

        const result = valueToResistorBands(resistanceInput, toleranceInput, [valueToBandNumBands]); // Prioritize selected num bands

        if (result.error) {
            setValueToBandError(result.error);
            toast({
                title: "Band Calculation Error",
                description: result.error,
                variant: "destructive",
            });
        } else if (result.bands) {
            setCalculatedBands(result.bands);
             setValueToBandNumBands(result.numBands ?? valueToBandNumBands); // Update numBands if calculated
        }
    }, [resistanceInput, toleranceInput, valueToBandNumBands, toast]);

    // Trigger calculation when inputs change in Value -> Band mode
     useEffect(() => {
         // Debounce calculation
         if (mode === 'valueToBand') {
             const handler = setTimeout(() => {
                handleValueToBandCalculation();
             }, 300); // 300ms debounce
             return () => clearTimeout(handler);
         }
     }, [resistanceInput, toleranceInput, valueToBandNumBands, mode, handleValueToBandCalculation]);


    // Determine which bands to show and their roles based on numBands
    const showBand3Digit = numBands === 5 || numBands === 6;
    const showTempCo = numBands === 6;
    const band3IsMultiplier = numBands === 4;
    const band4IsMultiplier = numBands === 5 || numBands === 6;
    const band4IsTolerance = numBands === 4;
    const band5IsTolerance = numBands === 5 || numBands === 6;

    // Render Band Selector Dropdown
    const renderBandSelect = (
        bandKey: keyof ResistorBands, // The key in the 'bands' state object
        label: string,
        availableColors: ResistorBandColor[],
        required: boolean = true
    ) => (
        <div className="flex flex-col space-y-1">
            <Label htmlFor={bandKey} className="text-xs text-muted-foreground">{label}</Label>
            <Select
                value={bands[bandKey] || 'select'}
                onValueChange={(value) => handleBandChange(bandKey, value as ResistorBandColor | 'select')}
            >
                <SelectTrigger id={bandKey} className={cn("h-8 w-full", bands[bandKey] ? 'font-medium' : 'text-muted-foreground')}>
                    <SelectValue placeholder="Select Color" />
                </SelectTrigger>
                <SelectContent>
                    {!required && <SelectItem value="select">-- Optional --</SelectItem>}
                    {availableColors.map(color => (
                        <SelectItem key={color} value={color}>
                            <div className="flex items-center gap-2">
                                <span
                                    className="inline-block w-3 h-3 rounded-full border"
                                    style={getBandStyle(color)}
                                ></span>
                                {color.charAt(0).toUpperCase() + color.slice(1)}
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );

    // --- Resistor Visualization Band Colors ---
    // Get the correct color based on the band's role for the current numBands
    const visBand1Color = bands.band1;
    const visBand2Color = bands.band2;
    const visBand3Color = band3IsMultiplier ? undefined : bands.band3; // Only show digit 3 for 5/6 bands
    const visMultiplierColor = band3IsMultiplier ? bands.band3 : bands.multiplier;
    const visToleranceColor = band4IsTolerance ? bands.multiplier : bands.tolerance; // For 4-band, tolerance is in 'multiplier' field
    const visTempCoColor = showTempCo ? bands.tempCoefficient : undefined;


    return (
        <div className="container mx-auto px-4 py-8"> {/* Add container and padding */}
            <Tabs value={mode} onValueChange={(value) => setMode(value as 'bandToValue' | 'valueToBand')}>
                <Card className="w-full max-w-xl mx-auto">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Palette size={24} /> Resistor Color Code Calculator</CardTitle>
                        <CardDescription>Calculate resistance from color bands or find bands for a value.</CardDescription>
                        <TabsList className="grid w-full grid-cols-2 mt-4">
                            <TabsTrigger value="bandToValue">Color Bands → Value</TabsTrigger>
                            <TabsTrigger value="valueToBand">Value → Color Bands</TabsTrigger>
                        </TabsList>
                    </CardHeader>

                    {/* --- Band to Value Tab --- */}
                    <TabsContent value="bandToValue">
                        <CardContent className="space-y-6">
                             {/* Number of Bands Selector */}
                             <div className="space-y-1">
                                <Label htmlFor="numBands">Number of Bands</Label>
                                <Select value={String(numBands)} onValueChange={(v) => setNumBands(parseInt(v) as 4 | 5 | 6)}>
                                    <SelectTrigger id="numBands" className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="4">4 Bands</SelectItem>
                                        <SelectItem value="5">5 Bands</SelectItem>
                                        <SelectItem value="6">6 Bands</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                           {/* Resistor Visualization */}
                            <div className="bg-yellow-100 rounded-md p-4 flex items-center justify-center space-x-1 h-16 relative">
                                <div className="h-full w-4 bg-yellow-200 rounded-l-sm"></div> {/* Left Lead Area */}
                                <div className="h-full flex-1 bg-yellow-200 relative flex items-center px-2 space-x-1 md:space-x-2">
                                    {/* Bands - Positions adjust slightly based on band count */}
                                    <div className="absolute left-2 w-1 h-full rounded-sm" style={getBandStyle(visBand1Color)}></div>
                                    <div className={cn("absolute w-1 h-full rounded-sm", numBands === 4 ? "left-5" : "left-4 md:left-5")} style={getBandStyle(visBand2Color)}></div>
                                    {/* Digit 3 or Multiplier */}
                                     <div className={cn("absolute w-1 h-full rounded-sm", numBands === 4 ? "left-8" : "left-6 md:left-8")} style={getBandStyle(band3IsMultiplier ? visMultiplierColor : visBand3Color)}></div>
                                     {/* Multiplier (Band 4 for 5/6) */}
                                    {band4IsMultiplier && <div className="absolute left-8 md:left-11 w-1 h-full rounded-sm" style={getBandStyle(visMultiplierColor)}></div>}
                                    {/* Tolerance */}
                                    <div className={cn("absolute w-1 h-full rounded-sm", numBands === 4 ? "right-5" : "right-6 md:right-8")} style={getBandStyle(visToleranceColor)}></div>
                                    {/* Temp Co */}
                                    {visTempCoColor && <div className="absolute right-3 md:right-4 w-1 h-full rounded-sm" style={getBandStyle(visTempCoColor)}></div>}
                                </div>
                                <div className="h-full w-4 bg-yellow-200 rounded-r-sm"></div> {/* Right Lead Area */}
                            </div>

                            {/* Band Selectors Grid - Dynamic based on numBands */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {renderBandSelect('band1', 'Digit 1', digitColors, true)}
                                {renderBandSelect('band2', 'Digit 2', digitColors, true)}
                                {/* Band 3: Digit or Multiplier */}
                                {renderBandSelect('band3', band3IsMultiplier ? 'Multiplier' : 'Digit 3', band3IsMultiplier ? multiplierColors : digitColors, true)}
                                {/* Band 4: Multiplier or Tolerance */}
                                {renderBandSelect('multiplier', band4IsTolerance ? 'Tolerance' : 'Multiplier', band4IsTolerance ? toleranceColors : multiplierColors, true)}
                                {/* Band 5: Tolerance (only for 5/6 bands) */}
                                {band5IsTolerance && renderBandSelect('tolerance', 'Tolerance', toleranceColors, true)}
                                {/* Band 6: Temp Coefficient (only for 6 bands) */}
                                {showTempCo && renderBandSelect('tempCoefficient', 'Temp. Coeff.', tempCoColors, false)}
                            </div>


                            {/* Result Display */}
                            <div className="pt-6 border-t space-y-2">
                                <h4 className="font-semibold text-lg">Calculated Value:</h4>
                                {bandToValueResult.resistance !== null ? (
                                    <>
                                        <p className="text-2xl font-bold">{bandToValueResult.resistanceString}</p>
                                        <div className="flex items-center space-x-4 text-muted-foreground">
                                            {bandToValueResult.tolerance !== null && (
                                                <span className="flex items-center gap-1"><Sigma size={14}/> ±{bandToValueResult.tolerance}%</span>
                                            )}
                                            {bandToValueResult.tempCoefficient !== null && (
                                                 <span className="flex items-center gap-1"><Thermometer size={14}/> {bandToValueResult.tempCoefficient} ppm/°C</span>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-muted-foreground italic">Select valid colors for all required bands.</p>
                                )}
                            </div>
                        </CardContent>
                    </TabsContent>

                     {/* --- Value to Band Tab --- */}
                    <TabsContent value="valueToBand">
                        <CardContent className="space-y-6">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Resistance Input */}
                                <div className="space-y-1">
                                    <Label htmlFor="resistanceValue">Resistance Value</Label>
                                    <Input
                                        id="resistanceValue"
                                        value={resistanceInput}
                                        onChange={(e) => setResistanceInput(e.target.value)}
                                        placeholder="e.g., 4.7k, 220, 1M"
                                    />
                                     <p className="text-xs text-muted-foreground">Use k, M, G or T (e.g., 4k7, 1.5M)</p>
                                </div>
                                 {/* Tolerance Input */}
                                <div className="space-y-1">
                                    <Label htmlFor="toleranceValue">Tolerance (%)</Label>
                                    <Select
                                        value={toleranceInput !== null ? String(toleranceInput) : 'select'}
                                        onValueChange={(v) => setToleranceInput(v === 'select' ? null : parseFloat(v))}
                                    >
                                        <SelectTrigger id="toleranceValue">
                                            <SelectValue placeholder="Select Tolerance"/>
                                        </SelectTrigger>
                                        <SelectContent>
                                             <SelectItem value="select">-- Optional --</SelectItem>
                                            {toleranceColors.filter(c => c !== 'none').map(color => {
                                                 const tolValue = ResistorColorMap[color]?.tolerance;
                                                 return tolValue !== undefined ? (
                                                     <SelectItem key={color} value={String(tolValue)}>
                                                          ±{tolValue}% ({color})
                                                     </SelectItem>
                                                 ) : null;
                                            })}
                                             <SelectItem value="20">±20% (None)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                             </div>

                            {/* Number of Bands Selector for Value->Band */}
                            <div className="space-y-1">
                                <Label htmlFor="numBandsValue">Desired Bands</Label>
                                <Select value={String(valueToBandNumBands)} onValueChange={(v) => setValueToBandNumBands(parseInt(v) as 4 | 5 | 6)}>
                                    <SelectTrigger id="numBandsValue" className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="4">4 Bands</SelectItem>
                                        <SelectItem value="5">5 Bands</SelectItem>
                                         <SelectItem value="6">6 Bands</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>


                            {valueToBandError && (
                                <p className="text-sm text-destructive flex items-center gap-1">
                                    <AlertCircle size={16} /> {valueToBandError}
                                </p>
                            )}

                            {/* Calculated Bands Display */}
                            {calculatedBands && !valueToBandError && (
                                <div className="pt-6 border-t space-y-4">
                                    <h4 className="font-semibold text-lg">Calculated Bands ({valueToBandNumBands}-Band):</h4>
                                     {/* Resistor Visualization */}
                                    <div className="bg-yellow-100 rounded-md p-4 flex items-center justify-center space-x-1 h-16 relative">
                                        <div className="h-full w-4 bg-yellow-200 rounded-l-sm"></div>
                                        <div className="h-full flex-1 bg-yellow-200 relative flex items-center px-2 space-x-1 md:space-x-2">
                                             {/* Dynamically render bands based on calculation */}
                                             <div className="absolute left-2 w-1 h-full rounded-sm" style={getBandStyle(calculatedBands.band1)}></div>
                                             <div className="absolute left-4 md:left-5 w-1 h-full rounded-sm" style={getBandStyle(calculatedBands.band2)}></div>
                                             {/* Band 3: Digit (5/6) or Multiplier (4) */}
                                             <div className={cn("absolute w-1 h-full rounded-sm", valueToBandNumBands === 4 ? "left-8" : "left-6 md:left-8")} style={getBandStyle(calculatedBands.band3)}></div>
                                            {/* Band 4: Multiplier (5/6) or Tolerance (4) */}
                                             {(valueToBandNumBands >= 5) && <div className={cn("absolute w-1 h-full rounded-sm", "left-8 md:left-11")} style={getBandStyle(calculatedBands.multiplier)}></div>}
                                             {/* Band 5: Tolerance (5/6) */}
                                             <div className={cn("absolute w-1 h-full rounded-sm", numBands === 4 ? "right-5" : "right-6 md:right-8")} style={getBandStyle(calculatedBands.tolerance)}></div>
                                            {/* Band 6: TempCo (6) */}
                                            {valueToBandNumBands === 6 && <div className="absolute right-3 md:right-4 w-1 h-full rounded-sm" style={getBandStyle(calculatedBands.tempCoefficient)}></div>}
                                        </div>
                                        <div className="h-full w-4 bg-yellow-200 rounded-r-sm"></div>
                                    </div>
                                    {/* Textual Band Colors */}
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                                        <p><strong>Band 1 (Digit):</strong> {calculatedBands.band1 || 'N/A'}</p>
                                        <p><strong>Band 2 (Digit):</strong> {calculatedBands.band2 || 'N/A'}</p>
                                         {valueToBandNumBands >= 5 && <p><strong>Band 3 (Digit):</strong> {calculatedBands.band3 || 'N/A'}</p>}
                                        <p><strong>{valueToBandNumBands === 4 ? 'Band 3' : 'Band 4'} (Multiplier):</strong> {valueToBandNumBands === 4 ? calculatedBands.band3 : calculatedBands.multiplier || 'N/A'}</p>
                                        <p><strong>{valueToBandNumBands === 4 ? 'Band 4' : 'Band 5'} (Tolerance):</strong> {valueToBandNumBands === 4 ? calculatedBands.multiplier : calculatedBands.tolerance || 'N/A'}</p>
                                         {valueToBandNumBands === 6 && <p><strong>Band 6 (Temp Co):</strong> {calculatedBands.tempCoefficient || 'N/A'}</p>}
                                    </div>
                                    <p className="text-xs text-muted-foreground">Note: Colors are based on standard E-series values. Closest match shown.</p>
                                </div>
                            )}
                        </CardContent>
                    </TabsContent>
                </Card>
            </Tabs>
        </div>
    );
}
