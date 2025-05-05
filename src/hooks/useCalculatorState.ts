// src/hooks/useCalculatorState.ts
import { useState, useCallback, useEffect } from 'react';
import type { Unit } from '@/lib/units';
import { unitMultipliers, formatResultValue } from '@/lib/units';
import { useDebounceCallback } from 'usehooks-ts';

type Variable = string; // Generic variable name type

interface CalculatorState<T extends Record<Variable, string>, U extends Record<Variable, Unit>> {
  values: T;
  units: U;
  error: string | null;
  lockedFields: Set<Variable>;
  touchedFields: Set<Variable>; // Track fields that have been interacted with and blurred
}

interface UseCalculatorStateProps<T extends Record<Variable, string>, U extends Record<Variable, Unit>> {
  initialValues: T;
  initialUnits: U;
  calculationFn: (values: Record<Variable, number | null>, locked: Set<Variable>) => { results: Partial<Record<Variable, number | null>>, error?: string | null };
  variableOrder: Variable[]; // Order to determine which locked field to unlock
  requiredInputs: number; // Number of inputs required for calculation (e.g., 2 for Ohm's Law, 2 for Power)
}

export function useCalculatorState<T extends Record<Variable, string>, U extends Record<Variable, Unit>>({
  initialValues,
  initialUnits,
  calculationFn,
  variableOrder,
  requiredInputs,
}: UseCalculatorStateProps<T, U>) {
  const [state, setState] = useState<CalculatorState<T, U>>({
    values: initialValues,
    units: initialUnits,
    error: null,
    lockedFields: new Set<Variable>(),
    touchedFields: new Set<Variable>(), // Initialize touched fields
  });

  const getNumericValues = useCallback((): Record<Variable, number | null> => {
    const numericValues: Record<Variable, number | null> = {};
    for (const key in state.values) {
      const strVal = state.values[key];
      const unit = state.units[key];
      const multiplier = unitMultipliers[unit] ?? 1; // Use 1 if unit/multiplier not found
      const num = parseFloat(strVal);
      numericValues[key] = isNaN(num) ? null : num * multiplier;
    }
    return numericValues;
  }, [state.values, state.units]);

  const performCalculation = useCallback(() => {
    const numericValues = getNumericValues();
    const currentLockedFields = state.lockedFields;
    let userError: string | null = null;

    // --- Determine if enough inputs are provided *after* considering touched fields ---
    const filledCount = currentLockedFields.size;
    const touchedCount = state.touchedFields.size;

     if (filledCount < requiredInputs) {
         // Show hint only if at least one relevant field was touched (blurred)
         if (touchedCount > 0 && filledCount < requiredInputs) {
            const needed = requiredInputs - filledCount;
            userError = `Enter ${needed} more value${needed > 1 ? 's' : ''}.`;
         }
         // Clear previously calculated fields if not enough inputs anymore
        const clearedValues = { ...state.values };
        Object.keys(clearedValues).forEach(key => {
            if (!currentLockedFields.has(key)) {
                clearedValues[key as keyof T] = '';
            }
        });
         setState(prev => ({
             ...prev,
             values: clearedValues, // Update values in state
             error: userError // Set the hint/error
         }));
         return; // Stop calculation if not enough inputs
     }

    // --- Perform Actual Calculation ---
    const { results, error: calcError } = calculationFn(numericValues, currentLockedFields);
    const finalError = calcError ?? userError; // Prioritize calculation errors

    let newValues = { ...state.values };
    let newUnits = { ...state.units };
    let calculationPerformed = false;

    for (const key in results) {
      if (!currentLockedFields.has(key)) { // Only update non-locked fields
        const resultValue = results[key];
         // Use default unit if result is valid but current unit is somehow invalid for the type
        const currentUnit = state.units[key];
        const { displayValue, unit: formattedUnit } = formatResultValue(resultValue, key as any, currentUnit); // Cast key type

        // Only update if the display value actually changes to prevent infinite loops
        // Or if the unit changes
        if (newValues[key as keyof T] !== displayValue || newUnits[key as keyof U] !== formattedUnit) {
           newValues[key as keyof T] = displayValue;
           newUnits[key as keyof U] = formattedUnit as U[keyof U]; // Cast unit type
           calculationPerformed = true;
        }
      }
    }

     // Update state only if a calculation actually changed something or error changed
     if (calculationPerformed || finalError !== state.error) {
         setState(prev => ({
           ...prev,
           values: newValues,
           units: newUnits,
           error: finalError, // Use combined error
         }));
     } else if (!calculationPerformed && finalError === null && state.error !== null) {
         // Clear error if calculation ran successfully without changes and previous error existed
         setState(prev => ({ ...prev, error: null }));
     }

  }, [state.values, state.units, state.lockedFields, state.touchedFields, state.error, getNumericValues, calculationFn, requiredInputs]);

  const debouncedCalculate = useDebounceCallback(performCalculation, 300);

  useEffect(() => {
    // Debounced calculation runs when values, units, or locked fields change
    debouncedCalculate();
  }, [state.values, state.units, state.lockedFields, debouncedCalculate]);

  const handleValueChange = useCallback((variable: Variable, value: string) => {
    setState(prev => {
      const newLockedFields = new Set(prev.lockedFields);
      let newTouchedFields = new Set(prev.touchedFields); // Keep touched state
      let fieldToClear: Variable | null = null;

      if (value.trim() === '') {
        // If clearing a field, unlock it
        newLockedFields.delete(variable);
        // Also mark as untouched maybe? Optional, depends on desired UX. Let's keep it touched.
        // newTouchedFields.delete(variable);
      } else {
        // If entering a value, lock it
        newLockedFields.add(variable);
        newTouchedFields.add(variable); // Mark as touched when value is entered

        // If now more than requiredInputs fields are locked, unlock the oldest one according to variableOrder
        if (newLockedFields.size > requiredInputs) {
           const fieldToUnlock = variableOrder.find(f => f !== variable && newLockedFields.has(f));
           if (fieldToUnlock) {
             newLockedFields.delete(fieldToUnlock);
             fieldToClear = fieldToUnlock; // Store which field's value to clear
             // Don't mark the automatically unlocked field as untouched
           }
        }
      }

      // Prepare updated values
      const updatedValues = { ...prev.values, [variable]: value };
      if (fieldToClear) {
          updatedValues[fieldToClear as keyof T] = ''; // Clear the value of the unlocked field
      }


      return {
        ...prev,
        values: updatedValues,
        lockedFields: newLockedFields,
        touchedFields: newTouchedFields, // Persist touched state
        error: null, // Clear calculation errors on input change, hints will be re-evaluated
      };
    });
    // Calculation will be triggered by useEffect -> debouncedCalculate
  }, [variableOrder, requiredInputs]);

   const handleBlur = useCallback((variable: Variable) => {
       setState(prev => {
            // Only add to touched if it actually has a value after blur? Or always?
            // Let's mark as touched even if empty, to trigger hints if needed.
           const newTouchedFields = new Set(prev.touchedFields);
           newTouchedFields.add(variable);
           // Re-run calculation logic immediately on blur if touched state changes
           // This allows hints like "Enter one more value" to appear promptly
           // Note: This might bypass debounce for the hint logic, which is intended here.
            performCalculation(); // Trigger calculation/error update immediately
           return {
               ...prev,
               touchedFields: newTouchedFields,
           };
       });
   }, [performCalculation]); // Need performCalculation in dependency array

  const handleUnitChange = useCallback((variable: Variable, unit: Unit) => {
    setState(prev => ({
      ...prev,
      units: { ...prev.units, [variable]: unit },
       // Potentially mark as touched on unit change? Let's assume not for now.
    }));
    // Calculation will be triggered by useEffect -> debouncedCalculate
  }, []);

  const handleReset = useCallback(() => {
    setState({
      values: initialValues,
      units: initialUnits,
      error: null,
      lockedFields: new Set<Variable>(),
      touchedFields: new Set<Variable>(), // Reset touched fields
    });
  }, [initialValues, initialUnits]);

  return {
    values: state.values,
    units: state.units,
    error: state.error,
    lockedFields: state.lockedFields,
    touchedFields: state.touchedFields, // Expose touchedFields if needed by component
    handleValueChange,
    handleUnitChange,
    handleBlur, // Expose blur handler
    handleReset,
  };
}
