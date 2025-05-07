
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { BookOpen, Calculator, Home as HomeIcon, Network, TableIcon, Menu, X, Cpu, Zap, CircuitBoard, Palette, Binary, GitBranchPlus, Info, BrainCircuit, Podcast, Sigma, ChevronDown } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
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
    group: "Tools",
    icon: Cpu, // Icon for the dropdown trigger itself
    items: [
      { href: "/tools/subnet", label: "Subnet", icon: Network },
      { href: "/tools/truth-table", label: "Truth Table", icon: TableIcon },
      { href: "/tools/resistor", label: "Resistor", icon: Palette },
      { href: "/tools/base-converter", label: "Base Converter", icon: Binary },
      { href: "/tools/packet-flow", label: "Packet Flow", icon: GitBranchPlus },
      { href: "/tools/voltage-divider", label: "Voltage Divider", icon: Sigma }, // Added
    ],
  },
   ...(process.env.NODE_ENV === 'development' ? [{ href: "/diagnostics", label: "Diagnostics", icon: Info }] : []),
];

const renderNavLinks = (items: typeof navItems, closeSheet?: () => void, isMobile: boolean = false) => {
   const pathname = usePathname();

   return items.map((item, index) => {
     if ('group' in item) {
       const GroupIcon = item.icon || Cpu;
       if (isMobile) {
           return [
                <p key={`${item.group}-${index}-title`} className="px-2 pt-4 pb-1 text-xs font-semibold uppercase text-muted-foreground">{item.group}</p>,
                ...item.items.map(subItem => (
                    <SheetClose key={subItem.href} asChild>
                        <Link
                        href={subItem.href}
                        className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-2 text-base font-medium transition-colors hover:bg-muted hover:text-primary",
                            pathname === subItem.href ? "bg-muted text-primary font-semibold" : "text-foreground"
                        )}
                        onClick={closeSheet}
                        >
                        <subItem.icon size={18} />
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
                   "flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-primary",
                   item.items.some(sub => pathname.startsWith(sub.href)) ? "text-primary" : "text-muted-foreground"
                 )}>
                   {item.icon && <GroupIcon size={16} />}
                   {item.group}
                   <ChevronDown size={14} className="opacity-70 ml-1" />
                 </Button>
               </DropdownMenuTrigger>
               <DropdownMenuContent align="start" className="w-56">
                 {item.items.map(subItem => (
                   <DropdownMenuItem key={subItem.href} asChild>
                     <Link
                       href={subItem.href}
                       className={cn(
                         "flex items-center gap-2 w-full px-2 py-1.5 text-sm",
                         pathname === subItem.href ? "bg-accent text-accent-foreground font-semibold" : "hover:bg-accent/50"
                       )}
                     >
                       <subItem.icon size={14} className="mr-2 opacity-80" />
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
                        "flex items-center gap-3 rounded-md px-3 py-2 text-base font-medium transition-colors hover:bg-muted hover:text-primary",
                         pathname === item.href ? "bg-muted text-primary font-semibold" : "text-foreground"
                    )}
                    onClick={closeSheet}
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
        <Link href="/" className="flex items-center gap-2 text-xl md:text-2xl font-bold tracking-tight text-primary transition-opacity hover:opacity-80" onClick={() => setIsMobileMenuOpen(false)}>
           <Network size={28} className="shrink-0"/>
           <span className="font-semibold">SmartPrep TU 716</span>
        </Link>

        <nav className="hidden md:flex flex-wrap items-center space-x-4 lg:space-x-6"> {/* Adjusted spacing */}
             {renderNavLinks(navItems, undefined, false)}
        </nav>

        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild className="md:hidden">
             <Button variant="ghost" size="icon" aria-label="Open main menu">
                <Menu className="h-6 w-6" />
             </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full max-w-xs bg-background p-0">
             <SheetHeader className="flex flex-row h-16 items-center justify-between border-b px-4">
                <SheetTitle> 
                  <Link href="/" className="flex items-center gap-2 text-xl font-bold text-primary" onClick={() => setIsMobileMenuOpen(false)}>
                    <Network size={24} />
                    SmartPrep
                  </Link>
                </SheetTitle>
                <SheetClose asChild>
                     <Button variant="ghost" size="icon" aria-label="Close main menu">
                        <X className="h-6 w-6" />
                    </Button>
                 </SheetClose>
             </SheetHeader>
             <nav className="flex flex-col space-y-1 p-4">
                 {renderNavLinks(navItems, () => setIsMobileMenuOpen(false), true)}
             </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

