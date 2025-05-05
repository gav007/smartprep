'use client';

import React from 'react';
import HostPacketFlow from '@/components/packet-flow/HostPacketFlow';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GitBranchPlus } from 'lucide-react'; // Example icon

export default function PacketFlowPage() {
  // Container and padding are handled by src/app/tools/layout.tsx
  return (
    <Card className="w-full mx-auto">
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <GitBranchPlus size={24} /> Packet Flow Simulator
            </CardTitle>
            <CardDescription>
                Visualize data encapsulation and de-encapsulation through the OSI model.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <HostPacketFlow />
        </CardContent>
    </Card>
  );
}
