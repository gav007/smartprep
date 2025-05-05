
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PowerCalculator from '@/components/calculators/PowerCalculator'; // Adjust path if necessary

// Mock the useCalculatorState hook
jest.mock('@/hooks/useCalculatorState', () => ({
  useCalculatorState: jest.fn(() => ({
    values: { voltage: '', current: '', resistance: '', power: '' },
    units: { voltage: 'V', current: 'A', resistance: 'Ω', power: 'W' },
    error: null,
    lockedFields: new Set(),
    touchedFields: new Set(),
    handleValueChange: jest.fn(),
    handleUnitChange: jest.fn(),
    handleBlur: jest.fn(),
    handleReset: jest.fn(),
  })),
}));

// Mock the useToast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

describe('PowerCalculator Component', () => {
  // Local state management for the mock hook within each test
  let mockState: any;
  const mockHandleValueChange = jest.fn();
  const mockHandleUnitChange = jest.fn();
  const mockHandleBlur = jest.fn();
  const mockHandleReset = jest.fn();

  beforeEach(() => {
    // Reset mocks and state before each test
    mockState = {
      values: { voltage: '', current: '', resistance: '', power: '' },
      units: { voltage: 'V', current: 'A', resistance: 'Ω', power: 'W' },
      error: null,
      lockedFields: new Set(),
      touchedFields: new Set(),
    };
    mockHandleValueChange.mockClear();
    mockHandleUnitChange.mockClear();
    mockHandleBlur.mockClear();
    mockHandleReset.mockClear();

    // Update the mock implementation before each render
    (require('@/hooks/useCalculatorState').useCalculatorState as jest.Mock).mockImplementation(() => ({
      ...mockState,
      handleValueChange: (variable: string, value: string) => {
          // Simulate state update locally for testing UI changes
          mockState.values[variable] = value;
          if (value.trim() !== '') mockState.lockedFields.add(variable);
          else mockState.lockedFields.delete(variable);
          mockHandleValueChange(variable, value); // Call the original mock
      },
      handleUnitChange: (variable: string, unit: string) => {
          mockState.units[variable] = unit;
          mockHandleUnitChange(variable, unit);
      },
      handleBlur: (variable: string) => {
          mockState.touchedFields.add(variable);
          mockHandleBlur(variable);
      },
      handleReset: () => {
          // Simulate reset locally
          mockState.values = { voltage: '', current: '', resistance: '', power: '' };
          mockState.units = { voltage: 'V', current: 'A', resistance: 'Ω', power: 'W' };
          mockState.error = null;
          mockState.lockedFields = new Set();
          mockState.touchedFields = new Set();
          mockHandleReset();
      },
    }));
  });

  test('renders correctly with initial state', () => {
    render(<PowerCalculator />);

    expect(screen.getByLabelText(/Voltage \(V\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Current \(I\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Resistance \(R\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Power \(P\)/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Clear All/i })).toBeInTheDocument();
    // Initial state should show placeholder text
     expect(screen.getByText(/Enter 2 valid values above to see results./i)).toBeInTheDocument();
  });

  test('calls handleValueChange on input change', () => {
    render(<PowerCalculator />);
    const voltageInput = screen.getByLabelText(/Voltage \(V\)/i);
    fireEvent.change(voltageInput, { target: { value: '10' } });
    expect(mockHandleValueChange).toHaveBeenCalledWith('voltage', '10');
     // Check if local mock state updated
     expect(mockState.values.voltage).toBe('10');
  });

   test('calls handleUnitChange on unit select', () => {
     render(<PowerCalculator />);
     // Assuming 'V' is the default, find the trigger and simulate opening/selecting 'mV'
     // This requires knowing the structure rendered by CalculatorInput and Select
     const voltageUnitTrigger = screen.getAllByRole('combobox')[0]; // Adjust index based on order
     fireEvent.mouseDown(voltageUnitTrigger); // Open the select

     // Wait for options to appear and select 'mV'
     // The exact query depends on how SelectItem renders the text
     // Using findByText might be more robust if options load async, but here they are static
     const mVOption = screen.getByText('mV');
     fireEvent.click(mVOption);

     expect(mockHandleUnitChange).toHaveBeenCalledWith('voltage', 'mV');
     expect(mockState.units.voltage).toBe('mV');
   });

   test('calls handleBlur on input blur', () => {
       render(<PowerCalculator />);
       const voltageInput = screen.getByLabelText(/Voltage \(V\)/i);
       fireEvent.change(voltageInput, { target: { value: '5' } }); // Ensure value change first
       fireEvent.blur(voltageInput);
       expect(mockHandleBlur).toHaveBeenCalledWith('voltage');
       expect(mockState.touchedFields.has('voltage')).toBe(true);
   });

  test('calls handleReset when "Clear All" is clicked', () => {
    render(<PowerCalculator />);
    const clearButton = screen.getByRole('button', { name: /Clear All/i });
    fireEvent.click(clearButton);
    expect(mockHandleReset).toHaveBeenCalled();
    // Check if local mock state reset
     expect(mockState.values).toEqual({ voltage: '', current: '', resistance: '', power: '' });
     expect(mockState.lockedFields.size).toBe(0);
  });

  test('displays calculated values in the summary section when provided by hook', async () => {
       // Simulate hook providing calculated values after input
       mockState.values = { voltage: '10', current: '2', resistance: '5', power: '20' };
       mockState.lockedFields = new Set(['voltage', 'current']); // Assume these were entered

       render(<PowerCalculator />);

       // Wait for summary to update (though it should be synchronous if state is passed directly)
       await waitFor(() => {
           expect(screen.getByText('Voltage:')).toHaveTextContent('Voltage: 10 V');
           expect(screen.getByText('Current:')).toHaveTextContent('Current: 2 A');
           expect(screen.getByText('Resistance:')).toHaveTextContent('Resistance: 5 Ω');
           expect(screen.getByText('Power:')).toHaveTextContent('Power: 20 W');
       });
  });

   test('displays error message when provided by hook', async () => {
       // Simulate hook providing an error
       mockState.error = 'Resistance must be positive.';
       mockState.lockedFields = new Set(['voltage', 'resistance']); // Example triggering state

       render(<PowerCalculator />);

       await waitFor(() => {
           expect(screen.getByRole('alert')).toBeInTheDocument();
           expect(screen.getByText('Error')).toBeInTheDocument();
           expect(screen.getByText('Resistance must be positive.')).toBeInTheDocument();
       });
       // Summary should probably show N/A or be hidden
       expect(screen.getByText(/Enter 2 valid values above/i)).toBeInTheDocument();
   });

   test('displays hint message when not enough inputs', async () => {
       // Simulate hook providing the hint error
       mockState.error = 'Enter 1 more value.';
       mockState.lockedFields = new Set(['voltage']);
       mockState.touchedFields = new Set(['voltage']); // Mark as touched

       render(<PowerCalculator />);

       await waitFor(() => {
            expect(screen.getByRole('alert')).toBeInTheDocument();
            expect(screen.getByText('Input Needed')).toBeInTheDocument();
            expect(screen.getByText('Enter 1 more value.')).toBeInTheDocument();
       });
        expect(screen.getByText(/Enter 2 valid values above/i)).toBeInTheDocument();
   });

});
