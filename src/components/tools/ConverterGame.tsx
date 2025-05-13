// src/components/tools/ConverterGame.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, XCircle, RotateCw, Trophy, Star, HelpCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import type { Unit, VariableCategory } from '@/lib/units';
import { unitMultipliers, formatResultValue, voltageUnitOptions, currentUnitOptions, resistanceUnitOptions, powerUnitOptions, frequencyUnitOptions, capacitanceUnitOptions } from '@/lib/units';
import type { ConverterGameQuestion, GameOption } from '@/types/calculator'; // Assuming types are in calculator.ts
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
];

function generateRandomValue(difficulty: number): number {
    // Difficulty 1-3: simple numbers, fewer decimals
    // Difficulty 4-7: wider range, more decimals
    // Difficulty 8-10: very small or very large numbers
    let baseValue: number;
    if (difficulty <= 3) {
        baseValue = Math.random() * 100;
        return parseFloat(baseValue.toFixed(Math.random() > 0.5 ? 0 : 1));
    } else if (difficulty <= 7) {
        baseValue = Math.random() * 10000;
        return parseFloat(baseValue.toFixed(Math.floor(Math.random() * 3)));
    } else {
        const orderOfMagnitude = Math.floor(Math.random() * 6) - 3; // 10^-3 to 10^2
        baseValue = (Math.random() * 9 + 1) * Math.pow(10, orderOfMagnitude);
         return parseFloat(baseValue.toPrecision(3));
    }
}

function getRandomUnit(units: Unit[]): Unit {
    return units[Math.floor(Math.random() * units.length)];
}

function generateDistractors(correctValue: number, targetUnit: Unit, category: VariableCategory, difficulty: number): GameOption[] {
    const distractors: GameOption[] = [];
    const factors = [10, 100, 1000, 0.1, 0.01, 0.001];
    let attempts = 0;

    while (distractors.length < 3 && attempts < 50) {
        attempts++;
        let distractorValue;
        const randomFactor = factors[Math.floor(Math.random() * factors.length)];
        
        if (Math.random() > 0.5 || correctValue === 0) { // Add or subtract for variety, or if correct is 0
            const offsetMagnitude = Math.pow(10, Math.floor(Math.log10(Math.abs(correctValue) || 1)) - (Math.floor(Math.random()*2)+1) ); // smaller offset
            distractorValue = correctValue + (Math.random() > 0.5 ? 1 : -1) * offsetMagnitude * (Math.random()*5 + 1);
            if (Math.abs(distractorValue) < 1e-9 && distractorValue !== 0) distractorValue = 0; // Prevent tiny numbers close to zero
        } else {
             distractorValue = correctValue * randomFactor;
        }
        
        // Ensure distractor is different enough and not NaN/Infinity
        if (!isNaN(distractorValue) && isFinite(distractorValue) && Math.abs(distractorValue - correctValue) > 1e-9 * Math.abs(correctValue) && Math.abs(distractorValue - correctValue) > 1e-9 &&
            !distractors.some(d => Math.abs(d.valueInTargetUnit - distractorValue) < 1e-9) &&
            distractors.length < 3) {

            const formatted = formatResultValue(distractorValue * unitMultipliers[targetUnit], category, targetUnit);
            distractors.push({
                key: '', // Will be assigned later
                label: `${formatted.displayValue} ${formatted.unit}`,
                valueInTargetUnit: parseFloat(formatted.displayValue) // Store the number as displayed
            });
        }
    }
    // Fill with more distinct values if not enough distractors
    const baseDistractorValues = [correctValue / 1000, correctValue * 1000, correctValue / 10, correctValue * 10];
     for(const val of baseDistractorValues) {
         if (distractors.length >=3) break;
         if (!isNaN(val) && isFinite(val) && Math.abs(val - correctValue) > 1e-9 && !distractors.some(d => Math.abs(d.valueInTargetUnit - val) < 1e-9)) {
              const formatted = formatResultValue(val * unitMultipliers[targetUnit], category, targetUnit);
               distractors.push({
                   key: '',
                   label: `${formatted.displayValue} ${formatted.unit}`,
                   valueInTargetUnit: parseFloat(formatted.displayValue)
               });
         }
     }

    return distractors.slice(0, 3); // Ensure only 3 distractors
}

