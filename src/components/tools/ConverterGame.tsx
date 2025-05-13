// src/components/tools/ConverterGame.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, XCircle, RotateCw, Trophy, Gem } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import type { Unit, VariableCategory } from '@/lib/units';
import { unitMultipliers, formatResultValue, voltageUnitOptions, currentUnitOptions, resistanceUnitOptions, powerUnitOptions, frequencyUnitOptions, capacitanceUnitOptions, timeUnitOptions } from '@/lib/units';
import type { ConverterGameQuestion, GameOption } from '@/types/calculator';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const TOTAL_ROUNDS = 10;

const unitCategories: { category: VariableCategory, units: Unit[] }[] = [
    { category: 'voltage', units: voltageUnitOptions },
    { category: 'current', units: currentUnitOptions },
    { category: 'resistance', units: resistanceUnitOptions },
    { category: 'power', units: powerUnitOptions },
    { category: 'frequency', units: frequencyUnitOptions },
    { category: 'capacitance', units: capacitanceUnitOptions },
    { category: 'time', units: timeUnitOptions },
];

function generateRandomValue(difficulty: number): number {
    let baseValue: number;
    let precision: number;

    if (difficulty <= 3) { // Simpler numbers, fewer decimals, powers of 10 more likely
        baseValue = (Math.floor(Math.random() * 90) + 10) * Math.pow(10, Math.floor(Math.random() * 4) - 2); // e.g. 10*10^-2 to 99*10^1
        precision = Math.random() > 0.3 ? 0 : 1; // 70% chance of whole number
    } else if (difficulty <= 7) { // Wider range, more decimals
        baseValue = Math.random() * 10000;
        precision = Math.floor(Math.random() * 3); // 0 to 2 decimal places
    } else { // Very small or very large numbers, specific precisions
        const orderOfMagnitude = Math.floor(Math.random() * 10) - 5; // 10^-5 to 10^4
        baseValue = (Math.random() * 9 + 1) * Math.pow(10, orderOfMagnitude); // e.g. 1.23e-4 or 4.56e3
        precision = Math.floor(Math.random() * 2) + 2; // 2 to 3 decimal places for small/large values
    }
    // Ensure value is not extremely small like 1e-15 which might cause display issues
    if (Math.abs(baseValue) < 1e-9 && baseValue !== 0) {
       return parseFloat(baseValue.toPrecision(3));
    }
    return parseFloat(baseValue.toFixed(precision));
}

function getRandomUnit(units: Unit[]): Unit {
    return units[Math.floor(Math.random() * units.length)];
}

