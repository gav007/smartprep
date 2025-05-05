
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Binary, Copy } from 'lucide-react'; // Added Binary icon
import { performConversions, formatBinaryString } from '@/lib/calculator-utils';
import type { ConversionBase, ConversionResult } from '@/types/calculator';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"; // Added import for Table components

export default function BaseConverterPage() {
  const [input, setInput] = useState<string>('');
  const [inputBase, setInputBase] = useState<ConversionBase>('dec');
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const conversionResult = useMemo(() => {
    setError(null); // Reset error on new calculation
    const trimmedInput = input.trim();

    if (!trimmedInput) {
        return { binary: '', decimal: '', hexadecimal: '' }; // Return empty if input is empty
    }

    const result = performConversions(trimmedInput, inputBase);

    if (result === null) {
      setError(`Invalid input for ${inputBase.toUpperCase()} base. Check characters.`);
      return { binary: 'Error', decimal: 'Error', hexadecimal: 'Error' };
    }
     // Validate results (e.g., check for excessively large numbers if needed)
     // BigInt handles large numbers, but display might be an issue.

    return result;
  }, [input, inputBase]);


  const handleCopyToClipboard = useCallback((text: string, label: string) => {
    if (!text || text === 'Error') return;
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied to Clipboard",
        description: `${label} (${text}) copied.`,
      });
    }).catch(err => {
      console.error('Failed to copy:', err);
      toast({
        title: "Copy Failed",
        description: "Could not copy text to clipboard.",
        variant: "destructive",
      });
    });
  }, [toast]);

  // Render output field with copy button
   const renderOutputField = (label: string, value: string, base: ConversionBase) => (
       <div className="flex flex-col space-y-1">
         <Label htmlFor={`output-${base}`} className="text-sm text-muted-foreground">{label}</Label>
         <div className="flex items-center gap-2">
            <Input
                id={`output-${base}`}
                type="text"
                value={value}
                readOnly
                className={cn(
                    "flex-grow font-mono text-sm md:text-base",
                     value === 'Error' ? 'text-destructive border-destructive' : 'bg-muted/30'
                 )}
                aria-label={`${label} result`}
            />
            <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={() => handleCopyToClipboard(value, label)}
                disabled={!value || value === 'Error'}
                aria-label={`Copy ${label} value`}
            >
                <Copy size={16} />
            </Button>
         </div>
         {base === 'bin' && value && value !== 'Error' && (
             <p className="text-xs text-muted-foreground font-mono tracking-tight">{formatBinaryString(value, 8)}</p>
         )}
       </div>
   );

  return (
    <div className="container mx-auto px-4 py-8">
        <Card className="w-full max-w-xl mx-auto">
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><Binary size={24} /> Base Converter</CardTitle>
            <CardDescription>Convert values between Binary, Decimal, and Hexadecimal.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            {/* Input Section */}
            <div className="flex items-end gap-2">
                {/* Base Selector */}
                <div className="flex-shrink-0 w-[120px] space-y-1">
                     <Label htmlFor="inputBase">Input Base</Label>
                     <Select value={inputBase} onValueChange={(v) => setInputBase(v as ConversionBase)}>
                        <SelectTrigger id="inputBase">
                            <SelectValue placeholder="Select Base" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="dec">Decimal</SelectItem>
                            <SelectItem value="bin">Binary</SelectItem>
                            <SelectItem value="hex">Hexadecimal</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                {/* Value Input */}
                <div className="flex-grow space-y-1">
                    <Label htmlFor="inputValue">Value</Label>
                    <Input
                        id="inputValue"
                        type="text"
                        placeholder={`Enter ${inputBase} value`}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                         className={cn("font-mono", error ? 'border-destructive focus-visible:ring-destructive' : '')}
                        aria-invalid={!!error}
                        aria-describedby="input-error"
                    />
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <p id="input-error" className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle size={16} /> {error}
                </p>
            )}

            {/* Output Section */}
            {(conversionResult.binary || conversionResult.decimal || conversionResult.hexadecimal) && !error && (
                <div className="pt-6 border-t space-y-4">
                    <h4 className="font-semibold text-lg">Converted Values:</h4>
                    {renderOutputField("Binary", conversionResult.binary, 'bin')}
                    {renderOutputField("Decimal", conversionResult.decimal, 'dec')}
                    {renderOutputField("Hexadecimal", conversionResult.hexadecimal, 'hex')}
                </div>
            )}

             {/* Test Cases Example (Optional Display) */}
             <details className="text-xs text-muted-foreground pt-2">
                 <summary className="cursor-pointer hover:text-foreground">Show examples</summary>
                 <Table className="mt-1">
                     <TableHeader>
                         <TableRow>
                             <TableHead>Input</TableHead>
                             <TableHead>Base</TableHead>
                             <TableHead>Binary</TableHead>
                             <TableHead>Decimal</TableHead>
                             <TableHead>Hex</TableHead>
                         </TableRow>
                     </TableHeader>
                     <TableBody>
                         <TableRow>
                             <TableCell>42</TableCell>
                             <TableCell>DEC</TableCell>
                             <TableCell>101010</TableCell>
                             <TableCell>42</TableCell>
                             <TableCell>2A</TableCell>
                         </TableRow>
                         <TableRow>
                             <TableCell>1111</TableCell>
                             <TableCell>BIN</TableCell>
                             <TableCell>1111</TableCell>
                             <TableCell>15</TableCell>
                             <TableCell>F</TableCell>
                         </TableRow>
                         <TableRow>
                             <TableCell>1A3F</TableCell>
                             <TableCell>HEX</TableCell>
                             <TableCell>1101000111111</TableCell>
                             <TableCell>6719</TableCell>
                             <TableCell>1A3F</TableCell>
                         </TableRow>
                     </TableBody>
                 </Table>
             </details>

        </CardContent>
        </Card>
    </div>
  );
}

    