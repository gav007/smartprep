import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import OhmsLawCalculator from '@/components/calculators/OhmsLawCalculator'; // Adjust path if necessary

// Mock the useCalculatorState hook
jest.mock('@/hooks/useCalculatorState', () => ({
  useCalculatorState: jest.fn(() => ({
    values: { voltage: '', current: '', resistance: '' },
    units: { voltage: 'V', current: 'A', resistance: 'Ω' },
    error: null,
    lockedFields: new Set(),
    touchedFields: new Set(),
    handleValueChange: jest.fn(),
    handleUnitChange: jest.fn(),
    handleBlur: jest.fn(),
    handleReset: jest.fn(),
  })),
}));

// Mock the useToast hook (if calculator uses it, though Ohm's law doesn't currently)
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

describe('OhmsLawCalculator Component', () => {
  // Local state management for the mock hook within each test
  let mockState: any;
  const mockHandleValueChange = jest.fn();
  const mockHandleUnitChange = jest.fn();
  const mockHandleBlur = jest.fn();
  const mockHandleReset = jest.fn();

  beforeEach(() => {
    // Reset mocks and state before each test
    mockState = {
      values: { voltage: '', current: '', resistance: '' },
      units: { voltage: 'V', current: 'A', resistance: 'Ω' },
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
          mockState.values[variable] = value;
          if (value.trim() !== '') mockState.lockedFields.add(variable);
          else mockState.lockedFields.delete(variable);
          mockHandleValueChange(variable, value);
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
          mockState.values = { voltage: '', current: '', resistance: '' };
          mockState.units = { voltage: 'V', current: 'A', resistance: 'Ω' };
          mockState.error = null;
          mockState.lockedFields = new Set();
          mockState.touchedFields = new Set();
          mockHandleReset();
      },
    }));
  });

  test('renders correctly with initial state', () => {
    render(<OhmsLawCalculator />);
    expect(screen.getByLabelText(/Voltage \(V\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Current \(I\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Resistance \(R\)/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Clear All/i })).toBeInTheDocument();
    expect(screen.getByText(/Enter 2 valid values above to see results./i)).toBeInTheDocument();
  });

  test('calls handleValueChange on input change', () => {
    render(<OhmsLawCalculator />);
    const voltageInput = screen.getByLabelText(/Voltage \(V\)/i);
    fireEvent.change(voltageInput, { target: { value: '12' } });
    expect(mockHandleValueChange).toHaveBeenCalledWith('voltage', '12');
    expect(mockState.values.voltage).toBe('12');
  });

   test('calls handleUnitChange on unit select', () => {
     render(<OhmsLawCalculator />);
     const currentUnitTrigger = screen.getAllByRole('combobox')[1]; // Assuming Current is second
     fireEvent.mouseDown(currentUnitTrigger);
     const mAOption = screen.getByText('mA');
     fireEvent.click(mAOption);
     expect(mockHandleUnitChange).toHaveBeenCalledWith('current', 'mA');
     expect(mockState.units.current).toBe('mA');
   });

   test('calls handleBlur on input blur', () => {
       render(<OhmsLawCalculator />);
       const resistanceInput = screen.getByLabelText(/Resistance \(R\)/i);
       fireEvent.change(resistanceInput, { target: { value: '100' } });
       fireEvent.blur(resistanceInput);
       expect(mockHandleBlur).toHaveBeenCalledWith('resistance');
       expect(mockState.touchedFields.has('resistance')).toBe(true);
   });

  test('calls handleReset when "Clear All" is clicked', () => {
    render(<OhmsLawCalculator />);
    const clearButton = screen.getByRole('button', { name: /Clear All/i });
    fireEvent.click(clearButton);
    expect(mockHandleReset).toHaveBeenCalled();
    expect(mockState.values).toEqual({ voltage: '', current: '', resistance: '' });
  });

  test('displays calculated values in the summary section', async () => {
       // Simulate hook providing calculated values
       mockState.values = { voltage: '12', current: '0.12', resistance: '100' };
       mockState.lockedFields = new Set(['voltage', 'resistance']); // Indicate inputs

       render(<OhmsLawCalculator />);

       await waitFor(() => {
           expect(screen.getByText('Voltage:')).toHaveTextContent('Voltage: 12 V');
           expect(screen.getByText('Current:')).toHaveTextContent('Current: 120 mA'); // Example formatting
           expect(screen.getByText('Resistance:')).toHaveTextContent('Resistance: 100 Ω');
       });
  });

   test('displays error message when provided by hook', async () => {
       mockState.error = 'Resistance cannot be zero.';
       mockState.lockedFields = new Set(['voltage', 'resistance']);
       mockState.values.resistance = '0'; // Simulate bad input state

       render(<OhmsLawCalculator />);

       await waitFor(() => {
           expect(screen.getByRole('alert')).toBeInTheDocument();
           expect(screen.getByText('Error')).toBeInTheDocument();
           expect(screen.getByText('Resistance cannot be zero.')).toBeInTheDocument();
       });
       // Summary should show placeholder or N/A
       expect(screen.getByText(/Enter 2 valid values above/i)).toBeInTheDocument();
   });

   test('displays hint message when not enough inputs and touched', async () => {
       mockState.error = 'Enter 1 more value.';
       mockState.lockedFields = new Set(['voltage']);
       mockState.touchedFields = new Set(['voltage']); // Ensure it's marked touched

       render(<OhmsLawCalculator />);

       await waitFor(() => {
            expect(screen.getByRole('alert')).toBeInTheDocument();
            expect(screen.getByText('Input Needed')).toBeInTheDocument();
            expect(screen.getByText('Enter 1 more value.')).toBeInTheDocument();
       });
        expect(screen.getByText(/Enter 2 valid values above/i)).toBeInTheDocument();
   });

    test('does NOT display hint message if not enough inputs but NOT touched', () => {
        mockState.error = 'Enter 1 more value.'; // Hook might set this
        mockState.lockedFields = new Set(['voltage']);
        mockState.touchedFields = new Set(); // Not touched/blurred

        render(<OhmsLawCalculator />);

        // The error alert should NOT be rendered yet
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        // Placeholder text should still be visible
        expect(screen.getByText(/Enter 2 valid values above/i)).toBeInTheDocument();
    });
});
