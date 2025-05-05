
'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Palette, Sigma, Thermometer, HelpCircle, RotateCcw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { calculateResistorFromBands, valueToResistorBands } from '@/lib/calculator-utils';
import type { ResistorBands, ResistorResult, ResistorBandColor } from '@/types/calculator';
import { ResistorColorMap } from '@/types/calculator';
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


// Define available colors for each band type
const digitColors: ResistorBandColor[] = ['black', 'brown', 'red', 'orange', 'yellow', 'green', 'blue', 'violet', 'gray', 'white'];
const multiplierColors: ResistorBandColor[] = ['black', 'brown', 'red', 'orange', 'yellow', 'green', 'blue', 'violet', 'gray', 'white', 'gold', 'silver'];
const toleranceColors: ResistorBandColor[] = ['brown', 'red', 'green', 'blue', 'violet', 'gray', 'gold', 'silver', 'none'];
const tempCoColors: ResistorBandColor[] = ['brown', 'red', 'orange', 'yellow', 'blue', 'violet', 'gray']; // Based on common values

// Initial default bands based on number of bands
const getDefaultBands = (numBands: 4 | 5 | 6): ResistorBands => {
    if (numBands === 4) return { band1: 'brown', band2: 'black', band3: 'red', multiplier: 'gold' }; // Band 3 is Multiplier, Multiplier field is Tolerance
    if (numBands === 5) return { band1: 'brown', band2: 'black', band3: 'black', multiplier: 'red', tolerance: 'brown' };
    return { band1: 'brown', band2: 'black', band3: 'black', multiplier: 'red', tolerance: 'brown', tempCoefficient: 'brown' };
};

const initialNumBands: 4 | 5 | 6 = 4;
const initialBands = getDefaultBands(initialNumBands);
const initialValueToBandNumBands: 4 | 5 | 6 = 4;
const initialResistanceInput = '1k';
const initialToleranceInput = 5;

const getBandStyle = (color?: ResistorBandColor) => {
    if (!color || color === 'none') return { backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))', border: '1px dashed hsl(var(--border))' };

     const variableStyleMap: Record<ResistorBandColor, React.CSSProperties> = {
         black: { backgroundColor: '#000000', color: '#ffffff' },
         brown: { backgroundColor: '#a52a2a', color: '#ffffff' },
         red: { backgroundColor: '#ff0000', color: '#ffffff' },
         orange: { backgroundColor: '#ffa500', color: '#000000' },
         yellow: { backgroundColor: '#ffff00', color: '#000000' },
         green: { backgroundColor: '#008000', color: '#ffffff' },
         blue: { backgroundColor: '#0000ff', color: '#ffffff' },
         violet: { backgroundColor: '#ee82ee', color: '#000000' },
         gray: { backgroundColor: '#808080', color: '#ffffff' },
         white: { backgroundColor: '#ffffff', color: '#000000', border: '1px solid #ccc' },
         gold: { backgroundColor: '#ffd700', color: '#000000' },
         silver: { backgroundColor: '#c0c0c0', color: '#000000' },
         none: { backgroundColor: 'transparent', color: 'hsl(var(--muted-foreground))' }
     };
     return variableStyleMap[color];
};


