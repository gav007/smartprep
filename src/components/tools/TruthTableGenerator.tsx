
'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Check, X, Copy, TableIcon, HelpCircle, Download } from 'lucide-react';
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

      // 1. Replace logic symbols/words with JS equivalents
      evalString = evalString.replace(/·|\*|&|AND/gi, '&&'); // AND
      evalString = evalString.replace(/\+|\||OR/gi, '||');     // OR
      evalString = evalString.replace(/⊕|\^|XOR/gi, '!==');    // XOR (using JS inequality for boolean XOR)
      evalString = evalString.replace(/¬|!|NOT/gi, '!');       // NOT

      // 2. Handle variable bars (e.g., A̅) - simplistic replacement
      variables.forEach(v => {
        const regex = new RegExp(`${v}̅`, 'g');
        evalString = evalString.replace(regex, `!${v}`);
      });

       // 3. Replace variable names with their boolean values
       // Sort variables by length descending to avoid partial replacements (e.g., 'AB' before 'A') - though only A-D used here
       const sortedVars = [...variables].sort((a, b) => b.length - a.length);
       sortedVars.forEach(v => {
         // Use regex to replace whole variables only, avoid partial matches in words
         // Ensure variables are treated as distinct identifiers
         const regex = new RegExp(`\\b${v}\\b`, 'g');
         evalString = evalString.replace(regex, inputs[v].toString());
       });

        // 4. Basic validation against remaining potentially unsafe characters
        // Allows: true, false, &&, ||, !==, !, (, ), whitespace
        if (/[^truefalse&|!=\s()]/.test(evalString)) {
             console.error("Potential unsafe or invalid characters detected after replacements:", evalString);
             // More specific checks can be added here (e.g., balanced parentheses)
             // Check for adjacent operators or invalid sequences like '&& ||'
             if (/(?:&&|\|\||!==|!)\s*(?:&&|\|\||!==)/.test(evalString)) throw new Error("Invalid operator sequence.");
             if (/\(\s*\)/.test(evalString)) throw new Error("Empty parentheses found.");
             // Basic parenthesis balancing check
             if (evalString.split('(').length !== evalString.split(')').length) throw new Error("Mismatched parentheses.");

            // Throw a general error if specifics aren't caught
            throw new Error("Invalid characters or structure in expression after replacements.");
        }

         // console.log("Evaluating:", evalString); // Debugging

         // 5. Using Function constructor - **BE CAUTIOUS**
         const result = new Function(`return ${evalString}`)();

        return Boolean(result);
    } catch (error: any) {
        console.error("Error evaluating expression:", expression, "Mapped to:", error);
        // Provide a more specific error message if possible
        throw new Error(`Syntax Error: ${error.message || 'Invalid expression structure.'}`);
    }
};


