
import Link from 'next/link';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Calculator, Network, Palette, Sigma, TableIcon, Zap, CircuitBoard, Binary, Podcast, Info, BookOpen, Layers, Waves, Gem, Database, FileCode, Laptop, ListChecks } from 'lucide-react';
import Footer from '@/components/layout/Footer';

// Define featured tools data with updated icons and descriptions
const featuredTools = [
  {
    title: "🎧 Audio Lessons",
    description: "Listen and learn with focused lessons on networking and electronics.",
    icon: Podcast,
    link: "/audio",
    aiHint: "audio podcast lessons education",
    ctaText: "▶️ Browse Audio Library"
  },
  {
    title: "⚡ Flash Cards: Applied Networking",
    description: "Reinforce practical networking knowledge with interactive flash cards.",
    icon: Layers,
    link: "/flashcards/applied",
    aiHint: "flashcards networking applied study",
    ctaText: "Start Studying"
  },
  {
    title: "📚 Flash Cards: CCNA",
    description: "Review key CCNA concepts and terminologies with flash cards.",
    icon: BookOpen,
    link: "/flashcards/ccna",
    aiHint: "flashcards ccna cisco study",
    ctaText: "Start Studying"
  },
  {
    title: "📊 Flash Cards: Databases & Stats",
    description: "Test your knowledge on database fundamentals and statistical concepts.",
    icon: Database,
    link: "/flashcards/database",
    aiHint: "flashcards database statistics data study",
    ctaText: "Start Studying"
  },
  {
    title: "💻 Flash Cards: C Programming",
    description: "Master C language fundamentals, syntax, and core concepts.",
    icon: FileCode,
    link: "/flashcards/cprogramming",
    aiHint: "flashcards c language programming study code",
    ctaText: "Start Studying"
  },
  {
    title: "🖥️ Flash Cards: Operating Systems",
    description: "Explore core OS concepts, process management, memory, and file systems.",
    icon: Laptop,
    link: "/flashcards/operatingsystems",
    aiHint: "flashcards operating systems kernel study",
    ctaText: "Start Studying"
  },
  {
    title: "🐍 Flash Cards: Python & Networking",
    description: "Explore Python for network automation, scripting, and socket programming.",
    icon: FileCode,
    link: "/flashcards/pythonnetworking",
    aiHint: "flashcards python networking scripting study code",
    ctaText: "Start Studying"
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
    title: "Ohm's &amp; Power Calc",
    description: "Solve for Voltage (V), Current (I), Resistance (R), or Power (P) using Ohm's Law.",
    icon: Zap,
    link: "/calculator#power", // Links to specific section in calculator page
    aiHint: "ohms law power triangle formula",
    ctaText: "Open Tool"
  },
   {
    title: "BJT Solver",
    description: "Analyze fixed-bias common-emitter BJT circuits: find IB, IC, VCE, and saturation points.",
    icon: CircuitBoard,
    link: "/calculator#bjt", // Links to specific section in calculator page
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
   {
    title: "Converter Game",
    description: "Test your unit conversion skills. Convert values to engineering notation.",
    icon: Gem,
    link: "/tools/converter-game",
    aiHint: "units conversion game engineering notation practice",
    ctaText: "Play Game"
   },
   {
    title: "Voltage Divider Calc",
    description: "Calculate output voltage for a resistive voltage divider circuit (Vout = Vin * R2 / (R1 + R2)).",
    icon: Sigma,
    link: "/tools/voltage-divider",
    aiHint: "voltage divider resistors circuit",
    ctaText: "Open Tool"
  },
  {
    title: "Waveform Viewer",
    description: "Visualize Sine, Square, Triangle, and Sawtooth waveforms. Adjust parameters in real-time.",
    icon: Waves,
    link: "/tools/waveform",
    aiHint: "oscilloscope signal waveform electronics",
    ctaText: "Open Viewer"
  }
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
              <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start pt-4 flex-wrap">
                <Button asChild size="lg" className="shadow-lg hover:shadow-xl transition-shadow">
                  <Link href="/quiz">🎯 Start Quiz <ArrowRight className="ml-2 h-5 w-5" /></Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="shadow hover:shadow-md transition-shadow">
                  <Link href="/calculator">🧮 Open Calculators <Calculator className="ml-2 h-5 w-5" /></Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="shadow hover:shadow-md transition-shadow bg-accent/10 hover:bg-accent/20 text-accent-foreground border-accent/30">
                  <Link href="/audio">🎧 Audio Lessons <Podcast className="ml-2 h-5 w-5" /></Link>
                </Button>
              </div>
            </div>
            <div className="flex justify-center items-center">
                <Image
                  src="/images/network.jpg"
                  alt="Networking equipment and server rack"
                  width={600}
                  height={400}
                  className="rounded-xl shadow-2xl object-cover aspect-[4/3]"
                  data-ai-hint="network server rack data center ethernet cables switch"
                  priority
                />
            </div>
          </div>
        </section>

        {/* Plenty of Pi Card Section */}
        <section className="py-16 md:py-20 bg-secondary/20 dark:bg-background">
          <div className="container mx-auto px-4">
            <Card className="max-w-2xl mx-auto bg-card border border-border/60 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] dark:border-border/40">
              <CardHeader className="items-center text-center pt-8 pb-4">
                <div className="p-3 bg-accent/10 text-accent rounded-full mb-4 inline-block ring-1 ring-accent/20">
                  <span className="text-5xl font-bold text-accent">π</span>
                </div>
                <CardTitle className="text-3xl md:text-4xl font-bold text-foreground">Unlock the World of Numbers & Code</CardTitle>
                <CardDescription className="text-muted-foreground text-lg mt-2 max-w-md mx-auto">
                  Plenty of π offers interactive tools and engaging lessons to make learning math and computer science fun and accessible for everyone.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center pb-8">
                <Button asChild size="lg" className="shadow-lg hover:shadow-xl transition-shadow bg-accent text-accent-foreground hover:bg-accent/90">
                  <a href="https://plenty-of-pi.xyz" target="_blank" rel="noopener noreferrer">
                    Explore Plenty of π <ArrowRight className="ml-2 h-5 w-5" />
                  </a>
                </Button>
              </CardContent>
            </Card>
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
        
        {/* Recent Updates & Diagnostics Card Section */}
        <section className="py-16 md:py-20 bg-secondary/20 dark:bg-secondary/30">
          <div className="container mx-auto px-4">
            <Card className="max-w-2xl mx-auto bg-card border border-border/60 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] dark:border-border/40">
              <CardHeader className="items-center text-center pt-8 pb-4">
                <div className="p-3 bg-primary/10 text-primary rounded-full mb-4 inline-block ring-1 ring-primary/20">
                  <ListChecks size={32} />
                </div>
                <CardTitle className="text-3xl md:text-4xl font-bold text-foreground">Latest Updates</CardTitle>
                <CardDescription className="text-muted-foreground text-lg mt-2 max-w-md mx-auto">
                  Stay informed about new features and improvements.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center pb-8">
                <Button asChild size="lg" className="shadow-lg hover:shadow-xl transition-shadow">
                  <Link href="/diagnostics">
                    View Updates <Info className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* About Section - Updated Design */}
        <section className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4 grid md:grid-cols-2 gap-16 items-center">
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
