
'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Palette, Sigma, Thermometer, HelpCircle } from 'lucide-react'; // Using Palette icon
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { calculateResistorFromBands, valueToResistorBands } from '@/lib/calculator-utils';
import type { ResistorBands, ResistorResult, ResistorBandColor } from '@/types/calculator';
import { ResistorColorMap } from '@/types/calculator';
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


// Define available colors for each band type
const digitColors: ResistorBandColor[] = ['black', 'brown', 'red', 'orange', 'yellow', 'green', 'blue', 'violet', 'gray', 'white'];
// Ensure multiplier colors are correctly defined
const multiplierColors: ResistorBandColor[] = ['black', 'brown', 'red', 'orange', 'yellow', 'green', 'blue', 'violet', 'gray', 'white', 'gold', 'silver'];
const toleranceColors: ResistorBandColor[] = ['brown', 'red', 'green', 'blue', 'violet', 'gray', 'gold', 'silver', 'none'];
const tempCoColors: ResistorBandColor[] = ['brown', 'red', 'orange', 'yellow', 'blue', 'violet', 'gray']; // Based on common values


const getBandStyle = (color?: ResistorBandColor) => {
    if (!color || color === 'none') return { backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))', border: '1px dashed hsl(var(--border))' };

    // Map colors to HSL values or Tailwind classes for better theme support
    // Using CSS Variables defined in globals.css for theme consistency
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
    const [bandError, setBandError] = useState<string | null>(null);

    // State for Band -> Value mode
    // Initialize with default for 4-band (Brown, Black, Red, Gold = 1kΩ 5%)
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

    // Determine which bands to show and their roles based on numBands for Band->Value mode
    const showBand3Digit = numBands === 5 || numBands === 6;
    const showTempCo = numBands === 6;
    const band3IsMultiplier = numBands === 4;
    const band4IsMultiplier = numBands === 5 || numBands === 6;
    const band4IsTolerance = numBands === 4;
    const band5IsTolerance = numBands === 5 || numBands === 6;


     // --- Band to Value Calculation ---
    const bandToValueResult = useMemo<ResistorResult & { error?: string }>(() => {
        setBandError(null); // Clear previous errors

        // Check required bands based on numBands
        let missingBands: string[] = [];
        if (!bands.band1) missingBands.push("Digit 1");
        if (!bands.band2) missingBands.push("Digit 2");

        if (numBands === 4) {
            if (!bands.band3) missingBands.push("Multiplier (Band 3)");
            if (!bands.multiplier) missingBands.push("Tolerance (Band 4)"); // 'multiplier' holds tolerance color
        } else if (numBands === 5) {
            if (!bands.band3) missingBands.push("Digit 3");
            if (!bands.multiplier) missingBands.push("Multiplier (Band 4)");
            if (!bands.tolerance) missingBands.push("Tolerance (Band 5)");
        } else { // 6 bands
            if (!bands.band3) missingBands.push("Digit 3");
            if (!bands.multiplier) missingBands.push("Multiplier (Band 4)");
            if (!bands.tolerance) missingBands.push("Tolerance (Band 5)");
             // Temp Co (Band 6) is optional, no check needed here
        }

        if (missingBands.length > 0) {
             const errorMsg = `Select valid colors for all required bands: ${missingBands.join(', ')}.`;
             setBandError(errorMsg);
            return { resistance: null, tolerance: null, tempCoefficient: null, resistanceString: 'N/A', error: errorMsg };
        }

        // Call the calculation utility function
        const result = calculateResistorFromBands(bands, numBands);

        // Enhancement: Check for unrealistic values (e.g., > 1GΩ with gold/silver multiplier)
         if (result.resistance !== null && Math.abs(result.resistance) > 1e9) {
             const multColor = numBands === 4 ? bands.band3 : bands.multiplier;
             if (multColor === 'gold' || multColor === 'silver') {
                 setBandError("Warning: High resistance value with Gold/Silver multiplier might be unrealistic.");
                 // Don't block calculation, just warn
             }
         }

         if (result.resistance === null) {
            setBandError("Calculation failed. Check band selections.");
         }


        return { ...result, error: bandError }; // Include potential error message
    }, [bands, numBands, bandError]); // Added bandError dependency


    const handleBandChange = (bandName: keyof ResistorBands, color: ResistorBandColor | 'select') => {
         const newColor = (color === 'select') ? undefined : color;

         setBands(prev => {
            const updatedBands = { ...prev, [bandName]: newColor };
            // Clean up unused bands based on numBands (optional, but good practice)
            // This logic should ideally be in the selection/rendering part, not here directly
            return updatedBands;
         });
         setBandError(null); // Clear error when a band changes
    };


    // Reset bands when numBands changes
     useEffect(() => {
        let defaultBands: ResistorBands = {};
        if (numBands === 4) {
             // Brown, Black, Red, Gold (1k 5%)
            defaultBands = { band1: 'brown', band2: 'black', band3: 'red', multiplier: 'gold'}; // Band 3 = Multiplier, Band 4 (multiplier field) = Tolerance
        } else if (numBands === 5) {
             // Brown, Black, Black, Red, Brown (1k 1%)
            defaultBands = { band1: 'brown', band2: 'black', band3: 'black', multiplier: 'red', tolerance: 'brown' };
        } else { // 6 bands
             // Brown, Black, Black, Red, Brown, Brown (1k 1% 100ppm)
            defaultBands = { band1: 'brown', band2: 'black', band3: 'black', multiplier: 'red', tolerance: 'brown', tempCoefficient: 'brown' };
        }
         setBands(defaultBands);
         setBandError(null); // Clear errors on reset
     }, [numBands]);


    // --- Value to Band Calculation ---
     const handleValueToBandCalculation = useCallback(() => {
        setValueToBandError(null);
        setCalculatedBands(null);

        if (!resistanceInput) {
            return; // Don't calculate if input is empty
        }

        const result = valueToResistorBands(resistanceInput, toleranceInput, [valueToBandNumBands]);

        if (result.error) {
            setValueToBandError(result.error);
            // Optionally show toast
            // toast({ title: "Band Calculation Error", description: result.error, variant: "destructive" });
        } else if (result.bands) {
            setCalculatedBands(result.bands);
            // Update the number of bands selector if the calculation resulted in a specific band count
            if (result.numBands && result.numBands !== valueToBandNumBands) {
                setValueToBandNumBands(result.numBands);
            }
        }
    }, [resistanceInput, toleranceInput, valueToBandNumBands, toast]); // Removed toast from dependency list unless used

    // Trigger calculation when inputs change in Value -> Band mode
     useEffect(() => {
         if (mode === 'valueToBand') {
             const handler = setTimeout(() => {
                handleValueToBandCalculation();
             }, 300); // Debounce
             return () => clearTimeout(handler);
         }
     }, [resistanceInput, toleranceInput, valueToBandNumBands, mode, handleValueToBandCalculation]);


    // Render Band Selector Dropdown - Added tooltip support
    const renderBandSelect = (
        bandKey: keyof ResistorBands,
        label: string,
        tooltipText: string,
        availableColors: ResistorBandColor[],
        required: boolean = true
    ) => (
        <TooltipProvider delayDuration={200}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="flex flex-col space-y-1">
                        <Label htmlFor={bandKey} className="text-xs text-muted-foreground flex items-center gap-1">
                            {label}
                            <HelpCircle size={12} className="opacity-50"/>
                        </Label>
                        <Select
                            value={bands[bandKey] || 'select'}
                            onValueChange={(value) => handleBandChange(bandKey, value as ResistorBandColor | 'select')}
                            required={required} // HTML5 validation (basic)
                        >
                            <SelectTrigger
                                id={bandKey}
                                className={cn(
                                    "h-8 w-full",
                                    !bands[bandKey] && required ? "border-destructive focus:ring-destructive" : "", // Highlight if required and empty
                                    bands[bandKey] ? 'font-medium' : 'text-muted-foreground'
                                )}
                                aria-label={`Select ${label}`}
                            >
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
                                             {/* Display value for context */}
                                             {ResistorColorMap[color] && typeToDisplayValue(ResistorColorMap[color], bandKey, numBands) && (
                                                 <span className="ml-auto text-xs text-muted-foreground">
                                                    {typeToDisplayValue(ResistorColorMap[color], bandKey, numBands)}
                                                 </span>
                                             )}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                         {/* Show inline error if required and not selected */}
                         {!bands[bandKey] && required && bandError && bandError.includes(label) && (
                            <p className="text-xs text-destructive">{label} is required.</p>
                         )}
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{tooltipText}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );

     // Helper to show relevant value in dropdown
     const typeToDisplayValue = (colorData: any, bandKey: keyof ResistorBands, numBands: number): string | null => {
         if (!colorData) return null;
         if (bandKey === 'band1' || bandKey === 'band2' || (bandKey === 'band3' && numBands >= 5)) return String(colorData.digit ?? '');
         if ((bandKey === 'band3' && numBands === 4) || (bandKey === 'multiplier' && numBands >= 5)) return `x${formatMultiplier(colorData.multiplier)}`;
         if ((bandKey === 'multiplier' && numBands === 4) || (bandKey === 'tolerance' && numBands >= 5)) return colorData.tolerance !== undefined ? `±${colorData.tolerance}%` : null;
         if (bandKey === 'tempCoefficient' && numBands === 6) return colorData.tempCoefficient !== undefined ? `${colorData.tempCoefficient}ppm` : null;
         return null;
     };

    const formatMultiplier = (value?: number): string => {
        if (value === undefined || value === null || !isFinite(value)) return 'N/A';
        if (value >= 1e9) return `${value / 1e9}G`;
        if (value >= 1e6) return `${value / 1e6}M`;
        if (value >= 1e3) return `${value / 1e3}k`;
        if (value === 0.1) return '0.1';
        if (value === 0.01) return '0.01';
        return String(value);
    };


    // --- Resistor Visualization Band Colors ---
    const visBand1Color = bands.band1;
    const visBand2Color = bands.band2;
    const visBand3Color = band3IsMultiplier ? undefined : bands.band3;
    const visMultiplierColor = band3IsMultiplier ? bands.band3 : bands.multiplier;
    const visToleranceColor = band4IsTolerance ? bands.multiplier : bands.tolerance;
    const visTempCoColor = showTempCo ? bands.tempCoefficient : undefined;


    return (
        <div className="container mx-auto px-4 py-8">
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
                                        <SelectItem value="4">4 Bands (Digits, Multiplier, Tolerance)</SelectItem>
                                        <SelectItem value="5">5 Bands (Digits, Multiplier, Tolerance)</SelectItem>
                                        <SelectItem value="6">6 Bands (Digits, Multiplier, Tolerance, TempCo)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                           {/* Resistor Visualization */}
                            <div className="bg-yellow-100 rounded-md p-4 flex items-center justify-center space-x-1 h-16 relative">
                                <div className="h-full w-4 bg-yellow-200 rounded-l-sm"></div> {/* Left Lead Area */}
                                <div className="h-full flex-1 bg-yellow-200 relative flex items-center px-2 space-x-1 md:space-x-2">
                                    {/* Bands - Positions adjust slightly based on band count */}
                                    <div className="absolute left-2 w-1 h-full rounded-sm" style={getBandStyle(visBand1Color)}></div>
                                    <div className={cn("absolute w-1 h-full rounded-sm", "left-4 md:left-5")} style={getBandStyle(visBand2Color)}></div>
                                    {/* Band 3 (Digit or Multiplier) */}
                                    <div className={cn("absolute w-1 h-full rounded-sm", "left-6 md:left-8")} style={getBandStyle(band3IsMultiplier ? visMultiplierColor : visBand3Color)}></div>
                                    {/* Band 4 (Multiplier or Tolerance) */}
                                    {(numBands >= 5 || numBands === 4) && <div className={cn("absolute w-1 h-full rounded-sm", numBands === 4 ? "right-5" : "left-8 md:left-11")} style={getBandStyle(numBands === 4 ? visToleranceColor : visMultiplierColor)}></div>}
                                    {/* Band 5 (Tolerance) */}
                                    {band5IsTolerance && <div className={cn("absolute w-1 h-full rounded-sm", "right-6 md:right-8")} style={getBandStyle(visToleranceColor)}></div>}
                                    {/* Band 6 (Temp Co) */}
                                    {visTempCoColor && <div className="absolute right-3 md:right-4 w-1 h-full rounded-sm" style={getBandStyle(visTempCoColor)}></div>}
                                </div>
                                <div className="h-full w-4 bg-yellow-200 rounded-r-sm"></div> {/* Right Lead Area */}
                            </div>

                            {/* Band Selectors Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {renderBandSelect('band1', 'Digit 1', 'First significant digit.', digitColors, true)}
                                {renderBandSelect('band2', 'Digit 2', 'Second significant digit.', digitColors, true)}
                                {/* Conditional rendering based on numBands */}
                                {showBand3Digit && renderBandSelect('band3', 'Digit 3', 'Third significant digit (for 5/6 band).', digitColors, true)}
                                {band3IsMultiplier && renderBandSelect('band3', 'Multiplier (Band 3)', 'Multiplier value for 4-band.', multiplierColors, true)}
                                {band4IsMultiplier && renderBandSelect('multiplier', 'Multiplier (Band 4)', 'Multiplier value for 5/6 band.', multiplierColors, true)}
                                {band4IsTolerance && renderBandSelect('multiplier', 'Tolerance (Band 4)', 'Tolerance percentage for 4-band.', toleranceColors, true)}
                                {band5IsTolerance && renderBandSelect('tolerance', 'Tolerance (Band 5)', 'Tolerance percentage for 5/6 band.', toleranceColors, true)}
                                {showTempCo && renderBandSelect('tempCoefficient', 'Temp. Coeff. (Band 6)', 'Temperature Coefficient (ppm/°C). Optional.', tempCoColors, false)}
                            </div>


                            {/* Result Display */}
                            <div className="pt-6 border-t space-y-2">
                                <h4 className="font-semibold text-lg">Calculated Value:</h4>
                                 {/* Display Band Error Message */}
                                 {bandToValueResult.error && (
                                    <p className="text-sm text-destructive flex items-center gap-1">
                                        <AlertCircle size={16} /> {bandToValueResult.error}
                                    </p>
                                )}
                                {!bandToValueResult.error && bandToValueResult.resistance !== null ? (
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
                                    // Don't show this generic message if a specific error is already shown
                                    !bandToValueResult.error && <p className="text-muted-foreground italic">Select valid colors for all required bands.</p>
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
                                     <p className="text-xs text-muted-foreground">Use k, M, G (e.g., 4k7, 1.5M). Case insensitive.</p>
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
                                            <div className="absolute left-2 w-1 h-full rounded-sm" style={getBandStyle(calculatedBands.band1)}></div>
                                            <div className="absolute left-4 md:left-5 w-1 h-full rounded-sm" style={getBandStyle(calculatedBands.band2)}></div>
                                            {/* Band 3: Digit (5/6) or Multiplier (4) */}
                                            <div className={cn("absolute w-1 h-full rounded-sm", "left-6 md:left-8")} style={getBandStyle(calculatedBands.band3)}></div>
                                            {/* Band 4: Multiplier (5/6) or Tolerance (4) */}
                                            <div className={cn("absolute w-1 h-full rounded-sm", valueToBandNumBands === 4 ? "right-5" : "left-8 md:left-11")} style={getBandStyle(valueToBandNumBands === 4 ? calculatedBands.multiplier : calculatedBands.multiplier)}></div> {/* Multiplier role varies */}
                                            {/* Band 5: Tolerance (5/6) */}
                                            {valueToBandNumBands >= 5 && <div className={cn("absolute w-1 h-full rounded-sm", "right-6 md:right-8")} style={getBandStyle(calculatedBands.tolerance)}></div>}
                                            {/* Band 6: TempCo (6) */}
                                            {valueToBandNumBands === 6 && <div className="absolute right-3 md:right-4 w-1 h-full rounded-sm" style={getBandStyle(calculatedBands.tempCoefficient)}></div>}
                                        </div>
                                        <div className="h-full w-4 bg-yellow-200 rounded-r-sm"></div>
                                    </div>
                                    {/* Textual Band Colors */}
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                                        <p><strong>Band 1:</strong> {calculatedBands.band1 || 'N/A'}</p>
                                        <p><strong>Band 2:</strong> {calculatedBands.band2 || 'N/A'}</p>
                                        <p><strong>Band 3:</strong> {calculatedBands.band3 || 'N/A'}</p>
                                        <p><strong>Band 4:</strong> {calculatedBands.multiplier || 'N/A'}</p>
                                        {valueToBandNumBands >= 5 && <p><strong>Band 5 (Tol):</strong> {calculatedBands.tolerance || 'N/A'}</p>}
                                        {valueToBandNumBands === 6 && <p><strong>Band 6 (Temp):</strong> {calculatedBands.tempCoefficient || 'N/A'}</p>}
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
