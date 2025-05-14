// src/components/tools/ConverterGame.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, XCircle, RotateCw, Trophy, Gem, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import type { Unit, VariableCategory } from '@/lib/units';
import { unitMultipliers, formatResultValue, voltageUnitOptions, currentUnitOptions, resistanceUnitOptions, powerUnitOptions, frequencyUnitOptions, capacitanceUnitOptions, timeUnitOptions } from '@/lib/units';
import type { ConverterGameQuestion, GameOption } from '@/types/calculator';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const TOTAL_ROUNDS = 10;

const unitCategories: { category: VariableCategory, units: Unit[], baseUnit: Unit }[] = [
    { category: 'voltage', units: voltageUnitOptions, baseUnit: 'V' },
    { category: 'current', units: currentUnitOptions, baseUnit: 'A' },
    { category: 'resistance', units: resistanceUnitOptions, baseUnit: 'Ω' },
    { category: 'power', units: powerUnitOptions, baseUnit: 'W' },
    { category: 'frequency', units: frequencyUnitOptions, baseUnit: 'Hz' },
    { category: 'capacitance', units: capacitanceUnitOptions, baseUnit: 'F' },
    { category: 'time', units: timeUnitOptions, baseUnit: 's' },
];

function generateRandomValueForCategory(difficulty: number, category: VariableCategory): number {
    let baseMagnitude: number;
    let numDecimalPlaces: number;

    switch (category) {
        case 'voltage':
            baseMagnitude = (Math.random() * (difficulty < 5 ? 20 : 200) + (difficulty < 3 ? 0.1 : 0.001));
            numDecimalPlaces = difficulty > 5 ? 3 : (difficulty > 2 ? 2 : 1);
            if (difficulty > 7 && Math.random() < 0.3) baseMagnitude *= (Math.random() > 0.5 ? 1000 : 0.001);
            break;
        case 'current':
            baseMagnitude = (Math.random() * (difficulty < 5 ? 2 : 5) + (difficulty < 3 ? 0.001 : 0.000001));
            numDecimalPlaces = difficulty > 5 ? 3 : (difficulty > 2 ? 2 : 1);
            if (difficulty > 3 && Math.random() < 0.6) baseMagnitude *= (Math.random() > 0.5 ? 0.001 : 0.000001); // mA/µA/nA focus
            if (difficulty > 7 && Math.random() < 0.3) baseMagnitude *= 0.000000001; // pA focus (rare)
            break;
        case 'resistance':
            baseMagnitude = (Math.random() * (difficulty < 5 ? 1000 : 10000) + (difficulty < 3 ? 1 : 0.1));
            numDecimalPlaces = difficulty > 5 ? 2 : (difficulty > 2 ? 1 : 0);
            if (difficulty > 7 && Math.random() < 0.3) baseMagnitude *= 1000; // MΩ
            break;
        default:
            const order = Math.floor(Math.random() * (difficulty / 2 + 3)) - Math.floor(difficulty / 3 + 1);
            baseMagnitude = (Math.random() * 90 + 10) * Math.pow(10, order);
            numDecimalPlaces = Math.min(3, Math.floor(difficulty / 3));
            break;
    }
    
    let finalValue = parseFloat(baseMagnitude.toFixed(Math.max(0, numDecimalPlaces)));

    // Introduce specific values like 0.002A more naturally based on category and difficulty
    if (category === 'current' && difficulty >= 4 && difficulty <=7 && Math.random() < 0.25) {
        finalValue = 0.002; // 2mA
    } else if (category === 'current' && difficulty > 7 && Math.random() < 0.2) {
        finalValue = 0.000002; // 2µA
    }


    const smallestAllowedMultiplier = Math.min(...unitCategories.find(uc => uc.category === category)?.units.map(u => unitMultipliers[u]) || [1]);
    if (Math.abs(finalValue) < smallestAllowedMultiplier / 100 && finalValue !== 0 && smallestAllowedMultiplier >= 1e-9) {
       finalValue = parseFloat(finalValue.toPrecision(2)); 
    } else if (Math.abs(finalValue) < 1e-9 && finalValue !==0) {
        finalValue = parseFloat(finalValue.toPrecision(2));
    }

    return finalValue === 0 && baseMagnitude !== 0 ? parseFloat(baseMagnitude.toPrecision(2)) : finalValue; // Avoid rounding to 0 if original wasn't
}


