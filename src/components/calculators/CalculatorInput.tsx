// src/components/calculators/CalculatorInput.tsx
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from 'lucide-react';
import type { Unit } from '@/lib/units';
import { cn } from '@/lib/utils';

interface CalculatorInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  unit?: Unit; // Make unit optional
  unitOptions?: Unit[];
  onUnitChange?: (unit: Unit) => void;
  placeholder?: string;
  tooltip?: string;
  isCalculated?: boolean; // Indicate if the field is currently auto-calculated
  error?: boolean; // Indicate an error state
  disabled?: boolean;
  type?: string;
  min?: string | number;
  step?: string | number;
}

const CalculatorInput: React.FC<CalculatorInputProps> = ({
  id,
  label,
  value,
  onChange,
  unit,
  unitOptions,
  onUnitChange,
  placeholder,
  tooltip,
  isCalculated = false,
  error = false,
  disabled = false,
  type = "number",
  min,
  step = "any",
}) => {
  const inputElement = (
    <Input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        isCalculated ? 'bg-muted/50 border-input font-medium' : '',
        error ? 'border-destructive focus-visible:ring-destructive' : ''
      )}
      disabled={disabled}
      min={min}
      step={step}
      aria-invalid={error}
      aria-describedby={tooltip ? `${id}-tooltip` : undefined}
    />
  );

  return (
    <div className="grid grid-cols-3 items-end gap-2">
      {/* Label and Tooltip */}
      <div className="col-span-1 flex items-center space-x-1">
        <Label htmlFor={id}>{label}</Label>
        {tooltip && (
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" className="cursor-help text-muted-foreground hover:text-foreground">
                  <HelpCircle size={14} />
                </button>
              </TooltipTrigger>
              <TooltipContent id={`${id}-tooltip`}>
                <p>{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Input Field */}
      <div className="col-span-1">
        {inputElement}
      </div>

      {/* Unit Selector */}
      <div className="col-span-1">
        {unitOptions && unitOptions.length > 0 && onUnitChange && unit ? (
          <Select value={unit} onValueChange={(newUnit) => onUnitChange(newUnit as Unit)} disabled={disabled}>
            <SelectTrigger className="w-full md:w-[85px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {unitOptions.map(u => (
                <SelectItem key={u} value={u}>{u}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : unit ? (
            // Display unit if provided but no options (e.g., %)
            <span className="flex h-10 w-full items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground">
                {unit}
            </span>
        ) : (
          <div className="w-full md:w-[85px] flex-shrink-0"></div> // Placeholder for alignment
        )}
      </div>
    </div>
  );
};

export default CalculatorInput;
