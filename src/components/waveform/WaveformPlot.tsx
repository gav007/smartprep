// src/components/waveform/WaveformPlot.tsx
'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { DataPoint, WaveformParams } from '@/types/waveform';

interface WaveformPlotProps {
  data: DataPoint[];
  params: WaveformParams;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/80 backdrop-blur-sm p-2 border rounded-md shadow-lg text-xs">
        <p className="label">{`Time: ${label !== undefined && label !== null ? parseFloat(label).toFixed(2) : 'N/A'} ms`}</p>
        <p className="intro text-primary">{`Voltage: ${payload[0].value !== undefined && payload[0].value !== null ? parseFloat(payload[0].value).toFixed(2) : 'N/A'} V`}</p>
      </div>
    );
  }
  return null;
};

export default function WaveformPlot({ data, params }: WaveformPlotProps) {
  if (!data || data.length === 0) {
    return <div className="h-80 w-full flex items-center justify-center text-muted-foreground bg-muted/30 rounded-md border border-dashed">No waveform data to display. Adjust parameters.</div>;
  }

  const yDomainMin = Math.min(-params.amplitude + params.dcOffset, params.dcOffset - params.amplitude, -1);
  const yDomainMax = Math.max(params.amplitude + params.dcOffset, params.dcOffset + params.amplitude, 1);
  const yAxisDomain = [
      Math.floor(yDomainMin / 1) * 1 -1, // Round down to nearest integer and subtract 1
      Math.ceil(yDomainMax / 1) * 1 + 1   // Round up to nearest integer and add 1
  ];


  const xTicks = Array.from({length: 11}, (_, i) => (params.timeWindowMs / 10) * i);
  const yTicks = [];
  const numGridLines = Math.max(5, Math.floor(yAxisDomain[1] - yAxisDomain[0]));
  const step = (yAxisDomain[1] - yAxisDomain[0]) / (numGridLines -1 > 0 ? numGridLines -1 : 1);

  for (let i = 0; i < numGridLines; i++) {
    yTicks.push(parseFloat((yAxisDomain[0] + i * step).toFixed(1)));
  }
   // Ensure 0V line is included if within range
   if (yAxisDomain[0] < 0 && yAxisDomain[1] > 0 && !yTicks.some(tick => Math.abs(tick) < 0.01)) {
    yTicks.push(0);
    yTicks.sort((a,b) => a-b);
  }


  return (
    <div className="h-80 w-full md:h-96 bg-card p-2 rounded-lg shadow-inner border">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="time"
            type="number"
            domain={[0, params.timeWindowMs]}
            label={{ value: 'Time (ms)', position: 'insideBottomRight', offset: -2, dy: 10, fontSize: 10 }}
            tickFormatter={(tick) => tick.toFixed(0)}
            ticks={xTicks}
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={{ stroke: 'hsl(var(--muted-foreground))' }}
            tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis
            type="number"
            domain={yAxisDomain}
            label={{ value: 'Voltage (V)', angle: -90, position: 'insideLeft', dx: 10, fontSize: 10 }}
            tickFormatter={(tick) => tick.toFixed(1)}
            ticks={yTicks}
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={{ stroke: 'hsl(var(--muted-foreground))' }}
            tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--accent))', strokeWidth: 1, strokeDasharray: '3 3' }} />
          <Line
            type="monotone"
            dataKey="voltage"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false} // For smoother updates when params change quickly
          />
           {/* Zero Volt Reference Line */}
          {yAxisDomain[0] < 0 && yAxisDomain[1] > 0 && (
             <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="2 2" strokeWidth={0.5} />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
