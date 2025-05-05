
"use client";
import React, { useState, useEffect } from "react";

// Define types for units to ensure consistency - Keeping these for potential future integration
type VoltageUnit = 'V' | 'mV' | 'kV';
type CurrentUnit = 'A' | 'mA' | 'µA';
type ResistanceUnit = 'Ω' | 'kΩ' | 'MΩ';
type PowerUnit = 'W' | 'mW' | 'kW';

// Define multipliers for unit conversions - Keeping these
const voltageMultipliers: Record<VoltageUnit, number> = { V: 1, mV: 1e-3, kV: 1e3 };
const currentMultipliers: Record<CurrentUnit, number> = { A: 1, mA: 1e-3, µA: 1e-6 };
const resistanceMultipliers: Record<ResistanceUnit, number> = { Ω: 1, kΩ: 1e3, MΩ: 1e6 };
const powerMultipliers: Record<PowerUnit, number> = { W: 1, mW: 1e-3, kW: 1e3 };

// Formatting helpers (simplified for now)
const formatResult = (value: string | number | null, unit: string): string => {
    if (value === null || value === "" || isNaN(Number(value))) return 'N/A';
    // Basic formatting, could be enhanced like before
    const num = Number(value);
    const precision = Math.abs(num) < 10 ? 3 : 2;
    return `${num.toFixed(precision).replace(/\.?0+$/, '')} ${unit}`;
}