function generateDistractors(correctNumericValueInTargetUnit: number, targetUnit: Unit, category: VariableCategory, difficulty: number): GameOption[] {
    const distractors: GameOption[] = [];
    const usedValues = new Set<number>([correctNumericValueInTargetUnit]); // Track used numeric values to ensure uniqueness
    let attempts = 0;

    const generateDistractorValue = (): number => {
        let distractorValue;
        const magnitudeChangeFactor = Math.pow(10, Math.floor(Math.random() * 3) + 1); // 10, 100, 1000
        
        // Type 1: Shift decimal place
        if (Math.random() < 0.4) {
            distractorValue = correctNumericValueInTargetUnit * (Math.random() > 0.5 ? magnitudeChangeFactor : 1 / magnitudeChangeFactor);
        } 
        // Type 2: Slight variation of correct value
        else if (Math.random() < 0.7 && correctNumericValueInTargetUnit !== 0) {
            const relativeChange = (Math.random() * 0.5 + 0.1) * (Math.random() > 0.5 ? 1 : -1); // 10-50% variation
            distractorValue = correctNumericValueInTargetUnit * (1 + relativeChange);
        }
        // Type 3: Off by one or two in the last significant digit shown by correct answer
        else if (correctNumericValueInTargetUnit !== 0) {
            const correctFormatted = formatResultValue(correctNumericValueInTargetUnit * unitMultipliers[targetUnit] , category, targetUnit);
            const correctDisplayNum = parseFloat(correctFormatted.displayValue);
            const numStr = correctDisplayNum.toString();
            const decimalPointIndex = numStr.indexOf('.');
            let scaleFactor = 1;
            if (decimalPointIndex !== -1) {
                const decimalPlaces = numStr.length - decimalPointIndex - 1;
                scaleFactor = Math.pow(10, -decimalPlaces);
            }
            distractorValue = correctDisplayNum + (Math.floor(Math.random()*3) -1) * scaleFactor * (Math.random() > 0.5 ? 1 : 10) ;
            distractorValue = distractorValue / unitMultipliers[targetUnit]; // convert back to targetUnit base value
        }
        // Type 4: Completely different magnitude or a common wrong conversion
        else {
             distractorValue = generateRandomValue(difficulty) / unitMultipliers[targetUnit]; // A random value in target unit
        }
        // Ensure non-zero for very small values if correct is non-zero
        if (Math.abs(distractorValue) < 1e-9 && correctNumericValueInTargetUnit !== 0 && distractorValue !== 0) {
            distractorValue = distractorValue * 1000; // Make it more distinct
        }
        return distractorValue;
    };


    while (distractors.length < 3 && attempts < 100) {
        attempts++;
        const distractorNumericValue = generateDistractorValue();

        if (isNaN(distractorNumericValue) || !isFinite(distractorNumericValue) || usedValues.has(distractorNumericValue)) {
            continue;
        }
        
        // Format the distractor like the correct answer
        const formattedDistractor = formatResultValue(distractorNumericValue * unitMultipliers[targetUnit], category, targetUnit);
        const displayDistractorValue = parseFloat(formattedDistractor.displayValue);

        // Final check for uniqueness of the display value
        if (!usedValues.has(displayDistractorValue)) {
             distractors.push({
                key: '', // Will be assigned A, B, C, D later
                label: `${formattedDistractor.displayValue} ${formattedDistractor.unit}`,
                valueInTargetUnit: displayDistractorValue 
            });
            usedValues.add(displayDistractorValue);
        }
    }
    // Fill with very different values if still not enough unique distractors
    const fallbackFactors = [0.001, 0.01, 0.1, 10, 100, 1000];
    while (distractors.length < 3 && fallbackFactors.length > 0) {
        const factor = fallbackFactors.shift()!;
        const fallbackValue = correctNumericValueInTargetUnit * factor;
        const formattedFallback = formatResultValue(fallbackValue * unitMultipliers[targetUnit], category, targetUnit);
        const displayFallbackValue = parseFloat(formattedFallback.displayValue);
        if (!usedValues.has(displayFallbackValue)) {
             distractors.push({
                key: '',
                label: `${formattedFallback.displayValue} ${formattedFallback.unit}`,
                valueInTargetUnit: displayFallbackValue
            });
            usedValues.add(displayFallbackValue);
        }
    }
    // If still not enough (highly unlikely), fill with simple variations like 0 or negative if appropriate
    while(distractors.length < 3){
        const randomNum = Math.random() * 10 * (Math.random() > 0.5 ? 1 : -1);
         const formattedRandom = formatResultValue(randomNum * unitMultipliers[targetUnit], category, targetUnit);
         const displayRandomVal = parseFloat(formattedRandom.displayValue);
        if(!usedValues.has(displayRandomVal)){
             distractors.push({key:'', label: `${formattedRandom.displayValue} ${formattedRandom.unit}`, valueInTargetUnit: displayRandomVal});
            usedValues.add(displayRandomVal);
        } else { // ultimate fallback
            distractors.push({key:'', label: `${(Math.random()*100).toFixed(2)} ${targetUnit}`, valueInTargetUnit: Math.random()*100});
        }
    }


    return distractors.slice(0,3); // Ensure max 3
}