function getRandomUnit(units: Unit[]): Unit {
    return units[Math.floor(Math.random() * units.length)];
}

function generateDistractors(
    correctValueInBaseUnits: number,
    targetUnit: Unit,
    category: VariableCategory,
    difficulty: number
): GameOption[] {
    const distractors: GameOption[] = [];
    const correctFormatted = formatResultValue(correctValueInBaseUnits, category, targetUnit);
    const correctDisplayNumericPart = parseFloat(correctFormatted.displayValue);

    const usedDisplayValues = new Set<string>([`${correctDisplayNumericPart.toPrecision(4)}`]);
    let attempts = 0;

    // Factors for prefix errors - more focused
    const prefixErrorFactors = [1000, 0.001];
    if (difficulty > 4) prefixErrorFactors.push(1_000_000, 0.000_001);
    if (difficulty > 7) prefixErrorFactors.push(1_000_000_000, 0.000_000_001);


    for (const factor of prefixErrorFactors) {
        if (distractors.length >= 3) break;
        const distractorBaseValue = correctValueInBaseUnits * factor;
        const formattedDistractor = formatResultValue(distractorBaseValue, category, targetUnit);
        const displayDistractorNumeric = parseFloat(formattedDistractor.displayValue);
        const distractorKey = `${displayDistractorNumeric.toPrecision(4)}`;


        if (!usedDisplayValues.has(distractorKey) && isFinite(displayDistractorNumeric) && displayDistractorNumeric !== 0) {
            distractors.push({
                key: '',
                label: `${formattedDistractor.displayValue} ${targetUnit}`,
                valueInTargetUnit: displayDistractorNumeric
            });
            usedDisplayValues.add(distractorKey);
        }
    }

    // Slightly off values (digit errors or small calculation mistakes)
    const smallVariationFactors = difficulty < 5 ? [1.1, 0.9, 1.5, 0.5] : [1.01, 0.99, 1.05, 0.95, 1.2, 0.8];
     for (const factor of smallVariationFactors) {
         if (distractors.length >= 3) break;
         let distractorBaseValue = correctValueInBaseUnits * factor;
         // If correct value is very small, ensure variation is also small but distinct
         if (Math.abs(correctValueInBaseUnits) < 1e-6 && correctValueInBaseUnits !== 0) {
            distractorBaseValue = correctValueInBaseUnits + (Math.random() - 0.5) * Math.abs(correctValueInBaseUnits) * 0.5;
         }

        const formattedDistractor = formatResultValue(distractorBaseValue, category, targetUnit);
        const displayDistractorNumeric = parseFloat(formattedDistractor.displayValue);
        const distractorKey = `${displayDistractorNumeric.toPrecision(4)}`;

        if (!usedDisplayValues.has(distractorKey) && isFinite(displayDistractorNumeric) && displayDistractorNumeric !== 0) {
            distractors.push({
                key: '',
                label: `${formattedDistractor.displayValue} ${targetUnit}`,
                valueInTargetUnit: displayDistractorNumeric
            });
            usedDisplayValues.add(distractorKey);
        }
    }

    // Fallback: If still not enough, create more varied distractors.
    while (distractors.length < 3 && attempts < 30) {
        attempts++;
        // Generate a distractor that's significantly different to avoid too-close options
        const randomOrderShift = Math.pow(10, Math.floor(Math.random() * 4) - 2); // 0.01, 0.1, 1, 10
        let variedBaseValue = correctValueInBaseUnits * randomOrderShift * (Math.random() * 1.8 + 0.1); // further vary
        
        // Ensure it's not zero if original isn't
        if (correctValueInBaseUnits !== 0 && variedBaseValue === 0) {
            variedBaseValue = correctValueInBaseUnits * (Math.random() > 0.5 ? 100 : 0.01);
        }


        const formattedDistractor = formatResultValue(variedBaseValue, category, targetUnit);
        const displayDistractorNumeric = parseFloat(formattedDistractor.displayValue);
        const distractorKey = `${displayDistractorNumeric.toPrecision(4)}`;


        if (!usedDisplayValues.has(distractorKey) && isFinite(displayDistractorNumeric)) {
             if (displayDistractorNumeric === 0 && correctDisplayNumericPart !== 0 && !usedDisplayValues.has("0.000")) { // Don't add zero if correct isn't zero, unless it's a forced option
                // Skip adding zero unless it's a specific distractor type
             } else {
                distractors.push({
                    key: '',
                    label: `${formattedDistractor.displayValue} ${targetUnit}`,
                    valueInTargetUnit: displayDistractorNumeric
                });
                usedDisplayValues.add(distractorKey);
             }
        }
    }
    
    // Ensure we have exactly 3 distractors, even if it means some less ideal ones
    while (distractors.length < 3) {
        const emergencyVal = parseFloat((correctDisplayNumericPart * (Math.random()*5 + 2) + (Math.random()*10)).toPrecision(3));
        const emergencyKey = `${emergencyVal.toPrecision(4)}`;
        if(!usedDisplayValues.has(emergencyKey) && isFinite(emergencyVal)){
            distractors.push({key:'', label: `${emergencyVal} ${targetUnit}`, valueInTargetUnit: emergencyVal});
            usedDisplayValues.add(emergencyKey);
        } else { // last resort for uniqueness
             distractors.push({key:'', label: `${(correctDisplayNumericPart + 1234.56 + Math.random()*100).toPrecision(3)} ${targetUnit}`, valueInTargetUnit: (correctDisplayNumericPart + 1234.56 + Math.random()*100) });
        }
    }

    return distractors.slice(0, 3);
}


