'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Network, AlertTriangle } from 'lucide-react';
import { isValidIPv4, calculateSubnetDetails, cidrToSubnetMask } from '@/lib/calculator-utils'; // Import cidrToSubnetMask
import type { SubnetResult } from '@/types/calculator';
import { Button } from '@/components/ui/button';
import { BrainCircuit } from 'lucide-react'; // Assuming explainAnswer is adapted or a new flow is created
// import { explainSubnetResult } from '@/ai/flows/explain-subnet'; // Placeholder for AI explanation flow

export default function SubnetCalculatorPage() {
  const [ipAddress, setIpAddress] = useState<string>('192.168.1.1');
  const [cidr, setCidr] = useState<number>(24);
  const [error, setError] = useState<string | null>(null);
  const [subnetResult, setSubnetResult] = useState<SubnetResult | null>(null);
  // const [explanation, setExplanation] = useState<string | null>(null);
  // const [loadingExplanation, setLoadingExplanation] = useState<boolean>(false);

  const cidrOptions = Array.from({ length: 33 - 8 }, (_, i) => 8 + i); // /8 to /32

  useEffect(() => {
    // Initial calculation on load
    handleCalculation();
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array ensures this runs only once on mount


  const handleIpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newIp = e.target.value;
    setIpAddress(newIp);
    // Real-time validation feedback (optional, can be done on calculate)
    if (!isValidIPv4(newIp) && newIp.length > 0) {
      setError('Invalid IPv4 address format.');
    } else {
      setError(null);
      handleCalculation(newIp, cidr); // Trigger calculation on valid change
    }
     // setExplanation(null); // Clear explanation on input change
  };

  const handleCidrChange = (value: string) => {
    const newCidr = parseInt(value, 10);
    setCidr(newCidr);
    if (isValidIPv4(ipAddress)) {
      setError(null);
      handleCalculation(ipAddress, newCidr); // Trigger calculation
    } else if (ipAddress.length > 0) {
       setError('Invalid IPv4 address format.');
    }
     // setExplanation(null); // Clear explanation on input change
  };

  const handleCalculation = (currentIp = ipAddress, currentCidr = cidr) => {
    if (!isValidIPv4(currentIp)) {
      setError('Invalid IPv4 address format.');
      setSubnetResult(null);
      return;
    }
    setError(null);
    const result = calculateSubnetDetails(currentIp, currentCidr);
    setSubnetResult(result);
  };

  // const handleExplain = async () => {
  //   if (!subnetResult) return;
  //   setLoadingExplanation(true);
  //   setExplanation(null);
  //   try {
  //     // const result = await explainSubnetResult({
  //     //   ipAddress: subnetResult.ipAddress,
  //     //   cidr: subnetResult.cidr,
  //     //   subnetMask: subnetResult.subnetMask,
  //     //   networkAddress: subnetResult.networkAddress,
  //     //   broadcastAddress: subnetResult.broadcastAddress,
  //     //   usableHosts: subnetResult.usableHosts,
  //     // });
  //     // setExplanation(result.explanation);
  //     setExplanation("AI Explanation feature is not yet implemented."); // Placeholder
  //   } catch (err) {
  //     console.error("Error fetching explanation:", err);
  //     setExplanation("Sorry, couldn't generate an explanation right now.");
  //   } finally {
  //     setLoadingExplanation(false);
  //   }
  // };


  const renderBinaryTable = () => {
    if (!subnetResult || !subnetResult.binaryIpAddress || !subnetResult.binarySubnetMask || !subnetResult.binaryNetworkAddress || !subnetResult.binaryBroadcastAddress) return null;

    const ipParts = subnetResult.binaryIpAddress.split('.');
    const maskParts = subnetResult.binarySubnetMask.split('.');
    const netParts = subnetResult.binaryNetworkAddress.split('.');
    const broadParts = subnetResult.binaryBroadcastAddress.split('.');

    return (
        <div className="overflow-x-auto">
            <Table className="mt-4 border">
                <TableHeader>
                <TableRow>
                    <TableHead className="w-[150px]">Component</TableHead>
                    <TableHead>Octet 1</TableHead>
                    <TableHead>Octet 2</TableHead>
                    <TableHead>Octet 3</TableHead>
                    <TableHead>Octet 4</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow>
                        <TableCell className="font-medium">IP Address</TableCell>
                        {ipParts.map((part, index) => <TableCell key={`ip-${index}`} className="font-mono">{part}</TableCell>)}
                    </TableRow>
                    <TableRow>
                        <TableCell className="font-medium">Subnet Mask</TableCell>
                        {maskParts.map((part, index) => <TableCell key={`mask-${index}`} className="font-mono">{part}</TableCell>)}
                    </TableRow>
                     <TableRow>
                        <TableCell className="font-medium">Network Addr</TableCell>
                        {netParts.map((part, index) => <TableCell key={`net-${index}`} className="font-mono">{part}</TableCell>)}
                    </TableRow>
                     <TableRow>
                        <TableCell className="font-medium">Broadcast Addr</TableCell>
                        {broadParts.map((part, index) => <TableCell key={`broad-${index}`} className="font-mono">{part}</TableCell>)}
                    </TableRow>
                </TableBody>
            </Table>
        </div>
    );
  };


  return (
    <div className="container mx-auto p-4 md:p-6">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Network className="h-6 w-6 text-primary" />
            Subnet Calculator
          </CardTitle>
          <CardDescription>
            Enter an IPv4 address and CIDR prefix length to calculate network details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 items-end">
            <div className="space-y-2">
              <Label htmlFor="ipAddress">IP Address</Label>
              <Input
                id="ipAddress"
                type="text"
                value={ipAddress}
                onChange={handleIpChange}
                placeholder="e.g., 192.168.1.1"
                className={error && ipAddress.length > 0 ? 'border-destructive focus-visible:ring-destructive' : ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cidr">CIDR Prefix</Label>
              <Select value={String(cidr)} onValueChange={handleCidrChange}>
                <SelectTrigger id="cidr">
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
            </div>
             {/* The button is less necessary if calculations are real-time
             <Button onClick={handleCalculation} className="md:self-end">
              Calculate
            </Button> */}
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {subnetResult && !error && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Calculation Results</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div><strong>Network Address:</strong> {subnetResult.networkAddress}</div>
                <div><strong>Broadcast Address:</strong> {subnetResult.broadcastAddress}</div>
                <div><strong>Subnet Mask:</strong> {subnetResult.subnetMask}</div>
                <div><strong>Wildcard Mask:</strong> {subnetResult.wildcardMask}</div>
                <div><strong>First Usable Host:</strong> {subnetResult.firstUsableHost}</div>
                <div><strong>Last Usable Host:</strong> {subnetResult.lastUsableHost}</div>
                <div><strong>Total Hosts:</strong> {subnetResult.totalHosts.toLocaleString()}</div>
                <div><strong>Usable Hosts:</strong> {subnetResult.usableHosts.toLocaleString()}</div>
              </div>

              {renderBinaryTable()}

              {/* AI Explanation Button - Placeholder */}
              {/* <div className="mt-6 text-center">
                <Button variant="outline" onClick={handleExplain} disabled={loadingExplanation}>
                  <BrainCircuit className="mr-2 h-4 w-4" />
                  {loadingExplanation ? 'Explaining...' : 'Explain This Result'}
                </Button>
                {explanation && (
                   <Alert className="mt-4 text-left border-primary bg-primary/5">
                     <BrainCircuit className="h-4 w-4 text-primary" />
                     <AlertTitle className="text-primary">AI Explanation</AlertTitle>
                     <AlertDescription className="prose prose-sm max-w-none">
                       {explanation}
                     </AlertDescription>
                   </Alert>
                )}
              </div> */}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
