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

const CustomTooltip = ({ active, payload, label, timeUnit }: any) => {
  if (active && payload && payload.length) {
    const timeValue = label !== undefined && label !== null ? parseFloat(label) : NaN;
    let displayTime = 'N/A';
    if (!isNaN(timeValue)) {
      displayTime = timeValue.toLocaleString(undefined, {maximumSignificantDigits: 4});
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

  // Determine X-axis unit and scale for ticks
  const timeWindowMs = params.timeWindowMs;
  let xAxisUnitLabel = 'ms';
  let timeDivisor = 1; // if timeWindowMs >= 1, display in ms

  if (timeWindowMs < 1) { // If less than 1ms, display in µs
    xAxisUnitLabel = 'µs';
    timeDivisor = 0.001; // Convert ms to µs for display
  }

  const xAxisDomainMax = timeWindowMs / timeDivisor;

  // Generate X-axis ticks, ensuring they are in the chosen display unit
  const xTicks = Array.from({ length: 11 }, (_, i) => parseFloat(((xAxisDomainMax / 10) * i).toFixed(3)));


  // Dynamic Y-axis domain calculation
  const peakMagnitude = Math.abs(params.amplitude);
  let yMin = params.dcOffset - peakMagnitude;
  let yMax = params.dcOffset + peakMagnitude;
  
  // Ensure a minimum visible range if amplitude is very small or zero
  if (yMax - yMin < 0.2) { // e.g. less than 0.2V range
    yMin -= 0.1;
    yMax += 0.1;
  }
  if (yMin === 0 && yMax === 0 && params.dcOffset === 0) { // Handles 0 amplitude, 0 offset
    yMin = -1; yMax = 1;
  }


  const range = yMax - yMin;
  // Add padding to the domain, e.g., 10% of the range or a fixed amount
  const yPadding = Math.max(0.5, range * 0.1); 
  const yAxisDomain = [Math.floor(yMin - yPadding), Math.ceil(yMax + yPadding)];


  // Smart Y-axis Ticks
  const numYGridLines = Math.max(5, Math.min(11, Math.floor(yAxisDomain[1] - yAxisDomain[0]) +1 )); // Aim for 5-11 grid lines
  const yStep = (yAxisDomain[1] - yAxisDomain[0]) / (numYGridLines -1 > 0 ? numYGridLines -1 : 1);
  const yTicks = [];
  for (let i = 0; i < numYGridLines; i++) {
    yTicks.push(parseFloat((yAxisDomain[0] + i * yStep).toFixed(1)));
  }
  // Ensure 0V line is included if within range and not too close to other ticks
  if (yAxisDomain[0] < 0 && yAxisDomain[1] > 0 && !yTicks.some(tick => Math.abs(tick) < Math.abs(yStep/2))) {
    yTicks.push(0);
    yTicks.sort((a,b) => a-b);
  }
  
  // Apply timeDivisor to data for plotting if unit is µs
  const plotData = timeDivisor !== 1 ? data.map(p => ({ ...p, time: p.time / timeDivisor })) : data;

  return (
    <div className="h-80 w-full md:h-96 bg-card p-2 rounded-lg shadow-inner border">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={plotData} margin={{ top: 5, right: 25, left: -15, bottom: 15 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="time"
            type="number"
            domain={[0, xAxisDomainMax]}
            label={{ value: `Time (${xAxisUnitLabel})`, position: 'insideBottomRight', offset: -2, dy: 10, fontSize: 10 }}
            tickFormatter={(tick) => tick.toLocaleString(undefined, {maximumSignificantDigits: 3})}
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
            allowDataOverflow={false} // Prevent lines going out of bounds
          />
          <Tooltip content={<CustomTooltip timeUnit={xAxisUnitLabel}/>} cursor={{ stroke: 'hsl(var(--accent))', strokeWidth: 1, strokeDasharray: '3 3' }} />
          <Line
            type="monotone"
            dataKey="voltage"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
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