function generateGameQuestion(round: number): ConverterGameQuestion {
    const difficulty = Math.min(10, Math.floor(round / 2) + 1); // Slower difficulty ramp
    const categoryInfo = unitCategories[Math.floor(Math.random() * unitCategories.length)];
    
    let originalUnit: Unit;
    let targetUnit: Unit;

    do {
        originalUnit = getRandomUnit(categoryInfo.units);
        targetUnit = getRandomUnit(categoryInfo.units);
    } while (
        originalUnit === targetUnit || 
        !unitMultipliers[originalUnit] || 
        !unitMultipliers[targetUnit] ||
        // Avoid trivial conversions like V to V, or impossible ones for the game
        unitMultipliers[originalUnit] === unitMultipliers[targetUnit]
    );

    const originalValueInBaseUnits = generateRandomValue(difficulty); // e.g. 0.0264 Amps
    
    // Value to display for the question, in its original unit
    const displayValueForQuestion = originalValueInBaseUnits / unitMultipliers[originalUnit];
    const formattedOriginal = formatResultValue(originalValueInBaseUnits, categoryInfo.category, originalUnit);

    const promptText = `Convert ${formattedOriginal.displayValue} ${originalUnit} to ${targetUnit}`;

    // Correct answer in target unit's display format
    const correctValueInTargetUnitBase = originalValueInBaseUnits / unitMultipliers[targetUnit];
    const formattedCorrect = formatResultValue(originalValueInBaseUnits, categoryInfo.category, targetUnit);
    const correctNumericValueForComparison = parseFloat(formattedCorrect.displayValue);
    
    const correctOption: GameOption = {
        key: '', 
        label: `${formattedCorrect.displayValue} ${targetUnit}`, // Use targetUnit directly for label consistency
        valueInTargetUnit: correctNumericValueForComparison
    };

    const distractorOptions = generateDistractors(correctNumericValueForComparison, targetUnit, categoryInfo.category, difficulty);
    
    const allOptionsUnkeyed = [correctOption, ...distractorOptions];
    const shuffledOptions = allOptionsUnkeyed
        .sort(() => Math.random() - 0.5)
        .map((opt, index) => ({ ...opt, key: String.fromCharCode(65 + index) }));

    const correctAnswerKey = shuffledOptions.find(
        opt => Math.abs(opt.valueInTargetUnit - correctNumericValueForComparison) < 1e-9 
    )?.key || 'A';

    return {
        id: `q-${round}-${Date.now()}`,
        originalValue: parseFloat(formattedOriginal.displayValue), 
        originalUnit: originalUnit,
        targetUnit: targetUnit,
        category: categoryInfo.category,
        promptText,
        options: shuffledOptions,
        correctAnswerKey,
        difficulty,
    };
}


