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
  requiredInputs: number; // Number of inputs required for calculation
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
      // Treat empty string as null, not NaN
      const num = strVal?.trim() === '' ? null : parseFloat(strVal);
      numericValues[key] = num === null || isNaN(num) ? null : num * multiplier;
    }
    return numericValues;
  }, [state.values, state.units]);


  const performCalculation = useCallback((isTriggeredByBlur: boolean = false) => {
    const numericValues = getNumericValues();
    const currentLockedFields = state.lockedFields;
    let userError: string | null = null;

    // --- Determine if enough inputs are provided *after* considering touched fields ---
    const filledCount = currentLockedFields.size;
    // Check how many *locked* fields have been touched. Only show error if enough fields were touched/blurred.
    const relevantTouchedCount = Array.from(currentLockedFields).filter(f => state.touchedFields.has(f)).length;

     if (filledCount < requiredInputs) {
         // Show hint only if enough fields were touched/blurred OR if triggered explicitly by blur.
         const showHint = isTriggeredByBlur || relevantTouchedCount >= requiredInputs -1; // Show if near completion or blurred
         if (showHint) {
            const needed = requiredInputs - filledCount;
            // Avoid showing the error if the user just started typing
            if (needed > 0 && needed < requiredInputs) {
                 userError = `Enter ${needed} more value${needed > 1 ? 's' : ''}.`;
            }
         }

         // Clear previously calculated fields if not enough inputs anymore
        const clearedValues = { ...state.values };
        let changed = false;
        Object.keys(clearedValues).forEach(key => {
            if (!currentLockedFields.has(key) && clearedValues[key as keyof T] !== '') {
                clearedValues[key as keyof T] = '';
                changed = true;
            }
        });

         // Only update state if values changed or error changed
         if (changed || userError !== state.error) {
             setState(prev => ({
                 ...prev,
                 values: clearedValues, // Update values in state
                 error: userError // Set the hint/error
             }));
         }
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
        const currentUnit = state.units[key];
        const { displayValue, unit: formattedUnit } = formatResultValue(resultValue, key as any, currentUnit); // Cast key type

        // Check if the new display value is substantially different from the current one
        // Avoid updates for tiny floating-point differences or identical strings
        const currentValue = newValues[key as keyof T];
        const isDifferent = currentValue !== displayValue;

        if (isDifferent) {
           newValues[key as keyof T] = displayValue;
           calculationPerformed = true;
        }
        // Update unit if the formatter suggests a better one
        if (newUnits[key as keyof U] !== formattedUnit) {
             newUnits[key as keyof U] = formattedUnit as U[keyof U]; // Cast unit type
             calculationPerformed = true; // Consider unit change as a change
        }
      }
    }

     // Update state only if calculation changed values/units or error changed
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
     // but skip if lockedFields size is less than requiredInputs to avoid premature calculation
     if (state.lockedFields.size >= requiredInputs) {
        debouncedCalculate();
     } else {
         // If not enough fields are locked, still check if we need to show the "Enter more values" hint
         // This ensures the hint appears even without a full calculation run, but only if relevant fields were touched.
         performCalculation(false); // Pass false to indicate not triggered by blur
     }

  }, [state.values, state.units, state.lockedFields, debouncedCalculate, performCalculation, requiredInputs]);


  const handleValueChange = useCallback((variable: Variable, value: string) => {
    setState(prev => {
      const newLockedFields = new Set(prev.lockedFields);
      let newTouchedFields = new Set(prev.touchedFields); // Keep existing touched state
      let fieldToClear: Variable | null = null;

      if (value.trim() === '') {
        // If clearing a field, unlock it
        newLockedFields.delete(variable);
        // User intentionally cleared it, keep it marked as touched
      } else {
        // If entering a value, lock it
        newLockedFields.add(variable);
        // Mark as touched only when value is entered? Or on focus? Let's stick to blur for now.
        // newTouchedFields.add(variable);

        // If now more than requiredInputs fields are locked, unlock the oldest one according to variableOrder
        if (newLockedFields.size > requiredInputs) {
           // Find the first field in variableOrder that IS locked but IS NOT the currently edited field
           const fieldToUnlock = variableOrder.find(f => f !== variable && newLockedFields.has(f));
           if (fieldToUnlock) {
             newLockedFields.delete(fieldToUnlock);
             fieldToClear = fieldToUnlock; // Store which field's value to clear
             // Keep the automatically unlocked field marked as touched if it was before
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
        error: null, // Clear calculation errors on input change, hints will be re-evaluated by useEffect/performCalculation
      };
    });
    // Calculation will be triggered by useEffect -> debouncedCalculate OR performCalculation
  }, [variableOrder, requiredInputs]);

   const handleBlur = useCallback((variable: Variable) => {
       // Only update state if the touched status actually changes
        if (!state.touchedFields.has(variable)) {
            setState(prev => {
                const newTouchedFields = new Set(prev.touchedFields);
                newTouchedFields.add(variable);
                // Trigger calculation logic immediately on blur to update hints/errors if necessary
                // This bypasses the debounce specifically for the blur event.
                 performCalculation(true); // Pass true to indicate triggered by blur
                return {
                    ...prev,
                    touchedFields: newTouchedFields,
                };
            });
        }
        // If already touched, blur doesn't need to trigger immediate calculation again
        // The regular debounced calculation will handle subsequent changes.

   }, [state.touchedFields, performCalculation]); // Need performCalculation in dependency array

  const handleUnitChange = useCallback((variable: Variable, unit: Unit) => {
    setState(prev => ({
      ...prev,
      units: { ...prev.units, [variable]: unit },
      // Don't mark as touched on unit change, user hasn't necessarily 'left' the field group
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
