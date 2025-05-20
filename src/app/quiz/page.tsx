
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
import { Loader2, AlertTriangle, BookOpen, Network, ListChecks, BrainCircuit, Database, FileCode } from 'lucide-react'; // Added FileCode
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


type QuizState = 'selecting' | 'loading' | 'active' | 'review' | 'error';

interface QuizOption {
  key: string;
  label: string;
  filename: string;
  totalQuestions?: number; // Add total questions count after loading meta
  icon: React.ElementType; // Add icon field
  description: string; // Add description field
}

const quizOptions: QuizOption[] = [
  { key: 'applied', label: 'Applied Networking Quiz', filename: 'applied.json', icon: Network, description: 'Practical networking applications and scenarios.' },
  { key: 'network', label: 'Networking Fundamentals Quiz', filename: 'network_quiz.json', icon: BookOpen, description: 'Core concepts of computer networking.' },
  { key: 'electronics', label: 'Electronics Fundamentals Quiz', filename: 'electronics.json', icon: BrainCircuit, description: 'Basic principles and components of electronics.' },
  { key: 'database', label: 'Databases & Statistics Quiz', filename: 'Data_Database.json', icon: Database, description: 'Fundamental concepts of databases and statistics.' },
  { key: 'cprogramming', label: 'C Programming Language Quiz', filename: 'C_quiz.json', icon: FileCode, description: 'Test your knowledge of C programming fundamentals.' },
];

const questionCountOptions = [5, 10, 20]; // Define available question counts

