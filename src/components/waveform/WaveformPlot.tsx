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
  Dot,
} from 'recharts';
import type { DataPoint, WaveformParams } from '@/types/waveform';
import { formatResultValue } from '@/lib/units';

interface WaveformPlotProps {
  data: DataPoint[];
  params: WaveformParams; 
}

const CustomTooltip = ({ active, payload, label, timeUnitLabel, timeForInstantaneousVoltageMs }: any) => {
  if (active && payload && payload.length) {
    const timeValue = label !== undefined && label !== null ? parseFloat(label) : NaN;
    let displayTime = 'N/A';
    if (!isNaN(timeValue)) {
      displayTime = timeValue.toLocaleString(undefined, {maximumSignificantDigits: 4, useGrouping: false});
    }

    return (
      <div className="bg-background/80 backdrop-blur-sm p-2 border rounded-md shadow-lg text-xs">
        <p className="label">{`Time: ${displayTime} ${timeUnitLabel}`}</p>
        <p className="intro text-primary">{`Voltage: ${payload[0].value !== undefined && payload[0].value !== null ? parseFloat(payload[0].value).toFixed(2) : 'N/A'} V`}</p>
        {timeForInstantaneousVoltageMs !== undefined && Math.abs(timeValue - timeForInstantaneousVoltageMs) < 0.000001 * (timeUnitLabel === 'ms' ? 1 : 1000) && ( // highlight if close to specified t
          <p className="font-bold text-accent">Calculated v(t)</p>
        )}
      </div>
    );
  }
  return null;
};

// Custom Dot for marking instantaneous voltage point
const CalculatedPointDot = (props: any) => {
  const { cx, cy, stroke, payload, value, timeForInstantaneousVoltageMs, timeDivisor } = props;
  if (timeForInstantaneousVoltageMs === undefined || payload.time * timeDivisor !== timeForInstantaneousVoltageMs/1000) {
    return null; // Don't render if not the specific point or time is undefined
  }
  return <Dot cx={cx} cy={cy} r={4} stroke={stroke} fill="hsl(var(--accent))" strokeWidth={2} />;
};


