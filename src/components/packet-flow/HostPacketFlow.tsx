// src/components/packet-flow/HostPacketFlow.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Play, Pause, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, RotateCcw, Info, Settings, Copy } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import OSILayerCard from './OSILayerCard';
import FlowPath from './FlowPath';
import { osiLayers, generateSimulationSteps, generateMAC, generateIP, generatePort } from '@/lib/osi-model'; // Import helpers
import type { SimulationStep } from '@/types/packet';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

// --- Configuration State ---
interface SimulationConfig {
    initialData: string;
    protocol: 'TCP' | 'UDP' | 'ICMP'; // Added ICMP
    hostAMAC: string;
    hostBMAC: string;
    routerMACInternal: string;
    routerMACExternal: string;
    hostAIP: string;
    hostBIP: string;
    routerIPInternal: string;
    routerIPExternal: string;
    hostAPort: number;
    hostBPort: number;
    isValid: boolean; // Track overall config validity
}

// --- Initial/Default Configuration ---
const createDefaultConfig = (): SimulationConfig => ({
    initialData: "Hello",
    protocol: 'TCP',
    hostAMAC: generateMAC(),
    hostBMAC: generateMAC(),
    routerMACInternal: generateMAC(),
    routerMACExternal: generateMAC(),
    hostAIP: generateIP("192.168.1"),
    hostBIP: generateIP("10.10.10"),
    routerIPInternal: "192.168.1.1",
    routerIPExternal: "10.10.10.1",
    hostAPort: generatePort(),
    hostBPort: 80,
    isValid: true, // Assume default is valid
});

const validateConfig = (config: SimulationConfig): { isValid: boolean; errors: Record<string, string> } => {
    const errors: Record<string, string> = {};
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;

    if (!ipRegex.test(config.hostAIP)) errors.hostAIP = "Invalid Host A IP";
    if (!ipRegex.test(config.hostBIP)) errors.hostBIP = "Invalid Host B IP";
    if (!ipRegex.test(config.routerIPInternal)) errors.routerIPInternal = "Invalid Router Internal IP";
    if (!ipRegex.test(config.routerIPExternal)) errors.routerIPExternal = "Invalid Router External IP";

    if (!macRegex.test(config.hostAMAC)) errors.hostAMAC = "Invalid Host A MAC";
    if (!macRegex.test(config.hostBMAC)) errors.hostBMAC = "Invalid Host B MAC";
    if (!macRegex.test(config.routerMACInternal)) errors.routerMACInternal = "Invalid Router Internal MAC";
    if (!macRegex.test(config.routerMACExternal)) errors.routerMACExternal = "Invalid Router External MAC";

    if (isNaN(config.hostAPort) || config.hostAPort < 0 || config.hostAPort > 65535) errors.hostAPort = "Invalid Host A Port";
    if (isNaN(config.hostBPort) || config.hostBPort < 0 || config.hostBPort > 65535) errors.hostBPort = "Invalid Host B Port";

    return { isValid: Object.keys(errors).length === 0, errors };
};


