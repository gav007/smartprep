// src/components/calculators/ResistorColorCodeCalculator.tsx
'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Palette, Sigma, Thermometer, HelpCircle, RotateCcw, Copy } from 'lucide-react';
import CalculatorCard from './CalculatorCard'; // Import shared card
import CalculatorInput from './CalculatorInput'; // Import shared input (for value->band mode)
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { calculateResistorFromBands, valueToResistorBands, ResistorColorMap } from '@/lib/calculator-utils';
import type { ResistorBands, ResistorResult, ResistorBandColor } from '@/types/calculator';
import { cn } from "@/lib/utils";
import { formatResultValue } from '@/lib/units'; // Import centralized formatter


// Define available colors for each band type - Centralize these if used elsewhere
const digitColors: ResistorBandColor[] = ['black', 'brown', 'red', 'orange', 'yellow', 'green', 'blue', 'violet', 'gray', 'white'];
const multiplierColorsMap: { [key in ResistorBandColor]?: number } = {
    black: 1, brown: 10, red: 100, orange: 1e3, yellow: 10e3, green: 100e3, blue: 1e6, violet: 10e6, gray: 100e6, white: 1e9, gold: 0.1, silver: 0.01
};
const multiplierColors: ResistorBandColor[] = Object.keys(multiplierColorsMap) as ResistorBandColor[];

const toleranceColorsMap: { [key in ResistorBandColor]?: number } = {
    brown: 1, red: 2, green: 0.5, blue: 0.25, violet: 0.1, gray: 0.05, gold: 5, silver: 10, none: 20
};
const toleranceColors: ResistorBandColor[] = Object.keys(toleranceColorsMap) as ResistorBandColor[];

const tempCoColorsMap: { [key in ResistorBandColor]?: number } = {
    brown: 100, red: 50, orange: 15, yellow: 25, blue: 10, violet: 5, gray: 1 // Added gray
};
const tempCoColors: ResistorBandColor[] = Object.keys(tempCoColorsMap) as ResistorBandColor[];

// Initial default bands based on number of bands
const getDefaultBands = (numBands: 4 | 5 | 6): ResistorBands => {
    if (numBands === 4) return { band1: 'brown', band2: 'black', band3: 'red', multiplier: 'gold' }; // Band 3 is Multiplier, multiplier field holds Tolerance color
    if (numBands === 5) return { band1: 'brown', band2: 'black', band3: 'black', multiplier: 'red', tolerance: 'brown' };
    return { band1: 'brown', band2: 'black', band3: 'black', multiplier: 'red', tolerance: 'brown', tempCoefficient: 'brown' };
};

const initialNumBands: 4 | 5 | 6 = 4;
const initialBands = getDefaultBands(initialNumBands);
const initialValueToBandNumBands: 4 | 5 | 6 = 4;
const initialResistanceInput = '1k';
const initialToleranceInput = 5;

const getBandStyle = (color?: ResistorBandColor): React.CSSProperties => {
    if (!color || color === 'none') return { backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))', border: '1px dashed hsl(var(--border))' };
    const styleMap: Record<ResistorBandColor, React.CSSProperties> = {
         black: { backgroundColor: '#333', color: '#fff', border: '1px solid #555' }, // Darker black
         brown: { backgroundColor: '#a52a2a', color: '#fff' },
         red: { backgroundColor: '#ff0000', color: '#fff' },
         orange: { backgroundColor: '#ffa500', color: '#000' },
         yellow: { backgroundColor: '#ffff00', color: '#000' },
         green: { backgroundColor: '#008000', color: '#fff' },
         blue: { backgroundColor: '#0077cc', color: '#fff' }, // Slightly adjusted blue
         violet: { backgroundColor: '#9400d3', color: '#fff' }, // Darker violet
         gray: { backgroundColor: '#808080', color: '#fff' },
         white: { backgroundColor: '#ffffff', color: '#000', border: '1px solid #ccc' },
         gold: { backgroundColor: '#ffd700', color: '#000' },
         silver: { backgroundColor: '#c0c0c0', color: '#000' },
         none: { backgroundColor: 'transparent', color: 'hsl(var(--muted-foreground))', border: 'none' }
     };
     return styleMap[color];
};

