
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Check, X, Copy, TableIcon } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";

interface TruthTableEntry {
  inputs: Record<string, boolean>;
  output: boolean;
}

// Basic parser and evaluator (simple cases, no operator precedence, limited functions)
// WARNING: Using Function constructor is generally unsafe if input is not tightly controlled.
// For a production app, a dedicated parsing library (like expr-eval or mathjs) is recommended.
// This implementation is simplified for demonstration.
const evaluateExpression = (expression: string, variables: string[], inputs: Record<string, boolean>): boolean | null => {
  try {
    let evalString = expression;
    // Replace logic symbols with JS equivalents
    evalString = evalString.replace(/·|\*|&/g, '&&'); // AND
    evalString = evalString.replace(/\+/g, '||');     // OR
    evalString = evalString.replace(/⊕|XOR/gi, '!=='); // XOR (using inequality)

    // Handle NOT (bar notation is tricky, use ! or ¬ for simplicity)
    evalString = evalString.replace(/¬|!/g, '!'); // Use ! or ¬ for NOT
    // Replace variable bars (e.g., A̅) - simplistic replacement
     variables.forEach(v => {
       const regex = new RegExp(`${v}̅`, 'g');
       evalString = evalString.replace(regex, `!${v}`);
     });

     // Replace variables with their boolean values
     variables.forEach(v => {
       // Use regex to replace whole variables only, avoid partial matches in words
       const regex = new RegExp(`\\b${v}\\b`, 'g');
       evalString = evalString.replace(regex, inputs[v].toString());
     });


    // Basic validation against unsafe characters before using Function
    if (/[^a-zA-Z0-9&|!=\s().]/.test(evalString)) {
       console.error("Potential unsafe characters detected in expression:", evalString);
       return null; // Or throw a specific error
    }

    // Create function scope with variables
    const variableDeclarations = variables.map(v => `const ${v} = ${inputs[v]};`).join('\n');
    // console.log("Evaluating:", evalString); // Debugging
    // console.log("With scope:", variableDeclarations); // Debugging

     // Using Function constructor - **BE CAUTIOUS WITH UNTRUSTED INPUT**
     // A safer approach involves building an AST (Abstract Syntax Tree) and evaluating it.
     // This is a basic example assuming controlled input or prior sanitization.
     const result = new Function(`return ${evalString}`)();


    return Boolean(result);
  } catch (error) {
    console.error("Error evaluating expression:", error);
    return null; // Return null indicates evaluation error
  }
};


export default function TruthTableGenerator() {
  const [expression, setExpression] = useState<string>('A + B');
  const [variables, setVariables] = useState<string[]>(['A', 'B']);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const truthTable = useMemo<TruthTableEntry[] | null>(() => {
    setError(null);
    if (!expression) return [];
    if (variables.length === 0) return [];
    if (variables.length > 4) {
        setError("Maximum of 4 variables (A, B, C, D) supported for clarity.");
        return null;
    }

    const numRows = 1 << variables.length; // 2^n rows
    const table: TruthTableEntry[] = [];

    for (let i = 0; i < numRows; i++) {
      const inputs: Record<string, boolean> = {};
      variables.forEach((variable, index) => {
        // Determine boolean value based on bit position
        inputs[variable] = (i >> (variables.length - 1 - index) & 1) === 1;
      });

       // Evaluate the expression for the current input combination
      const output = evaluateExpression(expression, variables, inputs);

      if (output === null) {
        setError(`Error evaluating expression. Check syntax near inputs: ${JSON.stringify(inputs)}`);
        return null; // Stop table generation on error
      }

      table.push({ inputs, output });
    }
    return table;
  }, [expression, variables]);

   // Automatically detect variables from the expression (simple version)
   const updateVariablesFromExpression = useCallback(() => {
        const detectedVars = expression
            .match(/[A-D]/gi) // Match A, B, C, D case-insensitive
            ?.map(v => v.toUpperCase()) // Convert to uppercase
            .filter((value, index, self) => self.indexOf(value) === index) // Unique
            .sort() || []; // Sort alphabetically

        if (detectedVars.length <= 4) {
             setVariables(detectedVars);
        } else {
             setError("Expression contains more than 4 variables (A, B, C, D). Reduce variables.");
             // Optionally clear variables or keep the first 4?
             // setVariables(detectedVars.slice(0, 4));
        }

    }, [expression]);

    React.useEffect(() => {
        updateVariablesFromExpression();
    }, [expression, updateVariablesFromExpression]);


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
        const headers = [...variables, 'Output'].join(',');
        const rows = truthTable.map(entry => {
            const inputValues = variables.map(v => entry.inputs[v] ? '1' : '0');
            const outputValue = entry.output ? '1' : '0';
            return [...inputValues, outputValue].join(',');
        });
        return [headers, ...rows].join('\n');
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
        <CardDescription>
            Enter a boolean logic expression using variables A, B, C, D.
            Supported operators: AND (·, *, &), OR (+, |), NOT (!, ¬, A̅), XOR (⊕). Parentheses () for grouping.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-1">
          <Label htmlFor="expression">Logic Expression</Label>
          <Input
            id="expression"
            type="text"
            value={expression}
            onChange={(e) => setExpression(e.target.value)}
            placeholder="e.g., A · B + !C"
            className="font-mono"
          />
           <p className="text-xs text-muted-foreground pt-1">
               Variables detected: {variables.join(', ') || 'None'} (Max 4: A, B, C, D)
           </p>
        </div>

        {error && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle size={16} /> {error}
          </p>
        )}

        {/* Truth Table Display */}
        {truthTable && truthTable.length > 0 && !error && (
          <div className="space-y-4 pt-6 border-t">
            <h3 className="text-lg font-semibold mb-2">Truth Table:</h3>
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
                      {/* {entry.output ? '1' : '0'} */}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex justify-end gap-2">
                 <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                             <Button
                                variant="outline"
                                size="sm"
                                onClick={downloadCsv}
                                disabled={!truthTable || truthTable.length === 0}
                            >
                                <Copy size={16} className="mr-2"/> Export CSV
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                        <p>Download table as a CSV file (1=True, 0=False)</p>
                        </TooltipContent>
                    </Tooltip>
                 </TooltipProvider>
            </div>
          </div>
        )}

         {/* Placeholder for Logic Gate Diagram */}
         {/* <div className="pt-6 border-t">
             <h3 className="text-lg font-semibold mb-2">Logic Diagram (Placeholder)</h3>
             <p className="text-muted-foreground text-sm">Visual logic gate representation coming soon.</p>
         </div> */}

      </CardContent>
    </Card>
  );
}
