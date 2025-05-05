import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, Network, ArrowRight, GitBranch, Waves, Component } from "lucide-react";

const tools = [
  {
    href: "/tools/subnet",
    icon: Network,
    title: "Subnet Calculator",
    description: "Calculate network details from IP and CIDR.",
  },
  {
    href: "/tools/converter",
    icon: GitBranch, // Using GitBranch as a metaphor for base conversion
    title: "Base Converter",
    description: "Convert between Binary, Decimal, and Hexadecimal.",
  },
   {
    href: "/tools/waveform",
    icon: Waves,
    title: "Waveform Generator",
    description: "Visualize basic electronic waveforms.",
   },
   {
     href: "/tools/resistor",
     icon: Component, // Using Component for resistor
     title: "Resistor Color Code",
     description: "Calculate resistance from colors or vice-versa.",
   },
];

export default function CalculatorDashboardPage() {
  return (
    <div className="flex flex-col items-center pt-10">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2">
          <Calculator className="h-8 w-8 text-primary" />
          Electronics & Networking Tools
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          A collection of useful calculators and utilities for electronics and networking tasks. Select a tool below to get started.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
        {tools.map((tool) => (
          <Link href={tool.href} key={tool.href} passHref>
            <Card className="cursor-pointer hover:shadow-lg transition-shadow hover:border-primary h-full flex flex-col">
              <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
                <tool.icon className="h-8 w-8 text-primary shrink-0" />
                <CardTitle className="text-xl font-semibold">{tool.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                <CardDescription>{tool.description}</CardDescription>
              </CardContent>
              <CardContent className="pt-0">
                 <p className="text-sm text-primary font-medium flex items-center gap-1">
                    Go to tool <ArrowRight size={16}/>
                 </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
