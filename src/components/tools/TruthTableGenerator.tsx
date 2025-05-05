
'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Check, X, Copy, TableIcon, HelpCircle, Download, RotateCcw } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';


interface TruthTableEntry {
  inputs: Record<string, boolean>;
  output: boolean;
}

// Basic parser and evaluator (simple cases, no operator precedence, limited functions)
// WARNING: Using Function constructor is generally unsafe if input is not tightly controlled.
// This implementation is simplified for demonstration.
const evaluateExpression = (expression: string, variables: string[], inputs: Record<string, boolean>): boolean | null => {
    try {
      let evalString = expression.trim();

       // Ensure expression isn't empty after trimming
        if (!evalString) {
             return null; // Treat empty expression as no output initially
        }

      // 1. Replace logic symbols/words with JS equivalents
      evalString = evalString.replace(/·|\*|&|AND/gi, ' && '); // AND - Added spaces
      evalString = evalString.replace(/\+|\||OR/gi, ' || ');     // OR - Added spaces
      evalString = evalString.replace(/⊕|\^|XOR/gi, ' !== ');    // XOR - Added spaces
      evalString = evalString.replace(/¬|!|NOT/gi, ' ! ');       // NOT - Added spaces

      // 2. Handle variable bars (e.g., A̅) - simplistic replacement
      variables.forEach(v => {
        const regex = new RegExp(`${v}̅`, 'g');
        evalString = evalString.replace(regex, ` !${v} `); // Added spaces
      });

       // 3. Replace variable names with their boolean values
       const sortedVars = [...variables].sort((a, b) => b.length - a.length);
       sortedVars.forEach(v => {
         const regex = new RegExp(`\\b${v}\\b`, 'g');
         evalString = evalString.replace(regex, inputs[v].toString());
       });

        // 4. Basic validation against remaining potentially unsafe characters and structure
         evalString = evalString.replace(/\s+/g, ' ').trim(); // Normalize whitespace

        // Check for invalid characters (anything not expected)
        if (/[^truefalse&|!=\s()01]/.test(evalString)) { // Allow 0/1 if variables aren't used
             console.error("Potential unsafe or invalid characters detected:", evalString);
             throw new Error("Invalid characters found in expression.");
        }

        // More specific structural checks
        if (/(?:&&|\|\||!==)\s*(?:&&|\|\||!==)/.test(evalString)) throw new Error("Invalid operator sequence."); // Adjacent binary operators
        if (/\(\s*\)/.test(evalString)) throw new Error("Empty parentheses found."); // Empty parens
        if (evalString.startsWith('&&') || evalString.startsWith('||') || evalString.startsWith('!==')) throw new Error("Expression cannot start with a binary operator.");
        if (evalString.endsWith('&&') || evalString.endsWith('||') || evalString.endsWith('!==') || evalString.endsWith('!')) throw new Error("Expression cannot end with an operator.");
        if (evalString.split('(').length !== evalString.split(')').length) throw new Error("Mismatched parentheses.");
         // Check for valid operands around binary operators
         const tokens = evalString.split(/(\s+|&&|\|\||!==|\(|\))/).filter(Boolean);
         for (let i = 0; i < tokens.length; i++) {
             if (['&&', '||', '!=='].includes(tokens[i])) {
                 if (i === 0 || i === tokens.length - 1 || ['&&', '||', '!==', '!', '('].includes(tokens[i-1]) || ['&&', '||', '!==', ')'].includes(tokens[i+1])) {
                     throw new Error(`Invalid placement of operator '${tokens[i]}'.`);
                 }
             }
              if (tokens[i] === '!') {
                   if (i === tokens.length - 1 || ['&&', '||', '!==', ')'].includes(tokens[i+1])) {
                       throw new Error("Invalid placement of NOT operator '!'.");
                   }
              }
         }


         // 5. Using Function constructor - **BE CAUTIOUS**
         // Return a function to avoid direct eval pollution
         const evaluator = new Function(`return (${evalString});`); // Wrap in parens for safety
         const result = evaluator();


        return Boolean(result);
    } catch (error: any) {
        console.error("Error evaluating expression:", expression, "Mapped to:", error.message);
        // Provide a more specific error message if possible
        throw new Error(`Syntax Error: ${error.message || 'Invalid expression structure.'}`);
    }
};

