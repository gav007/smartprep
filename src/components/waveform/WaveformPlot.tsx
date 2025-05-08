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
      // Format time based on timeUnitLabel for consistency
      const timeInSeconds = timeValue / (timeUnitLabel === 'ms' ? 1000 : timeUnitLabel === 'µs' ? 1e6 : timeUnitLabel === 'ns' ? 1e9 : 1);
      const formattedTime = formatResultValue(timeInSeconds, 'time');
      displayTime = `${formattedTime.displayValue} ${formattedTime.unit}`;
    }

    return (
      <div className="bg-background/80 backdrop-blur-sm p-2 border rounded-md shadow-lg text-xs">
        <p className="label">{`Time: ${displayTime}`}</p>
        <p className="intro text-primary">{`Voltage: ${payload[0].value !== undefined && payload[0].value !== null ? parseFloat(payload[0].value).toFixed(3) : 'N/A'} V`}</p>
         {timeForInstantaneousVoltageMs !== undefined && Math.abs(timeValue - timeForInstantaneousVoltageMs) < 0.000001 * (timeUnitLabel === 'ms' ? 1 : (timeUnitLabel === 'µs' ? 1000 : 1000000) ) && ( // Check against actual ms value
          <p className="font-bold text-accent">Calculated v(t)</p>
        )}
      </div>
    );
  }
  return null;
};

// Custom Dot for marking instantaneous voltage point
const CalculatedPointDot = (props: any) => {
  const { cx, cy, stroke, payload, value, timeForInstantaneousVoltageMs, timeDivisorForPlot } = props;

  // timeForInstantaneousVoltageMs is in ms. payload.time is in seconds from data.
  // Convert payload.time to the same unit as tMarkerPosition for comparison.
  const plotTimeForPayload = payload.time * timeDivisorForPlot;
  const tMarkerPosition = timeForInstantaneousVoltageMs !== undefined ? (timeForInstantaneousVoltageMs / 1000) * timeDivisorForPlot : undefined;

  if (tMarkerPosition === undefined || Math.abs(plotTimeForPayload - tMarkerPosition) > 1e-6 ) { // Use a small epsilon for float comparison
    return null;
  }
  return <Dot cx={cx} cy={cy} r={4} stroke={"hsl(var(--accent))"} fill="hsl(var(--accent))" strokeWidth={1} />;
};


