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
  DotProps, // Keep DotProps import for type safety if props are passed through
} from 'recharts';
import type { DataPoint, WaveformParams } from '@/types/waveform';
import { formatResultValue, unitMultipliers } from '@/lib/units';
import type { TimeUnit } from '@/lib/units';

const CustomTooltip = ({ active, payload, label, timeUnitLabel, timeForInstantaneousVoltageMs, timeUnitForVInst }: any) => {
  if (active && payload && payload.length) {
    const timeValue = label !== undefined && label !== null ? parseFloat(label) : NaN;
    let displayTime = 'N/A';
    if (!isNaN(timeValue)) {
      // Convert the X-axis 'label' (which is in plot units) back to seconds for consistent formatting by formatResultValue
      const timeInSecondsOnAxis = timeValue / (unitMultipliers[timeUnitLabel as TimeUnit || 'ms'] / unitMultipliers.s); // Convert plot unit to seconds
      const formattedTime = formatResultValue(timeInSecondsOnAxis, 'time', timeUnitForVInst || 'ms');
      displayTime = `${formattedTime.displayValue} ${formattedTime.unit}`;
    }

    return (
      <div className="bg-background/80 backdrop-blur-sm p-2 border rounded-md shadow-lg text-xs">
        <p className="label">{`Time: ${displayTime}`}</p>
        <p className="intro text-primary">{`Voltage: ${payload[0].value !== undefined && payload[0].value !== null ? parseFloat(payload[0].value).toFixed(3) : 'N/A'} V`}</p>
         {/* Highlight if this is the calculated v(t) point */}
         {timeForInstantaneousVoltageMs !== undefined &&
          timeForInstantaneousVoltageMs !== null &&
          // Compare payload.time (in seconds) with timeForInstantaneousVoltageMs (in ms)
          Math.abs(parseFloat(label) / (unitMultipliers[timeUnitLabel as TimeUnit || 'ms'] / unitMultipliers.ms) - timeForInstantaneousVoltageMs) < 1e-3 && (
          <p className="font-bold text-accent">Calculated v(t)</p>
        )}
      </div>
    );
  }
  return null;
};

interface CalculatedPointDotProps extends DotProps {
  timeForInstantaneousVoltageMs?: number;
  timeUnitLabel?: TimeUnit; // The unit of the X-axis 'timePlot' values
  // payload is already part of DotProps and contains { time: number (in seconds), voltage: number }
}

const CalculatedPointDot: React.FC<CalculatedPointDotProps> = (props) => {
  const { cx, cy, payload, timeForInstantaneousVoltageMs, timeUnitLabel } = props;

  if (cx === undefined || cy === undefined || !payload || payload.time === undefined || payload.time === null) {
      return null;
  }

  if (timeForInstantaneousVoltageMs === undefined || timeForInstantaneousVoltageMs === null) {
      return null;
  }

  // payload.time is in seconds (original data unit)
  // timeForInstantaneousVoltageMs is in milliseconds
  const payloadTimeInMs = payload.time * 1000;


  // Compare times in milliseconds
  if (Math.abs(payloadTimeInMs - timeForInstantaneousVoltageMs) > 1e-3 ) { // Using a small tolerance for float comparison
      return null;
  }

  // If it's the calculated point, render a distinct dot
  return (<circle cx={cx} cy={cy} r={4} stroke={"hsl(var(--accent))"} fill={"hsl(var(--accent))"} strokeWidth={1} />);
}; // Ensured semicolon here

