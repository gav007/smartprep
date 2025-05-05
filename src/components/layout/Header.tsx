
import Link from 'next/link';
import { BookOpen, Calculator, Home as HomeIcon, Network, TableIcon } from 'lucide-react'; // Added TableIcon

export default function Header() {
  return (
    <header className="bg-primary text-primary-foreground shadow-md">
      <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold tracking-tight flex items-center gap-2">
           <Network size={28} />
           SmartPrep
        </Link>
        <div className="space-x-4 md:space-x-6 flex items-center text-sm">
           <Link href="/" className="hover:text-accent transition-colors flex items-center gap-1">
            <HomeIcon size={16} />
             Home
          </Link>
          <Link href="/quiz" className="hover:text-accent transition-colors flex items-center gap-1">
             <BookOpen size={16} />
            Quizzes
          </Link>
           <Link href="/calculator" className="hover:text-accent transition-colors flex items-center gap-1">
            <Calculator size={16} />
             Calculators
          </Link>
           <Link href="/tools/subnet" className="hover:text-accent transition-colors flex items-center gap-1">
              <Network size={16} /> {/* Reusing Network icon for subnet */}
             Subnet Calc
           </Link>
           <Link href="/tools/truth-table" className="hover:text-accent transition-colors flex items-center gap-1">
              <TableIcon size={16} />
              Truth Table
           </Link>
             <Link href="/tools/resistor" className="hover:text-accent transition-colors flex items-center gap-1">
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circuit-board"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M11 9h4a2 2 0 0 0 2-2V3"/><path d="M11 15h4a2 2 0 0 1 2 2v4"/><path d="M14 15V9h-4"/><path d="M7 9v6"/><path d="M7 9H3"/><path d="M7 15H3"/><path d="M17 9v6"/><path d="M17 15h4"/><path d="M17 9h4"/></svg> {/* Inline SVG for resistor-like icon */}
               Resistor Calc
           </Link>
           {/* Removed Op-Amp and Wave Rectifier specific links */}
        </div>
         {/* Placeholder for mobile menu toggle if needed */}
         {/* <button className="md:hidden"> <Menu size={24} /> </button> */}
      </nav>
    </header>
  );
}
