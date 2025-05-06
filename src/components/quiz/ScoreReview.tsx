
'use client';

import React, { useState, useCallback, useRef } from 'react';
import type { Question, AnswerSelection } from '@/types/quiz';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle, CircleAlert, RefreshCw, Home, Copy } from 'lucide-react'; // Changed CircleCheckBig to CheckCircle if that was a typo
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast"; // Import useToast
import { cn } from "@/lib/utils"; // Import cn for conditional classes

interface ScoreReviewProps {
  questions: Question[];
  userAnswers: AnswerSelection[];
  onRestart: () => void;
  onGoHome: () => void;
}


export default function ScoreReview({ questions, userAnswers, onRestart, onGoHome }: ScoreReviewProps) {
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


   const copyToClipboard = useCallback((text: string | undefined, questionIndex: number, type: 'Question' | 'Feedback') => {
     if (!text) return;
     navigator.clipboard.writeText(text).then(() => {
       toast({
         title: `${type} Copied`,
         description: `${type} for Question ${questionIndex + 1} copied to clipboard.`,
       });
     }).catch(err => {
       console.error(`Failed to copy ${type}:`, err);
       toast({
         title: "Copy Failed",
         description: `Could not copy ${type}.`,
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
              <AccordionItem key={questionId} value={`item-${index}`} className={cn("border-b rounded-lg mb-2 overflow-hidden", isCorrect ? "border-green-200 dark:border-green-700/50" : "border-destructive/30 dark:border-destructive/50")}>
                {/* The AccordionTrigger now only wraps the main clickable text/icon area.
                    The copy Button is a sibling within the flex container.
                    The outer div manages the overall header appearance and hover group for the copy button.
                */}
                <div className={cn("flex justify-between items-center p-3 group", isCorrect ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/20 text-destructive')}>
                    <AccordionTrigger className="flex-1 p-0 hover:no-underline focus-visible:ring-0 focus-visible:ring-offset-0 text-left rounded-sm"> {/* AccordionTrigger is now more minimal */}
                      <div className="flex items-center min-w-0">
                        {isCorrect ? (
                          <CheckCircle className="h-5 w-5 mr-2 shrink-0" />
                        ) : (
                          <CircleAlert className="h-5 w-5 mr-2 shrink-0" />
                        )}
                        <span className="flex-1 text-base font-medium mr-2 truncate">{index + 1}. {question.question}</span>
                      </div>
                    </AccordionTrigger>
                    {/* Copy button is now a sibling to AccordionTrigger, within the shared header div */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn("ml-2 h-6 w-6 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity shrink-0", isCorrect ? "text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300" : "text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300")}
                        onClick={(e) => { e.stopPropagation(); copyToClipboard(question.question, index, 'Question'); }}
                        aria-label="Copy question text"
                    >
                       <Copy size={14} />
                    </Button>
                </div>
                <AccordionContent className="pt-0 pb-0 px-0">
                    <div className="bg-background p-4 border-t border-border space-y-3">
                         <p><strong>Your Answer:</strong> {userAnswerLabel || (userAnswer?.selectedOption ? `"${userAnswer.selectedOption}" (Invalid)`: <span className="italic text-muted-foreground">Not answered</span>)} {isCorrect ? <span className="text-green-700 dark:text-green-400">(Correct)</span> : <span className="text-destructive">(Incorrect)</span>}</p>
                        {!isCorrect && <p><strong>Correct Answer:</strong> {correctAnswerLabel || `"${question.answer}" (Invalid)`}</p>}
                        {question.feedback && (
                            <div className="relative group/feedback">
                                <p className="text-muted-foreground italic pr-8"><strong>Feedback:</strong> {question.feedback}</p>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-0 right-0 h-6 w-6 text-muted-foreground opacity-0 group-hover/feedback:opacity-100 focus-visible:opacity-100 transition-opacity"
                                    onClick={(e) => {e.stopPropagation(); copyToClipboard(question.feedback, index, 'Feedback'); }}
                                    aria-label="Copy feedback text"
                                >
                                <Copy size={14} />
                                </Button>
                            </div>
                         )}
                    </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4 p-6 bg-muted/30 rounded-b-lg">
        <Button variant="outline" onClick={onRestart} className="w-full sm:w-auto">
          <RefreshCw className="mr-2 h-4 w-4" /> Select New Quiz
        </Button>
        <Button variant="default" onClick={onGoHome} className="w-full sm:w-auto">
          <Home className="mr-2 h-4 w-4" /> Go Home
        </Button>
      </CardFooter>
    </Card>
  );
}

