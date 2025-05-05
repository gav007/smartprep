
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Construction } from 'lucide-react'; // Icon indicating under construction

export default function BJTSolver() {
  return (
    <Card className="opacity-50 pointer-events-none"> {/* Dim and disable */}
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Construction size={20}/> Super BJT Solver</CardTitle>
        <CardDescription>Calculate BJT circuit parameters (Coming Soon).</CardDescription>
      </CardHeader>
      <CardContent className="text-center text-muted-foreground">
        <Construction className="h-16 w-16 mx-auto my-4 text-yellow-500" />
        <p>This calculator is currently under development.</p>
         <p className="text-xs mt-1">Check back later for BJT analysis tools!</p>
      </CardContent>
    </Card>
  );
}