interface WaveformPlotProps {
  data: DataPoint[];
  params: WaveformParams;
  Vrms: number | null;
}
export default function WaveformPlot({ data, params, Vrms }: WaveformPlotProps) {
  const timeWindowMs = params.timeWindowMs;

  let xAxisUnitLabel: TimeUnit = 'ms'; // Default to ms
  let timePlotUnitMultiplier = 1000; // Converts seconds (base) to ms

  // Determine the best unit for the X-axis based on the time window
  if (timeWindowMs < 0.001) { // Less than 1 microsecond
    xAxisUnitLabel = 'ns';
    timePlotUnitMultiplier = 1e9; // seconds to nanoseconds
  } else if (timeWindowMs < 1) { // Less than 1 millisecond
    xAxisUnitLabel = 'µs';
    timePlotUnitMultiplier = 1e6; // seconds to microseconds
  } else if (timeWindowMs >= 1000) { // 1 second or more
    xAxisUnitLabel = 's';
    timePlotUnitMultiplier = 1; // seconds to seconds
  }
  // Default is ms (1000)

  const plotData = data.map(p => ({ ...p, timePlot: p.time * timePlotUnitMultiplier }));

  // Calculate X-axis domain max based on the chosen unit for plotting
  const xAxisDomainMax = timeWindowMs * (timePlotUnitMultiplier / 1000); // timeWindowMs is in ms, convert to plotting unit

  // X-axis ticks - dynamic based on range
  // Aim for a reasonable number of ticks (e.g., 5-11)
  const numXTicks = Math.min(11, Math.max(5, Math.floor(xAxisDomainMax / (xAxisDomainMax < 10 ? 1 : (xAxisDomainMax < 100 ? 10: 100))) + 1));
  const xTickInterval = parseFloat((xAxisDomainMax / (numXTicks > 1 ? numXTicks - 1 : 1)).toPrecision(3)); // Avoid too many decimal places on ticks

  const xTicks = [];
  for (let i = 0; i < numXTicks; i++) {
    const tick = i * xTickInterval;
    if (xAxisUnitLabel === 'ns' || xAxisUnitLabel === 'µs') xTicks.push(parseFloat(tick.toFixed(0))); // Integer for ns/us
    else if (xAxisUnitLabel === 'ms' && timeWindowMs < 10) xTicks.push(parseFloat(tick.toFixed(2))); // More precision for small ms windows
    else xTicks.push(parseFloat(tick.toFixed(1))); // Default to 1 decimal for s/ms
  }
  const uniqueXTicks = xTicks.filter((value, index, self) => self.indexOf(value) === index); // Ensure unique ticks


  // Y-axis domain calculation
  const peakMagnitude = Math.abs(params.amplitude);
  let yMin = params.dcOffset - peakMagnitude;
  let yMax = params.dcOffset + peakMagnitude;

    // Handle DC cases for y-axis scaling
    if (params.amplitude === 0 && params.frequency === 0) { // True DC line at offset
        yMin = params.dcOffset - 1; // Add some padding
        yMax = params.dcOffset + 1;
    } else if (params.amplitude === 0) { // Constant line at DC offset (e.g., triangle at A=0)
        yMin = params.dcOffset - 1;
        yMax = params.dcOffset + 1;
    } else if (params.frequency === 0) { // "DC" from AC wave at f=0 (constant value)
        let constValue = params.dcOffset;
        if (params.type === 'sine') {
            constValue = params.amplitude * Math.sin(params.phase * (Math.PI/180)) + params.dcOffset;
        } else if (params.type === 'square') {
            // Square wave at f=0 is constant at one of its peaks
            constValue = params.amplitude + params.dcOffset; // Or -params.amplitude + params.dcOffset
        }
        yMin = constValue - Math.max(1, Math.abs(params.amplitude * 0.1) || 1); // Ensure some visible range
        yMax = constValue + Math.max(1, Math.abs(params.amplitude * 0.1) || 1);
    }


  const range = yMax - yMin;
  const yPadding = range === 0 ? 1 : Math.max(0.5, range * 0.2); // Ensure padding even for flat lines
  const yAxisDomain: [number, number] = [parseFloat((yMin - yPadding).toFixed(2)), parseFloat((yMax + yPadding).toFixed(2))];

  // Y-axis Ticks
  const numYGridLines = Math.min(11, Math.max(5, Math.floor(Math.abs(yAxisDomain[1] - yAxisDomain[0])) +1 ));
  const yStep = (yAxisDomain[1] - yAxisDomain[0]) / (numYGridLines -1 > 0 ? numYGridLines -1 : 1); // Avoid division by zero
  const yTicks = [];
  for (let i = 0; i < numYGridLines; i++) {
    const tickVal = parseFloat((yAxisDomain[0] + i * yStep).toFixed(1));
    if(!yTicks.includes(tickVal)) yTicks.push(tickVal); // Avoid duplicate ticks
  }
  // Ensure 0 is a tick if the range spans it and DC offset is 0 (common reference)
  if (yAxisDomain[0] < 0 && yAxisDomain[1] > 0 && params.dcOffset === 0 && !yTicks.some(tick => Math.abs(tick) < Math.abs(yStep/3))) {
    if(!yTicks.includes(0)) yTicks.push(0);
    yTicks.sort((a,b) => a-b);
  }


  // Marker for instantaneous voltage calculation
  let tMarkerPositionOnPlot: number | undefined = undefined;
  if (params.timeForInstantaneousVoltageMs !== undefined && params.timeForInstantaneousVoltageMs !== null) {
     // Convert timeForInstantaneousVoltageMs (which is in ms) to the current plot's X-axis unit
     tMarkerPositionOnPlot = params.timeForInstantaneousVoltageMs * (timePlotUnitMultiplier / 1000);
  }

  if (!plotData || plotData.length < 2) {
    return (
      <div className="h-80 w-full flex items-center justify-center text-muted-foreground bg-muted/30 rounded-md border border-dashed">
        Not enough data points to render waveform. Adjust parameters.
      </div>
    );
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
            tickFormatter={(tick) => tick.toLocaleString(undefined, {maximumSignificantDigits: 3, useGrouping: false})} // Ensure numbers are formatted nicely
            ticks={uniqueXTicks.length > 1 ? uniqueXTicks : undefined} // Provide explicit ticks if calculated
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
            allowDataOverflow={false} // Prevent plot exceeding defined domain
          />
          <Tooltip
            content={<CustomTooltip
                        timeUnitLabel={xAxisUnitLabel}
                        timeForInstantaneousVoltageMs={params.timeForInstantaneousVoltageMs}
                        timeUnitForVInst={params.timeForInstantaneousVoltageUnit}
                    />}
            cursor={{ stroke: 'hsl(var(--accent))', strokeWidth: 1, strokeDasharray: '3 3' }}
          />
          <Line
            type="monotone" // Or "linear" for more direct point-to-point
            dataKey="voltage"
            stroke={"hsl(var(--primary))"}
            strokeWidth={1.5}
            dot={(props: DotProps) => <CalculatedPointDot {...props} timeForInstantaneousVoltageMs={params.timeForInstantaneousVoltageMs} timeUnitLabel={xAxisUnitLabel} />}
            activeDot={{ r: 4, strokeWidth: 1, stroke: 'hsl(var(--ring))', fill: 'hsl(var(--primary))' }}
            isAnimationActive={false} // Disable animation for performance with many points
          />
           {/* DC Offset Line */}
           {params.dcOffset !== 0 && <ReferenceLine y={params.dcOffset} stroke="hsl(var(--muted-foreground))" strokeDasharray="2 2" strokeWidth={0.75} label={{ value: `DC: ${params.dcOffset.toFixed(1)}V`, position: 'insideTopRight', fontSize: 9, fill: 'hsl(var(--muted-foreground))', dy: -2, dx: -2 }} />}

           {/* Zero Volt Line if not DC offset and range spans zero */}
           {yAxisDomain[0] < 0 && yAxisDomain[1] > 0 && params.dcOffset === 0 && ( // Only show if DC offset is zero itself
             <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" strokeWidth={0.75} />
          )}

           {/* Marker for v(t) calculation */}
           {tMarkerPositionOnPlot !== undefined && isFinite(tMarkerPositionOnPlot) && tMarkerPositionOnPlot >=0 && tMarkerPositionOnPlot <= xAxisDomainMax && (
            <ReferenceLine
                x={tMarkerPositionOnPlot}
                stroke={"hsl(var(--accent))"}
                strokeWidth={1.5}
                label={{
                    value: `t=${formatResultValue(params.timeForInstantaneousVoltageMs! / 1000, 'time', params.timeForInstantaneousVoltageUnit).displayValue}${formatResultValue(params.timeForInstantaneousVoltageMs! / 1000, 'time', params.timeForInstantaneousVoltageUnit).unit}`,
                    position: 'top',
                    fontSize: 9,
                    fill: 'hsl(var(--accent))',
                    dy: -5
                }}
            />
          )}

           {/* Vrms Lines - Ensure they are within Y-axis domain to be visible */}
           {Vrms !== null && params.amplitude !==0 && params.frequency !== 0 && (Vrms + params.dcOffset) <= yAxisDomain[1] && (Vrms + params.dcOffset) >= yAxisDomain[0] && (
              <ReferenceLine y={Vrms + params.dcOffset} stroke="hsl(var(--destructive))" strokeDasharray="3 3" strokeWidth={0.75} label={{ value: `Vrms(+)`, position: 'insideBottomRight', fontSize: 9, fill: 'hsl(var(--destructive))' }} />
           )}
           {Vrms !== null && params.amplitude !==0 && params.frequency !== 0 && params.type !== 'square' && (-Vrms + params.dcOffset) >= yAxisDomain[0] && (-Vrms + params.dcOffset) <= yAxisDomain[1] && ( 
              <ReferenceLine y={-Vrms + params.dcOffset} stroke="hsl(var(--destructive))" strokeDasharray="3 3" strokeWidth={0.75} label={{ value: `Vrms(-)`, position: 'insideTopRight', fontSize: 9, fill: 'hsl(var(--destructive))' }} />
           )}

            {/* Vpeak Lines - Ensure they are within Y-axis domain */}
            {params.amplitude !== 0 && (params.amplitude + params.dcOffset) <= yAxisDomain[1] && <ReferenceLine y={params.amplitude + params.dcOffset} stroke="hsl(var(--chart-2))" strokeDasharray="1 2" strokeWidth={0.5} label={{ value: `Vpk(+)`, position: 'insideTopLeft', fontSize: 8, fill: 'hsl(var(--chart-2))' }} />}
            {params.amplitude !== 0 && (-params.amplitude + params.dcOffset) >= yAxisDomain[0] && <ReferenceLine y={-params.amplitude + params.dcOffset} stroke="hsl(var(--chart-2))" strokeDasharray="1 2" strokeWidth={0.5} label={{ value: `Vpk(-)`, position: 'insideBottomLeft', fontSize: 8, fill: 'hsl(var(--chart-2))' }} />}

        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
