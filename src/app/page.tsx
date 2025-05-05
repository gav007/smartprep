
import Link from 'next/link';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Calculator, Code, Cpu, GitBranch, Network, Palette, Sigma, TableIcon, Settings, Zap, CircuitBoard, Binary } from 'lucide-react'; // Removed BrainCircuit, Added Binary
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

// Placeholder for Recent Updates/Changelog data
const recentUpdates = [
    { id: 2, date: "2024-07-25", title: "Added BJT Solver", description: "Analyze basic BJT fixed-bias circuits." },
    { id: 3, date: "2024-07-20", title: "Improved UI Responsiveness", description: "Enhanced experience on mobile devices." },
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
                  src="data:image/jpeg;base64,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" // Updated relevant hero image path
                  alt="Networking equipment including servers and ethernet cables in a data rack" // Updated alt text
                  width={600}
                  height={400}
                  className="rounded-xl shadow-2xl object-cover aspect-[4/3]" // Consistent styling: aspect-[4/3], rounded-xl
                  data-ai-hint="network server rack data center ethernet cables switch" // Updated hint
                  priority // Load hero image faster
                  // Removed onError handler
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
                  src="/assets/images/hero-electronics.jpg" // Placeholder - Desk with computer, PCB, oscilloscope waveform
                  alt="Engineer's desk with electronics components, PCB, and oscilloscope waveform"
                  width={500}
                  height={350}
                  className="rounded-xl shadow-xl object-cover aspect-[4/3]" // Consistent styling: rounded-xl
                  data-ai-hint="engineer desk electronics pcb oscilloscope waveform breadboard multimeter" // Updated hint
                  loading="lazy" // Add lazy loading
                  // Removed onError handler
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

        {/* Recent Updates Section - Added */}
        <section className="py-16 md:py-20 bg-background">
            <div className="container mx-auto px-4 max-w-3xl">
                <h2 className="text-3xl font-bold text-center mb-10">Recent Updates</h2>
                <div className="space-y-6">
                    {recentUpdates.map(update => (
                        <div key={update.id} className="p-4 border rounded-lg bg-card flex items-start gap-4 shadow-sm">
                            <div className="text-primary pt-1"><Settings size={20} /></div>
                            <div className="flex-1">
                                <p className="text-xs text-muted-foreground">{update.date}</p>
                                <h3 className="font-semibold">{update.title}</h3>
                                <p className="text-sm text-muted-foreground mt-1">{update.description}</p>
                            </div>
                        </div>
                    ))}
                     {/* Link to a full changelog page if needed */}
                     {/* <div className="text-center mt-8">
                         <Button variant="link" asChild>
                             <Link href="/changelog">View Full Changelog</Link>
                         </Button>
                     </div> */}
                </div>
            </div>
        </section>


      </main>

      <Footer /> {/* Use the existing Footer component */}
    </div>
  );
}
