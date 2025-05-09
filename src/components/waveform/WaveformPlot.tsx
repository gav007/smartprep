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
  Dot, // Import Dot from recharts
} from 'recharts';
import type { DataPoint, WaveformParams } from '@/types/waveform';
import { formatResultValue, unitMultipliers } from '@/lib/units';
import type { TimeUnit }
from '@/lib/units'; // Ensure TimeUnit is imported

interface WaveformPlotProps {
  data: DataPoint[];
  params: WaveformParams;
  Vrms: number | null;
}

const CustomTooltip = ({ active, payload, label, timeUnitLabel, timeForInstantaneousVoltageMs, timeUnitForVInst }: any) => {
  if (active && payload && payload.length) {
    const timeValue = label !== undefined && label !== null ? parseFloat(label) : NaN;
    let displayTime = 'N/A';
    if (!isNaN(timeValue)) {
      const timeInSecondsOnAxis = timeValue / (unitMultipliers[timeUnitLabel as TimeUnit] / unitMultipliers['s']);
      const formattedTime = formatResultValue(timeInSecondsOnAxis, 'time', timeUnitForVInst || 'ms');
      displayTime = `${formattedTime.displayValue} ${formattedTime.unit}`;
    }

    return (
      <div className="bg-background/80 backdrop-blur-sm p-2 border rounded-md shadow-lg text-xs">
        <p className="label">{`Time: ${displayTime}`}</p>
        <p className="intro text-primary">{`Voltage: ${payload[0].value !== undefined && payload[0].value !== null ? parseFloat(payload[0].value).toFixed(3) : 'N/A'} V`}</p>
         {timeForInstantaneousVoltageMs !== undefined &&
          timeForInstantaneousVoltageMs !== null &&
          Math.abs(parseFloat(label) * (unitMultipliers[timeUnitLabel as TimeUnit] / unitMultipliers['ms']) - timeForInstantaneousVoltageMs) < 1e-3 && (
          <p className="font-bold text-accent">Calculated v(t)</p>
        )}
      </div>
    );
  }
  return null;
};

interface CalculatedPointDotProps {
  cx?: number;
  cy?: number;
  stroke?: string;
  payload?: any;
  value?: number;
  timeForInstantaneousVoltageMs?: number;
}

const CalculatedPointDot: React.FC<CalculatedPointDotProps> = (props) => {
  const { cx, cy, payload, timeForInstantaneousVoltageMs } = props;

  if (cx === undefined || cy === undefined || payload === undefined || payload.time === undefined) {
    return null;
  }

  if (timeForInstantaneousVoltageMs === undefined || timeForInstantaneousVoltageMs === null) {
    return null;
  }
  
  const payloadTimeInMs = payload.time * 1000;

  if (Math.abs(payloadTimeInMs - timeForInstantaneousVoltageMs) > 1e-3 ) { 
    return null;
  }
  
  // Corrected JSX return: Use the imported Dot component or a simple circle
  return <Dot cx={cx} cy={cy} r={4} stroke={"hsl(var(--accent))"} fill={"hsl(var(--accent))"} strokeWidth={1} />;
  // If Dot is not working or preferred, use:
  // return <circle cx={cx} cy={cy} r={4} stroke={"hsl(var(--accent))"} fill={"hsl(var(--accent))"} strokeWidth={1} />;
};


