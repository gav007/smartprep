
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

  // Generate the marker ID only on the client side after hydration
  useEffect(() => {
    setMarkerId(`arrowhead-${direction}-${Math.random().toString(16).slice(2)}`);
  }, [direction]); // Regenerate if direction changes (though likely stable)

  const pathVariants = {
    inactive: { pathLength: 0, opacity: 0.3 },
    active: {
      pathLength: 1,
      opacity: 1,
      transition: { duration: 0.8, ease: "easeInOut" }
    }
  };

  // Basic line path - customize with actual coordinates based on layout
  const getPathD = () => {
    if (isVertical) return "M 0 0 V 50"; // Simple vertical line
    // Horizontal lines - adjust coordinates based on actual layout
    if (direction === 'AtoR' || direction === 'RtoA') return "M 0 25 H 100";
    if (direction === 'RtoB' || direction === 'BtoR') return "M 0 25 H 100";
    return "M 0 0 L 10 10"; // Default fallback
  };


  // Don't render until the marker ID is generated on the client
  if (!markerId) {
    // Render a placeholder or null during server render and initial client render before useEffect runs
    return (
        <svg
            width="100%"
            height={isVertical ? "50" : "50"}
            viewBox={isVertical ? "0 0 10 50" : "0 0 100 50"}
            className={cn("overflow-visible opacity-30", className)} // Show placeholder state
            style={style}
        >
             <path
                d={getPathD()}
                fill="transparent"
                stroke={'hsl(var(--muted-foreground))'}
                strokeWidth="2"
                strokeDasharray="4 4" // Make it dashed
            />
        </svg>
    );
  }

  return (
    <svg
      width="100%" // Adjust width/height based on container
      height={isVertical ? "50" : "50"} // Example heights
      viewBox={isVertical ? "0 0 10 50" : "0 0 100 50"} // Adjust viewBox
      className={cn("overflow-visible", className)}
      style={style}
    >
      <defs>
        <marker
          id={markerId}
          markerWidth="6"
          markerHeight="6"
          refX="5" // Position arrowhead slightly away from the end
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
        strokeDasharray="4 4" // Make it dashed
        variants={pathVariants}
        initial="inactive"
        animate={isActive ? "active" : "inactive"}
        markerEnd={`url(#${markerId})`} // Add arrowhead using the client-generated ID
      />
    </svg>
  );
};

export default FlowPath;