const sampleExpressions = ['A & B', 'A | !B', '!A + B'];
const initialExpression = sampleExpressions[0];
const initialVariables = ['A', 'B'];

export default function TruthTableGenerator() {
  const [expression, setExpression] = useState<string>(initialExpression);
  const [variables, setVariables] = useState<string[]>(initialVariables);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

    // --- Auto-detect variables ---
   const updateVariablesFromExpression = useCallback((expr: string) => {
        const detectedVars = expr
            .toUpperCase() // Convert whole string to uppercase first
            .match(/[A-D]/g) // Match only A, B, C, D
            ?.filter((value, index, self) => self.indexOf(value) === index) // Unique
            .sort() || []; // Sort alphabetically

        // Only update if the detected variables are different from current ones
        if (JSON.stringify(detectedVars) !== JSON.stringify(variables)) {
            if (detectedVars.length <= 4) {
                 setVariables(detectedVars);
                 setError(null); // Clear variable count error if fixed
            } else {
                 setError("Expression contains more than 4 variables (A, B, C, D). Reduce variables.");
                 // Keep existing variables or clear them? Let's keep them but show error.
            }
        } else if (detectedVars.length > 4) {
            // Ensure error is set even if variable list hasn't changed string-wise
             setError("Expression contains more than 4 variables (A, B, C, D). Reduce variables.");
        } else {
             // Clear error if it was previously set but now the count is valid
             if (error && error.includes("more than 4 variables")) {
                 setError(null);
             }
        }
    }, [variables, error]); // Add 'error' to dependency list


    // --- Handle Expression Input Change ---
    const handleExpressionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let newValue = e.target.value;

        // Auto-replace Unicode/alternative symbols
        newValue = newValue.replace(/⊕/g, '^');
        newValue = newValue.replace(/¬/g, '!');
        newValue = newValue.replace(/·/g, '*');
         newValue = newValue.replace(/\bAND\b/gi, '*'); // Replace AND word
         newValue = newValue.replace(/\bOR\b/gi, '+');  // Replace OR word
         newValue = newValue.replace(/\bNOT\b/gi, '!'); // Replace NOT word
         newValue = newValue.replace(/\bXOR\b/gi, '^'); // Replace XOR word

        // Auto-format spacing (simple version) - Apply carefully
        // newValue = newValue
        //     .replace(/\s*(\+|\*|!|\^|\(|\))\s*/g, ' $1 ') // Add spaces around operators/parens
        //     .replace(/\s+/g, ' ').trim(); // Collapse multiple spaces and trim

        setExpression(newValue);
         // Update variables based on the *new* value
        updateVariablesFromExpression(newValue);
    };


    // --- Generate Truth Table ---
  const truthTable = useMemo<TruthTableEntry[] | null>(() => {
    // Clear previous evaluation errors when inputs change
    setError(null);

    const trimmedExpression = expression.trim();
    if (!trimmedExpression) return []; // Empty expression, empty table

    if (variables.length === 0) {
        // If expression has content but no variables (e.g., "1 + 0"), evaluate directly?
        // For a truth table, this case might be invalid or result in a single row.
        // Let's treat it as an error for now, requiring variables A-D.
        setError("Expression must contain variables (A, B, C, or D).");
        return null;
    }
    if (variables.length > 4) {
        // This error is now handled by updateVariablesFromExpression, but double-check here.
        if (!error) setError("Maximum of 4 variables (A, B, C, D) supported.");
        return null;
    }

    const numRows = 1 << variables.length; // 2^n rows
    const table: TruthTableEntry[] = [];

    try {
        for (let i = 0; i < numRows; i++) {
            const inputs: Record<string, boolean> = {};
            variables.forEach((variable, index) => {
                inputs[variable] = (i >> (variables.length - 1 - index) & 1) === 1;
            });

            const output = evaluateExpression(expression, variables, inputs);
            if (output === null) {
                 // Should not happen if evaluateExpression throws, but good safety check
                 throw new Error("Evaluation returned null unexpectedly.");
            }
            table.push({ inputs, output });
        }
         return table; // Success
    } catch (evalError: any) {
         // Set error state if evaluation fails for any row
         setError(evalError.message || "Error evaluating expression. Check syntax.");
         return null; // Indicate table generation failed
    }

  }, [expression, variables, error]); // Add error to dependency list


   // --- Insert Operator from Palette ---
    const insertOperator = (operator: string) => {
        const input = inputRef.current;
        if (!input) return;

        const start = input.selectionStart;
        const end = input.selectionEnd;
        const currentValue = input.value;
        let newValue = '';

        const opWithSpace = ['(', ')'].includes(operator) ? operator : ` ${operator} `;

        if (start !== null && end !== null) {
             newValue = currentValue.substring(0, start) + opWithSpace + currentValue.substring(end);
             const newCursorPos = start + opWithSpace.length;
              setExpression(newValue);
              setTimeout(() => {
                  input.focus();
                  input.setSelectionRange(newCursorPos, newCursorPos);
              }, 0);
        } else {
             newValue = currentValue + opWithSpace;
              setExpression(newValue);
              setTimeout(() => input.focus(), 0);
        }
         updateVariablesFromExpression(newValue);
    };


    // --- CSV Export & Reset ---
   const handleCopyToClipboard = useCallback((text: string, label: string) => {
        navigator.clipboard.writeText(text).then(() => {
        toast({
            title: "Copied to Clipboard",
            description: `${label} copied.`,
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

    const generateCsv = () => {
        if (!truthTable) return '';
        const expressionHeader = `# Expression: ${expression}\n`;
        const headers = [...variables, 'Output'].join(',');
        const rows = truthTable.map(entry => {
            const inputValues = variables.map(v => entry.inputs[v] ? '1' : '0');
            const outputValue = entry.output ? '1' : '0';
            return [...inputValues, outputValue].join(',');
        });
        return expressionHeader + [headers, ...rows].join('\n');
    };

    const downloadCsv = () => {
        const csvData = generateCsv();
        if (!csvData) {
             toast({ title: "Export Failed", description: "No table data to export.", variant: "destructive" });
             return;
        }
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'truth_table.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
         toast({ title: "CSV Downloaded", description: "Truth table exported as CSV." });
    };

     const handleReset = () => {
         setExpression(initialExpression);
         setVariables(initialVariables); // Reset variables to match initial expression
         setError(null);
     };

     const loadSample = (sampleExpr: string) => {
         setExpression(sampleExpr);
         updateVariablesFromExpression(sampleExpr); // Update variables when loading sample
         setError(null);
     };


  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><TableIcon size={24} /> Logic Truth Table Generator</CardTitle>
         {/* Help Alert */}
          <Alert className="bg-accent/10 border-accent mt-4">
             <HelpCircle className="h-4 w-4 text-accent" />
             <AlertTitle className="font-semibold text-accent">How to Use</AlertTitle>
             <AlertDescription className="space-y-1 text-muted-foreground">
                <p>Enter a boolean logic expression using variables <strong>A, B, C, D</strong> (max 4).</p>
                <p><strong>Supported Operators:</strong></p>
                <ul className="list-disc list-inside pl-4 text-xs grid grid-cols-2 gap-x-4">
                    <li><code>+</code> or <code>|</code> or <code>OR</code> : OR</li>
                    <li><code>*</code> or <code>&</code> or <code>·</code> or <code>AND</code> : AND</li>
                    <li><code>!</code> or <code>¬</code> or <code>NOT</code> : NOT (Prefix)</li>
                    <li><code>^</code> or <code>⊕</code> or <code>XOR</code> : XOR</li>
                    <li><code>( )</code> : Grouping</li>
                </ul>
                 <p className="text-xs pt-1">Symbols like <code>·</code>, <code>¬</code>, <code>⊕</code> and words (AND, OR, NOT, XOR) are auto-converted.</p>
             </AlertDescription>
          </Alert>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-1 relative">
          <Label htmlFor="expression">Logic Expression</Label>
          <div className="flex items-center gap-2">
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Input
                            ref={inputRef}
                            id="expression"
                            type="text"
                            value={expression}
                            onChange={handleExpressionChange}
                            placeholder="e.g., A * B + !C"
                            className={cn("font-mono flex-grow", error ? 'border-destructive focus-visible:ring-destructive' : '')}
                            aria-invalid={!!error}
                            aria-describedby="expression-error expression-vars expression-examples" // Link to examples
                        />
                     </TooltipTrigger>
                     <TooltipContent>
                        <p>Allowed Variables: A, B, C, D. Allowed Operators: +, *, !, ^, (, ). See "How to Use" above.</p>
                     </TooltipContent>
                </Tooltip>
            </TooltipProvider>
          </div>

           {/* Operator Palette */}
            <div className="flex flex-wrap gap-1 pt-2">
                 {(['+', '*', '!', '^', '(', ')'] as const).map(op => (
                    <Button
                        key={op} variant="outline" size="sm"
                        onClick={() => insertOperator(op)}
                        className="font-mono px-2.5 h-7 text-xs" aria-label={`Insert ${op}`}
                    >{op}</Button>
                 ))}
             </div>

           {/* Sample Expressions */}
            <div className="flex flex-wrap gap-1 pt-1">
                 <span className="text-xs text-muted-foreground mr-1">Samples:</span>
                 {sampleExpressions.map(sample => (
                    <Button
                        key={sample} variant="link" size="sm"
                        onClick={() => loadSample(sample)}
                        className="font-mono px-1 h-6 text-xs" aria-label={`Load sample: ${sample}`}
                    >{sample}</Button>
                 ))}
             </div>

           {/* Reset Button */}
            <Button variant="outline" onClick={handleReset} size="sm" className="mt-2">
                <RotateCcw className="mr-2 h-4 w-4" /> Reset Expression
            </Button>

           <p id="expression-vars" className="text-xs text-muted-foreground pt-1">
               Variables detected: {variables.join(', ') || (expression.trim() ? 'None (Only constants?)' : 'None')}
           </p>
             {error && (
                 <p id="expression-error" className="text-sm text-destructive flex items-center gap-1 pt-1">
                    <AlertCircle size={16} /> {error}
                 </p>
             )}
             {/* Examples linked by aria-describedby */}
             <div id="expression-examples" className="text-xs text-muted-foreground pt-1 hidden" aria-hidden="true">
                Examples: A + B, A * B, !A, (A + B) * C
             </div>
        </div>


        {/* Truth Table Display */}
        {truthTable && truthTable.length > 0 && !error && (
          <div className="space-y-4 pt-6 border-t">
            <div className="flex justify-between items-center">
                 <h3 className="text-lg font-semibold">Truth Table ({truthTable.length} rows):</h3>
                 <TooltipProvider>
                     <Tooltip>
                         <TooltipTrigger asChild>
                              <Button
                                 variant="outline" size="sm" onClick={downloadCsv}
                                 disabled={!truthTable || truthTable.length === 0}
                             ><Download size={16} className="mr-2"/> Export CSV</Button>
                         </TooltipTrigger>
                         <TooltipContent><p>Download table as CSV (1=True, 0=False)</p></TooltipContent>
                     </Tooltip>
                 </TooltipProvider>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  {variables.map(variable => (
                    <TableHead key={variable} className="text-center font-mono">{variable}</TableHead>
                  ))}
                  <TableHead className="text-center font-mono font-semibold">Output</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {truthTable.map((entry, rowIndex) => (
                  <TableRow key={rowIndex} className={cn(rowIndex % 2 === 0 ? 'bg-muted/30' : '')}>
                    {variables.map(variable => (
                      <TableCell key={`${variable}-${rowIndex}`} className="text-center font-mono">
                        {entry.inputs[variable] ? '1' : '0'}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-mono font-semibold">
                       {entry.output ? <Check className="h-5 w-5 text-green-600 mx-auto" /> : <X className="h-5 w-5 text-destructive mx-auto" />}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

          </div>
        )}

         {/* Show message if table can't be generated due to issues other than variable count */}
         {expression.trim() && (!truthTable || truthTable.length === 0) && !error && variables.length > 0 && (
            <p className="text-center text-muted-foreground pt-4 border-t">Could not generate table. Check expression syntax.</p>
         )}
         {/* Show message if no variables detected */}
          {expression.trim() && variables.length === 0 && !error && (
             <p className="text-center text-muted-foreground pt-4 border-t">No variables (A-D) detected in the expression.</p>
         )}


      </CardContent>
    </Card>
  );
}
