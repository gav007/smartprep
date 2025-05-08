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
  params: WaveformParams & { timeWindowMs: number }; // Ensure timeWindowMs is passed for plot configuration
}

const CustomTooltip = ({ active, payload, label, timeUnit }: any) => {
  if (active && payload && payload.length) {
    const timeValue = label !== undefined && label !== null ? parseFloat(label) : NaN;
    let displayTime = 'N/A';
    if (!isNaN(timeValue)) {
      // Format time with appropriate precision for the current unit
      const precision = timeUnit === 'µs' ? 0 : (timeUnit === 'ms' ? 3 : 4);
      displayTime = timeValue.toLocaleString(undefined, {minimumFractionDigits: 0, maximumSignificantDigits: 4});
    }

    return (
      <div className="bg-background/80 backdrop-blur-sm p-2 border rounded-md shadow-lg text-xs">
        <p className="label">{`Time: ${displayTime} ${timeUnit}`}</p>
        <p className="intro text-primary">{`Voltage: ${payload[0].value !== undefined && payload[0].value !== null ? parseFloat(payload[0].value).toFixed(2) : 'N/A'} V`}</p>
      </div>
    );
  }
  return null;
};

export default function WaveformPlot({ data, params }: WaveformPlotProps) {
  if (!data || data.length === 0) {
    return <div className="h-80 w-full flex items-center justify-center text-muted-foreground bg-muted/30 rounded-md border border-dashed">No waveform data to display. Adjust parameters or check for errors.</div>;
  }

  const timeWindowMs = params.timeWindowMs; // This is now the effective time window
  let xAxisUnitLabel = 'ms';
  let timeDivisor = 1; // Data 'time' is in seconds, plot x-axis in chosen unit

  if (timeWindowMs < 0.01) { // e.g., less than 10µs, display in ns
    xAxisUnitLabel = 'ns';
    timeDivisor = 1e-9; // s to ns
  } else if (timeWindowMs < 1) { // If less than 1ms, display in µs
    xAxisUnitLabel = 'µs';
    timeDivisor = 1e-6; // s to µs
  } else if (timeWindowMs >= 1000) { // If 1s or more, display in s
    xAxisUnitLabel = 's';
    timeDivisor = 1; // s to s
  } else { // Default to ms
    xAxisUnitLabel = 'ms';
    timeDivisor = 1e-3; // s to ms
  }
  
  // Scale data 'time' (which is in seconds from generator) to the chosen display unit
  const plotData = data.map(p => ({ ...p, time: p.time / timeDivisor }));
  const xAxisDomainMax = (timeWindowMs / 1000) / timeDivisor; // Total time window in the chosen unit

  // Generate X-axis ticks
  const numXTicks = 11; // Aim for around 11 ticks
  const xTickInterval = xAxisDomainMax / (numXTicks - 1);
  const xTicks = Array.from({ length: numXTicks }, (_, i) => parseFloat((i * xTickInterval).toFixed(timeDivisor < 1e-3 ? 0 : 3)));


  // Dynamic Y-axis domain calculation
  const peakMagnitude = Math.abs(params.amplitude);
  let yMin = params.dcOffset - peakMagnitude;
  let yMax = params.dcOffset + peakMagnitude;
  
  if (yMax === yMin) { // Handles zero amplitude case
    yMin -= 1;
    yMax += 1;
  }
  
  const range = yMax - yMin;
  const yPadding = Math.max(0.5, range * 0.15); // Slightly increased padding
  const yAxisDomain: [number, number] = [parseFloat((yMin - yPadding).toFixed(1)), parseFloat((yMax + yPadding).toFixed(1))];

  // Smart Y-axis Ticks
  const numYGridLines = Math.max(5, Math.min(11, Math.floor(yAxisDomain[1] - yAxisDomain[0]) +1 )); 
  const yStep = (yAxisDomain[1] - yAxisDomain[0]) / (numYGridLines -1 > 0 ? numYGridLines -1 : 1);
  const yTicks = [];
  for (let i = 0; i < numYGridLines; i++) {
    const tickVal = parseFloat((yAxisDomain[0] + i * yStep).toFixed(1));
    if(!yTicks.includes(tickVal)) yTicks.push(tickVal); // Avoid duplicate ticks from parseFloat
  }
  if (yAxisDomain[0] < 0 && yAxisDomain[1] > 0 && !yTicks.some(tick => Math.abs(tick) < Math.abs(yStep/3))) { // Ensure 0V line is distinct
    if(!yTicks.includes(0)) yTicks.push(0);
    yTicks.sort((a,b) => a-b);
  }
  
  return (
    <div className="h-80 w-full md:h-96 bg-card p-2 rounded-lg shadow-inner border">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={plotData} margin={{ top: 5, right: 30, left: -10, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="time"
            type="number"
            domain={[0, 'dataMax']} // Let Recharts determine max based on plotted data
            label={{ value: `Time (${xAxisUnitLabel})`, position: 'insideBottom', offset: -10, dy: 10, fontSize: 10 }}
            tickFormatter={(tick) => tick.toLocaleString(undefined, {maximumSignificantDigits: 3})}
            ticks={xTicks}
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={{ stroke: 'hsl(var(--muted-foreground))' }}
            tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis
            type="number"
            domain={yAxisDomain}
            label={{ value: 'Voltage (V)', angle: -90, position: 'insideLeft', dx: 10, dy: 5, fontSize: 10 }}
            tickFormatter={(tick) => tick.toLocaleString(undefined, {minimumFractionDigits:1, maximumFractionDigits: 1})}
            ticks={yTicks.length > 1 ? yTicks : undefined} // Only pass ticks if more than one generated
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={{ stroke: 'hsl(var(--muted-foreground))' }}
            tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
            allowDataOverflow={false}
          />
          <Tooltip content={<CustomTooltip timeUnit={xAxisUnitLabel}/>} cursor={{ stroke: 'hsl(var(--accent))', strokeWidth: 1, strokeDasharray: '3 3' }} />
          <Line
            type="monotone"
            dataKey="voltage"
            stroke="hsl(var(--primary))"
            strokeWidth={1.5} // Thinner line for dense data
            dot={false}
            isAnimationActive={false}
          />
          {yAxisDomain[0] < 0 && yAxisDomain[1] > 0 && (
             <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="2 2" strokeWidth={0.75} />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