export default function ResistorCalculatorPage() {
    const [mode, setMode] = useState<'bandToValue' | 'valueToBand'>('bandToValue');
    const [numBands, setNumBands] = useState<4 | 5 | 6>(initialNumBands);
    const [bandError, setBandError] = useState<string | null>(null);

    // State for Band -> Value mode
    const [bands, setBands] = useState<ResistorBands>(initialBands);


    // State for Value -> Band mode
    const [resistanceInput, setResistanceInput] = useState<string>(initialResistanceInput);
    const [toleranceInput, setToleranceInput] = useState<number | null>(initialToleranceInput);
    const [calculatedBands, setCalculatedBands] = useState<ResistorBands | null>(null);
    const [valueToBandError, setValueToBandError] = useState<string | null>(null);
    const [valueToBandNumBands, setValueToBandNumBands] = useState<4 | 5 | 6>(initialValueToBandNumBands);


    const { toast } = useToast();

    // Determine band roles based on numBands
    const showBand3Digit = numBands >= 5;
    const showTempCo = numBands === 6;
    const multiplierBandKey: keyof ResistorBands = numBands === 4 ? 'band3' : 'multiplier';
    const toleranceBandKey: keyof ResistorBands = numBands === 4 ? 'multiplier' : 'tolerance';


     // --- Band to Value Calculation ---
    const bandToValueResult = useMemo<ResistorResult & { error?: string }>(() => {
        let currentError: string | null = null;
        const hasSomeInput = Object.values(bands).some(val => val !== undefined);
        let missingBands: string[] = [];

        // Basic Validation: Check required bands
        if (hasSomeInput) {
            if (!bands.band1) missingBands.push("Digit 1");
            if (!bands.band2) missingBands.push("Digit 2");
            if (numBands >= 5 && !bands.band3) missingBands.push("Digit 3");
            if (!bands[multiplierBandKey]) missingBands.push("Multiplier");
            if (!bands[toleranceBandKey] && !(numBands === 4 && bands.multiplier === undefined)) { // Tol required unless 4-band and its slot is empty
                 missingBands.push("Tolerance");
            }
            // TempCo is optional

            if (missingBands.length > 0) {
                 currentError = `Select colors for required bands: ${missingBands.join(', ')}.`;
            }
        }

        let calculationResult: ResistorResult = { resistance: null, tolerance: null, tempCoefficient: null, resistanceString: 'N/A' };

        // Proceed with calculation only if no missing bands error
        if (!currentError && hasSomeInput) {
             calculationResult = calculateResistorFromBands(bands, numBands);

            // Additional checks after calculation
             if (calculationResult.resistance === null && missingBands.length === 0) { // Check if calc failed despite inputs seeming complete
                currentError = "Calculation failed. Check band selections.";
            } else if (calculationResult.resistance !== null && Math.abs(calculationResult.resistance) > 1e9) {
                const multColor = bands[multiplierBandKey];
                if (multColor === 'gold' || multColor === 'silver') {
                    currentError = "Warning: High resistance value with Gold/Silver multiplier might be unrealistic.";
                }
            }
        } else if (!hasSomeInput) {
             currentError = null; // No error if no input yet
        }

        setBandError(currentError); // Update stateful error

        return { ...calculationResult, error: currentError };
    }, [bands, numBands, multiplierBandKey, toleranceBandKey]);


    const handleBandChange = (bandName: keyof ResistorBands, color: ResistorBandColor | 'select') => {
         const newColor = (color === 'select') ? undefined : color;
         setBands(prev => ({ ...prev, [bandName]: newColor }));
    };


    // Reset bands when numBands changes
     useEffect(() => {
         const newDefaultBands = getDefaultBands(numBands);
         setBands(newDefaultBands);
         setBandError(null);
     }, [numBands]);


    // --- Value to Band Calculation ---
     const handleValueToBandCalculation = useCallback(() => {
        setValueToBandError(null);
        setCalculatedBands(null);

        if (!resistanceInput) return;

        const result = valueToResistorBands(resistanceInput, toleranceInput, [valueToBandNumBands]);

        if (result.error) {
            setValueToBandError(result.error);
        } else if (result.bands) {
            setCalculatedBands(result.bands);
            if (result.numBands && result.numBands !== valueToBandNumBands) {
                setValueToBandNumBands(result.numBands);
            }
        }
    }, [resistanceInput, toleranceInput, valueToBandNumBands]);

    // Trigger calculation when inputs change in Value -> Band mode
     useEffect(() => {
         if (mode === 'valueToBand') {
             const handler = setTimeout(() => {
                handleValueToBandCalculation();
             }, 300); // Debounce
             return () => clearTimeout(handler);
         }
     }, [resistanceInput, toleranceInput, valueToBandNumBands, mode, handleValueToBandCalculation]);

     // Reset Handlers
    const resetBandToValue = () => {
         setNumBands(initialNumBands);
         setBands(getDefaultBands(initialNumBands));
         setBandError(null);
     };

     const resetValueToBand = () => {
         setResistanceInput(initialResistanceInput);
         setToleranceInput(initialToleranceInput);
         setValueToBandNumBands(initialValueToBandNumBands);
         setCalculatedBands(null);
         setValueToBandError(null);
     };


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
                             {required && <span className="text-destructive">*</span>}
                            <HelpCircle size={12} className="opacity-50"/>
                        </Label>
                        <Select
                            value={bands[bandKey] || 'select'}
                            onValueChange={(value) => handleBandChange(bandKey, value as ResistorBandColor | 'select')}
                            required={required}
                        >
                            <SelectTrigger
                                id={bandKey}
                                className={cn(
                                    "h-8 w-full",
                                    !bands[bandKey] && required && bandError ? "border-destructive focus:ring-destructive" : "", // Highlight if required and error exists
                                    bands[bandKey] ? 'font-medium' : 'text-muted-foreground'
                                )}
                                aria-label={`Select ${label}`}
                            >
                                <SelectValue placeholder="Select Color" />
                            </SelectTrigger>
                            <SelectContent>
                                {(!required || bandKey === 'tempCoefficient') && <SelectItem value="select">-- Optional --</SelectItem>}
                                {availableColors.map(color => (
                                    <SelectItem key={color} value={color}>
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="inline-block w-3 h-3 rounded-full border"
                                                style={getBandStyle(color)}
                                            ></span>
                                            {color.charAt(0).toUpperCase() + color.slice(1)}
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
                         {!bands[bandKey] && required && bandError && bandError.includes(label) && (
                            <p className="text-xs text-destructive mt-1">{label} is required.</p>
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
        if (bandKey === multiplierBandKey) return colorData.multiplier !== undefined ? `x${formatMultiplier(colorData.multiplier)}` : null;
        if (bandKey === toleranceBandKey) return colorData.tolerance !== undefined ? `±${colorData.tolerance}%` : null;
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
    const visBand3Color = showBand3Digit ? bands.band3 : undefined; // Digit 3 only for 5/6
    const visMultiplierColor = bands[multiplierBandKey];
    const visToleranceColor = bands[toleranceBandKey];
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
                                <div className="h-full w-4 bg-yellow-200 rounded-l-sm"></div>
                                <div className="h-full flex-1 bg-yellow-200 relative flex items-center px-2 space-x-1 md:space-x-2">
                                    <div className="absolute left-2 w-1 h-full rounded-sm" style={getBandStyle(visBand1Color)}></div>
                                    <div className={cn("absolute w-1 h-full rounded-sm", "left-4 md:left-5")} style={getBandStyle(visBand2Color)}></div>
                                    {/* Band 3: Digit or Multiplier */}
                                    {numBands >= 5 && <div className={cn("absolute w-1 h-full rounded-sm", "left-6 md:left-8")} style={getBandStyle(visBand3Color)}></div>}
                                    {numBands === 4 && <div className={cn("absolute w-1 h-full rounded-sm", "left-6 md:left-8")} style={getBandStyle(visMultiplierColor)}></div>} {/* Multiplier */}
                                    {/* Band 4: Multiplier or Tolerance */}
                                    {numBands >= 5 && <div className={cn("absolute w-1 h-full rounded-sm", "left-8 md:left-11")} style={getBandStyle(visMultiplierColor)}></div>} {/* Multiplier */}
                                    {numBands === 4 && <div className={cn("absolute w-1 h-full rounded-sm", "right-6 md:right-8")} style={getBandStyle(visToleranceColor)}></div>} {/* Tolerance */}
                                    {/* Band 5: Tolerance */}
                                    {numBands >= 5 && <div className={cn("absolute w-1 h-full rounded-sm", "right-6 md:right-8")} style={getBandStyle(visToleranceColor)}></div>}
                                    {/* Band 6: TempCo */}
                                    {numBands === 6 && <div className="absolute right-3 md:right-4 w-1 h-full rounded-sm" style={getBandStyle(visTempCoColor)}></div>}
                                </div>
                                <div className="h-full w-4 bg-yellow-200 rounded-r-sm"></div>
                            </div>


                            {/* Band Selectors Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {renderBandSelect('band1', 'Digit 1', 'First significant digit.', digitColors, true)}
                                {renderBandSelect('band2', 'Digit 2', 'Second significant digit.', digitColors, true)}
                                {showBand3Digit && renderBandSelect('band3', 'Digit 3', 'Third significant digit (for 5/6 band).', digitColors, true)}
                                {/* Multiplier Band: Key depends on numBands */}
                                {renderBandSelect(multiplierBandKey, 'Multiplier', `Multiplier value (Band ${numBands === 4 ? 3 : 4}).`, multiplierColors, true)}
                                {/* Tolerance Band: Key depends on numBands */}
                                {renderBandSelect(toleranceBandKey, 'Tolerance', `Tolerance percentage (Band ${numBands === 4 ? 4 : 5}).`, toleranceColors, true)}
                                {showTempCo && renderBandSelect('tempCoefficient', 'Temp. Coeff.', 'Temperature Coefficient (ppm/°C) (Band 6). Optional.', tempCoColors, false)}
                            </div>


                             <Button variant="outline" onClick={resetBandToValue} className="w-full md:w-auto mt-2">
                                <RotateCcw className="mr-2 h-4 w-4" /> Reset Bands
                             </Button>


                            {/* Result Display */}
                            <div className="pt-6 border-t space-y-2">
                                <h4 className="font-semibold text-lg">Calculated Value:</h4>
                                 {bandError && (
                                    <p className="text-sm text-destructive flex items-center gap-1">
                                        <AlertCircle size={16} /> {bandError}
                                    </p>
                                )}
                                {bandToValueResult.resistance !== null && !bandError ? (
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
                                     !bandError && <p className="text-muted-foreground italic">Select colors to see result.</p>
                                )}
                            </div>
                        </CardContent>
                    </TabsContent>

                     {/* --- Value to Band Tab --- */}
                    <TabsContent value="valueToBand">
                        <CardContent className="space-y-6">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                            <Button variant="outline" onClick={resetValueToBand} className="w-full md:w-auto mt-2">
                                <RotateCcw className="mr-2 h-4 w-4" /> Reset Value
                            </Button>


                            {valueToBandError && (
                                <p className="text-sm text-destructive flex items-center gap-1">
                                    <AlertCircle size={16} /> {valueToBandError}
                                </p>
                            )}

                            {calculatedBands && !valueToBandError && (
                                <div className="pt-6 border-t space-y-4">
                                    <h4 className="font-semibold text-lg">Calculated Bands ({valueToBandNumBands}-Band):</h4>
                                    <div className="bg-yellow-100 rounded-md p-4 flex items-center justify-center space-x-1 h-16 relative">
                                        <div className="h-full w-4 bg-yellow-200 rounded-l-sm"></div>
                                        <div className="h-full flex-1 bg-yellow-200 relative flex items-center px-2 space-x-1 md:space-x-2">
                                            <div className="absolute left-2 w-1 h-full rounded-sm" style={getBandStyle(calculatedBands.band1)}></div>
                                            <div className="absolute left-4 md:left-5 w-1 h-full rounded-sm" style={getBandStyle(calculatedBands.band2)}></div>
                                            {/* Band 3: Digit (5/6) or Multiplier (4) */}
                                            <div className={cn("absolute w-1 h-full rounded-sm", "left-6 md:left-8")} style={getBandStyle(calculatedBands.band3)}></div>
                                            {/* Band 4: Multiplier (5/6) or Tolerance (4) */}
                                            <div className={cn("absolute w-1 h-full rounded-sm", valueToBandNumBands === 4 ? "right-6 md:right-8" : "left-8 md:left-11")} style={getBandStyle(calculatedBands.multiplier)}></div>
                                            {/* Band 5: Tolerance (5/6) */}
                                            {valueToBandNumBands >= 5 && <div className={cn("absolute w-1 h-full rounded-sm", "right-6 md:right-8")} style={getBandStyle(calculatedBands.tolerance)}></div>}
                                            {/* Band 6: TempCo (6) */}
                                            {valueToBandNumBands === 6 && <div className="absolute right-3 md:right-4 w-1 h-full rounded-sm" style={getBandStyle(calculatedBands.tempCoefficient)}></div>}
                                        </div>
                                        <div className="h-full w-4 bg-yellow-200 rounded-r-sm"></div>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                                        <p><strong>Band 1:</strong> {calculatedBands.band1 || 'N/A'}</p>
                                        <p><strong>Band 2:</strong> {calculatedBands.band2 || 'N/A'}</p>
                                        {/* Label Band 3 according to role */}
                                        <p><strong>Band 3 ({valueToBandNumBands >= 5 ? 'Digit' : 'Multiplier'}):</strong> {calculatedBands.band3 || 'N/A'}</p>
                                        {/* Label Band 4 according to role */}
                                        <p><strong>Band 4 ({valueToBandNumBands >= 5 ? 'Multiplier' : 'Tolerance'}):</strong> {calculatedBands.multiplier || 'N/A'}</p>
                                        {valueToBandNumBands >= 5 && <p><strong>Band 5 (Tolerance):</strong> {calculatedBands.tolerance || 'N/A'}</p>}
                                        {valueToBandNumBands === 6 && <p><strong>Band 6 (TempCo):</strong> {calculatedBands.tempCoefficient || 'N/A'}</p>}
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
