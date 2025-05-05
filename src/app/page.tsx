
import Link from 'next/link';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, BrainCircuit, Calculator, Code, Cpu, GitBranch, Network, Palette, Sigma, TableIcon } from 'lucide-react';
import Footer from '@/components/layout/Footer'; // Import the new Footer component

// Define featured tools data
const featuredTools = [
  {
    title: "Subnet Calculator",
    description: "Visualize and calculate IPv4 subnet details, including network/broadcast addresses and host ranges.",
    icon: Network,
    link: "/tools/subnet",
    aiHint: "network diagram subnetting"
  },
  {
    title: "Ohm's Law Solver",
    description: "Quickly calculate Voltage (V), Current (I), or Resistance (R) using Ohm's Law.",
    icon: Sigma, // Represents Resistance/Math
    link: "/calculator", // Links to the main calculator page where Ohm's law resides
    aiHint: "resistor circuit diagram"
  },
  {
    title: "Truth Table Generator",
    description: "Generate truth tables for boolean logic expressions with up to 4 variables.",
    icon: TableIcon,
    link: "/tools/truth-table",
    aiHint: "logic gates circuit"
  },
    {
    title: "Resistor Color Code",
    description: "Decode resistor color bands or find the bands for a specific resistance value.",
    icon: Palette, // More appropriate for color codes
    link: "/tools/resistor",
    aiHint: "resistor color bands"
  },
  {
    title: "Electronics Calculators",
    description: "Access a suite of tools including Power, AC Voltage, Op-Amp Gain, and BJT analysis.",
    icon: Calculator,
    link: "/calculator",
     aiHint: "calculator tools dashboard"
  },
  {
    title: "AI Quiz Explainer",
    description: "Get AI-powered explanations for quiz answers to deepen your understanding.",
    icon: BrainCircuit,
    link: "/quiz", // Link to quiz section where explanation is available after quiz
    aiHint: "artificial intelligence brain circuit"
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="py-16 md:py-24 bg-gradient-to-br from-background to-muted/30">
          <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight text-primary">
                🧠 Build Your Networking & Electronics Skills
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto md:mx-0">
                SmartPrep provides interactive quizzes and essential tools designed for students and professionals in networking and electronics. Master concepts and calculations with ease.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <Button asChild size="lg">
                  <Link href="/quiz">Start Quiz <ArrowRight className="ml-2 h-5 w-5" /></Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/calculator">Open Calculators <Calculator className="ml-2 h-5 w-5" /></Link>
                </Button>
              </div>
            </div>
            <div className="flex justify-center">
               {/* Placeholder using Lucide icon */}
               {/* <Cpu size={200} className="text-primary opacity-10" /> */}
                <Image
                  src="https://picsum.photos/600/400" // Placeholder image
                  alt="Networking and electronics concept"
                  width={600}
                  height={400}
                  className="rounded-lg shadow-lg object-cover"
                  data-ai-hint="abstract network circuit technology"
                />
            </div>
          </div>
        </section>

        {/* Featured Tools Section */}
        <section className="py-16 md:py-20 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Your Digital Toolkit</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredTools.map((tool) => (
                <Card key={tool.title} className="flex flex-col transition-all duration-300 hover:shadow-lg hover:scale-[1.02]">
                  <CardHeader className="flex flex-row items-center gap-4 pb-2">
                    <tool.icon className="h-10 w-10 text-primary" />
                    <CardTitle className="text-xl font-semibold">{tool.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <CardDescription>{tool.description}</CardDescription>
                  </CardContent>
                   <div className="p-6 pt-0">
                      <Button asChild variant="outline" className="w-full">
                        <Link href={tool.link}>Open Tool</Link>
                      </Button>
                   </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* About Section */}
        <section className="py-16 md:py-20 bg-secondary/50">
          <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
            <div className="flex justify-center">
                 <Image
                  src="https://picsum.photos/500/350" // Placeholder image
                  alt="Student learning electronics"
                  width={500}
                  height={350}
                  className="rounded-lg shadow-lg object-cover"
                  data-ai-hint="student engineer working electronics desk"
                />
            </div>
             <div className="space-y-4 text-center md:text-left">
              <h2 className="text-3xl font-bold">What is SmartPrep?</h2>
              <p className="text-muted-foreground text-lg">
                SmartPrep is your go-to resource for reinforcing core networking and electronics knowledge. Whether you're studying for an exam, refreshing your skills, or tackling a practical problem, our interactive quizzes and handy calculators provide the support you need.
              </p>
               <p className="text-muted-foreground text-lg">
                 Designed with clarity and ease-of-use in mind, SmartPrep helps bridge the gap between theory and application.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer /> {/* Add the Footer component */}
    </div>
  );
}
