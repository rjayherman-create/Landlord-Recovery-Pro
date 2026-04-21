import { Link, useLocation } from "wouter";
import { Scale, Home, FileText, Settings, LogOut, Menu, PieChart, Info, BookOpen, CreditCard, Library } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const isMarketing = location === "/" || location === "/how-it-works" || location === "/resources" || location === "/pricing";

  if (isMarketing) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <div className="bg-primary text-primary-foreground p-1.5 rounded">
                <Scale className="h-5 w-5" />
              </div>
              <span className="font-serif font-semibold text-lg">Landlord Recovery</span>
            </Link>
            
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
              <Link href="/how-it-works" className={`transition-colors hover:text-foreground/80 ${location === '/how-it-works' ? 'text-foreground' : 'text-foreground/60'}`}>How it Works</Link>
              <Link href="/resources" className={`transition-colors hover:text-foreground/80 ${location === '/resources' ? 'text-foreground' : 'text-foreground/60'}`}>Resources</Link>
              <Link href="/pricing" className={`transition-colors hover:text-foreground/80 ${location === '/pricing' ? 'text-foreground' : 'text-foreground/60'}`}>Pricing</Link>
            </nav>
            
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="hidden md:block text-sm font-medium text-foreground/60 hover:text-foreground">Sign In</Link>
              <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Link href="/dashboard">Get Started</Link>
              </Button>
            </div>
          </div>
        </header>
        <main className="flex-1">
          {children}
        </main>
        <footer className="bg-primary text-primary-foreground py-12">
          <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Scale className="h-5 w-5 text-accent" />
                <span className="font-serif font-semibold text-lg">Landlord Recovery</span>
              </div>
              <p className="text-sm text-primary-foreground/70">
                Empowering landlords to recover what's theirs without the expense of a lawyer.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-primary-foreground/70">
                <li><Link href="/how-it-works" className="hover:text-white">How it Works</Link></li>
                <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link href="/dashboard" className="hover:text-white">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-primary-foreground/70">
                <li><Link href="/resources" className="hover:text-white">State Limits</Link></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-primary-foreground/70">
                <li><a href="#" className="hover:text-white">Contact Us</a></li>
                <li><a href="#" className="hover:text-white">Help Center</a></li>
              </ul>
            </div>
          </div>
          <div className="container mx-auto px-4 mt-12 pt-8 border-t border-primary-foreground/10 text-sm text-primary-foreground/50 text-center">
            &copy; {new Date().getFullYear()} Landlord Recovery. All rights reserved. Not a law firm.
          </div>
        </footer>
      </div>
    );
  }

  // App Layout
  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-sidebar text-sidebar-foreground">
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="bg-sidebar-primary text-sidebar-primary-foreground p-1.5 rounded">
              <Scale className="h-5 w-5" />
            </div>
            <span className="font-serif font-semibold text-lg tracking-tight">Landlord Recovery</span>
          </Link>
        </div>
        
        <div className="flex-1 py-6 px-3">
          <nav className="space-y-1">
            <Link href="/dashboard" className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${location === '/dashboard' ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'}`}>
              <PieChart className="h-4 w-4" />
              Overview
            </Link>
            <Link href="/cases" className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${location.startsWith('/cases') ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'}`}>
              <FileText className="h-4 w-4" />
              My Cases
            </Link>
            <Link href="/documents" className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${location === '/documents' ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'}`}>
              <Library className="h-4 w-4" />
              Documents
            </Link>
          </nav>
          
          <div className="mt-8 mb-4 px-3">
            <h4 className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">Resources</h4>
          </div>
          <nav className="space-y-1">
            <Link href="/how-it-works" className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${location === '/how-it-works' ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'}`}>
              <Info className="h-4 w-4" />
              Guide
            </Link>
            <Link href="/resources" className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${location === '/resources' ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'}`}>
              <BookOpen className="h-4 w-4" />
              State Limits
            </Link>
          </nav>
        </div>
        
        <div className="p-4 border-t border-sidebar-border">
          <Button variant="ghost" className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden h-16 border-b bg-background flex items-center px-4 justify-between">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <Scale className="h-5 w-5 text-primary" />
            <span className="font-serif font-semibold">Landlord Recovery</span>
          </Link>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 bg-sidebar text-sidebar-foreground border-sidebar-border p-0">
              <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
                <span className="font-serif font-semibold text-lg tracking-tight">Menu</span>
              </div>
              <div className="py-4 px-2 space-y-1">
                <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium hover:bg-sidebar-accent/50">
                  <PieChart className="h-4 w-4" /> Overview
                </Link>
                <Link href="/cases" className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium hover:bg-sidebar-accent/50">
                  <FileText className="h-4 w-4" /> My Cases
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </header>
        
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
