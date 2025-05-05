
import Link from 'next/link';
import { Github } from 'lucide-react'; // Assuming you might want icons

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-muted text-muted-foreground py-6 mt-auto"> {/* mt-auto pushes footer down */}
      <div className="container mx-auto px-4 text-center md:flex md:justify-between md:items-center">
        <p className="text-sm mb-2 md:mb-0">
          &copy; {currentYear} SmartPrep. All rights reserved.
        </p>
        <div className="flex justify-center space-x-4 text-sm">
          <Link href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors flex items-center gap-1">
            <Github size={16} /> GitHub
          </Link>
           {/* Placeholder Links */}
          <Link href="#" className="hover:text-primary transition-colors">
            NetAcad (Placeholder)
          </Link>
          <Link href="#" className="hover:text-primary transition-colors">
            Privacy Policy
          </Link>
        </div>
      </div>
    </footer>
  );
}