export default function TruthTableGenerator() {
  const [expression, setExpression] = useState<string>('A + B');
  const [variables, setVariables] = useState<string[]>(['A', 'B']);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

    // --- Auto-detect variables ---
   const updateVariablesFromExpression = useCallback((expr: string) => {
        const detectedVars = expr
            .match(/[A-D]/gi) // Match A, B, C, D case-insensitive
            ?.map(v => v.toUpperCase()) // Convert to uppercase
            .filter((value, index, self) => self.indexOf(value) === index) // Unique
            .sort() || []; // Sort alphabetically

        if (detectedVars.length <= 4) {
             setVariables(detectedVars);
             setError(null); // Clear variable count error if fixed
        } else {
             setError("Expression contains more than 4 variables (A, B, C, D). Reduce variables.");
             // Keep existing variables or clear them? Let's keep them but show error.
             // setVariables([]);
        }
    }, []);


    // --- Handle Expression Input Change ---
    const handleExpressionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let newValue = e.target.value;

        // Auto-replace Unicode/alternative symbols
        newValue = newValue.replace(/⊕/g, '^');
        newValue = newValue.replace(/¬/g, '!');
        newValue = newValue.replace(/·/g, '*');
        // Optionally auto-replace AND, OR, NOT words?
        // newValue = newValue.replace(/\bAND\b/gi, '*');
        // newValue = newValue.replace(/\bOR\b/gi, '+');
        // newValue = newValue.replace(/\bNOT\b/gi, '!');

        // Auto-format spacing (simple version)
        newValue = newValue
            .replace(/\s*(\+|\*|!|\^|\(|\))\s*/g, ' $1 '); // Add spaces around operators/parens
            // .replace(/\s+/g, ' '); // Collapse multiple spaces

        setExpression(newValue);
         // Update variables based on the *new* value
        updateVariablesFromExpression(newValue);
    };


    // --- Generate Truth Table ---
  const truthTable = useMemo<TruthTableEntry[] | null>(() => {
    setError(null); // Clear previous evaluation errors
    if (!expression.trim()) return [];
    if (variables.length === 0 && expression.trim()) {
        // If expression exists but no variables detected (e.g., "1+0"), evaluate directly?
        // For now, assume variables are needed for a table.
        return [];
    }
    if (variables.length > 4) {
        setError("Maximum of 4 variables (A, B, C, D) supported.");
        return null;
    }

    const numRows = 1 << variables.length; // 2^n rows
    const table: TruthTableEntry[] = [];

    try {
        for (let i = 0; i < numRows; i++) {
        const inputs: Record<string, boolean> = {};
        variables.forEach((variable, index) => {
            // Determine boolean value based on bit position
            inputs[variable] = (i >> (variables.length - 1 - index) & 1) === 1;
        });

        // Evaluate the expression for the current input combination
        const output = evaluateExpression(expression, variables, inputs);

        // evaluateExpression now throws on error
        table.push({ inputs, output: output as boolean }); // Cast as boolean, error is caught outside loop
        }
         return table; // Success
    } catch (evalError: any) {
         setError(evalError.message || "Error evaluating expression. Check syntax.");
         return null; // Stop table generation on error
    }

  }, [expression, variables]);


   // --- Insert Operator from Palette ---
    const insertOperator = (operator: string) => {
        const input = inputRef.current;
        if (!input) return;

        const start = input.selectionStart;
        const end = input.selectionEnd;
        const currentValue = input.value;
        let newValue = '';

        const opWithSpace = ` ${operator} `;

        if (start !== null && end !== null) {
             newValue = currentValue.substring(0, start) + opWithSpace + currentValue.substring(end);
             // Set cursor position after the inserted operator + space
             const newCursorPos = start + opWithSpace.length;
              setExpression(newValue);
              // Use useEffect to focus and set cursor after state update
              setTimeout(() => { // Timeout ensures state update has rendered
                  input.focus();
                  input.setSelectionRange(newCursorPos, newCursorPos);
              }, 0);

        } else {
            // Fallback if selection info isn't available
             newValue = currentValue + opWithSpace;
              setExpression(newValue);
              setTimeout(() => input.focus(), 0);
        }
         updateVariablesFromExpression(newValue); // Update variables after insertion
    };


    // --- CSV Export ---
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
        // Add expression as a header comment (or first row)
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
        if (!csvData) return;
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


  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><TableIcon size={24} /> Logic Truth Table Generator</CardTitle>
         {/* Removed old description, replaced by Help Alert */}
      </CardHeader>
      <CardContent className="space-y-6">
         {/* Help Alert */}
          <Alert className="bg-accent/10 border-accent">
             <HelpCircle className="h-4 w-4 text-accent" />
             <AlertTitle className="font-semibold text-accent">How to Use</AlertTitle>
             <AlertDescription className="space-y-1 text-muted-foreground">
                <p>Enter a boolean logic expression using variables <strong>A, B, C, D</strong> (max 4).</p>
                <p><strong>Supported Operators (Keyboard):</strong></p>
                <ul className="list-disc list-inside pl-4 text-xs">
                    <li><code>+</code> : OR (e.g., <code>A + B</code>)</li>
                    <li><code>*</code> : AND (e.g., <code>A * B</code>)</li>
                    <li><code>!</code> : NOT (e.g., <code>!A</code>)</li>
                    <li><code>^</code> : XOR (e.g., <code>A ^ B</code>)</li>
                    <li><code>( )</code> : Grouping (e.g., <code>(A + B) * C</code>)</li>
                </ul>
                 <p className="text-xs pt-1">Symbols like <code>·</code>, <code>¬</code>, <code>⊕</code> will be auto-converted.</p>
             </AlertDescription>
          </Alert>

        <div className="space-y-1 relative">
          <Label htmlFor="expression">Logic Expression</Label>
          <div className="flex items-center gap-2">
            <Input
                ref={inputRef}
                id="expression"
                type="text"
                value={expression}
                onChange={handleExpressionChange}
                placeholder="e.g., A * B + !C"
                className={cn("font-mono flex-grow", error ? 'border-destructive focus-visible:ring-destructive' : '')}
                aria-invalid={!!error}
                aria-describedby="expression-error expression-vars"
            />
             <TooltipProvider delayDuration={100}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-accent" aria-label="Help with syntax">
                             <HelpCircle size={18} />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                    <p>Check the "How to Use" box for syntax rules.</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
          </div>

           {/* Operator Palette */}
            <div className="flex flex-wrap gap-1 pt-2">
                 {(['+', '*', '!', '^', '(', ')'] as const).map(op => (
                    <Button
                        key={op}
                        variant="outline"
                        size="sm"
                        onClick={() => insertOperator(op)}
                        className="font-mono px-2.5 h-7 text-xs"
                        aria-label={`Insert ${op}`}
                    >
                         {op}
                    </Button>
                 ))}
             </div>


           <p id="expression-vars" className="text-xs text-muted-foreground pt-1">
               Variables detected: {variables.join(', ') || (expression.trim() ? 'None (Only constants?)' : 'None')}
           </p>
             {error && (
                 <p id="expression-error" className="text-sm text-destructive flex items-center gap-1 pt-1">
                    <AlertCircle size={16} /> {error}
                 </p>
             )}
             {/* Examples (Could be shown dynamically on focus or always visible) */}
             <details className="text-xs text-muted-foreground pt-1">
                <summary className="cursor-pointer hover:text-foreground">Show examples</summary>
                 <ul className="list-disc list-inside pl-4 mt-1">
                    <li><code>A + B</code> (OR gate)</li>
                    <li><code>A * B</code> (AND gate)</li>
                    <li><code>!A</code> (NOT A)</li>
                    <li><code>A ^ B</code> (XOR gate)</li>
                    <li><code>(A + B) * C</code> (Combined logic)</li>
                 </ul>
             </details>
        </div>


        {/* Truth Table Display */}
        {truthTable && truthTable.length > 0 && !error && (
          <div className="space-y-4 pt-6 border-t">
            <div className="flex justify-between items-center">
                 <h3 className="text-lg font-semibold">Truth Table:</h3>
                 <TooltipProvider>
                     <Tooltip>
                         <TooltipTrigger asChild>
                              <Button
                                 variant="outline"
                                 size="sm"
                                 onClick={downloadCsv}
                                 disabled={!truthTable || truthTable.length === 0}
                             >
                                 <Download size={16} className="mr-2"/> Export CSV
                             </Button>
                         </TooltipTrigger>
                         <TooltipContent>
                         <p>Download table as a CSV file (1=True, 0=False)</p>
                         </TooltipContent>
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
                  <TableRow key={rowIndex}>
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

         {/* Show message if table can't be generated */}
         {expression.trim() && (!truthTable || truthTable.length === 0) && !error && (
            <p className="text-center text-muted-foreground pt-4 border-t">No table generated. Check your expression or ensure variables (A-D) are used.</p>
         )}


      </CardContent>
    </Card>
  );
}