function generateGameQuestion(round: number): ConverterGameQuestion {
    const difficulty = Math.min(10, round + 1); // Scale difficulty with round
    const categoryInfo = unitCategories[Math.floor(Math.random() * unitCategories.length)];
    
    let originalUnit: Unit;
    let targetUnit: Unit;

    // Ensure original and target units are different and suitable for conversion
    do {
        originalUnit = getRandomUnit(categoryInfo.units);
        targetUnit = getRandomUnit(categoryInfo.units);
    } while (originalUnit === targetUnit || !unitMultipliers[originalUnit] || !unitMultipliers[targetUnit]);

    const originalValueInBase = generateRandomValue(difficulty); // This is in base SI unit (e.g. Amps)
    
    // Value to display for the question (in originalUnit)
    const displayValueForQuestion = originalValueInBase / unitMultipliers[originalUnit];
    const formattedOriginal = formatResultValue(originalValueInBase, categoryInfo.category, originalUnit);

    const promptText = `Convert ${formattedOriginal.displayValue} ${formattedOriginal.unit} to ${targetUnit}`;

    // Correct answer in target unit
    const correctAnswerNumeric = originalValueInBase / unitMultipliers[targetUnit];
    const formattedCorrect = formatResultValue(originalValueInBase, categoryInfo.category, targetUnit);
    
    const correctOption: GameOption = {
        key: '', // Will be assigned 'A', 'B', 'C', or 'D'
        label: `${formattedCorrect.displayValue} ${formattedCorrect.unit}`,
        valueInTargetUnit: parseFloat(formattedCorrect.displayValue)
    };

    const distractorOptions = generateDistractors(parseFloat(formattedCorrect.displayValue), targetUnit, categoryInfo.category, difficulty);
    
    const allOptionsUnkeyed = [correctOption, ...distractorOptions.slice(0,3)]; // Max 3 distractors
     const shuffledOptions = allOptionsUnkeyed
        .sort(() => Math.random() - 0.5)
        .map((opt, index) => ({ ...opt, key: String.fromCharCode(65 + index) })); // Assign A, B, C, D

    const correctAnswerKey = shuffledOptions.find(
        opt => Math.abs(opt.valueInTargetUnit - parseFloat(formattedCorrect.displayValue)) < 1e-9 // Compare stored numeric value
    )?.key || 'A'; // Fallback, should always find

    return {
        id: `q-${round}-${Date.now()}`,
        originalValue: displayValueForQuestion, // Store the value as it's initially presented
        originalUnit: originalUnit,
        targetUnit: targetUnit,
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
    if (feedback) return; // Don't allow changing answer after feedback

    setSelectedOptionKey(optionKey);
    const isCorrect = optionKey === currentQuestion.correctAnswerKey;
    if (isCorrect) {
      setScore(s => s + 10);
      setFeedback({ message: 'Correct! Nicely done.', type: 'correct' });
      toast({ title: "Correct!", description: "+10 points", className: "bg-green-500 text-white" });
    } else {
      setScore(s => Math.max(0, s - 5)); // Score doesn't go below 0
      const correctOpt = currentQuestion.options.find(o => o.key === currentQuestion.correctAnswerKey);
      setFeedback({ message: `Incorrect. The right answer was ${correctOpt?.label || 'N/A'}.`, type: 'incorrect' });
      toast({ title: "Incorrect!", description: "-5 points", variant: "destructive" });
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
    loadQuestions(); // Generate new set of questions
  };

  if (isLoading) {
    return <p className="text-center text-muted-foreground p-8">Generating challenging conversions...</p>;
  }

  if (isGameOver) {
    return (
      <div className="text-center space-y-6 p-4">
        <Trophy className="h-16 w-16 mx-auto text-amber-500" />
        <h2 className="text-2xl font-bold">Game Over!</h2>
        <p className="text-xl">Your Final Score: <strong className={cn(score > 0 ? "text-primary" : "text-destructive")}>{score}</strong></p>
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
    return <p className="text-center text-destructive p-8">Error: Could not load question. Please try resetting.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-muted-foreground">Question: {currentRound + 1} / {TOTAL_ROUNDS}</p>
        <p className="text-sm font-semibold">Score: <span className={cn(score > 0 ? "text-primary" : score < 0 ? "text-destructive" : "text-foreground")}>{score}</span></p>
      </div>
      <Progress value={((currentRound +1) / TOTAL_ROUNDS) * 100} className="w-full h-2 mb-6" />

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl text-center leading-tight">
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
                htmlFor={`option-${option.key}`}
                className={cn(
                  "flex items-center space-x-3 p-3 border rounded-md hover:bg-muted/50 transition-colors cursor-pointer",
                  selectedOptionKey === option.key && !feedback && "ring-2 ring-primary border-primary bg-primary/10",
                  feedback && option.key === currentQuestion.correctAnswerKey && "bg-green-100 border-green-400 dark:bg-green-900/30 dark:border-green-700",
                  feedback && selectedOptionKey === option.key && option.key !== currentQuestion.correctAnswerKey && "bg-red-100 border-red-400 dark:bg-red-900/30 dark:border-red-700",
                  !!feedback && "cursor-not-allowed opacity-70"
                )}
              >
                <RadioGroupItem value={option.key} id={`option-${option.key}`} className="shrink-0" />
                <span className="text-sm sm:text-base flex-1">{option.label}</span>
                 {feedback && option.key === currentQuestion.correctAnswerKey && <CheckCircle className="h-5 w-5 text-green-600 shrink-0"/>}
                 {feedback && selectedOptionKey === option.key && option.key !== currentQuestion.correctAnswerKey && <XCircle className="h-5 w-5 text-destructive shrink-0"/>}
              </Label>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {feedback && (
        <Alert variant={feedback.type === 'correct' ? 'default' : 'destructive'} className={cn(feedback.type === 'correct' && "bg-green-50 border-green-200 text-green-700 dark:bg-green-900/30 dark:border-green-700 [&>svg]:text-green-600 dark:[&>svg]:text-green-400")}>
          {feedback.type === 'correct' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <AlertTitle>{feedback.type === 'correct' ? 'Correct!' : 'Incorrect'}</AlertTitle>
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