function generateGameQuestion(round: number): ConverterGameQuestion {
    const difficulty = Math.min(10, Math.floor(round / 2) + 1);
    let categoryInfo: { category: VariableCategory, units: Unit[], baseUnit: Unit };
    let originalUnit: Unit;
    let targetUnit: Unit;

    // Focus on V, A, Ohms initially, then expand
    const mainCategories = ['voltage', 'current', 'resistance'] as VariableCategory[];
    if (difficulty <= 3) { // Basic V, A, Ohm to/from milli/kilo
        const targetCat = mainCategories[round % 3];
        categoryInfo = unitCategories.find(uc => uc.category === targetCat)!;
        originalUnit = categoryInfo.baseUnit; // Start from base
        const otherUnits = categoryInfo.units.filter(u => u !== originalUnit && (u.startsWith('m') || u.startsWith('k')));
        targetUnit = otherUnits.length > 0 ? getRandomUnit(otherUnits) : categoryInfo.units.filter(u => u !== originalUnit)[0] || originalUnit;
    } else if (difficulty <= 6) { // Introduce micro and mega, and other categories
        categoryInfo = unitCategories[Math.floor(Math.random() * unitCategories.length)];
        originalUnit = getRandomUnit(categoryInfo.units);
        const potentialTargets = categoryInfo.units.filter(u => u !== originalUnit && Math.abs(Math.log10(unitMultipliers[u] / unitMultipliers[originalUnit])) <= 6); // Up to 2 prefix jumps
        targetUnit = potentialTargets.length > 0 ? getRandomUnit(potentialTargets) : categoryInfo.units.filter(u => u !== originalUnit)[0] || originalUnit;
    } else { // Harder: wider range, more complex categories
        categoryInfo = unitCategories[Math.floor(Math.random() * unitCategories.length)];
        originalUnit = getRandomUnit(categoryInfo.units);
        targetUnit = getRandomUnit(categoryInfo.units.filter(u => u !== originalUnit));
    }
    
    let attempts = 0; // Prevent infinite loops
    while ((originalUnit === targetUnit || unitMultipliers[originalUnit] === unitMultipliers[targetUnit]) && attempts < 20) {
        attempts++;
        targetUnit = getRandomUnit(categoryInfo.units.filter(u => u !== originalUnit));
         if (!targetUnit) targetUnit = categoryInfo.units[0]; // Fallback if only one unit exists somehow
    }
    // If still the same, force a different unit if possible
    if (originalUnit === targetUnit || unitMultipliers[originalUnit] === unitMultipliers[targetUnit]) {
        const differentUnits = categoryInfo.units.filter(u => u !== originalUnit && unitMultipliers[u] !== unitMultipliers[originalUnit]);
        targetUnit = differentUnits.length > 0 ? differentUnits[0] : categoryInfo.units[(categoryInfo.units.indexOf(originalUnit) + 1) % categoryInfo.units.length];
    }


    const originalValueInBaseUnits = generateRandomValueForCategory(difficulty, categoryInfo.category);
    
    const formattedOriginal = formatResultValue(originalValueInBaseUnits, categoryInfo.category, originalUnit);
    const promptText = `Convert ${formattedOriginal.displayValue} ${originalUnit} to ${targetUnit}`;

    const formattedCorrect = formatResultValue(originalValueInBaseUnits, categoryInfo.category, targetUnit);
    const correctNumericValueForComparison = parseFloat(formattedCorrect.displayValue);
    
    const correctOption: GameOption = {
        key: '', 
        label: `${formattedCorrect.displayValue} ${targetUnit}`,
        valueInTargetUnit: correctNumericValueForComparison
    };

    const distractorOptions = generateDistractors(originalValueInBaseUnits, targetUnit, categoryInfo.category, difficulty);
    
    const allOptionsUnkeyed = [correctOption, ...distractorOptions];
    
    const uniqueOptionsMap = new Map<string, GameOption>();
    allOptionsUnkeyed.forEach(opt => {
        const uniqueKey = `${opt.valueInTargetUnit.toPrecision(6)}-${targetUnit}`;
        if (!uniqueOptionsMap.has(uniqueKey)) {
            uniqueOptionsMap.set(uniqueKey, opt);
        }
    });

    let finalOptions = Array.from(uniqueOptionsMap.values());
     
    let fallbackAttempts = 0;
    while(finalOptions.length < 4 && fallbackAttempts < 10) {
        fallbackAttempts++;
        const fallbackMagnitudeFactor = Math.pow(10, Math.floor(Math.random() * 7) - 3); // 0.001 to 1000
        const fallbackBaseValue = correctValueInBaseUnits * fallbackMagnitudeFactor * (Math.random() > 0.5 ? 1.2 : 0.8);
        const formattedFallback = formatResultValue(fallbackBaseValue, categoryInfo.category, targetUnit);
        const fallbackNumeric = parseFloat(formattedFallback.displayValue);
        const fallbackKey = `${fallbackNumeric.toPrecision(6)}-${targetUnit}`;
        if(!uniqueOptionsMap.has(fallbackKey) && isFinite(fallbackNumeric) && fallbackNumeric !== 0) {
            finalOptions.push({key: '', label: `${formattedFallback.displayValue} ${targetUnit}`, valueInTargetUnit: fallbackNumeric});
            uniqueOptionsMap.set(fallbackKey, finalOptions[finalOptions.length - 1]);
        }
    }
    
    // Ensure exactly 4 options, even if some are less ideal duplicates numerically but different labels if forced
    while (finalOptions.length > 4) finalOptions.pop(); // Trim excess
    while (finalOptions.length < 4) {
        const emergencyVal = parseFloat((correctDisplayNumericPart * (Math.random() * 5 + 2) + (Math.random() * 10 + 1)).toPrecision(3));
        finalOptions.push({ key: `emergency-${finalOptions.length}`, label: `${emergencyVal} ${targetUnit}`, valueInTargetUnit: emergencyVal });
    }


    const shuffledOptions = finalOptions
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
      setScore(s => s + 10 * currentQuestion.difficulty); 
      setFeedback({ message: 'Correct! Nicely done.', type: 'correct' });
      toast({ title: "Correct!", description: `+${10 * currentQuestion.difficulty} points`, className: "bg-green-600 text-white dark:bg-green-700 dark:text-white" });
    } else {
      setScore(s => Math.max(0, s - (5 * Math.max(1, Math.floor(currentQuestion.difficulty / 2 )) ) ) ); 
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
        <p className="text-xl">Your Final Score: <strong className={cn(score > 50 * TOTAL_ROUNDS / 2 ? "text-primary" : score > 0 ? "text-amber-600" : "text-destructive")}>{score}</strong></p>
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
        <p className="text-lg font-semibold">Score: <span className={cn(score > 50 * (currentRound +1) / 2 ? "text-primary" : score > 0 ? "text-amber-600" : "text-foreground")}>{score}</span></p>
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
                htmlFor={`option-${option.key}-${currentQuestion.id}`} 
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
