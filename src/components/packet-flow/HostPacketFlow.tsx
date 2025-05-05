'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Play, Pause, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, RotateCcw, Info } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import OSILayerCard from './OSILayerCard';
import FlowPath from './FlowPath';
import { osiLayers, generateSimulationSteps } from '@/lib/osi-model';
import type { SimulationStep } from '@/types/packet';
import { cn } from '@/lib/utils';

const HostPacketFlow: React.FC = () => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [initialData, setInitialData] = useState("Hello, world!");
  const [protocol, setProtocol] = useState<'TCP' | 'UDP'>('TCP');
  const [simulationSteps, setSimulationSteps] = useState<SimulationStep[]>([]);
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);

  // Regenerate steps when data or protocol changes
  useEffect(() => {
    setSimulationSteps(generateSimulationSteps(initialData, protocol));
    setCurrentStepIndex(0); // Reset step index on regeneration
    setIsPlaying(false); // Stop playing on regeneration
    if (intervalRef.current) clearInterval(intervalRef.current); // Clear interval
  }, [initialData, protocol]);

  const currentStep = simulationSteps[currentStepIndex];

  const nextStep = useCallback(() => {
    setCurrentStepIndex((prev) => Math.min(prev + 1, simulationSteps.length - 1));
  }, [simulationSteps.length]);

  const prevStep = () => {
    setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
  };

  const goToFirstStep = () => setCurrentStepIndex(0);
  const goToLastStep = () => setCurrentStepIndex(simulationSteps.length - 1);
  const restart = () => {
      setCurrentStepIndex(0);
      setIsPlaying(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
      // Optionally regenerate steps if needed, or just reset index
      // setSimulationSteps(generateSimulationSteps(initialData, protocol));
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setIsPlaying(false);
    } else {
      if (currentStepIndex === simulationSteps.length - 1) {
         setCurrentStepIndex(0); // Restart if at the end
      }
      setIsPlaying(true);
      intervalRef.current = setInterval(() => {
        setCurrentStepIndex((prev) => {
          const nextIndex = prev + 1;
          if (nextIndex >= simulationSteps.length) {
            clearInterval(intervalRef.current!);
            setIsPlaying(false);
            return prev; // Stay at the last step
          }
          return nextIndex;
        });
      }, 1500); // Adjust speed as needed
    }
  };

  // Cleanup interval on component unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Ensure playback stops if manually navigating
   useEffect(() => {
     if (isPlaying && intervalRef.current) {
         // If user manually navigated while playing, stop playback
         // This effect runs AFTER state updates, so check if the source of change was the interval
         // This simple implementation stops play on any manual nav.
         // A more complex solution could check the event source.
         // For simplicity, let manual navigation stop playback.
         // Consider if nextStep triggered by interval should continue if user clicks next manually.
     }
   }, [currentStepIndex]); // Re-evaluate if playback should continue

   const getPayloadPreview = (packetState: SimulationStep['packetState'], layerIndex: number): string | undefined => {
       // Traverse down the payload structure based on the current layer
       let currentPayload: any = packetState;
       for (let i = 0; i <= layerIndex; i++) {
          const layerName = osiLayers[i].toLowerCase().replace(' ', ''); // e.g., "datalink"
          if (currentPayload && currentPayload[layerName as keyof typeof currentPayload]) {
              // Check if this layer has its own distinct payload field
              if ('payload' in currentPayload[layerName as keyof typeof currentPayload]!) {
                  currentPayload = currentPayload[layerName as keyof typeof currentPayload]!.payload;
              } else if (layerName === 'application' && currentPayload.application) {
                 return currentPayload.application.payload; // Base case
              } else {
                  // If no specific payload field, it means the content IS the payload for the layer above
                  // This logic needs refinement based on how `packetState` is structured.
                  // For now, let's assume the direct child is the next relevant data.
                  if (i < osiLayers.length - 1) {
                     const nextLayerName = osiLayers[i+1].toLowerCase().replace(' ', '');
                     currentPayload = currentPayload[nextLayerName as keyof typeof currentPayload];
                  }
              }
          } else {
              // Layer data not yet present
              return undefined;
          }
       }
       // After loop, currentPayload should hold the relevant data for this layer's context
       if (typeof currentPayload === 'string') return currentPayload;
       if (typeof currentPayload === 'object' && currentPayload !== null) {
          // Show a snippet or type indicator
          if ('payload' in currentPayload) return `Payload: ${String(currentPayload.payload).substring(0, 20)}...`;
          if ('bits' in currentPayload) return `Bits: ${String(currentPayload.bits).substring(0, 20)}...`;
          return JSON.stringify(currentPayload).substring(0, 20) + '...';
       }
       return undefined;
   };

    const getHeaderInfoForLayer = (packetState: SimulationStep['packetState'], layerName: string): Record<string, any> | undefined => {
         const key = layerName.toLowerCase().replace(' ', ''); // e.g., "datalink"
         const data = packetState[key as keyof typeof packetState];
         if (data && typeof data === 'object' && 'payload' in data) {
              // Exclude the payload itself from the displayed headers
              const { payload, ...headers } = data as any;
              return headers;
         }
         return data as Record<string, any> | undefined;
    };

  // --- Device Components ---
  const Device = ({ name, children }: { name: string; children: React.ReactNode }) => (
    <div className="flex flex-col items-center p-4 border border-dashed rounded-lg bg-card min-h-[400px] w-full md:w-64">
      <h3 className="text-lg font-semibold mb-4">{name}</h3>
      <div className="space-y-2 w-full">{children}</div>
    </div>
  );


  return (
    <div className="space-y-6">
       {/* Configuration Options */}
       <div className="flex flex-wrap gap-4 items-end p-4 border rounded-lg bg-muted/50">
           <div className="space-y-1">
              <Label htmlFor="initialData">Initial Data</Label>
              <Input
                id="initialData"
                value={initialData}
                onChange={(e) => setInitialData(e.target.value)}
                placeholder="Enter data to send"
                className="w-48"
              />
           </div>
           <div className="space-y-1">
                <Label htmlFor="protocol">Protocol</Label>
                 <Select value={protocol} onValueChange={(v) => setProtocol(v as 'TCP' | 'UDP')}>
                    <SelectTrigger id="protocol" className="w-32">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="TCP">TCP</SelectItem>
                        <SelectItem value="UDP">UDP</SelectItem>
                    </SelectContent>
                </Select>
           </div>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-muted-foreground">
                            <Info size={18}/>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                    <p>Change data/protocol to restart simulation.</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
       </div>

      {/* Simulation Area */}
      <div className="flex flex-col md:flex-row items-start justify-between gap-4 md:gap-8">
        {/* Host A */}
        <Device name="Host A">
          {osiLayers.map((layer, index) => (
            <OSILayerCard
              key={`A-${layer}`}
              layerName={layer}
              protocol={currentStep?.location === 'Host A' ? currentStep.packetState[layer.toLowerCase().replace(' ', '') as keyof SimulationStep['packetState']]?.protocol : undefined}
              headerInfo={currentStep?.location === 'Host A' ? getHeaderInfoForLayer(currentStep.packetState, layer) : undefined}
              payloadPreview={currentStep?.location === 'Host A' ? getPayloadPreview(currentStep.packetState, index) : undefined}
              isActive={currentStep?.location === 'Host A' && currentStep.activeLayerName === layer}
              direction={currentStep?.location === 'Host A' ? currentStep.direction : null}
            />
          ))}
        </Device>

        {/* Path A to R */}
         <div className="flex-1 flex items-center justify-center min-h-[50px] w-full md:w-auto md:min-h-0 md:min-w-[100px]">
            <FlowPath direction="AtoR" isActive={currentStep?.location === 'Network Cable' && currentStep.description.includes('to the router')} />
         </div>


        {/* Router */}
        <Device name="Router">
          {['Network', 'Data Link', 'Physical'].map((layer) => ( // Router operates up to Layer 3
            <OSILayerCard
              key={`R-${layer}`}
              layerName={layer}
               protocol={currentStep?.location === 'Router' ? currentStep.packetState[layer.toLowerCase().replace(' ', '') as keyof SimulationStep['packetState']]?.protocol : undefined}
              headerInfo={currentStep?.location === 'Router' ? getHeaderInfoForLayer(currentStep.packetState, layer) : undefined}
              payloadPreview={currentStep?.location === 'Router' ? getPayloadPreview(currentStep.packetState, osiLayers.indexOf(layer)) : undefined}
              isActive={currentStep?.location === 'Router' && currentStep.activeLayerName === layer}
              direction={currentStep?.location === 'Router' ? currentStep.direction : null}
            />
          ))}
           {/* Placeholders for other layers */}
          {osiLayers.filter(l => !['Network', 'Data Link', 'Physical'].includes(l)).map(layer => (
              <div key={`R-placeholder-${layer}`} className="h-[78px] rounded-md border border-dashed border-muted-foreground/20 bg-muted/30 flex items-center justify-center text-xs text-muted-foreground italic">{layer} (Not used)</div>
          ))}
        </Device>

         {/* Path R to B */}
         <div className="flex-1 flex items-center justify-center min-h-[50px] w-full md:w-auto md:min-h-0 md:min-w-[100px]">
           <FlowPath direction="RtoB" isActive={currentStep?.location === 'Network Cable' && currentStep.description.includes('to Host B')} />
        </div>

        {/* Host B */}
        <Device name="Host B">
           {osiLayers.map((layer, index) => (
            <OSILayerCard
              key={`B-${layer}`}
              layerName={layer}
              protocol={currentStep?.location === 'Host B' ? currentStep.packetState[layer.toLowerCase().replace(' ', '') as keyof SimulationStep['packetState']]?.protocol : undefined}
              headerInfo={currentStep?.location === 'Host B' ? getHeaderInfoForLayer(currentStep.packetState, layer) : undefined}
              payloadPreview={currentStep?.location === 'Host B' ? getPayloadPreview(currentStep.packetState, index) : undefined}
              isActive={currentStep?.location === 'Host B' && currentStep.activeLayerName === layer}
              direction={currentStep?.location === 'Host B' ? currentStep.direction : null}
            />
          ))}
        </Device>
      </div>

       {/* Description Area */}
      <AnimatePresence mode="wait">
         <motion.div
            key={currentStepIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="mt-6 p-4 border rounded-lg bg-card text-center min-h-[60px]"
          >
            <p className="font-semibold text-sm">Step {currentStep?.step + 1} / {simulationSteps.length}: {currentStep?.location} - {currentStep?.activeLayerName}</p>
            <p className="text-muted-foreground text-xs">{currentStep?.description}</p>
          </motion.div>
        </AnimatePresence>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2 mt-6 flex-wrap">
        <Button variant="outline" size="icon" onClick={goToFirstStep} disabled={currentStepIndex === 0} aria-label="Go to first step">
          <ChevronsLeft />
        </Button>
        <Button variant="outline" size="icon" onClick={prevStep} disabled={currentStepIndex === 0} aria-label="Previous step">
          <ChevronLeft />
        </Button>
        <Button variant="default" size="icon" onClick={togglePlayPause} aria-label={isPlaying ? "Pause" : "Play"}>
          {isPlaying ? <Pause /> : <Play />}
        </Button>
        <Button variant="outline" size="icon" onClick={nextStep} disabled={currentStepIndex === simulationSteps.length - 1} aria-label="Next step">
          <ChevronRight />
        </Button>
        <Button variant="outline" size="icon" onClick={goToLastStep} disabled={currentStepIndex === simulationSteps.length - 1} aria-label="Go to last step">
          <ChevronsRight />
        </Button>
        <Button variant="secondary" size="icon" onClick={restart} aria-label="Restart simulation">
            <RotateCcw />
        </Button>
      </div>
       {/* Progress Bar (Optional) */}
       <div className="w-full bg-muted rounded-full h-1.5 mt-4 dark:bg-muted/50">
            <div
                className="bg-primary h-1.5 rounded-full transition-all duration-300 ease-linear"
                style={{ width: `${((currentStepIndex + 1) / simulationSteps.length) * 100}%` }}
            ></div>
        </div>
    </div>
  );
};

export default HostPacketFlow;
