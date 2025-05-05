
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
    const [bands, setBands] = useState<ResistorBands>({
        band1: 'brown', band2: 'black', multiplier: 'orange', tolerance: 'gold' // Default 4-band 10k 5%
    });

    // State for Value -> Band mode
    const [resistanceInput, setResistanceInput] = useState<string>('10k');
    const [toleranceInput, setToleranceInput] = useState<number | null>(5); // Default 5%
    const [calculatedBands, setCalculatedBands] = useState<ResistorBands | null>(null);
    const [valueToBandError, setValueToBandError] = useState<string | null>(null);
     const [valueToBandNumBands, setValueToBandNumBands] = useState<4 | 5 | 6>(4);


    const { toast } = useToast();

    // --- Band to Value Calculation ---
    const bandToValueResult = useMemo<ResistorResult>(() => {
        return calculateResistorFromBands(bands, numBands);
    }, [bands, numBands]);

    const handleBandChange = (bandName: keyof ResistorBands, color: ResistorBandColor | 'select') => {
         // Allow deselecting optional bands like tempCo
         const newColor = (color === 'select' || color === 'none')
            ? ( (bandName === 'tolerance' || bandName === 'tempCoefficient') ? undefined : bands[bandName]) // Keep required bands if 'select' chosen
            : color;

        setBands(prev => ({ ...prev, [bandName]: newColor }));
    };

    // Reset bands when numBands changes
     useEffect(() => {
        let defaultBands: ResistorBands = {};
        if (numBands === 4) {
            defaultBands = { band1: 'brown', band2: 'black', multiplier: 'orange', tolerance: 'gold' }; // 10k 5%
        } else if (numBands === 5) {
            defaultBands = { band1: 'brown', band2: 'black', band3: 'black', multiplier: 'red', tolerance: 'brown' }; // 1k 1%
        } else { // 6 bands
            defaultBands = { band1: 'brown', band2: 'black', band3: 'black', multiplier: 'red', tolerance: 'brown', tempCoefficient: 'brown' }; // 1k 1% 100ppm
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
         // Debounce or trigger on button click? Let's trigger on change for now.
         if (mode === 'valueToBand') {
             const handler = setTimeout(() => {
                handleValueToBandCalculation();
             }, 300); // Simple debounce
             return () => clearTimeout(handler);
         }
     }, [resistanceInput, toleranceInput, valueToBandNumBands, mode, handleValueToBandCalculation]);


    // Render Band Selector Dropdown
    const renderBandSelect = (
        bandName: keyof ResistorBands,
        label: string,
        availableColors: ResistorBandColor[],
        required: boolean = true
    ) => (
        <div className="flex flex-col space-y-1">
            <Label htmlFor={bandName} className="text-xs text-muted-foreground">{label}</Label>
            <Select
                value={bands[bandName] || 'select'}
                onValueChange={(value) => handleBandChange(bandName, value as ResistorBandColor | 'select')}
            >
                <SelectTrigger id={bandName} className={cn("h-8 w-full", bands[bandName] ? 'font-medium' : 'text-muted-foreground')}>
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

    // Determine which bands to show based on numBands
    const showBand3Digit = numBands === 5 || numBands === 6;
    const showTempCo = numBands === 6;
    // Adjust band roles/labels based on numBands for Band 3 and 4
    const band3Label = numBands === 4 ? 'Multiplier' : 'Digit 3';
    const band4Label = numBands === 4 ? 'Tolerance' : 'Multiplier';
    const band5Label = 'Tolerance';
    const band6Label = 'Temp. Coeff.';

    const band3Colors = numBands === 4 ? multiplierColors : digitColors;
    const band4Colors = numBands === 4 ? toleranceColors : multiplierColors;
    const band5Colors = toleranceColors;


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
                                {/* Resistor Body */}
                                <div className="h-full w-4 bg-yellow-200 rounded-l-sm"></div> {/* Left Lead Area */}
                                <div className="h-full flex-1 bg-yellow-200 relative flex items-center px-2 space-x-1 md:space-x-2">
                                     {/* Bands */}
                                     <div className="absolute left-2 w-1 h-full rounded-sm" style={getBandStyle(bands.band1)}></div>
                                     <div className="absolute left-4 md:left-5 w-1 h-full rounded-sm" style={getBandStyle(bands.band2)}></div>
                                     <div className={cn("absolute left-6 md:left-8 w-1 h-full rounded-sm", numBands === 4 && "left-7 md:left-10")} style={getBandStyle(bands.band3)}></div>
                                     {(numBands > 4) && <div className="absolute left-8 md:left-11 w-1 h-full rounded-sm" style={getBandStyle(bands.multiplier)}></div>}
                                     <div className={cn("absolute right-6 md:right-8 w-1 h-full rounded-sm", numBands === 4 && "right-4 md:right-6")} style={getBandStyle(bands.tolerance)}></div>
                                    {showTempCo && <div className="absolute right-3 md:right-4 w-1 h-full rounded-sm" style={getBandStyle(bands.tempCoefficient)}></div>}
                                </div>
                                <div className="h-full w-4 bg-yellow-200 rounded-r-sm"></div> {/* Right Lead Area */}
                            </div>


                            {/* Band Selectors Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {renderBandSelect('band1', 'Digit 1', digitColors)}
                                {renderBandSelect('band2', 'Digit 2', digitColors)}
                                {renderBandSelect('band3', band3Label, band3Colors, showBand3Digit)}
                                {numBands > 4 && renderBandSelect('multiplier', band4Label, band4Colors)}
                                {renderBandSelect('tolerance', band5Label, band5Colors, numBands > 4)}
                                {showTempCo && renderBandSelect('tempCoefficient', band6Label, tempCoColors, false)}
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
                                         {/* <SelectItem value="6">6 Bands (Experimental)</SelectItem> */}
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
                                             <div className={cn("absolute left-6 md:left-8 w-1 h-full rounded-sm", valueToBandNumBands === 4 && "left-7 md:left-10")} style={getBandStyle(calculatedBands.band3)}></div>
                                            {/* Band 4: Multiplier (5/6) or Tolerance (4) */}
                                             {(valueToBandNumBands > 4) && <div className="absolute left-8 md:left-11 w-1 h-full rounded-sm" style={getBandStyle(calculatedBands.multiplier)}></div>}
                                             {/* Band 5: Tolerance (5/6) */}
                                             <div className={cn("absolute right-6 md:right-8 w-1 h-full rounded-sm", valueToBandNumBands === 4 && "right-4 md:right-6")} style={getBandStyle(valueToBandNumBands === 4 ? calculatedBands.multiplier : calculatedBands.tolerance)}></div>
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