export default function ConverterGame() {
  const [currentRound, setCurrentRound] = useState(0);
  const [score, setScore] = useState(0);
  const [questions, setQuestions] = useState<ConverterGameQuestion[]>([]);
  const [selectedOptionKey, setSelectedOptionKey] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; type: 'correct' | 'incorrect' } | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const currentQuestion = useMemo(() => questions[currentRound], [questions, currentRound]);

  const loadQuestions = useCallback(() => {
    setIsLoading(true);
    const newQuestions = Array.from({ length: TOTAL_ROUNDS }, (_, i) => generateGameQuestion(i));
    setQuestions(newQuestions);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const handleOptionSelect = (optionKey: string) => {
    if (feedback) return; 

    setSelectedOptionKey(optionKey);
    const isCorrect = optionKey === currentQuestion.correctAnswerKey;
    if (isCorrect) {
      setScore(s => s + 10 * currentQuestion.difficulty); // Score based on difficulty
      setFeedback({ message: 'Correct! Nicely done.', type: 'correct' });
      toast({ title: "Correct!", description: `+${10 * currentQuestion.difficulty} points`, className: "bg-green-600 text-white dark:bg-green-700 dark:text-white" });
    } else {
      setScore(s => Math.max(0, s - (5 * Math.max(1, Math.floor(currentQuestion.difficulty / 2 )) ) ) ); // Penalty also scales
      const correctOpt = currentQuestion.options.find(o => o.key === currentQuestion.correctAnswerKey);
      setFeedback({ message: `Incorrect. The right answer was ${correctOpt?.label || 'N/A'}.`, type: 'incorrect' });
      toast({ title: "Incorrect!", description: `-${5 * Math.max(1, Math.floor(currentQuestion.difficulty/2))} points`, variant: "destructive" });
    }
  };

  const handleNextRound = () => {
    if (currentRound < TOTAL_ROUNDS - 1) {
      setCurrentRound(prev => prev + 1);
      setSelectedOptionKey(null);
      setFeedback(null);
    } else {
      setIsGameOver(true);
    }
  };

  const handlePlayAgain = () => {
    setCurrentRound(0);
    setScore(0);
    setSelectedOptionKey(null);
    setFeedback(null);
    setIsGameOver(false);
    loadQuestions(); 
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-10 text-muted-foreground"><Loader2 className="h-8 w-8 animate-spin mr-2"/>Generating challenging conversions...</div>;
  }

  if (isGameOver) {
    return (
      <div className="text-center space-y-6 p-4">
        <Trophy className="h-16 w-16 mx-auto text-amber-500" />
        <h2 className="text-2xl font-bold">Game Over!</h2>
        <p className="text-xl">Your Final Score: <strong className={cn(score > 50 ? "text-primary" : score > 0 ? "text-amber-600" : "text-destructive")}>{score}</strong></p>
        <div className="flex gap-4 justify-center">
            <Button onClick={handlePlayAgain} size="lg">
                <RotateCw className="mr-2 h-5 w-5" /> Play Again
            </Button>
            <Button variant="outline" size="lg" asChild>
                 <a href="/tools">More Tools</a>
            </Button>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return <div className="text-center text-destructive p-8"><AlertCircle className="h-8 w-8 mx-auto mb-2"/>Error: Could not load question. Please try resetting.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-2">
        <p className="text-sm text-muted-foreground">Question: {currentRound + 1} / {TOTAL_ROUNDS} (Difficulty: {currentQuestion.difficulty})</p>
        <p className="text-lg font-semibold">Score: <span className={cn(score > 50 ? "text-primary" : score > 0 ? "text-amber-600" : "text-foreground")}>{score}</span></p>
      </div>
      <Progress value={((currentRound +1) / TOTAL_ROUNDS) * 100} className="w-full h-2 mb-4" />

      <Card className="shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg md:text-xl text-center font-semibold leading-tight">
            {currentQuestion.promptText}
          </CardTitle>
           <CardDescription className="text-center text-xs text-muted-foreground pt-1">
                Select the correct conversion:
            </CardDescription>
        </CardHeader>
        <CardContent className="pt-2 pb-4">
          <RadioGroup
            value={selectedOptionKey || ''}
            onValueChange={handleOptionSelect}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            disabled={!!feedback}
          >
            {currentQuestion.options.map((option) => (
              <Label
                key={option.key}
                htmlFor={`option-${option.key}-${currentQuestion.id}`} // Ensure unique ID per question
                className={cn(
                  "flex items-center space-x-3 p-3.5 border rounded-lg hover:bg-muted/60 transition-all duration-150",
                  "focus-within:ring-2 focus-within:ring-primary focus-within:border-primary",
                  !!feedback ? "cursor-not-allowed opacity-70" : "cursor-pointer",
                  selectedOptionKey === option.key && !feedback && "ring-2 ring-primary border-primary bg-primary/10 shadow-md",
                  feedback && option.key === currentQuestion.correctAnswerKey && "bg-green-100 border-green-500 dark:bg-green-900/40 dark:border-green-600 ring-2 ring-green-500",
                  feedback && selectedOptionKey === option.key && option.key !== currentQuestion.correctAnswerKey && "bg-red-100 border-red-500 dark:bg-red-900/40 dark:border-red-600 ring-2 ring-red-500"
                )}
              >
                <RadioGroupItem value={option.key} id={`option-${option.key}-${currentQuestion.id}`} className="shrink-0 border-muted-foreground data-[state=checked]:border-primary" />
                <span className="text-sm sm:text-base flex-1 font-mono">{option.label}</span>
                 {feedback && option.key === currentQuestion.correctAnswerKey && <CheckCircle className="h-5 w-5 text-green-600 shrink-0"/>}
                 {feedback && selectedOptionKey === option.key && option.key !== currentQuestion.correctAnswerKey && <XCircle className="h-5 w-5 text-destructive shrink-0"/>}
              </Label>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {feedback && (
        <Alert variant={feedback.type === 'correct' ? 'default' : 'destructive'} className={cn(feedback.type === 'correct' && "bg-green-50 border-green-300 text-green-700 dark:bg-green-900/30 dark:border-green-700 dark:text-green-300 [&>svg]:text-green-600 dark:[&>svg]:text-green-400")}>
          {feedback.type === 'correct' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <AlertTitle className="font-semibold">{feedback.type === 'correct' ? 'Correct!' : 'Not Quite!'}</AlertTitle>
          <AlertDescription>{feedback.message}</AlertDescription>
        </Alert>
      )}

      {feedback && (
        <Button onClick={handleNextRound} className="w-full mt-4" size="lg">
          {currentRound < TOTAL_ROUNDS - 1 ? 'Next Question' : 'View Results'}
        </Button>
      )}
    </div>
  );
}

