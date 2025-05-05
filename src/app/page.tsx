
import Link from 'next/link';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Calculator, Code, Cpu, GitBranch, Network, Palette, Sigma, TableIcon, Settings, Zap, CircuitBoard, Binary } from 'lucide-react';
import Footer from '@/components/layout/Footer';

// Define featured tools data with updated icons and descriptions
const featuredTools = [
  {
    title: "Subnet Calculator",
    description: "Visualize IPv4 subnets, calculate ranges, masks, and binary representations.",
    icon: Network,
    link: "/tools/subnet",
    aiHint: "network topology diagram routing"
  },
   {
    title: "Resistor Color Code",
    description: "Decode 4, 5, or 6 band resistor colors or find bands for a specific value.",
    icon: Palette,
    link: "/tools/resistor",
    aiHint: "resistor color bands circuit"
  },
  {
    title: "Logic Truth Table",
    description: "Generate truth tables for boolean expressions with up to 4 variables (A, B, C, D).",
    icon: TableIcon,
    link: "/tools/truth-table",
    aiHint: "logic gates boolean algebra"
  },
   {
    title: "Ohm's & Power Calc",
    description: "Solve for Voltage (V), Current (I), Resistance (R), or Power (P) using Ohm's Law.",
    icon: Zap, // Power icon
    link: "/calculator", // Links to the main calculator page
    aiHint: "ohms law power triangle formula"
  },
   {
    title: "BJT Solver",
    description: "Analyze fixed-bias common-emitter BJT circuits: find IB, IC, VCE, and saturation points.",
    icon: CircuitBoard, // More specific BJT icon
    link: "/calculator", // Links to main calculator page where BJT solver resides
    aiHint: "bjt transistor circuit diagram"
  },
   {
    title: "Base Converter", // Added Base Converter
    description: "Convert numbers between Binary, Decimal, and Hexadecimal representations.",
    icon: Binary,
    link: "/tools/base-converter",
    aiHint: "binary decimal hexadecimal number system"
   },
];


export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        {/* Hero Section - Updated Design */}
        <section className="relative py-20 md:py-32 overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background">
           {/* Optional: Subtle background pattern or SVG */}
           {/* <div className="absolute inset-0 opacity-5"> ... SVG pattern ... </div> */}
          <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center relative z-10">
            <div className="space-y-6 text-center md:text-left">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight text-primary">
                Master Networking & Electronics Concepts.
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto md:mx-0">
                Your essential toolkit for learning, practice, and problem-solving. Interactive quizzes and powerful calculators at your fingertips.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start pt-4">
                <Button asChild size="lg" className="shadow-lg hover:shadow-xl transition-shadow">
                  <Link href="/quiz">🎯 Start Quiz <ArrowRight className="ml-2 h-5 w-5" /></Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="shadow hover:shadow-md transition-shadow">
                  <Link href="/calculator">🧮 Open Calculators <Calculator className="ml-2 h-5 w-5" /></Link>
                </Button>
              </div>
            </div>
            <div className="flex justify-center items-center">
                {/* Updated hero image placeholder and hints */}
                <Image
                  src="/assets/images/hero-network.jpg" // Updated relevant hero image path
                  alt="Networking equipment including servers and ethernet cables in a data rack" // Updated alt text
                  width={600}
                  height={400}
                  className="rounded-xl shadow-2xl object-cover aspect-[4/3]" // Consistent styling: aspect-[4/3], rounded-xl
                  data-ai-hint="network server rack data center ethernet cables switch" // Updated hint
                  priority // Load hero image faster
                />
            </div>
          </div>
        </section>

        {/* Featured Tools Section - Updated Design */}
        <section className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">Your Digital Toolkit</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredTools.map((tool) => (
                <Card key={tool.title} className="flex flex-col bg-card border border-border/50 rounded-xl overflow-hidden shadow-sm transition-all duration-300 hover:shadow-lg hover:scale-[1.03] hover:border-primary/30 group">
                  <CardHeader className="flex flex-row items-start gap-4 pb-3 pt-5 px-5">
                    <div className="p-3 rounded-lg bg-primary/10 text-primary">
                       <tool.icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                        <CardTitle className="text-lg font-semibold">{tool.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow px-5 pb-4">
                    <CardDescription className="text-muted-foreground">{tool.description}</CardDescription>
                  </CardContent>
                   <CardFooter className="p-5 pt-0 bg-muted/30 group-hover:bg-muted/50 transition-colors">
                      <Button asChild variant="link" className="w-full justify-start p-0 h-auto text-primary font-semibold">
                        <Link href={tool.link}>Open Tool <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" /></Link>
                      </Button>
                   </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* About Section - Updated Design */}
        <section className="py-16 md:py-24 bg-secondary/30">
          <div className="container mx-auto px-4 grid md:grid-cols-2 gap-16 items-center">
            <div className="flex justify-center items-center md:order-2">
                 {/* Updated about image placeholder and hints */}
                 <Image
                  src="https://picsum.photos/500/350" // Replaced with picsum placeholder
                  alt="Electronics workbench with components, multimeter, and breadboard" // Updated alt text
                  width={500}
                  height={350}
                  className="rounded-xl shadow-xl object-cover aspect-[4/3]" // Consistent styling: rounded-xl
                  data-ai-hint="electronics workbench circuit breadboard multimeter components soldering" // Updated hint
                  loading="lazy" // Add lazy loading
                />
            </div>
             <div className="space-y-5 md:order-1 text-center md:text-left">
              <h2 className="text-3xl md:text-4xl font-bold">What is SmartPrep?</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                SmartPrep is your dedicated platform for mastering core networking and electronics concepts. We bridge theory and practice with interactive quizzes and a suite of essential calculation tools.
              </p>
               <p className="text-lg text-muted-foreground leading-relaxed">
                 Designed for clarity and ease-of-use, SmartPrep helps students and professionals build confidence and tackle real-world challenges.
              </p>
               <Button asChild variant="outline" className="mt-4">
                 <Link href="/quiz">Explore Quizzes <ArrowRight className="ml-2 h-4 w-4" /></Link>
               </Button>
            </div>
          </div>
        </section>

        {/* Recent Updates Section - Removed */}

      </main>

      <Footer /> {/* Use the existing Footer component */}
    </div>
  );
}
