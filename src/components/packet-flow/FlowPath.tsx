// src/components/packet-flow/FlowPath.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface FlowPathProps {
  direction: 'AtoR' | 'RtoB' | 'BtoR' | 'RtoA'; // A=HostA, R=Router, B=HostB
  isActive: boolean;
  isVertical?: boolean; // For flow between layers
  style?: React.CSSProperties;
  className?: string;
}

const FlowPath: React.FC<FlowPathProps> = ({ direction, isActive, isVertical = false, style, className }) => {
  const [markerId, setMarkerId] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false); // To track client-side mount

  useEffect(() => {
    setIsClient(true); // Component has mounted on the client
    // Generate a unique ID for the marker only on the client
    setMarkerId(`arrowhead-${direction}-${Math.random().toString(16).slice(2)}`);
  }, [direction]); // Re-generate if direction changes (though likely stable)

  const pathVariants = {
    inactive: { pathLength: 0, opacity: 0.3 },
    active: {
      pathLength: 1,
      opacity: 1,
      transition: { duration: 0.8, ease: "easeInOut" }
    }
  };

  const getPathD = () => {
    if (isVertical) return "M 5 0 V 50"; // Centered vertical line in a 10-width viewbox
    // Horizontal lines - adjust coordinates based on actual layout
    if (direction === 'AtoR' || direction === 'RtoA') return "M 0 25 H 100";
    if (direction === 'RtoB' || direction === 'BtoR') return "M 0 25 H 100";
    return "M 0 0 L 10 10"; // Default fallback
  };


  // On the server, and for the initial client render, return a placeholder or null.
  // This ensures the server output matches the client's first paint.
  if (!isClient || !markerId) {
    // Render a consistent placeholder. This SVG should not contain the marker or markerEnd.
    // It's crucial that this output is identical between server and initial client render.
    return (
        <svg
            width="100%"
            height={isVertical ? "50" : "50"}
            viewBox={isVertical ? "0 0 10 50" : "0 0 100 50"}
            className={cn("overflow-visible opacity-30", className)}
            style={style}
        >
             <path
                d={getPathD()}
                fill="transparent"
                stroke={'hsl(var(--muted-foreground))'} // Consistent placeholder color
                strokeWidth="2"
                strokeDasharray="4 4"
            />
        </svg>
    );
  }

  // This part renders only on the client after isClient is true and markerId is generated
  return (
    <svg
      width="100%"
      height={isVertical ? "50" : "50"}
      viewBox={isVertical ? "0 0 10 50" : "0 0 100 50"}
      className={cn("overflow-visible", className)}
      style={style}
    >
      <defs>
        <marker
          id={markerId}
          markerWidth="6"
          markerHeight="6"
          refX="5" 
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
           <path d="M0,0 L0,6 L6,3 z" fill={isActive ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'} />
        </marker>
      </defs>
      <motion.path
        d={getPathD()}
        fill="transparent"
        stroke={isActive ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'}
        strokeWidth="2"
        strokeDasharray="4 4" 
        variants={pathVariants}
        initial="inactive"
        animate={isActive ? "active" : "inactive"}
        markerEnd={`url(#${markerId})`}
      />
    </svg>
  );
};

export default FlowPath;
