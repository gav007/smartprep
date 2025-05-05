// src/components/packet-flow/OSILayerCard.tsx
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button'; // Import Button
import { Copy } from 'lucide-react'; // Import Copy icon
import { cn } from '@/lib/utils';
import type { PacketLayerData } from '@/types/packet';
import { AppWindow, Layers, Network, Smartphone, Cable, Router } from 'lucide-react'; // Removed Server icon

interface OSILayerCardProps {
  layerName: string;
  protocol?: string;
  headerInfo?: Record<string, any>; // Removed union types for simplicity, handle specific formatting below
  payloadPreview?: string;
  isActive: boolean;
  direction: 'Up' | 'Down' | 'Across' | null;
  copyToClipboard: (text: string | undefined, label: string) => void; // Add copy function prop
}

const layerIcons: Record<string, React.ElementType> = {
    Application: AppWindow,
    Presentation: Layers,
    Session: Layers,
    Transport: Smartphone,
    Network: Router,
    "Data Link": Network,
    Physical: Cable,
    Transmission: Cable,
};

// Consistent background and border colors using primary/accent for active state
const layerColors = {
    Application: 'bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-700/50',
    Presentation: 'bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-700/50',
    Session: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/30 dark:border-yellow-700/50',
    Transport: 'bg-red-50 border-red-200 dark:bg-red-900/30 dark:border-red-700/50',
    Network: 'bg-purple-50 border-purple-200 dark:bg-purple-900/30 dark:border-purple-700/50',
    "Data Link": 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/30 dark:border-indigo-700/50',
    Physical: 'bg-gray-100 border-gray-200 dark:bg-gray-800/50 dark:border-gray-600/50',
    Transmission: 'bg-gray-100 border-gray-200 dark:bg-gray-800/50 dark:border-gray-600/50',
};
const activeLayerColor = 'border-primary ring-1 ring-primary'; // More prominent active state

const OSILayerCard: React.FC<OSILayerCardProps> = ({
  layerName,
  protocol,
  headerInfo,
  payloadPreview,
  isActive,
  direction,
  copyToClipboard,
}) => {
  const Icon = layerIcons[layerName] || Layers;
  const bgColor = layerColors[layerName as keyof typeof layerColors] || 'bg-muted border-muted-foreground/20';

  // Function to format header values nicely
  const formatHeaderValue = (key: string, value: any): string => {
      if (key.toLowerCase().includes('mac')) return String(value).toUpperCase();
      if (key.toLowerCase().includes('ip')) return String(value);
      // Add more specific formatting if needed
      return typeof value === 'object' ? JSON.stringify(value) : String(value);
  };

  return (
    <Card className={cn(
      "transition-all duration-300 border",
      bgColor, // Apply base color
      isActive ? `${activeLayerColor} shadow-md scale-[1.03]` : `opacity-70 hover:opacity-90 border-transparent`, // Enhance active state, make inactive slightly transparent
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-3 px-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
           <Icon size={16} className={cn(isActive ? 'text-primary' : 'text-muted-foreground')}/>
           {layerName} {protocol && <span className="text-xs text-muted-foreground">({protocol})</span>}
        </CardTitle>
        {isActive && direction && (
            <span className={`text-xs font-bold ${
                direction === 'Down' ? 'text-blue-600 dark:text-blue-400' :
                direction === 'Up' ? 'text-green-600 dark:text-green-400' :
                'text-purple-600 dark:text-purple-400'
            }`}>
                {direction === 'Down' ? '↓ Encapsulate' : direction === 'Up' ? '↑ De-capsulate' : '→ Process/Transmit'}
            </span>
        )}
      </CardHeader>
      <CardContent className="px-3 pb-3 text-xs min-h-[80px]"> {/* Ensure minimum height */}
        {isActive && (headerInfo || payloadPreview) ? (
          <ScrollArea className="h-20 w-full rounded-md border bg-background/50 p-2 font-mono text-[10px] leading-tight relative group">
             {/* Copy Headers Button */}
             {headerInfo && Object.keys(headerInfo).length > 0 && (
                 <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-0 right-0 h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    onClick={() => copyToClipboard(JSON.stringify(headerInfo, null, 2), `${layerName} Headers`)}
                    aria-label={`Copy ${layerName} Headers`}
                 >
                    <Copy size={12} />
                 </Button>
             )}

             {/* Header Info */}
             {headerInfo && Object.entries(headerInfo).map(([key, value]) => {
                 if (value === undefined || value === null) return null; // Don't render null/undefined headers
                 const displayValue = formatHeaderValue(key, value);
                 const fullValue = typeof value === 'object' ? JSON.stringify(value) : String(value); // For copying
                return (
                    <div key={key} className="flex justify-between items-start group/line relative pr-5"> {/* Added relative and group */}
                        <span className="text-muted-foreground mr-1 whitespace-nowrap">{key}:</span>
                        <span className="truncate text-right flex-1">{displayValue.length > 40 ? displayValue.substring(0, 37) + '...' : displayValue}</span>
                         {/* Inline Copy Button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-0 right-0 h-4 w-4 text-muted-foreground opacity-0 group-hover/line:opacity-100 transition-opacity"
                             onClick={() => copyToClipboard(fullValue, key)}
                            aria-label={`Copy ${key}`}
                        >
                             <Copy size={10} />
                        </Button>
                    </div>
                );
             })}

             {/* Payload Preview */}
             {payloadPreview && (
                <div className="mt-1 pt-1 border-t border-dashed border-muted-foreground/30 group/line relative pr-5"> {/* Added relative and group */}
                    <span className="text-muted-foreground">Payload: </span>
                    <span className="italic opacity-80 truncate">{payloadPreview}</span>
                     {/* Inline Copy Button */}
                     <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-1 right-0 h-4 w-4 text-muted-foreground opacity-0 group-hover/line:opacity-100 transition-opacity"
                         onClick={() => copyToClipboard(payloadPreview, 'Payload')} // Assuming payloadPreview is the full payload for copy
                        aria-label="Copy Payload"
                    >
                         <Copy size={10} />
                    </Button>
                 </div>
             )}
             {/* Show if no headers/payload */}
             {!headerInfo && !payloadPreview && <p className="text-muted-foreground italic">No data at this layer yet.</p>}
          </ScrollArea>
        ) : (
           <div className="h-20 flex items-center justify-center">
             <p className="text-muted-foreground italic text-[10px]">...</p>
           </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OSILayerCard;