export default function QuizPage() {
  const [quizState, setQuizState] = useState<QuizState>('selecting');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<AnswerSelection[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuiz, setSelectedQuiz] = useState<QuizOption | null>(null);
  const [selectedQuestionCount, setSelectedQuestionCount] = useState<number>(10); // Default question count
  const [availableQuizzes, setAvailableQuizzes] = useState<QuizOption[]>(quizOptions); // State for quizzes with total count

  const router = useRouter();
   const { toast } = useToast();

   // Fetch quiz metadata (total question count) on initial load
    useEffect(() => {
        const fetchQuizMetadata = async () => {
            const updatedQuizzes = await Promise.all(quizOptions.map(async (quiz) => {
                try {
                    const response = await fetch(`/data/${quiz.filename}`);
                    if (!response.ok) return quiz; // Keep original if fetch fails
                    const rawData: RawQuestion[] = await response.json();
                    return { ...quiz, totalQuestions: rawData.length };
                } catch {
                    return quiz; // Keep original on error
                }
            }));
            setAvailableQuizzes(updatedQuizzes);
        };
        if (quizState === 'selecting') {
            fetchQuizMetadata();
        }
    }, [quizState]); // Re-fetch if returning to selection state


   const startQuiz = useCallback(async (quiz: QuizOption, count: number) => {
      setSelectedQuiz(quiz);
      setQuizState('loading');
      setError(null);
      setUserAnswers([]);
      setCurrentQuestionIndex(0);

      try {
        // Fetch data from the public directory
        const response = await fetch(`/data/${quiz.filename}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch quiz data (${quiz.filename}): ${response.statusText}`);
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

        // Use the selected count, but don't exceed available questions
        const actualCount = Math.min(count, normalizedQuestions.length);
        const selectedQuestions = shuffleArray(normalizedQuestions).slice(0, actualCount);

        setQuestions(selectedQuestions);
        // Initialize user answers
        setUserAnswers(selectedQuestions.map(q => ({ questionId: q.id, selectedOption: null })));
        setQuizState('active');
      } catch (err) {
        console.error("Failed to load quiz:", err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred while loading the quiz.');
        setQuizState('error');
      }
    }, []);

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
    const currentAnswer = userAnswers[currentQuestionIndex]?.selectedOption;
     if (currentAnswer === null) {
       toast({
         title: "Reminder",
         description: "You haven't selected an answer for this question.",
         variant: "default",
       });
     }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prevIndex => prevIndex - 1); // Corrected to decrement
    }
  };

  const handleSubmit = () => {
    const unanswered = userAnswers.filter(a => a.selectedOption === null).length;
    if (unanswered > 0) {
      toast({
        title: "Incomplete Quiz",
        description: `You have ${unanswered} unanswered question${unanswered > 1 ? 's' : ''}. Please review before submitting.`,
        variant: "destructive",
      });
    } else { // Only proceed to review if all questions are answered, or add a confirmation dialog
        setQuizState('review');
    }
  };

  const handleRestart = () => {
    setQuizState('selecting');
    setSelectedQuiz(null);
    setQuestions([]);
  };

  const handleGoHome = () => {
    router.push('/'); // Navigate to home page
    // Resetting state might be redundant if page reloads, but good for SPA feel
    setQuizState('selecting');
    setSelectedQuiz(null);
    setQuestions([]);
  };

  // Derived state
  const currentQuestion = questions[currentQuestionIndex];
  const currentSelectedOption = userAnswers.find(
    (answer) => answer.questionId === currentQuestion?.id
  )?.selectedOption ?? null;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const canSubmit = questions.length > 0 && userAnswers.every(a => a.selectedOption !== null);


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
        <Button onClick={handleRestart} variant="outline" className="mt-6">
          Back to Selection
        </Button>
      </div>
    );
  }

  if (quizState === 'selecting') {
     const currentSelectedQuizMeta = availableQuizzes.find(q => q.key === selectedQuiz?.key);
     const maxQuestions = currentSelectedQuizMeta?.totalQuestions ?? 0;

    return (
       <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center pt-10">
        <h1 className="text-3xl font-bold mb-8 text-center">Select a Quiz</h1>

        {/* Quiz Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-4xl mb-8">
          {availableQuizzes.map((quiz) => {
            const IconComponent = quiz.icon;
            return (
            <Card
              key={quiz.key}
              className={`cursor-pointer hover:shadow-lg transition-all duration-200 border-2 ${selectedQuiz?.key === quiz.key ? 'border-primary shadow-lg scale-[1.02]' : 'hover:border-primary/50'}`}
              onClick={() => setSelectedQuiz(quiz)}
            >
              <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
                 <IconComponent className="h-8 w-8 text-primary" />
                <CardTitle className="text-xl font-semibold">{quiz.label}</CardTitle>
              </CardHeader>
              <CardContent>
                 <CardDescription>
                    {quiz.description}
                    {quiz.totalQuestions && <span className="block mt-1 text-xs">({quiz.totalQuestions} questions available)</span>}
                 </CardDescription>
              </CardContent>
            </Card>
          );
        })}
        </div>

        {/* Question Count Selection - Only show if a quiz is selected */}
        {selectedQuiz && maxQuestions > 0 && (
            <Card className="w-full max-w-sm mb-8 border-primary/50">
                 <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2"><ListChecks size={20}/> Select Number of Questions</CardTitle>
                 </CardHeader>
                 <CardContent>
                    <Select
                        value={String(Math.min(selectedQuestionCount, maxQuestions > 0 ? maxQuestions : selectedQuestionCount))} // Ensure value is valid
                        onValueChange={(value) => setSelectedQuestionCount(parseInt(value))}
                        >
                        <SelectTrigger>
                            <SelectValue placeholder="Number of Questions" />
                        </SelectTrigger>
                        <SelectContent>
                            {questionCountOptions.map((count) => (
                                (count <= maxQuestions || maxQuestions === 0) && // Allow if maxQuestions not loaded or count is valid
                                <SelectItem key={count} value={String(count)}>
                                    {count} Questions
                                </SelectItem>
                            ))}
                             {maxQuestions > 0 && (
                                <SelectItem key="all" value={String(maxQuestions)}>
                                     All ({maxQuestions}) Questions
                                </SelectItem>
                             )}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>
        )}

         <Button
           size="lg"
           onClick={() => selectedQuiz && startQuiz(selectedQuiz, selectedQuestionCount)}
           disabled={!selectedQuiz || availableQuizzes.find(q => q.key === selectedQuiz.key)?.totalQuestions === 0}
         >
           Start Quiz Now
         </Button>

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
          <div className="text-center p-8">
            <p className="text-lg text-muted-foreground">No questions available for this quiz.</p>
             <Button onClick={handleRestart} variant="outline" className="mt-6">
               Back to Selection
             </Button>
          </div>
      )}
    </div>
  );
}
