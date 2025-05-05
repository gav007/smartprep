'use server';

/**
 * @fileOverview An AI agent that explains the correct answer to a quiz question.
 *
 * - explainAnswer - A function that handles the explanation generation process.
 * - ExplainAnswerInput - The input type for the explainAnswer function.
 * - ExplainAnswerOutput - The return type for the explainAnswer function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const ExplainAnswerInputSchema = z.object({
  userAnswer: z.string().describe('The answer provided by the user.'),
  correctAnswer: z.string().describe('The correct answer to the question.'),
  question: z.string().describe('The question being asked.'),
  feedback: z.string().describe('The original feedback from the quiz data.'),
});
export type ExplainAnswerInput = z.infer<typeof ExplainAnswerInputSchema>;

const ExplainAnswerOutputSchema = z.object({
  explanation: z.string().describe('The AI-generated explanation of the correct answer.'),
});
export type ExplainAnswerOutput = z.infer<typeof ExplainAnswerOutputSchema>;

export async function explainAnswer(input: ExplainAnswerInput): Promise<ExplainAnswerOutput> {
  return explainAnswerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'explainAnswerPrompt',
  input: {
    schema: z.object({
      userAnswer: z.string().describe('The answer provided by the user.'),
      correctAnswer: z.string().describe('The correct answer to the question.'),
      question: z.string().describe('The question being asked.'),
      feedback: z.string().describe('The original feedback from the quiz data.'),
    }),
  },
  output: {
    schema: z.object({
      explanation: z.string().describe('The AI-generated explanation of the correct answer.'),
    }),
  },
  prompt: `You are an expert tutor explaining quiz answers.

  The user answered "{{{userAnswer}}}" to the question: "{{{question}}}".
  The correct answer is "{{{correctAnswer}}}".
  The original feedback was: "{{{feedback}}}".

  Provide a clear and concise explanation of why the correct answer is correct, building on the original feedback.
  `,
});

const explainAnswerFlow = ai.defineFlow<
  typeof ExplainAnswerInputSchema,
  typeof ExplainAnswerOutputSchema
>(
  {
    name: 'explainAnswerFlow',
    inputSchema: ExplainAnswerInputSchema,
    outputSchema: ExplainAnswerOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
