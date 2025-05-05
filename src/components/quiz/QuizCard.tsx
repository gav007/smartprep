'use client';

import type { Question, Option } from '@/types/quiz';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface QuizCardProps {
  question: Question;
  selectedOption: string | null;
  onOptionChange: (optionKey: string) => void;
  questionNumber: number;
  totalQuestions: number;
}

export default function QuizCard({
  question,
  selectedOption,
  onOptionChange,
  questionNumber,
  totalQuestions,
}: QuizCardProps) {

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg rounded-lg overflow-hidden transition-all duration-300 hover:shadow-xl">
      <CardHeader className="bg-card-foreground/5 p-4 md:p-6">
        <CardDescription className="text-sm text-muted-foreground">
          Question {questionNumber} of {totalQuestions}
        </CardDescription>
        <CardTitle className="text-lg md:text-xl font-semibold mt-1">{question.question}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 md:p-6">
        <RadioGroup
          value={selectedOption ?? ''}
          onValueChange={onOptionChange}
          className="space-y-3"
        >
          {question.options.map((option) => (
            <div key={option.key} className="flex items-center space-x-3 p-3 border rounded-md hover:bg-accent/10 transition-colors cursor-pointer has-[:checked]:bg-accent/20 has-[:checked]:border-accent">
              <RadioGroupItem value={option.key} id={`option-${question.id}-${option.key}`} />
              <Label htmlFor={`option-${question.id}-${option.key}`} className="flex-1 text-base cursor-pointer">
                <span className="font-medium mr-2">{option.key}.</span> {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </CardContent>
    </Card>
  );
}
