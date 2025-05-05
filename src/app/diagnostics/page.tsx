// src/app/diagnostics/page.tsx
'use client'; // This page uses hooks and potentially browser APIs

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Server, FileJson, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import packageJson from '../../../package.json'; // Import package.json

interface QuizMeta {
  name: string;
  path: string;
  questionCount: number;
  status: 'loaded' | 'error';
  error?: string;
}

interface ModuleStatus {
    name: string;
    status: 'active' | 'inactive' | 'error';
    path?: string;
    error?: string;
}

export default function DiagnosticsPage() {
  const [buildTime, setBuildTime] = useState<string>('N/A');
  const [quizDataStatus, setQuizDataStatus] = useState<QuizMeta[]>([]);
  const [moduleStatus, setModuleStatus] = useState<ModuleStatus[]>([]);
  const [testStatus, setTestStatus] = useState<string>('Not Run'); // Simplified test status

  // Fetch Quiz Metadata on client-side
  useEffect(() => {
    const fetchQuizMeta = async () => {
      const quizzes = [
        { name: 'Applied Networking', path: '/data/applied.json' },
        { name: 'Networking Fundamentals', path: '/data/network_quiz.json' },
      ];
      const statusPromises = quizzes.map(async (quiz) => {
        try {
          const response = await fetch(quiz.path);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const data = await response.json();
          if (!Array.isArray(data)) throw new Error('Invalid format');
          return { ...quiz, questionCount: data.length, status: 'loaded' } as QuizMeta;
        } catch (err: any) {
          console.error(`Error loading quiz ${quiz.name}:`, err);
          return { ...quiz, questionCount: 0, status: 'error', error: err.message || 'Failed to load' } as QuizMeta;
        }
      });
      setQuizDataStatus(await Promise.all(statusPromises));
    };
    fetchQuizMeta();
  }, []);

  // Simulate checking module status (replace with actual checks if needed)
  useEffect(() => {
    // These are placeholders; replace with actual component/feature checks if necessary
    setModuleStatus([
      { name: 'Quiz Engine', status: 'active', path: 'src/app/quiz/' },
      { name: 'Calculators', status: 'active', path: 'src/app/calculator/' },
      { name: 'Subnet Tool', status: 'active', path: 'src/app/tools/subnet/' },
      { name: 'Truth Table Tool', status: 'active', path: 'src/app/tools/truth-table/' },
      { name: 'Resistor Tool', status: 'active', path: 'src/app/tools/resistor/' },
      { name: 'Base Converter Tool', status: 'active', path: 'src/app/tools/base-converter/' },
      { name: 'Packet Flow Sim', status: 'active', path: 'src/app/tools/packet-flow/' },
       { name: 'AI Features', status: 'inactive', error: 'Removed' }, // Indicate removal
    ]);
  }, []);

  // Get build time (this will be client render time, not actual build time)
  // For actual build time, you'd need to inject it during the build process (e.g., via env vars)
  useEffect(() => {
    setBuildTime(new Date().toLocaleString());
  }, []);

  // Placeholder for test status - replace with actual test result import/check if possible
  // This is highly dependent on your testing setup and CI/CD pipeline
  useEffect(() => {
    // Example: Assume tests passed if reaching this point without build errors
    // In a real scenario, you might fetch results from a CI artifact or API
    setTestStatus('Passed (Simulated)');
  }, []);

  return (
    <div className="container mx-auto px-4 py-12">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Info size={28} /> SmartPrep Diagnostics
          </CardTitle>
          <CardDescription>
            System status, loaded modules, and data sources overview.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">

          {/* Build & Version Info */}
          <section>
            <h2 className="text-xl font-semibold mb-3 border-b pb-2">System Information</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <p><strong>App Version:</strong> v{packageJson.version}</p>
              <p><strong>Next.js Version:</strong> {packageJson.dependencies.next}</p>
              <p><strong>React Version:</strong> {packageJson.dependencies.react}</p>
               <p><strong>Build/Render Time:</strong> {buildTime}</p>
               <p><strong>Environment:</strong> {process.env.NODE_ENV}</p>
            </div>
          </section>

          {/* Quiz Data Status */}
          <section>
            <h2 className="text-xl font-semibold mb-3 border-b pb-2">Quiz Data Status</h2>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Quiz Name</TableHead>
                        <TableHead>Path</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Questions</TableHead>
                        <TableHead>Error</TableHead>
                    </TableRow>
                </TableHeader>
                 <TableBody>
                    {quizDataStatus.length > 0 ? quizDataStatus.map(quiz => (
                        <TableRow key={quiz.path}>
                            <TableCell>{quiz.name}</TableCell>
                            <TableCell className="text-xs font-mono">{quiz.path}</TableCell>
                            <TableCell>
                                <Badge variant={quiz.status === 'loaded' ? 'default' : 'destructive'} className={quiz.status === 'loaded' ? 'bg-green-600 hover:bg-green-700' : ''}>
                                {quiz.status}
                                </Badge>
                            </TableCell>
                            <TableCell>{quiz.status === 'loaded' ? quiz.questionCount : 'N/A'}</TableCell>
                            <TableCell className="text-xs text-destructive">{quiz.error || '-'}</TableCell>
                        </TableRow>
                    )) : (
                         <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Loading quiz data...</TableCell></TableRow>
                    )}
                 </TableBody>
            </Table>
          </section>

           {/* Module Status */}
           <section>
             <h2 className="text-xl font-semibold mb-3 border-b pb-2">Feature Modules</h2>
             <Table>
                 <TableHeader>
                     <TableRow>
                         <TableHead>Module</TableHead>
                         <TableHead>Status</TableHead>
                         <TableHead>Path / Notes</TableHead>
                     </TableRow>
                 </TableHeader>
                  <TableBody>
                     {moduleStatus.map(mod => (
                         <TableRow key={mod.name}>
                             <TableCell>{mod.name}</TableCell>
                             <TableCell>
                                 <Badge variant={mod.status === 'active' ? 'default' : (mod.status === 'inactive' ? 'secondary' : 'destructive')} className={mod.status === 'active' ? 'bg-green-600 hover:bg-green-700' : ''}>
                                 {mod.status}
                                 </Badge>
                             </TableCell>
                             <TableCell className="text-xs">{mod.path || mod.error || '-'}</TableCell>
                         </TableRow>
                     ))}
                  </TableBody>
             </Table>
           </section>

            {/* Test Status */}
           <section>
             <h2 className="text-xl font-semibold mb-3 border-b pb-2">Test Status</h2>
              <div className={`flex items-center gap-2 p-3 rounded border ${testStatus.startsWith('Passed') ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                {testStatus.startsWith('Passed') ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
                <p className="font-medium">{testStatus}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Note: This is a simplified status. Check CI/CD or run `npm test` for detailed results.</p>
           </section>

        </CardContent>
      </Card>
    </div>
  );
}
