
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { BookOpen, Calculator, Home as HomeIcon, Network, TableIcon, Menu, X, Cpu, Zap, CircuitBoard, Palette, Binary, GitBranchPlus, Info } from 'lucide-react'; // Added Info icon
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet"; // Import SheetHeader and SheetTitle
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation'; // Import usePathname for active link styling


// Updated Nav Items for clarity and relevance
const navItems = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/quiz", label: "Quizzes", icon: BookOpen },
  { href: "/calculator", label: "Calculators", icon: Calculator },
  {
    group: "Tools", // Group related tools
    items: [
      { href: "/tools/subnet", label: "Subnet", icon: Network },
      { href: "/tools/truth-table", label: "Truth Table", icon: TableIcon },
      { href: "/tools/resistor", label: "Resistor", icon: Palette },
      { href: "/tools/base-converter", label: "Base Converter", icon: Binary },
      { href: "/tools/packet-flow", label: "Packet Flow", icon: GitBranchPlus },
    ],
  },
   // Add Diagnostics link - consider conditional rendering based on environment
   ...(process.env.NODE_ENV === 'development' ? [{ href: "/diagnostics", label: "Diagnostics", icon: Info }] : []),
];

// Function to render navigation links, handling groups
const renderNavLinks = (items: typeof navItems, closeSheet?: () => void, isMobile: boolean = false) => {
   const pathname = usePathname(); // Get current path

   return items.flatMap((item) => {
     if ('group' in item) {
       // Handle dropdown/group for desktop (optional, keeping it simple for now)
       // For mobile, render group items directly
       if (isMobile) {
           return [
                <p key={item.group} className="px-2 pt-4 pb-1 text-xs font-semibold uppercase text-muted-foreground">{item.group}</p>,
                ...item.items.map(subItem => (
                    <SheetClose key={subItem.href} asChild>
                        <Link
                        href={subItem.href}
                        className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-2 text-base font-medium transition-colors hover:bg-muted hover:text-primary",
                            pathname === subItem.href ? "bg-muted text-primary font-semibold" : "text-foreground"
                        )}
                        >
                        <subItem.icon size={18} />
                        {subItem.label}
                        </Link>
                    </SheetClose>
                ))
           ];
       } else {
          // Desktop: Render group items directly in the main nav for simplicity
           return item.items.map(subItem => (
               <Link
                key={subItem.href}
                href={subItem.href}
                className={cn(
                    "flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-primary",
                    pathname === subItem.href ? "text-primary" : "text-muted-foreground"
                )}
                >
                <subItem.icon size={16} />
                {subItem.label}
                </Link>
            ));
       }
     } else {
       // Regular link
       if (isMobile) {
         return (
            <SheetClose key={item.href} asChild>
                <Link
                    href={item.href}
                     className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-base font-medium transition-colors hover:bg-muted hover:text-primary",
                         pathname === item.href ? "bg-muted text-primary font-semibold" : "text-foreground"
                    )}
                >
                    <item.icon size={18} />
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
                "flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-primary",
                 pathname === item.href ? "text-primary" : "text-muted-foreground"
             )}
           >
             <item.icon size={16} />
             {item.label}
           </Link>
         );
       }
     }
   });
 };


export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* Logo/Brand Name */}
        <Link href="/" className="flex items-center gap-2 text-xl md:text-2xl font-bold tracking-tight text-primary transition-opacity hover:opacity-80" onClick={() => setIsMobileMenuOpen(false)}>
           <Network size={28} className="shrink-0"/>
           <span className="font-semibold">SmartPrep TU 716</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex flex-wrap items-center space-x-6"> {/* Added flex-wrap */}
             {renderNavLinks(navItems, undefined, false)}
        </nav>

        {/* Mobile Navigation Trigger */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild className="md:hidden">
             <Button variant="ghost" size="icon" aria-label="Open main menu">
                <Menu className="h-6 w-6" />
             </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full max-w-xs bg-background p-0">
             {/* Mobile Menu Header */}
             <SheetHeader className="flex flex-row h-16 items-center justify-between border-b px-4"> {/* Use SheetHeader */}
                 <Link href="/" className="flex items-center gap-2 text-xl font-bold text-primary" onClick={() => setIsMobileMenuOpen(false)}>
                   <Network size={24} />
                    {/* Visually hidden title for accessibility */}
                   <SheetTitle className="sr-only">Main Navigation Menu</SheetTitle>
                   SmartPrep
                 </Link>
                <SheetClose asChild>
                     <Button variant="ghost" size="icon" aria-label="Close main menu">
                        <X className="h-6 w-6" />
                    </Button>
                 </SheetClose>
             </SheetHeader>
             {/* Mobile Menu Links */}
             <nav className="flex flex-col space-y-1 p-4">
                 {renderNavLinks(navItems, () => setIsMobileMenuOpen(false), true)}
             </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
