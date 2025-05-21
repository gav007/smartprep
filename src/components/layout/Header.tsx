
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { BookOpen, Calculator, Home as HomeIcon, Network, TableIcon, Menu, X, Cpu, Zap, CircuitBoard, Palette, Binary, GitBranchPlus, Info, BrainCircuit, Podcast, Sigma, ChevronDown, Layers, Waves, Gem, Database, FileCode, Laptop, ListChecks, Moon, Sun } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetClose, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';


const navItems = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/quiz", label: "Quizzes", icon: BookOpen },
  { href: "/calculator", label: "Calculators", icon: Calculator },
  { href: "/audio", label: "Audio Lessons", icon: Podcast },
  {
    group: "Flashcards",
    icon: Layers,
    items: [
      { href: "/flashcards/applied", label: "Applied Networking", icon: Network },
      { href: "/flashcards/ccna", label: "CCNA Concepts", icon: BookOpen },
      { href: "/flashcards/database", label: "Databases & Statistics", icon: Database },
      { href: "/flashcards/cprogramming", label: "C Programming", icon: FileCode },
      { href: "/flashcards/operatingsystems", label: "Operating Systems", icon: Laptop },
      { href: "/flashcards/pythonnetworking", label: "Python & Networking", icon: FileCode },
    ]
  },
  {
    group: "Tools",
    icon: Cpu,
    items: [
      { href: "/tools/subnet", label: "Subnet", icon: Network },
      { href: "/tools/truth-table", label: "Truth Table", icon: TableIcon },
      { href: "/tools/resistor", label: "Resistor", icon: Palette },
      { href: "/tools/base-converter", label: "Base Converter", icon: Binary },
      { href: "/tools/converter-game", label: "Converter Game", icon: Gem },
      { href: "/tools/packet-flow", label: "Packet Flow", icon: GitBranchPlus },
      { href: "/tools/voltage-divider", label: "Voltage Divider", icon: Sigma },
      { href: "/tools/waveform", label: "Waveform Viewer", icon: Waves },
    ],
  },
   ...(process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_SHOW_DIAGNOSTICS === 'true' ? [{ href: "/diagnostics", label: "Diagnostics", icon: Info }] : []),
];

