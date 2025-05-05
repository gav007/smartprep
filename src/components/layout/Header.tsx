import Link from 'next/link';
import { Network, Calculator } from 'lucide-react'; // Import icons

export default function Header() {
  return (
    <header className="bg-primary text-primary-foreground shadow-md">
      <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold tracking-tight flex items-center gap-2">
           <Network size={28} /> {/* Added icon */}
           SmartPrep
        </Link>
        <div className="space-x-4">
          <Link href="/quiz" className="hover:text-accent transition-colors">
            Quizzes
          </Link>
          {/* Link to future calculator page */}
           <Link href="/calculator" className="hover:text-accent transition-colors flex items-center gap-1">
            <Calculator size={16} />
             Calculator (Soon)
          </Link>
        </div>
      </nav>
    </header>
  );
}