export default function WaveformPlot({ data, params }: WaveformPlotProps) {
  if (!data || data.length === 0) {
    return <div className="h-80 w-full flex items-center justify-center text-muted-foreground bg-muted/30 rounded-md border border-dashed">No waveform data to display. Adjust parameters or check for errors.</div>;
  }

  const timeWindowMs = params.timeWindowMs;
  
  let xAxisUnitLabel = 'ms';
  let timeDivisorForPlot = 1000; // Convert data's time (seconds) to ms for plot

  if (timeWindowMs < 0.01) { 
    xAxisUnitLabel = 'ns';
    timeDivisorForPlot = 1e9; 
  } else if (timeWindowMs < 1) { 
    xAxisUnitLabel = 'µs';
    timeDivisorForPlot = 1e6; 
  } else if (timeWindowMs >= 1000) { 
    xAxisUnitLabel = 's';
    timeDivisorForPlot = 1; 
  }
  
  const plotData = data.map(p => ({ ...p, timePlot: p.time * timeDivisorForPlot }));
  const xAxisDomainMax = timeWindowMs * (timeDivisorForPlot / 1000);


  const numXTicks = Math.min(11, Math.max(3, Math.floor(timeWindowMs / (timeWindowMs < 1 ? 0.1 : 1)) + 1));
  const xTickInterval = xAxisDomainMax / (numXTicks > 1 ? numXTicks - 1 : 1);
  const xTicks = Array.from({ length: numXTicks }, (_, i) => parseFloat((i * xTickInterval).toFixed(xAxisUnitLabel === 'ns' || xAxisUnitLabel === 'µs' ? 0 : (xAxisUnitLabel === 'ms' && timeWindowMs < 10 ? 2 : 1) )));


  const peakMagnitude = Math.abs(params.amplitude);
  let yMin = params.dcOffset - peakMagnitude;
  let yMax = params.dcOffset + peakMagnitude;
  
  if (yMax === yMin) { 
    yMin -= 1;
    yMax += 1;
  }
  
  const range = yMax - yMin;
  const yPadding = Math.max(0.5, range * 0.2); // Increased padding for better visibility
  const yAxisDomain: [number, number] = [parseFloat((yMin - yPadding).toFixed(1)), parseFloat((yMax + yPadding).toFixed(1))];

  const numYGridLines = Math.max(5, Math.min(11, Math.floor(yAxisDomain[1] - yAxisDomain[0]) +1 )); 
  const yStep = (yAxisDomain[1] - yAxisDomain[0]) / (numYGridLines -1 > 0 ? numYGridLines -1 : 1);
  const yTicks = [];
  for (let i = 0; i < numYGridLines; i++) {
    const tickVal = parseFloat((yAxisDomain[0] + i * yStep).toFixed(1));
    if(!yTicks.includes(tickVal)) yTicks.push(tickVal); 
  }
  if (yAxisDomain[0] < 0 && yAxisDomain[1] > 0 && !yTicks.some(tick => Math.abs(tick) < Math.abs(yStep/3))) {
    if(!yTicks.includes(0)) yTicks.push(0);
    yTicks.sort((a,b) => a-b);
  }

  // Convert timeForInstantaneousVoltageMs (which is in ms) to the current plot's X-axis unit for the ReferenceLine
  let tMarkerPosition: number | undefined = undefined;
  if (params.timeForInstantaneousVoltageMs !== undefined) {
     tMarkerPosition = (params.timeForInstantaneousVoltageMs / 1000) * timeDivisorForPlot;
  }
  
  return (
    <div className="h-80 w-full md:h-96 bg-card p-2 rounded-lg shadow-inner border">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={plotData} margin={{ top: 10, right: 30, left: 0, bottom: 25 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="timePlot"
            type="number"
            domain={[0, xAxisDomainMax]}
            label={{ value: `Time (${xAxisUnitLabel})`, position: 'insideBottom', offset: -15, dy: 15, fontSize: 10 }}
            tickFormatter={(tick) => tick.toLocaleString(undefined, {maximumSignificantDigits: 3, useGrouping: false})}
            ticks={xTicks}
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={{ stroke: 'hsl(var(--muted-foreground))' }}
            tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis
            type="number"
            domain={yAxisDomain}
            label={{ value: 'Voltage (V)', angle: -90, position: 'insideLeft', dx: 10, dy: 5, fontSize: 10 }}
            tickFormatter={(tick) => tick.toLocaleString(undefined, {minimumFractionDigits:1, maximumFractionDigits: 1, useGrouping: false})}
            ticks={yTicks.length > 1 ? yTicks : undefined} 
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={{ stroke: 'hsl(var(--muted-foreground))' }}
            tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
            allowDataOverflow={false}
          />
          <Tooltip 
            content={<CustomTooltip timeUnitLabel={xAxisUnitLabel} timeForInstantaneousVoltageMs={params.timeForInstantaneousVoltageMs ? (params.timeForInstantaneousVoltageMs / 1000 * timeDivisorForPlot) : undefined} />} 
            cursor={{ stroke: 'hsl(var(--accent))', strokeWidth: 1, strokeDasharray: '3 3' }} 
          />
          <Line
            type="monotone"
            dataKey="voltage"
            stroke="hsl(var(--primary))"
            strokeWidth={1.5} 
            dot={plotData.length < 100 ? <Dot r={2} strokeWidth={1} /> : false} // Show dots only for fewer points
            activeDot={{ r: 4, strokeWidth: 1, stroke: 'hsl(var(--ring))', fill: 'hsl(var(--primary))' }}
            isAnimationActive={false} // Disable animation for performance with large datasets
          />
           {/* DC Offset Reference Line */}
           {params.dcOffset !== 0 && <ReferenceLine y={params.dcOffset} stroke="hsl(var(--muted-foreground))" strokeDasharray="2 2" strokeWidth={0.75} label={{ value: `DC: ${params.dcOffset}V`, position: 'insideTopRight', fontSize: 9, fill: 'hsl(var(--muted-foreground))', dy: -2, dx: -2 }} />}

           {/* Zero Voltage Reference Line */}
           {yAxisDomain[0] < 0 && yAxisDomain[1] > 0 && params.dcOffset !== 0 && (
             <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" strokeWidth={0.75} />
          )}

           {/* Marker for v(t) calculation point */}
           {tMarkerPosition !== undefined && (
            <ReferenceLine 
                x={tMarkerPosition} 
                stroke="hsl(var(--accent))" 
                strokeWidth={1.5} 
                label={{ value: `t=${formatResultValue(params.timeForInstantaneousVoltageMs! / 1000, 'time').displayValue}${formatResultValue(params.timeForInstantaneousVoltageMs! / 1000, 'time').unit}`, position: 'top', fontSize: 9, fill: 'hsl(var(--accent))', dy: -5 }} 
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
