'use client';

import React, { useState, useCallback } from 'react';
import type { Question, AnswerSelection } from '@/types/quiz';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AlertCircle, CheckCircle, HelpCircle, RefreshCw, Home, BrainCircuit } from 'lucide-react';
import { explainAnswer, type ExplainAnswerInput } from '@/ai/flows/explain-answer'; // Import AI function
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

interface ScoreReviewProps {
  questions: Question[];
  userAnswers: AnswerSelection[];
  onRestart: () => void;
  onGoHome: () => void;
}

export default function ScoreReview({ questions, userAnswers, onRestart, onGoHome }: ScoreReviewProps) {
  const [explanations, setExplanations] = useState<Record<string, string>>({});
  const [loadingExplanations, setLoadingExplanations] = useState<Record<string, boolean>>({});
  const [errorExplanations, setErrorExplanations] = useState<Record<string, string | null>>({});


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
    if (explanations[questionId] || loadingExplanations[questionId]) return; // Don't fetch if already fetched or loading

    setLoadingExplanations(prev => ({ ...prev, [questionId]: true }));
    setErrorExplanations(prev => ({ ...prev, [questionId]: null }));


    try {
       const input: ExplainAnswerInput = {
         question: question.question,
         correctAnswer: question.options.find(opt => opt.key === question.answer)?.label || question.answer,
         userAnswer: userAnswer?.selectedOption ? (question.options.find(opt => opt.key === userAnswer.selectedOption)?.label || userAnswer.selectedOption) : "No answer provided",
         feedback: question.feedback,
       };
      const result = await explainAnswer(input);
      setExplanations(prev => ({ ...prev, [questionId]: result.explanation }));
    } catch (error) {
      console.error("Error fetching explanation:", error);
       setErrorExplanations(prev => ({ ...prev, [questionId]: "Sorry, couldn't generate an explanation right now." }));
    } finally {
      setLoadingExplanations(prev => ({ ...prev, [questionId]: false }));
    }
  }, [explanations, loadingExplanations]);


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

            return (
              <AccordionItem key={question.id} value={`item-${index}`}>
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

                 <Button
                    variant="outline"
                    size="sm"
                    onClick={() => getExplanation(question, userAnswer)}
                    disabled={loadingExplanations[question.id]}
                    className="mt-2 text-accent-foreground border-accent hover:bg-accent/10"
                  >
                    <BrainCircuit className="mr-2 h-4 w-4" />
                    {loadingExplanations[question.id] ? 'Getting Explanation...' : (explanations[question.id] ? 'Show AI Explanation' : 'Explain This Answer')}
                  </Button>

                   {loadingExplanations[question.id] && (
                     <div className="mt-2 space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                     </div>
                   )}

                    {errorExplanations[question.id] && (
                       <Alert variant="destructive" className="mt-2">
                         <AlertCircle className="h-4 w-4" />
                         <AlertTitle>Error</AlertTitle>
                         <AlertDescription>
                          {errorExplanations[question.id]}
                         </AlertDescription>
                       </Alert>
                    )}

                  {explanations[question.id] && !loadingExplanations[question.id] && (
                     <Alert className="mt-2 border-primary bg-primary/5">
                      <HelpCircle className="h-4 w-4 text-primary" />
                       <AlertTitle className="text-primary">AI Explanation</AlertTitle>
                       <AlertDescription>
                         {explanations[question.id]}
                       </AlertDescription>
                     </Alert>
                  )}

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