export default function WaveformPlot({ data, params }: WaveformPlotProps) {
  if (!data || data.length === 0) {
    return <div className="h-80 w-full flex items-center justify-center text-muted-foreground bg-muted/30 rounded-md border border-dashed">No waveform data to display. Adjust parameters or check for errors.</div>;
  }

  const timeWindowMs = params.timeWindowMs;
  
  let xAxisUnitLabel = 'ms';
  let timeDivisorForPlot = 1; // Default: plot time in ms (data.time is in seconds)

  if (timeWindowMs < 0.01) { // e.g., 5µs window -> 0.005ms
    xAxisUnitLabel = 'ns';
    timeDivisorForPlot = 1e6; // data.time (s) * 1e9 (to ns) / 1000 (ns to µs for plot) -> simplified to 1e6 from s for ns display
  } else if (timeWindowMs < 1) { // e.g., 0.5ms window
    xAxisUnitLabel = 'µs';
    timeDivisorForPlot = 1000; // data.time (s) * 1e6 (to µs) / 1000 (ms to µs for plot) -> simplified to 1000 from s for µs display
  } else if (timeWindowMs >= 1000) { // e.g., 1s window
    xAxisUnitLabel = 's';
    timeDivisorForPlot = 1/1000; // data.time (s) / 1000 (ms to s for plot)
  }
  
  const plotData = data.map(p => ({ ...p, timePlot: p.time * 1000 * timeDivisorForPlot })); // timePlot is now in the target unit (ns, µs, ms, s)
  const xAxisDomainMax = timeWindowMs * timeDivisorForPlot;

  const numXTicks = Math.min(11, Math.max(5, Math.floor(xAxisDomainMax / (xAxisDomainMax < 10 ? 1 : (xAxisDomainMax < 100 ? 10: 100))) + 1));
  const xTickInterval = parseFloat((xAxisDomainMax / (numXTicks > 1 ? numXTicks - 1 : 1)).toPrecision(3));
  
  const xTicks = Array.from({ length: numXTicks }, (_, i) => {
     const tick = i * xTickInterval;
     if (xAxisUnitLabel === 'ns' || xAxisUnitLabel === 'µs') return parseFloat(tick.toFixed(0));
     if (xAxisUnitLabel === 'ms' && timeWindowMs < 10) return parseFloat(tick.toFixed(2));
     return parseFloat(tick.toFixed(1));
  }).filter((value, index, self) => self.indexOf(value) === index); // Ensure unique ticks

  const peakMagnitude = Math.abs(params.amplitude);
  let yMin = params.dcOffset - peakMagnitude;
  let yMax = params.dcOffset + peakMagnitude;
  
  if (yMax === yMin) { 
    yMin -= Math.max(1, Math.abs(yMin * 0.1)); // Add padding relative to value or 1
    yMax += Math.max(1, Math.abs(yMax * 0.1));
  }
  if (yMax === 0 && yMin === 0) { // handles A=0, DC=0 case
      yMin = -1; yMax = 1;
  }
  
  const range = yMax - yMin;
  const yPadding = range === 0 ? 1 : Math.max(0.5, range * 0.2);
  const yAxisDomain: [number, number] = [parseFloat((yMin - yPadding).toFixed(2)), parseFloat((yMax + yPadding).toFixed(2))];

  const numYGridLines = Math.min(11, Math.max(5, Math.floor(Math.abs(yAxisDomain[1] - yAxisDomain[0])) +1 ));
  const yStep = (yAxisDomain[1] - yAxisDomain[0]) / (numYGridLines -1 > 0 ? numYGridLines -1 : 1);
  const yTicks = [];
  for (let i = 0; i < numYGridLines; i++) {
    const tickVal = parseFloat((yAxisDomain[0] + i * yStep).toFixed(1)); // One decimal for Y axis
    if(!yTicks.includes(tickVal)) yTicks.push(tickVal); 
  }
  if (yAxisDomain[0] < 0 && yAxisDomain[1] > 0 && !yTicks.some(tick => Math.abs(tick) < Math.abs(yStep/3))) {
    if(!yTicks.includes(0)) yTicks.push(0);
    yTicks.sort((a,b) => a-b);
  }
  
  let tMarkerPositionOnPlot: number | undefined = undefined;
  if (params.timeForInstantaneousVoltageMs !== undefined) {
     // Convert the timeForInstantaneousVoltageMs (which is in ms) to the current plot's X-axis unit
     tMarkerPositionOnPlot = params.timeForInstantaneousVoltageMs * timeDivisorForPlot;
  }
  
  // Vrms calculation for reference line
  let vrmsValue: number | undefined = undefined;
  if (params.amplitude > 0) {
    switch (params.type) {
        case 'sine': vrmsValue = params.amplitude / Math.sqrt(2); break;
        case 'square': vrmsValue = params.amplitude; break;
        case 'triangle': vrmsValue = params.amplitude / Math.sqrt(3); break;
        case 'sawtooth': vrmsValue = params.amplitude / Math.sqrt(3); break;
    }
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
            ticks={xTicks.length > 1 ? xTicks : undefined}
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
            content={<CustomTooltip timeUnitLabel={xAxisUnitLabel} timeForInstantaneousVoltageMs={tMarkerPositionOnPlot} />} 
            cursor={{ stroke: 'hsl(var(--accent))', strokeWidth: 1, strokeDasharray: '3 3' }} 
          />
          <Line
            type="monotone"
            dataKey="voltage"
            stroke="hsl(var(--primary))"
            strokeWidth={1.5} 
            dot={<CalculatedPointDot timeForInstantaneousVoltageMs={params.timeForInstantaneousVoltageMs} timeDivisorForPlot={1000 * timeDivisorForPlot} />}
            activeDot={{ r: 4, strokeWidth: 1, stroke: 'hsl(var(--ring))', fill: 'hsl(var(--primary))' }}
            isAnimationActive={false}
          />
           {params.dcOffset !== 0 && <ReferenceLine y={params.dcOffset} stroke="hsl(var(--muted-foreground))" strokeDasharray="2 2" strokeWidth={0.75} label={{ value: `DC: ${params.dcOffset.toFixed(1)}V`, position: 'insideTopRight', fontSize: 9, fill: 'hsl(var(--muted-foreground))', dy: -2, dx: -2 }} />}
           {yAxisDomain[0] < 0 && yAxisDomain[1] > 0 && params.dcOffset !== 0 && (
             <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" strokeWidth={0.75} />
          )}
           {tMarkerPositionOnPlot !== undefined && isFinite(tMarkerPositionOnPlot) && tMarkerPositionOnPlot >=0 && tMarkerPositionOnPlot <= xAxisDomainMax && (
            <ReferenceLine 
                x={tMarkerPositionOnPlot} 
                stroke="hsl(var(--accent))" 
                strokeWidth={1.5} 
                label={{ value: `t=${formatResultValue(params.timeForInstantaneousVoltageMs! / 1000, 'time', 'ms').displayValue}${formatResultValue(params.timeForInstantaneousVoltageMs! / 1000, 'time', 'ms').unit}`, position: 'top', fontSize: 9, fill: 'hsl(var(--accent))', dy: -5 }} 
            />
          )}
           {/* Vrms Marker */}
           {vrmsValue !== undefined && params.amplitude !==0 && (
              <ReferenceLine y={vrmsValue + params.dcOffset} stroke="hsl(var(--destructive))" strokeDasharray="3 3" strokeWidth={0.75} label={{ value: `Vrms(+)`, position: 'insideBottomRight', fontSize: 9, fill: 'hsl(var(--destructive))' }} />
           )}
           {vrmsValue !== undefined && params.amplitude !==0 && params.type !== 'square' && ( // Square wave RMS is only positive for ideal case
              <ReferenceLine y={-vrmsValue + params.dcOffset} stroke="hsl(var(--destructive))" strokeDasharray="3 3" strokeWidth={0.75} label={{ value: `Vrms(-)`, position: 'insideTopRight', fontSize: 9, fill: 'hsl(var(--destructive))' }} />
           )}
           {/* Peak Markers */}
            {params.amplitude !== 0 && <ReferenceLine y={params.amplitude + params.dcOffset} stroke="hsl(var(--chart-2))" strokeDasharray="1 2" strokeWidth={0.5} label={{ value: `Vpk(+)`, position: 'insideTopLeft', fontSize: 8, fill: 'hsl(var(--chart-2))' }} />}
            {params.amplitude !== 0 && <ReferenceLine y={-params.amplitude + params.dcOffset} stroke="hsl(var(--chart-2))" strokeDasharray="1 2" strokeWidth={0.5} label={{ value: `Vpk(-)`, position: 'insideBottomLeft', fontSize: 8, fill: 'hsl(var(--chart-2))' }} />}


        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