const renderNavLinks = (items: typeof navItems, closeSheet?: () => void, isMobile: boolean = false) => {
   const pathname = usePathname();

   return items.map((item, index) => {
     if ('group' in item) {
       const GroupIcon = item.icon || Cpu;
       if (isMobile) {
           return [
                <p key={`${item.group}-${index}-title`} className="px-2 pt-3 pb-1 text-xs font-semibold uppercase text-muted-foreground">{item.group}</p>,
                ...item.items.map(subItem => (
                    <SheetClose key={subItem.href} asChild>
                        <Link
                        href={subItem.href}
                        className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted hover:text-primary", // Adjusted py
                            pathname === subItem.href ? "bg-muted text-primary font-semibold" : "text-foreground"
                        )}
                        onClick={closeSheet}
                        >
                        <subItem.icon size={16} /> {/* Adjusted icon size */}
                        {subItem.label}
                        </Link>
                    </SheetClose>
                ))
           ];
       } else {
           // Desktop rendering for groups: Use DropdownMenu
           return (
             <DropdownMenu key={`${item.group}-${index}-dropdown`}>
               <DropdownMenuTrigger asChild>
                 <Button variant="ghost" className={cn(
                   "flex items-center gap-1 text-xs font-medium transition-colors hover:text-primary px-2 py-1 h-auto", // Compacted
                   item.items.some(sub => pathname.startsWith(sub.href) || pathname === sub.href) ? "text-primary" : "text-muted-foreground"
                 )}>
                   {item.icon && <GroupIcon size={14} />} {/* Compacted */}
                   {item.group}
                   <ChevronDown size={12} className="opacity-70 ml-0.5" /> {/* Compacted */}
                 </Button>
               </DropdownMenuTrigger>
               <DropdownMenuContent align="start" className="w-56"> {/* Adjusted width for longer item */}
                 {item.items.map(subItem => (
                   <DropdownMenuItem key={subItem.href} asChild>
                     <Link
                       href={subItem.href}
                       className={cn(
                         "flex items-center gap-2 w-full px-2 py-1 text-xs", // Compacted
                         pathname === subItem.href ? "bg-accent text-accent-foreground font-semibold" : "hover:bg-accent/50"
                       )}
                     >
                       <subItem.icon size={12} className="mr-1.5 opacity-80" /> {/* Compacted */}
                       {subItem.label}
                     </Link>
                   </DropdownMenuItem>
                 ))}
               </DropdownMenuContent>
             </DropdownMenu>
           );
       }
     } else {
       // Standard nav items (Home, Quizzes, etc.)
       if (isMobile) {
         return (
            <SheetClose key={item.href} asChild>
                <Link
                    href={item.href}
                     className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted hover:text-primary", // Adjusted py
                         pathname === item.href ? "bg-muted text-primary font-semibold" : "text-foreground"
                    )}
                    onClick={closeSheet}
                >
                    <item.icon size={16} /> {/* Adjusted icon size */}
                    {item.label}
                </Link>
            </SheetClose>
         );
       } else {
         return (
           <Link
             key={item.href}
             href={item.href}
             className={cn(
                "flex items-center gap-1 text-xs font-medium transition-colors hover:text-primary px-2 py-1 h-auto", // Compacted
                 pathname === item.href ? "text-primary" : "text-muted-foreground"
             )}
           >
             <item.icon size={14} /> {/* Compacted */}
             {item.label}
           </Link>
         );
       }
     }
   });
 };


export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light'); // Default to light

  // Effect to load theme from localStorage and apply it
  useEffect(() => {
    const storedTheme = localStorage.getItem('smartprep-theme') as 'light' | 'dark' | null;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = storedTheme || (systemPrefersDark ? 'dark' : 'light');
    setTheme(initialTheme);
  }, []);

  // Effect to update HTML class and localStorage when theme changes
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('smartprep-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container mx-auto flex h-14 max-w-7xl items-center justify-between px-4"> {/* Reduced height h-14 */}
        <Link href="/" className="flex items-center gap-1.5 text-lg md:text-xl font-bold tracking-tight text-primary transition-opacity hover:opacity-80" onClick={() => setIsMobileMenuOpen(false)}>
           <Network size={24} className="shrink-0"/> {/* Slightly smaller logo icon */}
           <span className="font-semibold">SmartPrep</span>
        </Link>

        <div className="flex items-center space-x-1"> {/* Container for nav and theme toggle */}
          <nav className="hidden md:flex flex-wrap items-center space-x-2 lg:space-x-3"> {/* Reduced spacing */}
               {renderNavLinks(navItems, undefined, false)}
          </nav>

          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme" className="ml-2">
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>

          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
               <Button variant="ghost" size="icon" aria-label="Open main menu">
                  <Menu className="h-5 w-5" /> {/* Smaller burger */}
               </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full max-w-xs bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden">
               <SheetHeader className="flex flex-row h-14 items-center justify-between border-b px-4">
                   <Link href="/" className="flex items-center gap-2 text-lg font-bold text-primary" onClick={() => setIsMobileMenuOpen(false)}>
                      <Network size={20} />
                      SmartPrep
                   </Link>
                  <SheetClose asChild>
                       <Button variant="ghost" size="icon" aria-label="Close main menu">
                          <X className="h-5 w-5" />
                      </Button>
                   </SheetClose>
               </SheetHeader>
               <nav className="flex flex-col space-y-1 p-3"> {/* Adjusted padding */}
                   {renderNavLinks(navItems, () => setIsMobileMenuOpen(false), true)}
               </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
