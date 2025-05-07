
import Link from 'next/link';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Calculator, Network, Palette, Sigma, TableIcon, Zap, CircuitBoard, Binary, Podcast, GitBranchPlus, Info } from 'lucide-react';
import Footer from '@/components/layout/Footer';

// Define featured tools data with updated icons and descriptions
const featuredTools = [
  {
    title: "🎧 Audio Lessons – Learn by Listening",
    description: "Understand networking & electronics anywhere, anytime.",
    icon: Podcast,
    link: "/audio",
    aiHint: "audio podcast lessons education", // Added aiHint for consistency
    ctaText: "▶️ Browse Audio Library"
  },
  {
    title: "Subnet Calculator",
    description: "Visualize IPv4 subnets, calculate ranges, masks, and binary representations.",
    icon: Network,
    link: "/tools/subnet",
    aiHint: "network topology diagram routing",
    ctaText: "Open Tool"
  },
   {
    title: "Resistor Color Code",
    description: "Decode 4, 5, or 6 band resistor colors or find bands for a specific value.",
    icon: Palette,
    link: "/tools/resistor",
    aiHint: "resistor color bands circuit",
    ctaText: "Open Tool"
  },
  {
    title: "Logic Truth Table",
    description: "Generate truth tables for boolean expressions with up to 4 variables (A, B, C, D).",
    icon: TableIcon,
    link: "/tools/truth-table",
    aiHint: "logic gates boolean algebra",
    ctaText: "Open Tool"
  },
   {
    title: "Ohm's & Power Calc",
    description: "Solve for Voltage (V), Current (I), Resistance (R), or Power (P) using Ohm's Law.",
    icon: Zap, // Power icon
    link: "/calculator#power", 
    aiHint: "ohms law power triangle formula",
    ctaText: "Open Tool"
  },
   {
    title: "BJT Solver",
    description: "Analyze fixed-bias common-emitter BJT circuits: find IB, IC, VCE, and saturation points.",
    icon: CircuitBoard, 
    link: "/calculator#bjt", 
    aiHint: "bjt transistor circuit diagram",
    ctaText: "Open Tool"
  },
   {
    title: "Base Converter",
    description: "Convert numbers between Binary, Decimal, and Hexadecimal representations.",
    icon: Binary,
    link: "/tools/base-converter",
    aiHint: "binary decimal hexadecimal number system",
    ctaText: "Open Tool"
   },
];


export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        {/* Hero Section - Updated Design */}
        <section className="relative py-20 md:py-32 overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background">
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
                <Image
                  src="/assets/images/hero-network.jpg" 
                  alt="Stylized representation of a network with interconnected nodes and data packets flowing, emphasizing connectivity and data transfer."
                  width={600}
                  height={400}
                  className="rounded-xl shadow-2xl object-cover aspect-[4/3]" 
                  data-ai-hint="network diagram data center" 
                  priority 
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
                        <Link href={tool.link}>{tool.ctaText || 'Open Tool'} <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" /></Link>
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
                 <Image
                  src="/assets/images/hero-electronics.jpg" 
                  alt="An engineer's workbench with various electronics components, a breadboard, multimeter, and an oscilloscope displaying a waveform."
                  width={500}
                  height={350}
                  className="rounded-xl shadow-xl object-cover aspect-[4/3]" 
                  data-ai-hint="electronics workbench circuit oscilloscope"
                  loading="lazy" 
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
      </main>
      <Footer />
    </div>
  );
}