export default function PowerCalculator() {
  const [voltage, setVoltage] = useState("");
  const [current, setCurrent] = useState("");
  const [resistance, setResistance] = useState("");
  const [power, setPower] = useState("");

  // Track the last edited field
  const [lastChanged, setLastChanged] = useState<"V" | "I" | "R" | "P" | null>(null);
  const [calculating, setCalculating] = useState(false); // Prevent infinite loops

  useEffect(() => {
    // If currently calculating, skip this effect run
    if (calculating) return;

    const v = parseFloat(voltage);
    const i = parseFloat(current);
    const r = parseFloat(resistance);
    const p = parseFloat(power);

    const inputs = [voltage, current, resistance, power].filter(s => s !== '').length;

    if (inputs !== 2 || !lastChanged) {
      // Reset calculated fields if not exactly 2 inputs or no recent change
      // This allows users to clear fields and start over
      if (inputs < 2 && lastChanged) {
          if (lastChanged !== 'V') setVoltage(val => lastChanged === 'V' ? val : '');
          if (lastChanged !== 'I') setCurrent(val => lastChanged === 'I' ? val : '');
          if (lastChanged !== 'R') setResistance(val => lastChanged === 'R' ? val : '');
          if (lastChanged !== 'P') setPower(val => lastChanged === 'P' ? val : '');
      }
      return;
    }

    setCalculating(true); // Set flag before potentially updating state

    try {
        // Logic based on which two fields are KNOWN (not necessarily the last changed)
        if (!isNaN(v) && !isNaN(i) && lastChanged !== 'R' && lastChanged !== 'P') {
            if (i !== 0) setResistance((v / i).toPrecision(4)); else setResistance(''); // Avoid div by zero
            setPower((v * i).toPrecision(4));
        } else if (!isNaN(v) && !isNaN(r) && lastChanged !== 'I' && lastChanged !== 'P') {
             if (r !== 0) setCurrent((v / r).toPrecision(4)); else setCurrent('');
             if (r !== 0) setPower(((v * v) / r).toPrecision(4)); else setPower('');
        } else if (!isNaN(i) && !isNaN(r) && lastChanged !== 'V' && lastChanged !== 'P') {
            setVoltage((i * r).toPrecision(4));
            setPower(((i * i) * r).toPrecision(4));
        } else if (!isNaN(v) && !isNaN(p) && lastChanged !== 'I' && lastChanged !== 'R') {
             if (v !== 0) setCurrent((p / v).toPrecision(4)); else setCurrent('');
             if (p !== 0) setResistance(((v * v) / p).toPrecision(4)); else setResistance('');
        } else if (!isNaN(i) && !isNaN(p) && lastChanged !== 'V' && lastChanged !== 'R') {
            if (i !== 0) setVoltage((p / i).toPrecision(4)); else setVoltage('');
            if (i !== 0) setResistance((p / (i * i)).toPrecision(4)); else setResistance('');
        } else if (!isNaN(r) && !isNaN(p) && lastChanged !== 'V' && lastChanged !== 'I') {
             if (r !== 0) {
                const calcI = Math.sqrt(Math.abs(p) / r); // Calculate magnitude
                setCurrent(calcI.toPrecision(4));
                setVoltage(Math.sqrt(Math.abs(p) * r).toPrecision(4)); // Calculate magnitude
             } else {
                 setCurrent('');
                 setVoltage('');
             }
        }
    } catch (error) {
        console.error("Calculation error:", error);
        // Optionally set an error state to display to the user
    } finally {
        // Crucially, unset the calculating flag AFTER state updates might have occurred
        // Use a microtask delay to ensure state updates are processed before the next effect run
        queueMicrotask(() => setCalculating(false));
    }

  }, [voltage, current, resistance, power, lastChanged, calculating]); // Add calculating to dependency array

  // Update handleInput to clear other fields ONLY when a new field gets focus/input
  // And only if we already have 2+ fields filled? No, just clear calculated fields.
  const handleInput = (setter: React.Dispatch<React.SetStateAction<string>>, value: string, field: "V" | "I" | "R" | "P") => {
    setter(value);
    setLastChanged(field); // Set this field as the last one changed

     // If the user starts typing in a field, clear the ones that would be calculated *from* it
     // This prevents lock-in and allows correction.
     // Example: If user types in V, and previously I, R, P were calculated, clear R and P.
     // Keep I because V and I calculate R and P.
     // Keep R because V and R calculate I and P.
     // Keep P because V and P calculate I and R.

     // Simpler approach: When a user types in a field, clear ONE field that is normally calculated from it,
     // letting the useEffect calculate the remaining one.
     // Or even simpler: just set the lastChanged and let useEffect handle the rest, including potential overwrites.
     // Let's stick to just setting lastChanged and letting useEffect manage consistency.
  };

  // Function to clear all fields
  const handleClear = () => {
      setVoltage("");
      setCurrent("");
      setResistance("");
      setPower("");
      setLastChanged(null);
      setCalculating(false); // Ensure flag is reset
  };

  return (
    // Applying basic Tailwind for layout matching the project style
    <div className="p-6 bg-card text-card-foreground rounded-lg shadow-sm border max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-zap"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"></path></svg> Electrical Power Calculator</h2>
      <p className="text-sm text-muted-foreground mb-4">Enter any two values to calculate the others.</p>
      <div className="space-y-3">
         {/* Using basic input with Tailwind classes */}
        <div className="space-y-1">
            <label htmlFor="voltage" className="text-sm font-medium text-muted-foreground">Voltage (V)</label>
            <input
            id="voltage"
            type="number"
            step="any"
            placeholder="Enter Voltage"
            value={voltage}
            onChange={(e) => handleInput(setVoltage, e.target.value, "V")}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
            />
        </div>
         <div className="space-y-1">
             <label htmlFor="current" className="text-sm font-medium text-muted-foreground">Current (A)</label>
            <input
                id="current"
                type="number"
                step="any"
                placeholder="Enter Current"
                value={current}
                onChange={(e) => handleInput(setCurrent, e.target.value, "I")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
            />
        </div>
         <div className="space-y-1">
            <label htmlFor="resistance" className="text-sm font-medium text-muted-foreground">Resistance (Ω)</label>
            <input
                id="resistance"
                type="number"
                step="any"
                placeholder="Enter Resistance"
                value={resistance}
                onChange={(e) => handleInput(setResistance, e.target.value, "R")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
            />
        </div>
        <div className="space-y-1">
             <label htmlFor="power" className="text-sm font-medium text-muted-foreground">Power (W)</label>
            <input
                id="power"
                type="number"
                step="any"
                placeholder="Enter Power"
                value={power}
                onChange={(e) => handleInput(setPower, e.target.value, "P")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
            />
        </div>
      </div>

       <button
         onClick={handleClear}
         className="mt-4 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
       >
         Clear All
       </button>


      {/* Display results simply for now */}
      <div className="mt-6 pt-4 border-t">
        <h3 className="font-semibold mb-2">Results:</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
            <p><strong>Voltage:</strong> {formatResult(voltage, 'V')}</p>
            <p><strong>Current:</strong> {formatResult(current, 'A')}</p>
            <p><strong>Resistance:</strong> {formatResult(resistance, 'Ω')}</p>
            <p><strong>Power:</strong> {formatResult(power, 'W')}</p>
        </div>
      </div>
    </div>
  );
}

