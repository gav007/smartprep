'use client';

import React, { useState, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Waves } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { generateWaveformData } from '@/lib/calculator-utils';
import type { WaveformParams, WaveformType, WaveformDataPoint } from '@/types/calculator';
import { Slider } from "@/components/ui/slider"; // Import Slider


export default function WaveformGeneratorPage() {
  const [waveformType, setWaveformType] = useState<WaveformType>('sine');
  const [frequency, setFrequency] = useState<number>(1); // 1 Hz default
  const [amplitude, setAmplitude] = useState<number>(5); // 5 V default
  // const [phase, setPhase] = useState<number>(0); // Phase in degrees
  const [samples, setSamples] = useState<number>(100); // Number of data points


  const waveformParams: WaveformParams = useMemo(() => ({
    type: waveformType,
    frequency,
    amplitude,
    // phase,
    samples,
    // Calculate duration based on frequency to show at least 2 cycles
    duration: (1 / frequency) * 2,
  }), [waveformType, frequency, amplitude, samples]); // Removed phase dependency

  const waveformData: WaveformDataPoint[] = useMemo(() => {
     // Add basic validation to prevent errors with extreme values
     if (frequency <= 0 || amplitude <= 0 || samples < 2) {
         return []; // Return empty data if params are invalid
     }
    return generateWaveformData(waveformParams);
  }, [waveformParams]);

  const handleFrequencyChange = (value: number[]) => {
     setFrequency(value[0]);
   };

   const handleAmplitudeChange = (value: number[]) => {
     setAmplitude(value[0]);
   };

  const handleSamplesChange = (value: number[]) => {
    setSamples(value[0]);
  }


  return (
    <div className="container mx-auto p-4 md:p-6">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Waves className="h-6 w-6 text-primary" />
            Waveform Generator
          </CardTitle>
          <CardDescription>
            Visualize basic electronic waveforms like Sine, Square, and Triangle.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Controls Column */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="waveformType">Waveform Type</Label>
                <Select value={waveformType} onValueChange={(v) => setWaveformType(v as WaveformType)}>
                  <SelectTrigger id="waveformType">
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sine">Sine</SelectItem>
                    <SelectItem value="square">Square</SelectItem>
                    <SelectItem value="triangle">Triangle</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                 <div className="flex justify-between items-center">
                    <Label htmlFor="frequency">Frequency (Hz)</Label>
                    <span className="text-sm text-muted-foreground">{frequency.toFixed(1)} Hz</span>
                 </div>
                <Slider
                    id="frequency"
                    min={0.1}
                    max={10}
                    step={0.1}
                    value={[frequency]}
                    onValueChange={handleFrequencyChange}
                 />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                     <Label htmlFor="amplitude">Amplitude (V)</Label>
                     <span className="text-sm text-muted-foreground">{amplitude.toFixed(1)} V</span>
                </div>
                 <Slider
                    id="amplitude"
                    min={0.1}
                    max={20}
                    step={0.1}
                    value={[amplitude]}
                    onValueChange={handleAmplitudeChange}
                 />
              </div>

               <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <Label htmlFor="samples">Samples</Label>
                    <span className="text-sm text-muted-foreground">{samples} points</span>
                </div>
                <Slider
                    id="samples"
                    min={10}
                    max={500}
                    step={10}
                    value={[samples]}
                    onValueChange={handleSamplesChange}
                 />
               </div>


              {/* Phase Input (Optional) */}
              {/* <div>
                <Label htmlFor="phase">Phase (°)</Label>
                <Input
                  id="phase"
                  type="number"
                  value={phase}
                  onChange={(e) => setPhase(parseFloat(e.target.value) || 0)}
                  step={10}
                />
              </div> */}
            </div>

            {/* Chart Column */}
            <div className="md:col-span-2 h-80 md:h-96 bg-muted/20 rounded-lg p-4 border">
              {waveformData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={waveformData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis
                              dataKey="time"
                              type="number"
                              domain={['dataMin', 'dataMax']}
                              label={{ value: "Time (s)", position: "insideBottomRight", dy: 10, fill: 'hsl(var(--muted-foreground))' }}
                              stroke="hsl(var(--foreground))"
                              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                              tickFormatter={(tick) => tick.toFixed(2)}
                          />
                          <YAxis
                              dataKey="voltage"
                              type="number"
                              domain={[-amplitude * 1.1, amplitude * 1.1]} // Dynamic domain based on amplitude
                              label={{ value: "Voltage (V)", angle: -90, position: "insideLeft", dx: -10, fill: 'hsl(var(--muted-foreground))' }}
                              stroke="hsl(var(--foreground))"
                              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                              tickFormatter={(tick) => tick.toFixed(1)}
                          />
                          <Tooltip
                            contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)', fontSize: '12px' }}
                            labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold' }}
                            itemStyle={{ color: 'hsl(var(--primary))' }}
                            formatter={(value: number) => [`${value.toFixed(2)} V`, 'Voltage']}
                            labelFormatter={(label: number) => `Time: ${label.toFixed(3)} s`}
                          />
                          {/* <Legend wrapperStyle={{ fontSize: '12px' }} /> */}
                          <Line
                              type="monotone" // Use "linear" for square/triangle for sharper lines if preferred
                              dataKey="voltage"
                              stroke="hsl(var(--primary))"
                              strokeWidth={2}
                              dot={false} // Disable dots for smoother lines
                              isAnimationActive={false} // Optional: disable animation for performance
                              name={`${waveformType.charAt(0).toUpperCase() + waveformType.slice(1)} Wave`}
                          />
                      </LineChart>
                  </ResponsiveContainer>
              ) : (
                 <div className="flex items-center justify-center h-full text-muted-foreground">
                     <p>Configure parameters to generate waveform.</p>
                 </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