const HostPacketFlow: React.FC = () => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [config, setConfig] = useState<SimulationConfig>(createDefaultConfig());
  const [configErrors, setConfigErrors] = useState<Record<string, string>>({});
  const [simulationSteps, setSimulationSteps] = useState<SimulationStep[]>([]);
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Regenerate steps when config changes and is valid
  useEffect(() => {
    const { isValid, errors } = validateConfig(config);
    setConfigErrors(errors);
    if (isValid) {
        setSimulationSteps(generateSimulationSteps(config)); // Pass entire config
        setCurrentStepIndex(0);
        setIsPlaying(false);
        if (intervalRef.current) clearInterval(intervalRef.current);
    } else {
         // If config becomes invalid, stop simulation and clear steps?
         setSimulationSteps([]); // Clear steps if config is bad
         setIsPlaying(false);
         if (intervalRef.current) clearInterval(intervalRef.current);
    }
  }, [config]); // Depend on the whole config object

  const currentStep = simulationSteps[currentStepIndex];

  // --- Simulation Controls ---
  const nextStep = useCallback(() => {
    setCurrentStepIndex((prev) => Math.min(prev + 1, simulationSteps.length - 1));
  }, [simulationSteps.length]);

  const prevStep = () => setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
  const goToFirstStep = () => setCurrentStepIndex(0);
  const goToLastStep = () => setCurrentStepIndex(simulationSteps.length - 1);
  const restart = () => { setCurrentStepIndex(0); setIsPlaying(false); if (intervalRef.current) clearInterval(intervalRef.current); };

  const togglePlayPause = () => {
    if (!config.isValid) {
        toast({ title: "Invalid Configuration", description: "Cannot start simulation. Please fix configuration errors.", variant: "destructive"});
        return;
    }
    if (isPlaying) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setIsPlaying(false);
    } else {
      if (currentStepIndex === simulationSteps.length - 1) setCurrentStepIndex(0);
      setIsPlaying(true);
      intervalRef.current = setInterval(() => {
        setCurrentStepIndex((prev) => {
          const nextIndex = prev + 1;
          if (nextIndex >= simulationSteps.length) {
            clearInterval(intervalRef.current!);
            setIsPlaying(false);
            return prev;
          }
          return nextIndex;
        });
      }, 1500);
    }
  };

  useEffect(() => { return () => { if (intervalRef.current) clearInterval(intervalRef.current); }; }, []);

  // --- Helper Functions ---
   const copyToClipboard = useCallback((text: string | undefined, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: "Copied", description: `${label} copied.` });
    }).catch(() => {
      toast({ title: "Copy Failed", variant: "destructive" });
    });
  }, [toast]);

   const getPayloadPreview = (packetState: SimulationStep['packetState'] | undefined, layerIndex: number): string | undefined => {
        if (!packetState) return undefined;
        let currentPayload: any = packetState;
        for (let i = 0; i <= layerIndex; i++) {
            const layerName = osiLayers[i].toLowerCase().replace(' ', '');
            const layerData = currentPayload?.[layerName as keyof typeof currentPayload];
            if (layerData && typeof layerData === 'object' && 'payload' in layerData) {
                currentPayload = layerData.payload;
            } else if (layerName === 'application' && currentPayload?.application) {
                 return typeof currentPayload.application.payload === 'string' ? currentPayload.application.payload : JSON.stringify(currentPayload.application.payload);
            } else {
                 // If layer data exists but no 'payload' key, it means THIS is the payload for the layer above
                 // Stop here for preview purposes for layers below Application
                 if (i < layerIndex) return "..."; // Indicate nested structure exists but don't dive deeper for preview
                 break; // Stop traversal if payload structure isn't as expected
            }
        }
        if (typeof currentPayload === 'string') return currentPayload.substring(0, 30) + (currentPayload.length > 30 ? '...' : '');
        if (typeof currentPayload === 'object' && currentPayload !== null) {
            return JSON.stringify(currentPayload).substring(0, 30) + '...';
        }
        return undefined;
    };

    const getHeaderInfoForLayer = (packetState: SimulationStep['packetState'] | undefined, layerName: string): Record<string, any> | undefined => {
         if (!packetState) return undefined;
         const key = layerName.toLowerCase().replace(' ', '');
         const data = packetState[key as keyof typeof packetState];
         if (data && typeof data === 'object') {
             // Exclude 'payload' for cleaner header display
             const { payload, ...headers } = data as any;
             // Convert flags object to string for display
             if ('flags' in headers && typeof headers.flags === 'object') {
                headers.flags = Object.entries(headers.flags).filter(([_, v]) => v).map(([k]) => k.toUpperCase()).join(', ') || 'None';
             }
             return Object.keys(headers).length > 0 ? headers : undefined;
         }
         return undefined;
    };

  // --- Device Components ---
  const Device = ({ name, children }: { name: string; children: React.ReactNode }) => (
    <div className="flex flex-col items-center p-3 md:p-4 border border-dashed rounded-lg bg-card min-h-[400px] w-full md:w-64 lg:w-72">
      <h3 className="text-lg font-semibold mb-4">{name}</h3>
      <ScrollArea className="w-full h-[calc(100%-3rem)]">
         <div className="space-y-2 w-full pr-3">{children}</div>
      </ScrollArea>
    </div>
  );

  // --- Configuration Dialog ---
   const ConfigDialog = () => (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm"><Settings size={16} className="mr-2"/> Configure</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader><DialogTitle>Simulation Configuration</DialogTitle></DialogHeader>
                <ScrollArea className="max-h-[60vh]">
                <div className="grid gap-4 py-4 pr-4">
                     {/* Data & Protocol */}
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="cfg-data" className="text-right">Data</Label>
                        <Input id="cfg-data" value={config.initialData} onChange={(e) => setConfig(c => ({ ...c, initialData: e.target.value }))} className="col-span-3" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="cfg-protocol" className="text-right">Protocol</Label>
                        <Select value={config.protocol} onValueChange={(v) => setConfig(c => ({ ...c, protocol: v as 'TCP' | 'UDP' | 'ICMP' }))}>
                            <SelectTrigger id="cfg-protocol" className="col-span-3"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="TCP">TCP</SelectItem>
                                <SelectItem value="UDP">UDP</SelectItem>
                                <SelectItem value="ICMP">ICMP</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     {/* Host A */}
                    <h4 className="font-semibold mt-4">Host A</h4>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="cfg-a-ip" className="text-right">IP</Label>
                        <Input id="cfg-a-ip" value={config.hostAIP} onChange={(e) => setConfig(c => ({ ...c, hostAIP: e.target.value }))} className={cn("col-span-3", configErrors.hostAIP && "border-destructive")} />
                        {configErrors.hostAIP && <p className="col-span-4 text-right text-xs text-destructive">{configErrors.hostAIP}</p>}
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="cfg-a-mac" className="text-right">MAC</Label>
                        <Input id="cfg-a-mac" value={config.hostAMAC} onChange={(e) => setConfig(c => ({ ...c, hostAMAC: e.target.value }))} className={cn("col-span-3", configErrors.hostAMAC && "border-destructive")} />
                        {configErrors.hostAMAC && <p className="col-span-4 text-right text-xs text-destructive">{configErrors.hostAMAC}</p>}
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="cfg-a-port" className="text-right">Port</Label>
                        <Input id="cfg-a-port" type="number" value={config.hostAPort} onChange={(e) => setConfig(c => ({ ...c, hostAPort: parseInt(e.target.value) || 0 }))} className={cn("col-span-3", configErrors.hostAPort && "border-destructive")} />
                        {configErrors.hostAPort && <p className="col-span-4 text-right text-xs text-destructive">{configErrors.hostAPort}</p>}
                    </div>
                     {/* Router */}
                    <h4 className="font-semibold mt-4">Router</h4>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="cfg-r-ip-int" className="text-right">Internal IP</Label>
                        <Input id="cfg-r-ip-int" value={config.routerIPInternal} onChange={(e) => setConfig(c => ({ ...c, routerIPInternal: e.target.value }))} className={cn("col-span-3", configErrors.routerIPInternal && "border-destructive")} />
                         {configErrors.routerIPInternal && <p className="col-span-4 text-right text-xs text-destructive">{configErrors.routerIPInternal}</p>}
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="cfg-r-mac-int" className="text-right">Internal MAC</Label>
                        <Input id="cfg-r-mac-int" value={config.routerMACInternal} onChange={(e) => setConfig(c => ({ ...c, routerMACInternal: e.target.value }))} className={cn("col-span-3", configErrors.routerMACInternal && "border-destructive")} />
                        {configErrors.routerMACInternal && <p className="col-span-4 text-right text-xs text-destructive">{configErrors.routerMACInternal}</p>}
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="cfg-r-ip-ext" className="text-right">External IP</Label>
                        <Input id="cfg-r-ip-ext" value={config.routerIPExternal} onChange={(e) => setConfig(c => ({ ...c, routerIPExternal: e.target.value }))} className={cn("col-span-3", configErrors.routerIPExternal && "border-destructive")} />
                         {configErrors.routerIPExternal && <p className="col-span-4 text-right text-xs text-destructive">{configErrors.routerIPExternal}</p>}
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="cfg-r-mac-ext" className="text-right">External MAC</Label>
                        <Input id="cfg-r-mac-ext" value={config.routerMACExternal} onChange={(e) => setConfig(c => ({ ...c, routerMACExternal: e.target.value }))} className={cn("col-span-3", configErrors.routerMACExternal && "border-destructive")} />
                         {configErrors.routerMACExternal && <p className="col-span-4 text-right text-xs text-destructive">{configErrors.routerMACExternal}</p>}
                    </div>
                    {/* Host B */}
                     <h4 className="font-semibold mt-4">Host B</h4>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="cfg-b-ip" className="text-right">IP</Label>
                        <Input id="cfg-b-ip" value={config.hostBIP} onChange={(e) => setConfig(c => ({ ...c, hostBIP: e.target.value }))} className={cn("col-span-3", configErrors.hostBIP && "border-destructive")} />
                         {configErrors.hostBIP && <p className="col-span-4 text-right text-xs text-destructive">{configErrors.hostBIP}</p>}
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="cfg-b-mac" className="text-right">MAC</Label>
                        <Input id="cfg-b-mac" value={config.hostBMAC} onChange={(e) => setConfig(c => ({ ...c, hostBMAC: e.target.value }))} className={cn("col-span-3", configErrors.hostBMAC && "border-destructive")} />
                         {configErrors.hostBMAC && <p className="col-span-4 text-right text-xs text-destructive">{configErrors.hostBMAC}</p>}
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="cfg-b-port" className="text-right">Port</Label>
                        <Input id="cfg-b-port" type="number" value={config.hostBPort} onChange={(e) => setConfig(c => ({ ...c, hostBPort: parseInt(e.target.value) || 0 }))} className={cn("col-span-3", configErrors.hostBPort && "border-destructive")} />
                         {configErrors.hostBPort && <p className="col-span-4 text-right text-xs text-destructive">{configErrors.hostBPort}</p>}
                    </div>
                </div>
                 </ScrollArea>
                <DialogFooter>
                    <Button type="button" variant="secondary" onClick={() => setConfig(createDefaultConfig())}>Reset to Defaults</Button>
                     {/* Close button is automatic */}
                </DialogFooter>
            </DialogContent>
        </Dialog>
   );

  return (
    <div className="space-y-6">
       {/* Configuration and Info */}
       <div className="flex flex-wrap gap-4 items-center justify-between p-4 border rounded-lg bg-muted/50">
            <div className="flex gap-2 items-center">
                <ConfigDialog />
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-muted-foreground"><Info size={18}/></Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Simulates packet flow between two hosts via a router.</p></TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
            {Object.keys(configErrors).length > 0 && (
                 <Alert variant="destructive" className="flex-grow md:flex-grow-0 md:max-w-xs">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Invalid Config</AlertTitle>
                    <AlertDescription>Fix errors in configuration before starting.</AlertDescription>
                </Alert>
            )}
       </div>

      {/* Simulation Area */}
      <div className="flex flex-col md:flex-row items-start justify-between gap-4 md:gap-8">
        <Device name="Host A">
          {osiLayers.map((layer, index) => (
            <OSILayerCard
              key={`A-${layer}`}
              layerName={layer}
              protocol={currentStep?.location === 'Host A' ? currentStep.packetState?.[layer.toLowerCase().replace(' ', '') as keyof SimulationStep['packetState']]?.protocol : undefined}
              headerInfo={currentStep?.location === 'Host A' ? getHeaderInfoForLayer(currentStep?.packetState, layer) : undefined}
              payloadPreview={currentStep?.location === 'Host A' ? getPayloadPreview(currentStep?.packetState, index) : undefined}
              isActive={currentStep?.location === 'Host A' && currentStep.activeLayerName === layer}
              direction={currentStep?.location === 'Host A' ? currentStep.direction : null}
               copyToClipboard={copyToClipboard} // Pass copy function
            />
          ))}
        </Device>

        {/* Paths with Conditional Rendering */}
         <div className="flex-1 flex items-center justify-center min-h-[50px] w-full md:w-auto md:min-h-0 md:min-w-[100px]">
            {simulationSteps.length > 0 && ( // Only render path if steps exist
                 <FlowPath direction="AtoR" isActive={currentStep?.location === 'Network Cable' && currentStep.description.includes('to the router')} />
             )}
         </div>

        <Device name="Router">
          {osiLayers.map((layer, index) => {
            const isRouterLayer = ['Network', 'Data Link', 'Physical'].includes(layer);
            return isRouterLayer ? (
                <OSILayerCard
                  key={`R-${layer}`}
                  layerName={layer}
                  protocol={currentStep?.location === 'Router' ? currentStep.packetState?.[layer.toLowerCase().replace(' ', '') as keyof SimulationStep['packetState']]?.protocol : undefined}
                  headerInfo={currentStep?.location === 'Router' ? getHeaderInfoForLayer(currentStep?.packetState, layer) : undefined}
                  payloadPreview={currentStep?.location === 'Router' ? getPayloadPreview(currentStep?.packetState, index) : undefined}
                  isActive={currentStep?.location === 'Router' && currentStep.activeLayerName === layer}
                  direction={currentStep?.location === 'Router' ? currentStep.direction : null}
                   copyToClipboard={copyToClipboard}
                />
              ) : (
                 <div key={`R-placeholder-${layer}`} className="h-[78px] rounded-md border border-dashed border-muted-foreground/20 bg-muted/30 flex items-center justify-center text-xs text-muted-foreground italic">{layer} (Not processed)</div>
              );
          })}
        </Device>

        <div className="flex-1 flex items-center justify-center min-h-[50px] w-full md:w-auto md:min-h-0 md:min-w-[100px]">
           {simulationSteps.length > 0 && (
               <FlowPath direction="RtoB" isActive={currentStep?.location === 'Network Cable' && currentStep.description.includes('to Host B')} />
           )}
        </div>

        <Device name="Host B">
           {osiLayers.map((layer, index) => (
            <OSILayerCard
              key={`B-${layer}`}
              layerName={layer}
              protocol={currentStep?.location === 'Host B' ? currentStep.packetState?.[layer.toLowerCase().replace(' ', '') as keyof SimulationStep['packetState']]?.protocol : undefined}
              headerInfo={currentStep?.location === 'Host B' ? getHeaderInfoForLayer(currentStep?.packetState, layer) : undefined}
              payloadPreview={currentStep?.location === 'Host B' ? getPayloadPreview(currentStep?.packetState, index) : undefined}
              isActive={currentStep?.location === 'Host B' && currentStep.activeLayerName === layer}
              direction={currentStep?.location === 'Host B' ? currentStep.direction : null}
               copyToClipboard={copyToClipboard}
            />
          ))}
        </Device>
      </div>

       {/* Description Area */}
      <AnimatePresence mode="wait">
         <motion.div
            key={currentStepIndex} // Animate when step changes
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="mt-6 p-4 border rounded-lg bg-card text-center min-h-[60px]"
          >
            {simulationSteps.length > 0 && currentStep ? (
                <>
                    <p className="font-semibold text-sm">Step {currentStep.step + 1} / {simulationSteps.length}: {currentStep.location} - {currentStep.activeLayerName}</p>
                    <p className="text-muted-foreground text-xs">{currentStep.description}</p>
                     {/* Next Step Preview */}
                     {currentStepIndex < simulationSteps.length - 1 && (
                         <p className="text-xs text-muted-foreground/70 italic mt-1">
                             Next: {simulationSteps[currentStepIndex + 1].location} - {simulationSteps[currentStepIndex + 1].activeLayerName}
                         </p>
                     )}
                </>
            ) : (
                 <p className="text-muted-foreground italic">{config.isValid ? "Configure simulation or press Play." : "Fix configuration errors to start."}</p>
             )}
          </motion.div>
        </AnimatePresence>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2 mt-6 flex-wrap">
        <Button variant="outline" size="icon" onClick={goToFirstStep} disabled={currentStepIndex === 0 || simulationSteps.length === 0} aria-label="Go to first step"><ChevronsLeft /></Button>
        <Button variant="outline" size="icon" onClick={prevStep} disabled={currentStepIndex === 0 || simulationSteps.length === 0} aria-label="Previous step"><ChevronLeft /></Button>
        <Button variant="default" size="icon" onClick={togglePlayPause} disabled={simulationSteps.length === 0} aria-label={isPlaying ? "Pause" : "Play"}>{isPlaying ? <Pause /> : <Play />}</Button>
        <Button variant="outline" size="icon" onClick={nextStep} disabled={currentStepIndex === simulationSteps.length - 1 || simulationSteps.length === 0} aria-label="Next step"><ChevronRight /></Button>
        <Button variant="outline" size="icon" onClick={goToLastStep} disabled={currentStepIndex === simulationSteps.length - 1 || simulationSteps.length === 0} aria-label="Go to last step"><ChevronsRight /></Button>
        <Button variant="secondary" size="icon" onClick={restart} disabled={simulationSteps.length === 0} aria-label="Restart simulation"><RotateCcw /></Button>
      </div>
       {/* Progress Bar */}
       {simulationSteps.length > 0 && (
           <div className="w-full bg-muted rounded-full h-1.5 mt-4 dark:bg-muted/50">
                <div
                    className="bg-primary h-1.5 rounded-full transition-all duration-300 ease-linear"
                    style={{ width: `${((currentStepIndex + 1) / simulationSteps.length) * 100}%` }}
                ></div>
            </div>
        )}
    </div>
  );
};

export default HostPacketFlow;
