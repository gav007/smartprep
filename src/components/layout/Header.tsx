
import Link from 'next/link';
import { BookOpen, Calculator, Home as HomeIcon, Network } from 'lucide-react'; // Import icons

export default function Header() {
  return (
    <header className="bg-primary text-primary-foreground shadow-md">
      <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold tracking-tight flex items-center gap-2">
           {/* Using Network icon for consistency, could be a more generic logo */}
           <Network size={28} />
           SmartPrep
        </Link>
        <div className="space-x-6 flex items-center">
           {/* Simplified Navigation */}
           <Link href="/" className="hover:text-accent transition-colors flex items-center gap-1 text-sm">
            <HomeIcon size={16} />
             Home
          </Link>
          <Link href="/quiz" className="hover:text-accent transition-colors flex items-center gap-1 text-sm">
             <BookOpen size={16} />
            Quizzes
          </Link>
           <Link href="/calculator" className="hover:text-accent transition-colors flex items-center gap-1 text-sm">
            <Calculator size={16} />
             Calculators
          </Link>
           {/* Removed Op-Amp and Wave Rectifier specific links */}
        </div>
         {/* Placeholder for mobile menu toggle if needed */}
         {/* <button className="md:hidden"> <Menu size={24} /> </button> */}
      </nav>
    </header>
  );
}

