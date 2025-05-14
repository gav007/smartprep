// src/components/calculators/CalculatorCard.tsx
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CalculatorCardProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  children: React.ReactNode; // Content of the calculator (inputs, results)
  className?: string;
}

const CalculatorCard: React.FC<CalculatorCardProps> = ({
  title,
  description,
  icon: Icon,
  children,
  className,
}) => {
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {Icon && <Icon className="text-primary" />} {/* Removed fixed size */}
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
      </CardContent>
    </Card>
  );
};

export default CalculatorCard;
