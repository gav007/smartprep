
import Link from 'next/link';
import { Github } from 'lucide-react'; // Assuming you might want icons

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const appVersion = process.env.npm_package_version || "1.0.0"; // Get version from package.json

  return (
    <footer className="bg-muted text-muted-foreground py-6 mt-auto border-t"> {/* mt-auto pushes footer down, added border */}
      <div className="container mx-auto px-4 text-center md:flex md:justify-between md:items-center">
        <p className="text-sm mb-2 md:mb-0">
          &copy; {currentYear} SmartPrep. v{appVersion} Beta
        </p>
        <div className="flex justify-center space-x-4 text-sm">
          {/* Using target="_blank" and rel="noopener noreferrer" for external links */}
          <Link href="https://github.com/gav007" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors flex items-center gap-1">
            <Github size={16} /> GitHub
 </Link>
          <a href="https://www.citizensinformation.ie/en/government-in-ireland/data-protection/overview-of-general-data-protection-regulation" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
            Privacy Policy
          </a>
           <a href="mailto:gav.s.may.business@gmail.com" className="hover:text-primary transition-colors">
            Contact
          </a>

           {/* Optional: Link to NetAcad or other resources */}
          {/* <Link href="#" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
            NetAcad
          </Link> */}
        </div>
      </div>
    </footer>
  );
}

    