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
}

interface UseCalculatorStateProps<T extends Record<Variable, string>, U extends Record<Variable, Unit>> {
  initialValues: T;
  initialUnits: U;
  calculationFn: (values: Record<Variable, number | null>, locked: Set<Variable>) => { results: Partial<Record<Variable, number | null>>, error?: string | null };
  variableOrder: Variable[]; // Order to determine which locked field to unlock
}

export function useCalculatorState<T extends Record<Variable, string>, U extends Record<Variable, Unit>>({
  initialValues,
  initialUnits,
  calculationFn,
  variableOrder,
}: UseCalculatorStateProps<T, U>) {
  const [state, setState] = useState<CalculatorState<T, U>>({
    values: initialValues,
    units: initialUnits,
    error: null,
    lockedFields: new Set<Variable>(),
  });

  const getNumericValues = useCallback((): Record<Variable, number | null> => {
    const numericValues: Record<Variable, number | null> = {};
    for (const key in state.values) {
      const strVal = state.values[key];
      const unit = state.units[key];
      const multiplier = unitMultipliers[unit];
      const num = parseFloat(strVal);
      numericValues[key] = isNaN(num) ? null : num * multiplier;
    }
    return numericValues;
  }, [state.values, state.units]);

  const performCalculation = useCallback(() => {
    const numericValues = getNumericValues();
    const filledValues = Object.entries(numericValues).filter(([_, v]) => v !== null);

    // Only calculate if exactly two fields are locked/valid
    if (state.lockedFields.size !== 2) {
        // Clear calculated fields if not exactly 2 locked
        const clearedValues = { ...state.values };
        Object.keys(clearedValues).forEach(key => {
            if (!state.lockedFields.has(key)) {
                clearedValues[key as keyof T] = '';
            }
        });
        setState(prev => ({
            ...prev,
            values: clearedValues, // Update values in state
            error: filledValues.length === 1 ? 'Enter one more value.' : null // Show hint if only one value
        }));
        return;
    }


    const { results, error: calcError } = calculationFn(numericValues, state.lockedFields);

    let newValues = { ...state.values };
    let newUnits = { ...state.units };
    let calculationPerformed = false;

    for (const key in results) {
      if (!state.lockedFields.has(key)) { // Only update non-locked fields
        const resultValue = results[key];
        const { displayValue, unit } = formatResultValue(resultValue, key as any, state.units[key]); // Cast key type

        // Only update if the display value actually changes to prevent infinite loops
        if (newValues[key as keyof T] !== displayValue) {
           newValues[key as keyof T] = displayValue;
           newUnits[key as keyof U] = unit as U[keyof U]; // Cast unit type
           calculationPerformed = true;
        }
      }
    }

     // Update state only if a calculation actually changed something
     // Or if there's a new error message
     if (calculationPerformed || calcError !== state.error) {
         setState(prev => ({
           ...prev,
           values: newValues,
           units: newUnits,
           error: calcError ?? null,
         }));
     }

  }, [state.values, state.units, state.lockedFields, state.error, getNumericValues, calculationFn]);

  const debouncedCalculate = useDebounceCallback(performCalculation, 300);

  useEffect(() => {
    debouncedCalculate();
  }, [state.values, state.units, state.lockedFields, debouncedCalculate]); // Depend on state values, units, and locked fields

  const handleValueChange = useCallback((variable: Variable, value: string) => {
    setState(prev => {
      const newLockedFields = new Set(prev.lockedFields);
      const otherLocked = Array.from(newLockedFields).filter(f => f !== variable);

      if (value.trim() === '') {
        // If clearing a field, unlock it
        newLockedFields.delete(variable);
         // Clear calculated fields dependent on this one (requires logic in calculationFn or here)
      } else {
        // If entering a value, lock it
        newLockedFields.add(variable);
        // If now more than 2 fields are locked, unlock the oldest one (not the current one)
        if (newLockedFields.size > 2) {
           // Find the first field in variableOrder that is locked and not the current one
           const fieldToUnlock = variableOrder.find(f => f !== variable && newLockedFields.has(f));
           if (fieldToUnlock) {
             newLockedFields.delete(fieldToUnlock);
             // Return a state update that clears the unlocked field's value
             return {
               ...prev,
               values: { ...prev.values, [variable]: value, [fieldToUnlock]: '' }, // Set current, clear unlocked
               lockedFields: newLockedFields,
               error: null,
             };
           }
        }
      }

      // Standard update if not unlocking an old field
      return {
        ...prev,
        values: { ...prev.values, [variable]: value },
        lockedFields: newLockedFields,
        error: null, // Clear error on input change
      };
    });
    // Calculation will be triggered by useEffect -> debouncedCalculate
  }, [variableOrder]);

  const handleUnitChange = useCallback((variable: Variable, unit: Unit) => {
    setState(prev => ({
      ...prev,
      units: { ...prev.units, [variable]: unit },
    }));
    // Calculation will be triggered by useEffect -> debouncedCalculate
  }, []);

  const handleReset = useCallback(() => {
    setState({
      values: initialValues,
      units: initialUnits,
      error: null,
      lockedFields: new Set<Variable>(),
    });
  }, [initialValues, initialUnits]);

  return {
    values: state.values,
    units: state.units,
    error: state.error,
    lockedFields: state.lockedFields,
    handleValueChange,
    handleUnitChange,
    handleReset,
  };
}