export default function ResistorColorCodeCalculator() {
    const [mode, setMode] = useState<'bandToValue' | 'valueToBand'>('bandToValue');
    const [numBands, setNumBands] = useState<4 | 5 | 6>(initialNumBands);
    const [bandError, setBandError] = useState<string | null>(null);
    const [bands, setBands] = useState<ResistorBands>(initialBands);

    const [resistanceInput, setResistanceInput] = useState<string>(initialResistanceInput);
    const [toleranceInput, setToleranceInput] = useState<number | null>(initialToleranceInput);
    const [calculatedBands, setCalculatedBands] = useState<ResistorBands | null>(null);
    const [valueToBandError, setValueToBandError] = useState<string | null>(null);
    const [valueToBandNumBands, setValueToBandNumBands] = useState<4 | 5 | 6>(initialValueToBandNumBands);

    const { toast } = useToast();

    // --- Determine band roles based on numBands ---
    const showBand3Digit = numBands === 5 || numBands === 6;
    const showTempCo = numBands === 6;
    const multiplierBandKey: keyof ResistorBands = numBands === 4 ? 'band3' : 'multiplier'; // In 4-band, band3 IS the multiplier
    const toleranceBandKey: keyof ResistorBands = numBands === 4 ? 'multiplier' : 'tolerance'; // In 4-band, multiplier field holds tolerance color

    // Define boolean flags for band roles based on numBands
    const band3IsMultiplier = numBands === 4;
    const band4IsMultiplier = numBands === 5 || numBands === 6;
    const band4IsTolerance = numBands === 4;
    const band5IsTolerance = numBands === 5 || numBands === 6;

    // --- Band to Value Calculation ---
    const bandToValueResult = useMemo<ResistorResult & { error?: string }>(() => {
        let currentError: string | undefined = undefined;
        let result: ResistorResult = { resistance: null, tolerance: null, tempCoefficient: null, resistanceString: 'N/A' };

        // Validation: Check if all *required* bands for the selected numBands are set
        const requiredBandsSet =
            bands.band1 &&
            bands.band2 &&
            (numBands === 4 ? bands.band3 && bands.multiplier : false) || // Band 3 is multiplier, Multiplier field is tolerance for 4-band
            (numBands >= 5 ? bands.band3 && bands.multiplier && bands.tolerance : false); // Digit 3, Multiplier, Tolerance for 5/6-band

        if (requiredBandsSet) {
             result = calculateResistorFromBands(bands, numBands);
             if (result.resistance === null) {
                currentError = "Calculation failed. Check band values.";
             } else if (Math.abs(result.resistance) > 1e9) { // Example: Check for unrealistic high value with low multiplier
                  const multColor = numBands === 4 ? bands.band3 : bands.multiplier;
                  if (multColor === 'gold' || multColor === 'silver') {
                      currentError = "Warning: High resistance with Gold/Silver multiplier.";
                  }
             }
        } else {
             // Don't show error if no bands are selected yet, only if some are selected but required ones are missing
             const someBandsSelected = Object.values(bands).some(b => b !== undefined);
             if (someBandsSelected) {
                 currentError = "Please select colors for all required bands.";
             }
             result = { resistance: null, tolerance: null, tempCoefficient: null, resistanceString: 'N/A' };
        }

        setBandError(currentError); // Update stateful error
        return { ...result, error: currentError };

    }, [bands, numBands]);

    const handleBandChange = (bandName: keyof ResistorBands, color: ResistorBandColor | 'select') => {
         const newColor = (color === 'select') ? undefined : color;
         setBands(prev => ({ ...prev, [bandName]: newColor }));
         // Error is handled by useMemo
    };

    // Reset bands when numBands changes in Band->Value mode
    useEffect(() => {
        if (mode === 'bandToValue') {
             const newDefaultBands = getDefaultBands(numBands);
             setBands(newDefaultBands);
             setBandError(null); // Clear errors on reset
        }
    }, [numBands, mode]);

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
            // Auto-switch number of bands if calculation requires it (e.g., 4.7k needs 4 bands)
             if (result.numBands && result.numBands !== valueToBandNumBands) {
                 setValueToBandNumBands(result.numBands);
             }
        }
    }, [resistanceInput, toleranceInput, valueToBandNumBands]);

    // Trigger calculation when inputs change in Value -> Band mode (debounced)
     useEffect(() => {
         if (mode === 'valueToBand') {
             const handler = setTimeout(handleValueToBandCalculation, 300);
             return () => clearTimeout(handler);
         }
     }, [resistanceInput, toleranceInput, valueToBandNumBands, mode, handleValueToBandCalculation]);

     // --- Reset Handlers ---
    const resetBandToValue = useCallback(() => {
         // setNumBands(initialNumBands); // This will trigger the useEffect below
         setBands(getDefaultBands(numBands)); // Reset to defaults for current band number
         setBandError(null);
     }, [numBands]); // Depend on numBands to reset correctly for the current setting

     const resetValueToBand = useCallback(() => {
         setResistanceInput(initialResistanceInput);
         setToleranceInput(initialToleranceInput);
         setValueToBandNumBands(initialValueToBandNumBands);
         setCalculatedBands(null);
         setValueToBandError(null);
     }, []);

     // Combined Reset for Tab Change
      const handleTabChange = (newMode: string) => {
          setMode(newMode as 'bandToValue' | 'valueToBand');
          if (newMode === 'bandToValue') {
              resetValueToBand(); // Clear value->band state
              resetBandToValue(); // Reset band->value state to defaults
          } else {
              resetBandToValue(); // Clear band->value state
              resetValueToBand(); // Reset value->band state to defaults
          }
      };

    // --- Helper Functions ---
    const copyToClipboard = useCallback((text: string | number | null | undefined, label: string) => {
        const textToCopy = String(text ?? '');
        if (!textToCopy || textToCopy === 'N/A') return;
        navigator.clipboard.writeText(textToCopy).then(() => {
            toast({ title: "Copied", description: `${label} copied to clipboard.` });
        }).catch(err => {
            toast({ title: "Copy Failed", description: "Could not copy.", variant: "destructive" });
            console.error('Copy failed:', err);
        });
    }, [toast]);

    const formatDisplayMultiplier = (value?: number): string => {
        if (value === undefined || value === null || !isFinite(value)) return 'N/A';
        if (value >= 1e9) return `×${value / 1e9}G`;
        if (value >= 1e6) return `×${value / 1e6}M`;
        if (value >= 1e3) return `×${value / 1e3}k`;
        if (value === 0.1) return '×0.1';
        if (value === 0.01) return '×0.01';
        return `×${value}`;
    };

    // --- Render Band Selector Dropdown ---
    const renderBandSelect = (
        bandKey: keyof ResistorBands,
        label: string,
        tooltipText: string,
        availableColors: ResistorBandColor[],
        required: boolean = true
    ) => {
        const colorMap = bandKey === multiplierBandKey ? multiplierColorsMap :
                         bandKey === toleranceBandKey ? toleranceColorsMap :
                         bandKey === 'tempCoefficient' ? tempCoColorsMap :
                         ResistorColorMap; // Fallback to digit map

        return (
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
                                required={required}
                                aria-label={`Select ${label}`}
                            >
                                <SelectTrigger
                                    id={bandKey}
                                    className={cn(
                                        "h-9 w-full", // Standardized height
                                        !bands[bandKey] && required && bandError && bandError.includes('required bands') ? "border-destructive focus:ring-destructive" : "",
                                        bands[bandKey] ? 'font-medium' : 'text-muted-foreground'
                                    )}
                                >
                                    <SelectValue placeholder="Select Color" />
                                </SelectTrigger>
                                <SelectContent>
                                    {(!required || bandKey === 'tempCoefficient') && <SelectItem value="select">-- Optional --</SelectItem>}
                                    {availableColors.map(color => {
                                        // Corrected logic to get display value based on actual role
                                        let displayValue = '';
                                        if (bandKey === 'band1' || bandKey === 'band2' || (bandKey === 'band3' && showBand3Digit)) {
                                            displayValue = String(ResistorColorMap[color]?.digit ?? '');
                                        } else if (
                                            (bandKey === 'band3' && band3IsMultiplier) ||
                                            (bandKey === 'multiplier' && band4IsMultiplier)
                                        ) {
                                            displayValue = formatDisplayMultiplier(multiplierColorsMap[color]);
                                        } else if (
                                            (bandKey === 'multiplier' && band4IsTolerance) ||
                                            (bandKey === 'tolerance' && band5IsTolerance)
                                        ) {
                                            displayValue = `±${toleranceColorsMap[color]}%`;
                                        } else if (bandKey === 'tempCoefficient' && showTempCo) {
                                            displayValue = `${tempCoColorsMap[color]}ppm`;
                                        }


                                        return (
                                            <SelectItem key={color} value={color}>
                                                <div className="flex items-center gap-2">
                                                    <span className="inline-block w-3 h-3 rounded-full border" style={getBandStyle(color)}></span>
                                                    {color.charAt(0).toUpperCase() + color.slice(1)}
                                                    {displayValue && <span className="ml-auto text-xs text-muted-foreground">{displayValue}</span>}
                                                </div>
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent><p>{tooltipText}</p></TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    };

    // --- Resistor Visualization Band Colors ---
    const visBand1Color = bands.band1;
    const visBand2Color = bands.band2;
    const visBand3Color = showBand3Digit ? bands.band3 : (band3IsMultiplier ? bands.band3 : undefined); // Digit 3 or Multiplier(4)
    const visBand4Color = band4IsMultiplier ? bands.multiplier : (band4IsTolerance ? bands.multiplier : undefined); // Multiplier(5/6) or Tolerance(4)
    const visBand5Color = band5IsTolerance ? bands.tolerance : undefined; // Tolerance(5/6)
    const visTempCoColor = showTempCo ? bands.tempCoefficient : undefined;

    // --- Value to Band Visualization Colors ---
    const calcVisBand1Color = calculatedBands?.band1;
    const calcVisBand2Color = calculatedBands?.band2;
    const calcVisBand3Color = valueToBandNumBands >= 5 ? calculatedBands?.band3 : (valueToBandNumBands === 4 ? calculatedBands?.band3 : undefined); // Band 3 is Digit (5/6) or Multiplier(4)
    const calcVisBand4Color = valueToBandNumBands >= 5 ? calculatedBands?.multiplier : (valueToBandNumBands === 4 ? calculatedBands?.multiplier : undefined); // Band 4 is Multiplier(5/6) or Tolerance(4)
    const calcVisBand5Color = valueToBandNumBands >= 5 ? calculatedBands?.tolerance : undefined; // Band 5 is Tolerance
    const calcVisBand6Color = valueToBandNumBands === 6 ? calculatedBands?.tempCoefficient : undefined; // Band 6 is TempCo

    return (
        <CalculatorCard
          title="Resistor Color Code"
          description="Calculate resistance from color bands or find bands for a value."
          icon={Palette}
          className="w-full max-w-xl mx-auto"
        >
            <Tabs value={mode} onValueChange={handleTabChange}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="bandToValue">Color Bands → Value</TabsTrigger>
                    <TabsTrigger value="valueToBand">Value → Color Bands</TabsTrigger>
                </TabsList>

                {/* --- Band to Value Tab --- */}
                <TabsContent value="bandToValue">
                    <div className="space-y-6">
                        {/* Number of Bands Selector */}
                        <div className="space-y-1">
                            <Label htmlFor="numBands">Number of Bands</Label>
                            <Select value={String(numBands)} onValueChange={(v) => setNumBands(parseInt(v) as 4 | 5 | 6)}>
                                <SelectTrigger id="numBands" className="w-full"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="4">4 Bands</SelectItem>
                                    <SelectItem value="5">5 Bands</SelectItem>
                                    <SelectItem value="6">6 Bands</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Resistor Visualization */}
                        <div className="bg-yellow-100/70 dark:bg-yellow-900/30 rounded-md p-4 flex items-center justify-center space-x-1 h-16 relative shadow-inner">
                            <div className="h-full w-24 bg-gray-300 dark:bg-gray-600 rounded-l-sm"></div> {/* Left Lead */}
                            <div className="h-full flex-1 bg-yellow-200/80 dark:bg-yellow-800/50 relative flex items-center px-2 space-x-2 md:space-x-4">
                                <div className="absolute left-2 w-24 h-full rounded-sm shadow-md" style={getBandStyle(visBand1Color)}></div> {/* Band 1 */}
                                <div className={cn("absolute w-24 h-full rounded-sm shadow-md", "left-12 md:left-14")} style={getBandStyle(visBand2Color)}></div> {/* Band 2 */}
                                <div className={cn("absolute w-24 h-full rounded-sm shadow-md", "left-22 md:left-26")} style={getBandStyle(visBand3Color)}></div> {/* Band 3 */}
                                {numBands >= 4 && <div className={cn("absolute w-24 h-full rounded-sm shadow-md", numBands === 4 ? "right-7 md:right-8" : "left-11 md:left-14")} style={getBandStyle(visBand4Color)}></div>}
                                {numBands >= 5 && <div className={cn("absolute w-24 h-full rounded-sm shadow-md", "right-7 md:right-8")} style={getBandStyle(visBand5Color)}></div>}
                                {numBands === 6 && <div className="absolute right-4 md:right-5 w-4 h-full rounded-sm shadow-md" style={getBandStyle(visTempCoColor)}></div>}
                            </div>
                            <div className="h-full w-4 bg-gray-300 dark:bg-gray-600 rounded-r-sm"></div> {/* Right Lead */}
                        </div>

                        {/* Band Selectors Grid */}
                         <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                            {renderBandSelect('band1', 'Digit 1', 'First significant digit.', digitColors, true)}
                            {renderBandSelect('band2', 'Digit 2', 'Second significant digit.', digitColors, true)}
                             {/* Band 3: Digit or Multiplier */}
                            {showBand3Digit && renderBandSelect('band3', 'Digit 3', 'Third significant digit (5/6 band).', digitColors, true)}
                            {band3IsMultiplier && renderBandSelect('band3', 'Multiplier', 'Multiplier value (4-band).', multiplierColors, true)}
                             {/* Band 4: Multiplier or Tolerance */}
                             {band4IsMultiplier && renderBandSelect('multiplier', 'Multiplier', 'Multiplier value (5/6 band).', multiplierColors, true)}
                             {band4IsTolerance && renderBandSelect('multiplier', 'Tolerance', 'Tolerance percentage (4-band).', toleranceColors, true)}
                             {/* Band 5: Tolerance */}
                             {band5IsTolerance && renderBandSelect('tolerance', 'Tolerance', 'Tolerance percentage (5/6 band).', toleranceColors, true)}
                            {showTempCo && renderBandSelect('tempCoefficient', 'Temp. Coeff.', 'Temperature Coefficient (ppm/°C).', tempCoColors, false)}
                        </div>

                        {/* Reset Button */}
                        <Button variant="outline" onClick={resetBandToValue} className="w-full md:w-auto mt-2">
                            <RotateCcw className="mr-2 h-4 w-4" /> Reset Bands
                        </Button>

                        {/* Result Display */}
                        <div className="pt-6 border-t space-y-2">
                            <h4 className="font-semibold text-lg flex justify-between items-center">
                                <span>Calculated Value:</span>
                                 {bandToValueResult.resistance !== null && !bandError && (
                                     <Button
                                        variant="ghost" size="sm"
                                        onClick={() => copyToClipboard(bandToValueResult.resistanceString, "Resistance Value")}
                                        className="text-muted-foreground hover:text-primary" aria-label="Copy resistance value"
                                    ><Copy size={14} className="mr-1"/> Copy</Button>
                                )}
                            </h4>
                            {bandError && bandError.includes('required bands') && ( // Show specific error for missing bands
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Input Needed</AlertTitle>
                                    <AlertDescription>{bandError}</AlertDescription>
                                </Alert>
                            )}
                             {bandError && !bandError.includes('required bands') && !bandError.startsWith("Warning:") && ( // Show other calculation errors
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Error</AlertTitle>
                                    <AlertDescription>{bandError}</AlertDescription>
                                </Alert>
                            )}
                             {bandError && bandError.startsWith("Warning:") && ( // Show warnings
                                <Alert variant="default" className="border-amber-500/50 text-amber-700 dark:text-amber-400 dark:border-amber-500/50 [&>svg]:text-amber-600 dark:[&>svg]:text-amber-400">
                                     <AlertCircle className="h-4 w-4" />
                                     <AlertTitle>Warning</AlertTitle>
                                     <AlertDescription>{bandError.replace("Warning: ", "")}</AlertDescription>
                                </Alert>
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
                    </div>
                </TabsContent>

                {/* --- Value to Band Tab --- */}
                <TabsContent value="valueToBand">
                    <div className="space-y-6">
                         {/* Input Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <CalculatorInput
                               id="resistanceValue" label="Resistance Value" value={resistanceInput} onChange={setResistanceInput}
                               placeholder="e.g., 4.7k, 220, 1M"
                               tooltip="Enter resistance. Use k, M, G (e.g., 4k7, 1.5M). Case insensitive."
                               type="text"
                           />
                           {/* Tolerance Selector */}
                           <div className="space-y-1">
                                <Label htmlFor="toleranceValue">Tolerance (%)</Label>
                                <Select value={toleranceInput !== null ? String(toleranceInput) : 'select'} onValueChange={(v) => setToleranceInput(v === 'select' ? null : parseFloat(v))}>
                                    <SelectTrigger id="toleranceValue"><SelectValue placeholder="Select Tolerance"/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="select">-- Optional --</SelectItem>
                                        {toleranceColors.map(color => {
                                            const tolValue = toleranceColorsMap[color];
                                            return tolValue !== undefined ? (
                                                <SelectItem key={color} value={String(tolValue)}>±{tolValue}% ({color})</SelectItem>
                                            ) : null;
                                        })}
                                    </SelectContent>
                                </Select>
                           </div>
                        </div>

                        {/* Number of Bands Selector */}
                        <div className="space-y-1">
                            <Label htmlFor="numBandsValue">Desired Bands</Label>
                            <Select value={String(valueToBandNumBands)} onValueChange={(v) => setValueToBandNumBands(parseInt(v) as 4 | 5 | 6)}>
                                <SelectTrigger id="numBandsValue" className="w-full"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="4">4 Bands</SelectItem>
                                    <SelectItem value="5">5 Bands</SelectItem>
                                    <SelectItem value="6">6 Bands (Defaults TempCo)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                         {/* Reset Button */}
                        <Button variant="outline" onClick={resetValueToBand} className="w-full md:w-auto mt-2">
                            <RotateCcw className="mr-2 h-4 w-4" /> Reset Value
                        </Button>

                        {/* Error Display */}
                        {valueToBandError && (
                             <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{valueToBandError}</AlertDescription>
                            </Alert>
                        )}

                        {/* Calculated Bands Display */}
                        {calculatedBands && !valueToBandError && (
                            <div className="pt-6 border-t space-y-4">
                                <h4 className="font-semibold text-lg">Calculated Bands ({valueToBandNumBands}-Band):</h4>
                                {/* Visualization */}
                                <div className="bg-yellow-100/70 dark:bg-yellow-900/30 rounded-md p-4 flex items-center justify-center space-x-1 h-16 relative shadow-inner">
                                    <div className="h-full w-24 bg-gray-300 dark:bg-gray-600 rounded-l-sm"></div>
                                    <div className="h-full flex-1 bg-yellow-200/80 dark:bg-yellow-800/50 relative flex items-center px-2 space-x-2 md:space-x-4">
                                        <div className="absolute left-2 w-24 h-full rounded-sm shadow-md" style={getBandStyle(calcVisBand1Color)}></div>
                                        <div className={cn("absolute w-24 h-full rounded-sm shadow-md", "left-12 md:left-14")} style={getBandStyle(calcVisBand2Color)}></div>
                                        <div className={cn("absolute w-24 h-full rounded-sm shadow-md", "left-22 md:left-26")} style={getBandStyle(calcVisBand3Color)}></div>
                                        {valueToBandNumBands >= 4 && <div className={cn("absolute w-24 h-full rounded-sm shadow-md", valueToBandNumBands === 4 ? "right-7 md:right-8" : "left-11 md:left-14")} style={getBandStyle(calcVisBand4Color)}></div>}
                                        {valueToBandNumBands >= 5 && <div className={cn("absolute w-24 h-full rounded-sm shadow-md", "right-7 md:right-8")} style={getBandStyle(calcVisBand5Color)}></div>}
                                        {valueToBandNumBands === 6 && <div className="absolute right-4 md:right-5 w-24 h-full rounded-sm shadow-md" style={getBandStyle(calcVisBand6Color)}></div>}
                                    </div>
                                    <div className="h-full w-4 bg-gray-300 dark:bg-gray-600 rounded-r-sm"></div>
                                </div>
                                {/* Textual Colors */}
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                                    <p><strong>Band 1:</strong> {calculatedBands.band1 || 'N/A'}</p>
                                    <p><strong>Band 2:</strong> {calculatedBands.band2 || 'N/A'}</p>
                                    <p><strong>Band 3:</strong> {calculatedBands.band3 || 'N/A'}</p>
                                    <p><strong>Band 4:</strong> {calculatedBands.multiplier || 'N/A'}</p>
                                    {valueToBandNumBands >= 5 && <p><strong>Band 5 (Tol):</strong> {calculatedBands.tolerance || 'N/A'}</p>}
                                    {valueToBandNumBands === 6 && <p><strong>Band 6 (Temp):</strong> {calculatedBands.tempCoefficient || 'N/A'}</p>}
                                </div>
                                <p className="text-xs text-muted-foreground">Note: Colors derived from standard E-series values; closest match shown.</p>
                            </div>
                        )}
                         {!calculatedBands && !valueToBandError && resistanceInput && (
                             <p className="text-center text-muted-foreground pt-4 border-t italic">Calculating bands...</p>
                         )}
                         {!resistanceInput && !valueToBandError && (
                              <p className="text-center text-muted-foreground pt-4 border-t italic">Enter resistance value above.</p>
                         )}
                    </div>
                </TabsContent>
            </Tabs>
        </CalculatorCard>
    );
}
