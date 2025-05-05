'use client';

import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, CheckCircle } from "lucide-react";

interface QuizControlsProps {
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
  isFirstQuestion: boolean;
  isLastQuestion: boolean;
  canSubmit: boolean; // Whether the submit button should be enabled/shown
}

export default function QuizControls({
  onPrevious,
  onNext,
  onSubmit,
  isFirstQuestion,
  isLastQuestion,
  canSubmit,
}: QuizControlsProps) {
  return (
    <div className="flex justify-between items-center mt-6 max-w-2xl mx-auto">
      <Button
        variant="outline"
        onClick={onPrevious}
        disabled={isFirstQuestion}
        aria-label="Previous Question"
        className="transition-opacity disabled:opacity-50"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Previous
      </Button>

      {isLastQuestion ? (
        <Button
          onClick={onSubmit}
          disabled={!canSubmit}
          aria-label="Submit Quiz"
          className="bg-accent hover:bg-accent/90 text-accent-foreground transition-opacity disabled:opacity-50"
        >
          <CheckCircle className="mr-2 h-4 w-4" /> Submit Quiz
        </Button>
      ) : (
        <Button
          variant="default"
          onClick={onNext}
          aria-label="Next Question"
          className="transition-opacity"
        >
          Next <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
