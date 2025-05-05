
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import QuizCard from '../../components/quiz/QuizCard'; // Corrected path
import type { Question } from '../../types/quiz'; // Corrected path

const mockQuestion: Question = {
  id: 'q1',
  question: 'What is 2 + 2?',
  options: [
    { key: 'A', label: '3' },
    { key: 'B', label: '4' },
    { key: 'C', label: '5' },
  ],
  answer: 'B',
  feedback: 'The answer is 4.',
};

describe('QuizCard Component', () => {
  test('renders question and options correctly', () => {
    const { container } = render(
      <QuizCard
        question={mockQuestion}
        selectedOption={null}
        onOptionChange={() => {}}
        questionNumber={1}
        totalQuestions={5}
      />
    );

    expect(screen.getByText(/Question 1 of 5/i)).toBeInTheDocument();
    expect(screen.getByText(mockQuestion.question)).toBeInTheDocument();
    expect(screen.getByLabelText(/A\. 3/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/B\. 4/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/C\. 5/i)).toBeInTheDocument();
     // Snapshot test
     expect(container).toMatchSnapshot();
  });

  test('calls onOptionChange when an option is selected', () => {
    const handleChange = jest.fn();
    render(
      <QuizCard
        question={mockQuestion}
        selectedOption={null}
        onOptionChange={handleChange}
        questionNumber={1}
        totalQuestions={5}
      />
    );

    const optionB = screen.getByLabelText(/B\. 4/i);
    fireEvent.click(optionB);

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith('B'); // Ensure the correct option key is passed
  });

  test('highlights the selected option', () => {
    const { container } = render(
      <QuizCard
        question={mockQuestion}
        selectedOption={'C'} // Option C is selected
        onOptionChange={() => {}}
        questionNumber={1}
        totalQuestions={5}
      />
    );

     // Find the radio button associated with the label C. 5
    const radioItemC = screen.getByRole('radio', { name: /C\. 5/i });
    expect(radioItemC).toBeChecked();

     // Verify other options are not checked
     const radioItemA = screen.getByRole('radio', { name: /A\. 3/i });
     expect(radioItemA).not.toBeChecked();
     const radioItemB = screen.getByRole('radio', { name: /B\. 4/i });
     expect(radioItemB).not.toBeChecked();

     // Snapshot test for selected state
     expect(container).toMatchSnapshot();
  });
});
