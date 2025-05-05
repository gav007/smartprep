
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation'; // Use useRouter from next/navigation
import { shuffleArray, normalizeQuestion } from '@/lib/quiz-client'; // Import client-side functions
import type { Question, AnswerSelection, RawQuestion } from '@/types/quiz';
import QuizCard from '@/components/quiz/QuizCard';
import QuizControls from '@/components/quiz/QuizControls';
import ScoreReview from '@/components/quiz/ScoreReview';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertTriangle, BookOpen, Network } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";


type QuizState = 'selecting' | 'loading' | 'active' | 'review' | 'error';

interface QuizOption {
  key: string;
  label: string;
  filename: string;
}

const quizOptions: QuizOption[] = [
  { key: 'applied', label: 'Applied Networking Quiz', filename: 'applied.json' },
  { key: 'network', label: 'Networking Fundamentals Quiz', filename: 'network_quiz.json' },
];


export default function QuizPage() {
  const [quizState, setQuizState] = useState<QuizState>('selecting');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<AnswerSelection[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuiz, setSelectedQuiz] = useState<QuizOption | null>(null);

  const router = useRouter();
   const { toast } = useToast();


   const startQuiz = useCallback(async (quiz: QuizOption, count: number = 10) => {
      setSelectedQuiz(quiz);
      setQuizState('loading');
      setError(null);
      setUserAnswers([]);
      setCurrentQuestionIndex(0);

      try {
        // Fetch data from the public directory
        const response = await fetch(`/data/${quiz.filename}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch quiz data: ${response.statusText}`);
        }
        const rawData: RawQuestion[] = await response.json();

         if (!Array.isArray(rawData)) {
           throw new Error(`Invalid quiz data format in ${quiz.filename}: Expected an array.`);
         }

         const normalizedQuestions: Question[] = rawData
           .map((raw, index) => normalizeQuestion(raw, index))
           .filter((q): q is Question => q !== null); // Filter out null values (invalid questions)

        if (normalizedQuestions.length === 0) {
           throw new Error(`No valid questions were found in ${quiz.filename}. Please check the data file.`);
        }

        const selectedQuestions = shuffleArray(normalizedQuestions).slice(0, count);

        setQuestions(selectedQuestions);
        // Initialize user answers
        setUserAnswers(selectedQuestions.map(q => ({ questionId: q.id, selectedOption: null })));
        setQuizState('active');
      } catch (err) {
        console.error("Failed to load quiz:", err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred while loading the quiz.');
        setQuizState('error');
      }
    }, []); // Removed toast dependency as it's not used here anymore

  const handleOptionChange = (optionKey: string) => {
    const currentQuestionId = questions[currentQuestionIndex]?.id;
    if (!currentQuestionId) return;

    setUserAnswers(prevAnswers =>
      prevAnswers.map(answer =>
        answer.questionId === currentQuestionId
          ? { ...answer, selectedOption: optionKey }
          : answer
      )
    );
  };

  const handleNext = () => {
     // Add a subtle toast notification when moving to the next question
    const currentAnswer = userAnswers[currentQuestionIndex]?.selectedOption;
     if (currentAnswer === null) {
       toast({
         title: "Reminder",
         description: "You haven't selected an answer for this question.",
         variant: "default", // Use default (less intrusive) style
       });
     }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prevIndex => prevIndex - 1);
    }
  };

  const handleSubmit = () => {
    // Check if all questions are answered before submitting
    const unanswered = userAnswers.filter(a => a.selectedOption === null).length;
    if (unanswered > 0) {
      toast({
        title: "Incomplete Quiz",
        description: `You have ${unanswered} unanswered question${unanswered > 1 ? 's' : ''}. Please review before submitting.`,
        variant: "destructive", // More prominent for incomplete submission attempt
      });
       // Optionally, prevent submission or navigate to the first unanswered question
       // const firstUnansweredIndex = userAnswers.findIndex(a => a.selectedOption === null);
       // if (firstUnansweredIndex !== -1) setCurrentQuestionIndex(firstUnansweredIndex);
       // return; // Prevent submission for now
    }
    setQuizState('review');
  };

  const handleRestart = () => {
    if (selectedQuiz) {
        startQuiz(selectedQuiz); // Restart the same quiz
    } else {
        setQuizState('selecting'); // Fallback to selection if something went wrong
    }
  };

  const handleGoHome = () => {
    setQuizState('selecting');
    setSelectedQuiz(null);
    setQuestions([]);
    // Optionally navigate to root or clear state fully
     // router.push('/'); // Or just reset state for SPA feel
  };

  // Derived state
  const currentQuestion = questions[currentQuestionIndex];
  const currentSelectedOption = userAnswers.find(
    (answer) => answer.questionId === currentQuestion?.id
  )?.selectedOption ?? null;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
   // Enable submit only when on the last question AND all questions have been attempted
   // Modify this logic if you allow submitting incomplete quizzes
  const canSubmit = isLastQuestion // && userAnswers.every(a => a.selectedOption !== null);


  // Render based on state
  if (quizState === 'loading') {
    return (
       <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading Quiz...</p>
      </div>
    );
  }

  if (quizState === 'error') {
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
         <Alert variant="destructive" className="max-w-lg mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Quiz</AlertTitle>
          <AlertDescription>
            {error || 'An unexpected error occurred.'}
          </AlertDescription>
        </Alert>
        <Button onClick={handleGoHome} variant="outline" className="mt-6">
          Back to Selection
        </Button>
      </div>
    );
  }

  if (quizState === 'selecting') {
    return (
       <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center pt-10">
        <h1 className="text-3xl font-bold mb-8 text-center">Select a Quiz</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
          {quizOptions.map((quiz) => (
            <Card
              key={quiz.key}
              className="cursor-pointer hover:shadow-lg transition-shadow hover:border-primary"
              onClick={() => startQuiz(quiz, 10)} // Pass count here
            >
              <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
                 {quiz.key === 'applied' ? <Network className="h-8 w-8 text-primary" /> : <BookOpen className="h-8 w-8 text-primary" />}
                <CardTitle className="text-xl font-semibold">{quiz.label}</CardTitle>
              </CardHeader>
              <CardContent>
                 <CardDescription>Test your knowledge on {quiz.label.toLowerCase().includes('applied') ? 'practical networking concepts' : 'fundamental networking principles'}.</CardDescription>
                 {/* Add more description if needed */}
              </CardContent>
               {/* Optional Footer or action indication */}
               {/* <CardFooter><p className="text-sm text-muted-foreground">Click to start</p></CardFooter> */}
            </Card>
          ))}
        </div>
         {/* Link to calculator dashboard removed as it's in the main header now */}
      </div>
    );
  }

  if (quizState === 'review') {
    return (
      <div className="container mx-auto px-4 py-8">
        <ScoreReview
            questions={questions}
            userAnswers={userAnswers}
            onRestart={handleRestart}
            onGoHome={handleGoHome}
        />
      </div>
    );
  }

  // Active quiz state
  return (
    <div className="container mx-auto px-4 py-8 w-full max-w-3xl flex flex-col items-center">
      {currentQuestion ? (
        <>
          <QuizCard
            question={currentQuestion}
            selectedOption={currentSelectedOption}
            onOptionChange={handleOptionChange}
            questionNumber={currentQuestionIndex + 1}
            totalQuestions={questions.length}
          />
          <QuizControls
            onPrevious={handlePrevious}
            onNext={handleNext}
            onSubmit={handleSubmit}
            isFirstQuestion={currentQuestionIndex === 0}
            isLastQuestion={isLastQuestion}
            canSubmit={canSubmit}
          />
        </>
      ) : (
         // Should not happen if loading works, but good fallback
          <div className="text-center p-8">
            <p className="text-lg text-muted-foreground">No questions available for this quiz.</p>
             <Button onClick={handleGoHome} variant="outline" className="mt-6">
               Back to Selection
             </Button>
          </div>
      )}
    </div>
  );
}
