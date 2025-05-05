
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { BookOpen, Calculator, Home as HomeIcon, Network, TableIcon, Menu, X, Cpu } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { cn } from '@/lib/utils';

const navItems = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/quiz", label: "Quizzes", icon: BookOpen },
  { href: "/calculator", label: "Calculators", icon: Calculator },
  { href: "/tools/subnet", label: "Subnet", icon: Network },
  { href: "/tools/truth-table", label: "Truth Table", icon: TableIcon },
  { href: "/tools/resistor", label: "Resistor", icon: Cpu }, // Using Cpu as proxy for Resistor
];

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <nav className="container mx-auto px-4 h-16 flex justify-between items-center">
        {/* Logo/Brand Name */}
        <Link href="/" className="text-xl md:text-2xl font-bold tracking-tight flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
           <Network size={28} />
           SmartPrep
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex space-x-6 items-center text-sm font-medium">
          {navItems.map((item) => (
             <Link
              key={item.href}
              href={item.href}
              className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"
             >
              <item.icon size={16} />
              {item.label}
            </Link>
          ))}
        </div>

        {/* Mobile Navigation Trigger */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild className="md:hidden">
             <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open menu</span>
             </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full max-w-xs bg-background p-6">
             <div className="flex justify-between items-center mb-8">
                 <Link href="/" className="text-xl font-bold tracking-tight flex items-center gap-2 text-primary" onClick={() => setIsMobileMenuOpen(false)}>
                   <Network size={24} />
                   SmartPrep
                 </Link>
                <SheetClose asChild>
                     <Button variant="ghost" size="icon">
                        <X className="h-6 w-6" />
                         <span className="sr-only">Close menu</span>
                    </Button>
                 </SheetClose>
             </div>
             <nav className="flex flex-col space-y-4">
                 {navItems.map((item) => (
                    <SheetClose key={item.href} asChild>
                         <Link
                            href={item.href}
                            className={cn(
                                "text-lg font-medium text-foreground hover:text-primary transition-colors flex items-center gap-2 p-2 rounded-md hover:bg-muted"
                                // Add active link styling if needed using usePathname hook
                            )}
                         >
                            <item.icon size={20} />
                            {item.label}
                         </Link>
                    </SheetClose>
                 ))}
             </nav>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  );
}
