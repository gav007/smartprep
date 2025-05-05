
'use client';

import React, { useState, useCallback, useRef } from 'react';
import type { Question, AnswerSelection } from '@/types/quiz';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AlertCircle, CheckCircle, HelpCircle, RefreshCw, Home, BrainCircuit, Copy, Loader2 } from 'lucide-react';
import { explainAnswer, type ExplainAnswerInput } from '@/ai/flows/explain-answer'; // Import AI function
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast"; // Import useToast

interface ScoreReviewProps {
  questions: Question[];
  userAnswers: AnswerSelection[];
  onRestart: () => void;
  onGoHome: () => void;
}

// Simple rate limiting placeholder - ideally use a more robust library
const explanationRequestTimestamps: Record<string, number> = {};
const RATE_LIMIT_MS = 2000; // Allow request every 2 seconds per question

export default function ScoreReview({ questions, userAnswers, onRestart, onGoHome }: ScoreReviewProps) {
  const [explanations, setExplanations] = useState<Record<string, string>>({});
  const [loadingExplanations, setLoadingExplanations] = useState<Record<string, boolean>>({});
  const [errorExplanations, setErrorExplanations] = useState<Record<string, string | null>>({});
  const { toast } = useToast(); // Initialize useToast

  const calculateScore = () => {
    let correctCount = 0;
    userAnswers.forEach(userAnswer => {
      const question = questions.find(q => q.id === userAnswer.questionId);
      if (question && userAnswer.selectedOption === question.answer) {
        correctCount++;
      }
    });
    return correctCount;
  };

  const score = calculateScore();
  const totalQuestions = questions.length;
  const scorePercentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

  const getExplanation = useCallback(async (question: Question, userAnswer: AnswerSelection | undefined) => {
    const questionId = question.id;
    const now = Date.now();

    // Check rate limit
    if (explanationRequestTimestamps[questionId] && now - explanationRequestTimestamps[questionId] < RATE_LIMIT_MS) {
        toast({
            title: "Rate Limited",
            description: "Please wait a moment before requesting another explanation for this question.",
            variant: "default",
        });
        return;
    }

    // Don't fetch if already successfully fetched (allow retry on error)
    if (explanations[questionId] && !errorExplanations[questionId]) return;
    if (loadingExplanations[questionId]) return; // Already loading

    setLoadingExplanations(prev => ({ ...prev, [questionId]: true }));
    setErrorExplanations(prev => ({ ...prev, [questionId]: null })); // Clear previous error on new attempt
    explanationRequestTimestamps[questionId] = now; // Update timestamp

    // --- Input Validation ---
    const correctAnswerLabel = question.options.find(opt => opt.key === question.answer)?.label;
    const userAnswerLabel = userAnswer?.selectedOption ? question.options.find(opt => opt.key === userAnswer.selectedOption)?.label : "No answer provided";

     if (!question.question || !correctAnswerLabel || !question.feedback) {
         setErrorExplanations(prev => ({ ...prev, [questionId]: "Missing necessary information to generate explanation." }));
         setLoadingExplanations(prev => ({ ...prev, [questionId]: false }));
         return;
     }
     // --- End Input Validation ---


    try {
       const input: ExplainAnswerInput = {
         question: question.question,
         correctAnswer: correctAnswerLabel, // Send label, not just key 'C'
         userAnswer: userAnswerLabel || "No answer provided", // Send label or indicator
         feedback: question.feedback,
       };

      if (!input.userAnswer || input.userAnswer === 'undefined') { // Extra check
         input.userAnswer = "No answer provided";
      }

      const result = await explainAnswer(input); // Call the Genkit flow

       if (!result || !result.explanation) {
          throw new Error("Received an empty explanation from the AI.");
       }

      setExplanations(prev => ({ ...prev, [questionId]: result.explanation }));
    } catch (error) {
      console.error("Error fetching explanation:", error);
       let errorMessage = "Sorry, couldn't generate an explanation right now.";
       if (error instanceof Error) {
           errorMessage = `Error: ${error.message}`; // Show more specific error
       }
       setErrorExplanations(prev => ({ ...prev, [questionId]: errorMessage }));
       setExplanations(prev => ({ ...prev, [questionId]: '' })); // Clear any potentially stale explanation on error
    } finally {
      setLoadingExplanations(prev => ({ ...prev, [questionId]: false }));
    }
  }, [explanations, loadingExplanations, errorExplanations, toast]); // Added errorExplanations and toast dependencies


   const copyToClipboard = useCallback((text: string | undefined, questionIndex: number) => {
     if (!text) return;
     navigator.clipboard.writeText(text).then(() => {
       toast({
         title: "Explanation Copied",
         description: `Explanation for Question ${questionIndex + 1} copied to clipboard.`,
       });
     }).catch(err => {
       console.error('Failed to copy explanation:', err);
       toast({
         title: "Copy Failed",
         description: "Could not copy explanation.",
         variant: "destructive",
       });
     });
   }, [toast]);

  return (
    <Card className="w-full max-w-3xl mx-auto shadow-lg rounded-lg">
      <CardHeader className="text-center bg-primary text-primary-foreground p-6 rounded-t-lg">
        <CardTitle className="text-2xl md:text-3xl font-bold">Quiz Results</CardTitle>
        <CardDescription className="text-primary-foreground/80 text-lg mt-2">
          You scored {score} out of {totalQuestions} ({scorePercentage}%)
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 md:p-6">
        <h3 className="text-xl font-semibold mb-4 text-center">Review Your Answers</h3>
        <Accordion type="single" collapsible className="w-full">
          {questions.map((question, index) => {
            const userAnswer = userAnswers.find(ua => ua.questionId === question.id);
            const isCorrect = userAnswer?.selectedOption === question.answer;
            const userAnswerLabel = question.options.find(opt => opt.key === userAnswer?.selectedOption)?.label;
            const correctAnswerLabel = question.options.find(opt => opt.key === question.answer)?.label;
            const questionId = question.id;

            return (
              <AccordionItem key={questionId} value={`item-${index}`}>
                <AccordionTrigger className={`flex justify-between items-center p-3 rounded-md transition-colors hover:bg-muted/50 ${isCorrect ? 'text-green-700 dark:text-green-400' : 'text-destructive'}`}>
                  <div className="flex items-center text-left">
                    {isCorrect ? (
                      <CheckCircle className="h-5 w-5 mr-2 shrink-0" />
                    ) : (
                      <AlertCircle className="h-5 w-5 mr-2 shrink-0" />
                    )}
                    <span className="flex-1 text-base font-medium">Question {index + 1}: {question.question}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-4 px-3 space-y-3 bg-muted/20 rounded-b-md border-l-4" style={{ borderColor: isCorrect ? 'hsl(var(--chart-2))' : 'hsl(var(--destructive))' }}>
                   <p><strong>Your Answer:</strong> {userAnswerLabel || (userAnswer?.selectedOption ? `"${userAnswer.selectedOption}" (Invalid)`: <span className="italic text-muted-foreground">Not answered</span>)} {isCorrect ? <span className="text-green-700 dark:text-green-400">(Correct)</span> : <span className="text-destructive">(Incorrect)</span>}</p>
                  {!isCorrect && <p><strong>Correct Answer:</strong> {correctAnswerLabel || `"${question.answer}" (Invalid)`}</p>}
                  <p className="text-muted-foreground italic"><strong>Original Feedback:</strong> {question.feedback}</p>

                  {/* AI Explanation Section */}
                  <div className="mt-3 space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => getExplanation(question, userAnswer)}
                        disabled={loadingExplanations[questionId] || (!!explanations[questionId] && !errorExplanations[questionId])} // Disable if loading or already succeeded
                        className="text-accent-foreground border-accent hover:bg-accent/10 disabled:opacity-70"
                      >
                        {loadingExplanations[questionId] ? (
                            <> <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Thinking... </>
                        ) : errorExplanations[questionId] ? (
                            <> <RefreshCw className="mr-2 h-4 w-4" /> Retry Explanation </>
                        ) : explanations[questionId] ? (
                           <> <BrainCircuit className="mr-2 h-4 w-4" /> Explanation Loaded </>
                        ) : (
                            <> <BrainCircuit className="mr-2 h-4 w-4" /> Explain This Answer </>
                        )}
                      </Button>

                    {/* Loading Skeleton */}
                    {loadingExplanations[questionId] && (
                        <div className="mt-2 space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                        </div>
                    )}

                    {/* Error Display */}
                    {errorExplanations[questionId] && !loadingExplanations[questionId] && (
                        <Alert variant="destructive" className="mt-2">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Explanation Error</AlertTitle>
                            <AlertDescription>
                            {errorExplanations[questionId]}
                            {/* Retry button integrated into the main button now */}
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Explanation Display */}
                    {explanations[questionId] && !loadingExplanations[questionId] && !errorExplanations[questionId] && (
                        <Alert className="mt-2 border-primary bg-primary/5 relative group">
                           <HelpCircle className="h-4 w-4 text-primary" />
                           <AlertTitle className="text-primary font-semibold">AI Explanation</AlertTitle>
                           <AlertDescription className="prose prose-sm dark:prose-invert max-w-none"> {/* Added prose for better text formatting */}
                            {explanations[questionId]}
                           </AlertDescription>
                           {/* Copy Button */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-2 right-2 h-7 w-7 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => copyToClipboard(explanations[questionId], index)}
                                aria-label="Copy explanation"
                            >
                                <Copy size={14} />
                            </Button>
                        </Alert>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
      <CardFooter className="flex justify-center space-x-4 p-6 bg-muted/30 rounded-b-lg">
        <Button variant="outline" onClick={onRestart}>
          <RefreshCw className="mr-2 h-4 w-4" /> Restart Quiz
        </Button>
        <Button variant="default" onClick={onGoHome}>
          <Home className="mr-2 h-4 w-4" /> Go Home
        </Button>
      </CardFooter>
    </Card>
  );
}

    