export default function WaveformPlot({ data, params, Vrms }: WaveformPlotProps) {
  if (!data || data.length === 0) {
    return <div className="h-80 w-full flex items-center justify-center text-muted-foreground bg-muted/30 rounded-md border border-dashed">No waveform data to display. Adjust parameters or check for errors.</div>;
  }

  const timeWindowMs = params.timeWindowMs;

  let xAxisUnitLabel: TimeUnit = 'ms';
  let timePlotUnitMultiplier = 1000; 

  if (timeWindowMs < 0.01) { 
    xAxisUnitLabel = 'ns';
    timePlotUnitMultiplier = 1e9; 
  } else if (timeWindowMs < 1) { 
    xAxisUnitLabel = 'µs';
    timePlotUnitMultiplier = 1e6; 
  } else if (timeWindowMs >= 1000) { 
    xAxisUnitLabel = 's';
    timePlotUnitMultiplier = 1; 
  }
  
  const plotData = data.map(p => ({ ...p, timePlot: p.time * timePlotUnitMultiplier }));
  const xAxisDomainMax = timeWindowMs * (timePlotUnitMultiplier / 1000); 

  const numXTicks = Math.min(11, Math.max(5, Math.floor(xAxisDomainMax / (xAxisDomainMax < 10 ? 1 : (xAxisDomainMax < 100 ? 10: 100))) + 1));
  const xTickInterval = parseFloat((xAxisDomainMax / (numXTicks > 1 ? numXTicks - 1 : 1)).toPrecision(3));

  const xTicks = Array.from({ length: numXTicks }, (_, i) => {
     const tick = i * xTickInterval;
     if (xAxisUnitLabel === 'ns' || xAxisUnitLabel === 'µs') return parseFloat(tick.toFixed(0));
     if (xAxisUnitLabel === 'ms' && timeWindowMs < 10) return parseFloat(tick.toFixed(2));
     return parseFloat(tick.toFixed(1));
  }).filter((value, index, self) => self.indexOf(value) === index);

  const peakMagnitude = Math.abs(params.amplitude);
  let yMin = params.dcOffset - peakMagnitude;
  let yMax = params.dcOffset + peakMagnitude;

    if (params.amplitude === 0 && params.frequency === 0) {
        yMin = params.dcOffset - 1; 
        yMax = params.dcOffset + 1;
    } else if (params.amplitude === 0) { 
        yMin = params.dcOffset - 1;
        yMax = params.dcOffset + 1;
    } else if (params.frequency === 0) { 
        if (params.type === 'sine') {
            const dcVal = params.amplitude * Math.sin(params.phase * (Math.PI/180)) + params.dcOffset;
            yMin = dcVal - Math.max(1, Math.abs(params.amplitude * 0.1) || 1); 
            yMax = dcVal + Math.max(1, Math.abs(params.amplitude * 0.1) || 1);
        } else if (params.type === 'square') {
            yMin = (params.amplitude + params.dcOffset) - Math.max(1, Math.abs(params.amplitude * 0.1) || 1);
            yMax = (params.amplitude + params.dcOffset) + Math.max(1, Math.abs(params.amplitude * 0.1) || 1);
        } else { 
            yMin = params.dcOffset - Math.max(1, Math.abs(params.dcOffset * 0.1) || 1); 
            yMax = params.dcOffset + Math.max(1, Math.abs(params.dcOffset * 0.1) || 1);
        }
    }

  const range = yMax - yMin;
  const yPadding = range === 0 ? 1 : Math.max(0.5, range * 0.2); 
  const yAxisDomain: [number, number] = [parseFloat((yMin - yPadding).toFixed(2)), parseFloat((yMax + yPadding).toFixed(2))];

  const numYGridLines = Math.min(11, Math.max(5, Math.floor(Math.abs(yAxisDomain[1] - yAxisDomain[0])) +1 ));
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

  let tMarkerPositionOnPlot: number | undefined = undefined;
  if (params.timeForInstantaneousVoltageMs !== undefined && params.timeForInstantaneousVoltageMs !== null) {
     tMarkerPositionOnPlot = params.timeForInstantaneousVoltageMs * (timePlotUnitMultiplier / 1000);
  }

  return (
    <div className="h-80 w-full md:h-96 bg-card p-2 rounded-lg shadow-inner border">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={plotData} margin={{ top: 10, right: 30, left: 0, bottom: 25 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))"} />
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
            content={<CustomTooltip timeUnitLabel={xAxisUnitLabel} timeForInstantaneousVoltageMs={params.timeForInstantaneousVoltageMs} timeUnitForVInst={params.timeForInstantaneousVoltageUnit} />}
            cursor={{ stroke: 'hsl(var(--accent))', strokeWidth: 1, strokeDasharray: '3 3' }}
          />
          <Line
            type="monotone"
            dataKey="voltage"
            stroke="hsl(var(--primary))"}
            strokeWidth={1.5}
            dot={<CalculatedPointDot timeForInstantaneousVoltageMs={params.timeForInstantaneousVoltageMs} />}
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
                stroke="hsl(var(--accent))"}
                strokeWidth={1.5}
                label={{ value: `t=${formatResultValue(params.timeForInstantaneousVoltageMs! / 1000, 'time', params.timeForInstantaneousVoltageUnit).displayValue}${formatResultValue(params.timeForInstantaneousVoltageMs! / 1000, 'time', params.timeForInstantaneousVoltageUnit).unit}`, position: 'top', fontSize: 9, fill: 'hsl(var(--accent))', dy: -5 }}
            />
          )}
           {Vrms !== null && params.amplitude !==0 && params.frequency !== 0 && (Vrms + params.dcOffset) <= yAxisDomain[1] && (Vrms + params.dcOffset) >= yAxisDomain[0] && (
              <ReferenceLine y={Vrms + params.dcOffset} stroke="hsl(var(--destructive))" strokeDasharray="3 3" strokeWidth={0.75} label={{ value: `Vrms(+)`, position: 'insideBottomRight', fontSize: 9, fill: 'hsl(var(--destructive))' }} />
           )}
           {Vrms !== null && params.amplitude !==0 && params.frequency !== 0 && params.type !== 'square' && (-Vrms + params.dcOffset) >= yAxisDomain[0] && (-Vrms + params.dcOffset) <= yAxisDomain[1] && ( 
              <ReferenceLine y={-Vrms + params.dcOffset} stroke="hsl(var(--destructive))" strokeDasharray="3 3" strokeWidth={0.75} label={{ value: `Vrms(-)`, position: 'insideTopRight', fontSize: 9, fill: 'hsl(var(--destructive))' }} />
           )}
            {params.amplitude !== 0 && (params.amplitude + params.dcOffset) <= yAxisDomain[1] && <ReferenceLine y={params.amplitude + params.dcOffset} stroke="hsl(var(--chart-2))" strokeDasharray="1 2" strokeWidth={0.5} label={{ value: `Vpk(+)`, position: 'insideTopLeft', fontSize: 8, fill: 'hsl(var(--chart-2))' }} />}
            {params.amplitude !== 0 && (-params.amplitude + params.dcOffset) >= yAxisDomain[0] && <ReferenceLine y={-params.amplitude + params.dcOffset} stroke="hsl(var(--chart-2))" strokeDasharray="1 2" strokeWidth={0.5} label={{ value: `Vpk(-)`, position: 'insideBottomLeft', fontSize: 8, fill: 'hsl(var(--chart-2))' }} />}

        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
