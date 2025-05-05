
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Copy, Network, Binary, RotateCcw } from 'lucide-react';
import { calculateSubnetDetails, isValidIPv4, ipToBinaryString, cidrToSubnetMask, formatIpBinaryString } from '@/lib/calculator-utils'; // Ensure formatIpBinaryString is imported
import type { SubnetResult } from '@/types/calculator';
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";


const cidrOptions = Array.from({ length: 33 - 0 }, (_, i) => i + 0); // /0 to /32
const initialCidr = 24;

export default function SubnetVisualizer() {
  const [ipAddress, setIpAddress] = useState<string>('');
  const [cidr, setCidr] = useState<number>(initialCidr);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const subnetDetails = useMemo<SubnetResult | null>(() => {
    setError(null); // Reset error on recalculation
    if (!ipAddress) {
        // Don't show error if IP is empty, just clear results
        return null;
    }
    if (!isValidIPv4(ipAddress)) {
      setError('Invalid IPv4 address format.');
      return null;
    }
    try {
      const result = calculateSubnetDetails(ipAddress, cidr);
       // Update binary representations within the result object itself
       if (result) {
           result.binaryIpAddress = ipToBinaryString(result.ipAddress) ?? undefined;
           result.binaryNetworkAddress = ipToBinaryString(result.networkAddress) ?? undefined;
           result.binarySubnetMask = ipToBinaryString(result.subnetMask) ?? undefined;
           result.binaryBroadcastAddress = ipToBinaryString(result.broadcastAddress) ?? undefined;
       }
      return result;
    } catch (e: any) {
      setError(e.message || 'Failed to calculate subnet details.');
      return null;
    }
  }, [ipAddress, cidr]);

  const handleCidrChange = (value: string) => {
    const newCidr = parseInt(value, 10);
    if (!isNaN(newCidr)) {
      setCidr(newCidr);
    }
  };

   const handleCopyToClipboard = useCallback((text: string | number | undefined, label: string) => {
       const textToCopy = String(text ?? '').replace(/,/g,''); // Convert to string, remove commas
        if (!textToCopy || textToCopy === 'N/A') return;

        navigator.clipboard.writeText(textToCopy).then(() => {
        toast({
            title: "Copied to Clipboard",
            description: `${label} (${textToCopy}) copied.`,
        });
        }).catch(err => {
        console.error('Failed to copy:', err);
        toast({
            title: "Copy Failed",
            description: "Could not copy text to clipboard.",
            variant: "destructive",
        });
        });
    }, [toast]);

    const handleReset = () => {
        setIpAddress('');
        setCidr(initialCidr);
        setError(null);
    };


  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Network size={24} /> Subnet Visualizer</CardTitle>
        <CardDescription>Calculate and visualize IPv4 subnet details.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          {/* IP Address Input */}
          <div className="space-y-1 md:col-span-2">
            <Label htmlFor="ipAddress">IPv4 Address</Label>
            <Input
              id="ipAddress"
              type="text"
              value={ipAddress}
              onChange={(e) => setIpAddress(e.target.value)}
              placeholder="e.g., 192.168.1.10"
              className={error && !isValidIPv4(ipAddress) ? 'border-destructive' : ''}
            />
             {error && !isValidIPv4(ipAddress) && (
                 <p className="text-xs text-destructive mt-1">{error}</p>
             )}
          </div>

          {/* CIDR Select */}
          <div className="space-y-1">
            <Label htmlFor="cidr">CIDR</Label>
            <Select value={String(cidr)} onValueChange={handleCidrChange}>
              <SelectTrigger id="cidr" className="w-full">
                <SelectValue placeholder="Select CIDR" />
              </SelectTrigger>
              <SelectContent>
                {cidrOptions.map((option) => (
                   <SelectItem key={option} value={String(option)}>
                    /{option} ({cidrToSubnetMask(option)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
             {error && isValidIPv4(ipAddress) && ( // Show general calculation errors here if IP is valid but calculation failed
                  <p className="text-xs text-destructive mt-1">{error}</p>
             )}
          </div>
        </div>

         {/* Reset Button */}
         <Button variant="outline" onClick={handleReset} className="w-full md:w-auto mt-2">
            <RotateCcw className="mr-2 h-4 w-4" /> Reset
         </Button>

        {/* Results Section */}
        {subnetDetails && !error && (
          <div className="space-y-4 pt-6 border-t">
            <h3 className="text-lg font-semibold mb-2">Subnet Details:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 text-sm">
               {Object.entries({
                'Network Address': subnetDetails.networkAddress,
                'Broadcast Address': subnetDetails.broadcastAddress,
                'Subnet Mask': subnetDetails.subnetMask,
                'Wildcard Mask': subnetDetails.wildcardMask,
                'First Usable Host': subnetDetails.firstUsableHost,
                'Last Usable Host': subnetDetails.lastUsableHost,
                'Total Hosts': subnetDetails.totalHosts, //.toLocaleString(),
                'Usable Hosts': subnetDetails.usableHosts, //.toLocaleString(),
                }).map(([label, value]) => (
                    <div key={label} className="flex justify-between items-center group">
                        <span><strong>{label}:</strong> {typeof value === 'number' ? value.toLocaleString() : value}</span>
                        {value !== 'N/A' && value !== undefined && (
                             <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleCopyToClipboard(value, label)}
                                aria-label={`Copy ${label}`}
                            >
                                <Copy size={14} />
                            </Button>
                        )}
                    </div>
               ))}
            </div>

             {/* Binary Breakdown Table */}
            <div className="pt-4">
                <h4 className="text-md font-semibold mb-2 flex items-center gap-2"><Binary size={18}/> Binary Representation</h4>
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead className="w-[150px]">Type</TableHead>
                        <TableHead>Binary Value (Dotted Octets)</TableHead>
                        <TableHead className="w-[50px] text-right">Copy</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {[
                        { label: 'IP Address', value: subnetDetails.binaryIpAddress },
                        { label: 'Subnet Mask', value: subnetDetails.binarySubnetMask },
                        { label: 'Network Addr', value: subnetDetails.binaryNetworkAddress },
                        { label: 'Broadcast Addr', value: subnetDetails.binaryBroadcastAddress },
                    ].map((item) => (
                        <TableRow key={item.label}>
                        <TableCell className="font-medium">{item.label}</TableCell>
                        <TableCell className="font-mono text-xs tracking-tight">{formatIpBinaryString(item.value)}</TableCell>
                         <TableCell className="text-right">
                             <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => handleCopyToClipboard(formatIpBinaryString(item.value), `${item.label} (Binary)`)}
                                disabled={!item.value}
                                aria-label={`Copy Binary ${item.label}`}
                            >
                                <Copy size={14} />
                            </Button>
                         </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
            </div>
          </div>
        )}

         {/* Placeholder for Visual Tree (Optional) */}
         {/* {subnetDetails && !error && (
             <div className="pt-6 border-t">
                 <h3 className="text-lg font-semibold mb-2">Subnet Division (Placeholder)</h3>
                 <p className="text-muted-foreground text-sm">Visual subnet tree representation coming soon.</p>
             </div>
         )} */}

      </CardContent>
       {/* Optional Footer for Actions */}
       {/* <CardFooter className="flex justify-end gap-2">
           <Button variant="outline" disabled={!subnetDetails}>Download JSON</Button>
           <Button variant="outline" disabled={!subnetDetails}>Download PDF</Button>
       </CardFooter> */}
    </Card>
  );
}
