'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { GitBranch, AlertTriangle, Copy } from 'lucide-react'; // Using GitBranch icon
import { performConversions, formatBinaryString } from '@/lib/calculator-utils';
import type { ConversionResult, ConversionBase } from '@/types/calculator';
import { useToast } from "@/hooks/use-toast";


export default function ConverterPage() {
  const [inputValue, setInputValue] = useState<string>('');
  const [inputBase, setInputBase] = useState<ConversionBase>('dec');
  const [result, setResult] = useState<ConversionResult | null>({ binary: '', decimal: '', hexadecimal: '' });
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();


  const handleConversion = useCallback(() => {
    if (!inputValue) {
        setResult({ binary: '', decimal: '', hexadecimal: '' });
        setError(null);
        return;
    }

    const conversionResult = performConversions(inputValue, inputBase);

    if (conversionResult === null) {
      setError(`Invalid ${inputBase === 'bin' ? 'binary' : inputBase === 'dec' ? 'decimal' : 'hex'} input value.`);
      setResult(null);
    } else {
      setError(null);
      setResult(conversionResult);
    }
  }, [inputValue, inputBase]);


  // Perform conversion whenever input value or base changes
  useEffect(() => {
    handleConversion();
  }, [inputValue, inputBase, handleConversion]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleBaseChange = (value: string) => {
    setInputBase(value as ConversionBase);
  };

  const handleCopyToClipboard = (value: string, label: string) => {
      if(!value) return;
     navigator.clipboard.writeText(value)
       .then(() => {
         toast({
           title: "Copied to Clipboard",
           description: `${label} value "${value}" copied.`,
         });
       })
       .catch(err => {
         console.error('Failed to copy text: ', err);
         toast({
           title: "Copy Failed",
           description: "Could not copy text to clipboard.",
           variant: "destructive",
         });
       });
   };

  return (
    <div className="container mx-auto p-4 md:p-6">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <GitBranch className="h-6 w-6 text-primary" />
            Binary / Decimal / Hex Converter
          </CardTitle>
          <CardDescription>
            Enter a value in one base and see its conversion in others.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 items-end">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="inputValue">Input Value</Label>
              <Input
                id="inputValue"
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                placeholder={`Enter ${inputBase === 'bin' ? 'binary' : inputBase === 'dec' ? 'decimal' : 'hex'} value`}
                className={error ? 'border-destructive focus-visible:ring-destructive' : ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inputBase">Input Base</Label>
              <Select value={inputBase} onValueChange={handleBaseChange}>
                <SelectTrigger id="inputBase">
                  <SelectValue placeholder="Select Base" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bin">Binary (2)</SelectItem>
                  <SelectItem value="dec">Decimal (10)</SelectItem>
                  <SelectItem value="hex">Hexadecimal (16)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

           {error && (
             <Alert variant="destructive" className="mb-4">
               <AlertTriangle className="h-4 w-4" />
               <AlertTitle>Error</AlertTitle>
               <AlertDescription>{error}</AlertDescription>
             </Alert>
           )}


          {result && !error && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Conversions</h3>
               <div className="space-y-3">
                  {/* Binary Output */}
                  <div className="flex items-center gap-2">
                      <Label htmlFor="outputBinary" className="w-24 text-right shrink-0">Binary</Label>
                      <Input
                        id="outputBinary"
                        type="text"
                        value={formatBinaryString(result.binary)} // Format binary output
                        readOnly
                        className="flex-1 font-mono bg-muted/50"
                      />
                      <Button variant="ghost" size="icon" onClick={() => handleCopyToClipboard(result.binary, 'Binary')} aria-label="Copy Binary">
                          <Copy className="h-4 w-4" />
                      </Button>
                  </div>

                   {/* Decimal Output */}
                   <div className="flex items-center gap-2">
                      <Label htmlFor="outputDecimal" className="w-24 text-right shrink-0">Decimal</Label>
                      <Input
                        id="outputDecimal"
                        type="text"
                        value={result.decimal}
                        readOnly
                        className="flex-1 font-mono bg-muted/50"
                      />
                      <Button variant="ghost" size="icon" onClick={() => handleCopyToClipboard(result.decimal, 'Decimal')} aria-label="Copy Decimal">
                          <Copy className="h-4 w-4" />
                      </Button>
                  </div>

                   {/* Hexadecimal Output */}
                   <div className="flex items-center gap-2">
                      <Label htmlFor="outputHex" className="w-24 text-right shrink-0">Hexadecimal</Label>
                      <Input
                        id="outputHex"
                        type="text"
                        value={result.hexadecimal}
                        readOnly
                        className="flex-1 font-mono bg-muted/50"
                      />
                       <Button variant="ghost" size="icon" onClick={() => handleCopyToClipboard(result.hexadecimal, 'Hexadecimal')} aria-label="Copy Hexadecimal">
                          <Copy className="h-4 w-4" />
                      </Button>
                  </div>
               </div>
               {/* Optional: Visual byte breakdown */}
               {result.binary && result.binary.length > 8 && (
                   <div className="mt-4">
                       <p className="text-sm text-muted-foreground mb-1">Binary (8-bit groups):</p>
                       <p className="font-mono text-sm break-all bg-muted/30 p-2 rounded">{formatBinaryString(result.binary)}</p>
                   </div>
               )}
               {/* Optional: Overflow warning - simplistic example */}
                {result.binary && result.binary.length > 32 && (
                     <Alert variant="default" className="mt-4">
                         <AlertTriangle className="h-4 w-4" />
                         <AlertTitle>Potential Overflow</AlertTitle>
                         <AlertDescription>
                            The value exceeds 32 bits, which might cause issues in some systems.
                         </AlertDescription>
                     </Alert>
                )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
