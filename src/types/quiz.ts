export interface Option {
  key: string;
  label: string;
}

export interface Question {
  id: string; // Added unique ID for mapping/keys
  question: string;
  options: Option[];
  answer: string;
  feedback: string;
}

export interface AnswerSelection {
  questionId: string;
  selectedOption: string | null;
}

// Type for the raw data before normalization
export interface RawQuestionFormatA {
  question: string;
  options: Record<string, string>;
  answer: string;
  feedback: string;
}

export interface RawQuestionFormatB {
  type?: string; // Optional "type" field
  question: string;
  options: Record<string, string>;
  answer: string;
  feedback: string;
}

export type RawQuestion = RawQuestionFormatA | RawQuestionFormatB;
