
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PowerCalculator from '../components/calculators/PowerCalculator';

describe('PowerCalculator Component', () => {
  test('renders correctly with initial state', () => {
    render(<PowerCalculator />);

    expect(screen.getByLabelText(/Voltage \(V\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Current \(I\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Resistance \(R\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Power \(P\)/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Clear All/i })).toBeInTheDocument();
    expect(screen.getByText(/Enter two valid values above/i)).toBeInTheDocument();
  });

  test('calculates Power and Resistance when Voltage and Current are entered', async () => {
    render(<PowerCalculator />);

    const voltageInput = screen.getByLabelText(/Voltage \(V\)/i);
    const currentInput = screen.getByLabelText(/Current \(I\)/i);

    fireEvent.change(voltageInput, { target: { value: '10' } });
    fireEvent.change(currentInput, { target: { value: '2' } });

    // Wait for debounce and calculation
    await waitFor(() => {
      // Check if the calculated fields are updated (they are still inputs)
      expect(screen.getByLabelText(/Resistance \(R\)/i)).toHaveValue('5'); // R = V/I = 10/2 = 5
      expect(screen.getByLabelText(/Power \(P\)/i)).toHaveValue('20');    // P = V*I = 10*2 = 20
    });

    // Verify summary section reflects calculated values and units
    expect(screen.getByText('Voltage:')).toHaveTextContent('Voltage: 10 V');
    expect(screen.getByText('Current:')).toHaveTextContent('Current: 2 A');
    expect(screen.getByText('Resistance:')).toHaveTextContent('Resistance: 5 Ω');
    expect(screen.getByText('Power:')).toHaveTextContent('Power: 20 W');
  });

  test('calculates Voltage and Power when Current and Resistance are entered', async () => {
      render(<PowerCalculator />);

      const currentInput = screen.getByLabelText(/Current \(I\)/i);
      const resistanceInput = screen.getByLabelText(/Resistance \(R\)/i);

      fireEvent.change(currentInput, { target: { value: '3' } }); // 3A
      fireEvent.change(resistanceInput, { target: { value: '4' } }); // 4Ω

      await waitFor(() => {
          expect(screen.getByLabelText(/Voltage \(V\)/i)).toHaveValue('12'); // V = I*R = 3*4 = 12
          expect(screen.getByLabelText(/Power \(P\)/i)).toHaveValue('36');   // P = I^2*R = 9*4 = 36
      });

      expect(screen.getByText('Voltage:')).toHaveTextContent('Voltage: 12 V');
      expect(screen.getByText('Current:')).toHaveTextContent('Current: 3 A');
      expect(screen.getByText('Resistance:')).toHaveTextContent('Resistance: 4 Ω');
      expect(screen.getByText('Power:')).toHaveTextContent('Power: 36 W');
  });


   test('calculates Current and Resistance when Voltage and Power are entered', async () => {
     render(<PowerCalculator />);

     const voltageInput = screen.getByLabelText(/Voltage \(V\)/i);
     const powerInput = screen.getByLabelText(/Power \(P\)/i);

     fireEvent.change(voltageInput, { target: { value: '100' } }); // 100V
     fireEvent.change(powerInput, { target: { value: '50' } });    // 50W

     await waitFor(() => {
        // I = P/V = 50/100 = 0.5A
        // R = V^2/P = 10000/50 = 200Ω
       expect(screen.getByLabelText(/Current \(I\)/i)).toHaveValue('0.5');
       expect(screen.getByLabelText(/Resistance \(R\)/i)).toHaveValue('200');
     });

       expect(screen.getByText('Voltage:')).toHaveTextContent('Voltage: 100 V');
       expect(screen.getByText('Current:')).toHaveTextContent('Current: 0.5 A'); // or 500 mA depending on formatter
       expect(screen.getByText('Resistance:')).toHaveTextContent('Resistance: 200 Ω');
       expect(screen.getByText('Power:')).toHaveTextContent('Power: 50 W');
   });

   test('clears all fields when "Clear All" is clicked', async () => {
       render(<PowerCalculator />);

       const voltageInput = screen.getByLabelText(/Voltage \(V\)/i);
       const currentInput = screen.getByLabelText(/Current \(I\)/i);
       const clearButton = screen.getByRole('button', { name: /Clear All/i });

       fireEvent.change(voltageInput, { target: { value: '10' } });
       fireEvent.change(currentInput, { target: { value: '2' } });

       // Wait for calculation
       await waitFor(() => {
           expect(screen.getByLabelText(/Power \(P\)/i)).toHaveValue('20');
       });

       fireEvent.click(clearButton);

       expect(voltageInput).toHaveValue('');
       expect(currentInput).toHaveValue('');
       expect(screen.getByLabelText(/Resistance \(R\)/i)).toHaveValue('');
       expect(screen.getByLabelText(/Power \(P\)/i)).toHaveValue('');
       expect(screen.queryByText(/Error/i)).not.toBeInTheDocument(); // Ensure error is cleared
       expect(screen.getByText(/Enter two valid values above/i)).toBeInTheDocument(); // Placeholder text reappears
   });

   test('inputs remain editable after calculation', async () => {
     render(<PowerCalculator />);

     const voltageInput = screen.getByLabelText(/Voltage \(V\)/i);
     const currentInput = screen.getByLabelText(/Current \(I\)/i);

     fireEvent.change(voltageInput, { target: { value: '10' } });
     fireEvent.change(currentInput, { target: { value: '2' } });

     await waitFor(() => {
       expect(screen.getByLabelText(/Power \(P\)/i)).toHaveValue('20');
     });

     // Change voltage again
     fireEvent.change(voltageInput, { target: { value: '12' } });

     // Wait for recalculation based on new V and old I
     await waitFor(() => {
         expect(screen.getByLabelText(/Power \(P\)/i)).toHaveValue('24'); // P = 12 * 2
         expect(screen.getByLabelText(/Resistance \(R\)/i)).toHaveValue('6'); // R = 12 / 2
     });

     expect(voltageInput).toHaveValue('12'); // Ensure the edited value persists
   });

   test('handles division by zero gracefully', async () => {
       render(<PowerCalculator />);

       const voltageInput = screen.getByLabelText(/Voltage \(V\)/i);
       const resistanceInput = screen.getByLabelText(/Resistance \(R\)/i);

       fireEvent.change(voltageInput, { target: { value: '10' } });
       fireEvent.change(resistanceInput, { target: { value: '0' } }); // Set resistance to 0

       await waitFor(() => {
            // Expect an error message
           expect(screen.getByText(/Resistance must be positive/i)).toBeInTheDocument();
           // Expect calculated fields to be empty or show N/A (check implementation)
           expect(screen.getByLabelText(/Current \(I\)/i)).toHaveValue('');
           expect(screen.getByLabelText(/Power \(P\)/i)).toHaveValue('');
       });
   });

    // Add more tests for different units and edge cases (negative values where appropriate, zero inputs)
});
