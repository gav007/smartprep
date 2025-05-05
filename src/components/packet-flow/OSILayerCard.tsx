'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { PacketLayerData } from '@/types/packet';
import { Layer7, Layers, Network, Smartphone, Cable, Router, Server } from 'lucide-react'; // Example icons

interface OSILayerCardProps {
  layerName: string;
  protocol?: string;
  headerInfo?: Record<string, any> | { payload: string } | { format: string; data: string } | { sessionId: string; data: string } | { bits: string };
  payloadPreview?: string;
  isActive: boolean;
  direction: 'Up' | 'Down' | 'Across' | null; // Added null type
}

const layerIcons: Record<string, React.ElementType> = {
    Application: Layer7,
    Presentation: Layers,
    Session: Layers, // Consider a different icon if available
    Transport: Smartphone, // Represents end-to-end connection
    Network: Router, // Represents routing
    "Data Link": Network, // Represents local network link
    Physical: Cable,
    Transmission: Cable, // Represent physical transmission
};

const layerColors = {
    Application: 'bg-blue-100 border-blue-300 dark:bg-blue-900/50 dark:border-blue-700',
    Presentation: 'bg-green-100 border-green-300 dark:bg-green-900/50 dark:border-green-700',
    Session: 'bg-yellow-100 border-yellow-300 dark:bg-yellow-900/50 dark:border-yellow-700',
    Transport: 'bg-red-100 border-red-300 dark:bg-red-900/50 dark:border-red-700',
    Network: 'bg-purple-100 border-purple-300 dark:bg-purple-900/50 dark:border-purple-700',
    "Data Link": 'bg-indigo-100 border-indigo-300 dark:bg-indigo-900/50 dark:border-indigo-700',
    Physical: 'bg-gray-100 border-gray-300 dark:bg-gray-800/50 dark:border-gray-600',
    Transmission: 'bg-gray-100 border-gray-300 dark:bg-gray-800/50 dark:border-gray-600',
};

const OSILayerCard: React.FC<OSILayerCardProps> = ({
  layerName,
  protocol,
  headerInfo,
  payloadPreview,
  isActive,
  direction,
}) => {
  const Icon = layerIcons[layerName] || Layers; // Default icon
  const bgColor = layerColors[layerName as keyof typeof layerColors] || 'bg-muted border-muted-foreground/20';

  return (
    <Card className={cn(
      "transition-all duration-300 border-2",
      isActive ? `shadow-lg scale-[1.02] ${bgColor}` : `opacity-60 hover:opacity-80 ${bgColor}`,
       // Hide border if not active to reduce visual noise
       isActive ? 'border-primary' : 'border-transparent'
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-3 px-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
           <Icon size={16} className={cn(isActive ? 'text-primary' : 'text-muted-foreground')}/>
           {layerName} {protocol && `(${protocol})`}
        </CardTitle>
         {/* Direction Arrow - Simple implementation */}
        {isActive && direction && (
             <span className={`text-xs font-bold ${direction === 'Down' ? 'text-blue-600 dark:text-blue-400' : direction === 'Up' ? 'text-green-600 dark:text-green-400' : 'text-purple-600 dark:text-purple-400'}`}>
                {direction === 'Down' ? '↓ Encapsulate' : direction === 'Up' ? '↑ De-encapsulate' : '→ Forward/Transmit'}
            </span>
        )}
      </CardHeader>
      <CardContent className="px-3 pb-3 text-xs">
        {isActive && headerInfo && (
          <ScrollArea className="h-20 w-full rounded-md border bg-background/50 p-2 font-mono text-[10px] leading-tight">
             {/* Render header info more cleanly */}
             {Object.entries(headerInfo).map(([key, value]) => {
                // Simple rendering, could be improved for nested objects/flags
                 let displayValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
                 // Truncate long values
                 if (displayValue.length > 50) displayValue = displayValue.substring(0, 47) + '...';
                return (
                    <div key={key} className="flex justify-between">
                        <span className="text-muted-foreground mr-1">{key}:</span>
                        <span className="truncate">{displayValue}</span>
                    </div>
                );
             })}
             {payloadPreview && (
                <div className="mt-1 pt-1 border-t border-dashed border-muted-foreground/30">
                    <span className="text-muted-foreground">Payload: </span>
                    <span className="italic opacity-80 truncate">{payloadPreview}</span>
                 </div>
             )}
          </ScrollArea>
        )}
        {!isActive && (
           <p className="text-muted-foreground italic text-[10px] h-20 flex items-center justify-center">...</p>
        )}
      </CardContent>
    </Card>
  );
};

export default OSILayerCard;
