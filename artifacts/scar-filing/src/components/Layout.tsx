import { Link, useLocation } from "wouter";
import { ReactNode } from "react";
import { Scale } from "lucide-react";

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/file", label: "File a Case" },
    { href: "/cases", label: "My Cases" },
    { href: "/guide", label: "Guide" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
            <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center">
              <Scale className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-serif font-semibold text-base">SmallClaims AI</span>
          </Link>
          <nav className="hidden sm:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  location === item.href
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <Link
            href="/file"
            className="bg-primary text-primary-foreground text-sm font-medium px-3 py-1.5 rounded-md hover:opacity-90 transition-opacity"
          >
            File Now
          </Link>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t border-border mt-auto">
        <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Scale className="w-3.5 h-3.5" />
            <span>SmallClaims AI — Not a law firm. Not legal advice.</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/guide" className="hover:text-foreground transition-colors">Filing Guide</Link>
            <Link href="/cases" className="hover:text-foreground transition-colors">My Cases</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
