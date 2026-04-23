import { Link, useLocation } from "wouter";
import { Home, FileText, Settings, Menu, PieChart, Info, BookOpen, CreditCard, Library, X, User, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { Show, UserButton, SignInButton } from "@clerk/react";
import { useClerkEnabled } from "@/context/ClerkEnabled";
import { useSubscription, openBillingPortal } from "@/hooks/useSubscription";

const logoUrl = `${import.meta.env.BASE_URL}logo.svg`;

function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const imgClass = size === "sm" ? "h-6 w-6" : size === "lg" ? "h-9 w-9" : "h-7 w-7";
  const textClass = size === "sm" ? "text-base" : size === "lg" ? "text-xl" : "text-lg";
  return (
    <span className="flex items-center gap-2">
      <img src={logoUrl} alt="Landlord Recovery" className={imgClass} />
      <span className={`font-serif font-semibold ${textClass} tracking-tight`}>Landlord Recovery</span>
    </span>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const clerkEnabled = useClerkEnabled();
  const { data: subscription } = useSubscription();

  const isMarketing = location === "/" || location === "/how-it-works" || location === "/resources" || location === "/pricing" || location === "/documents";

  if (isMarketing) {
    const marketingLinks = [
      { href: "/how-it-works", label: "How it Works" },
      { href: "/documents", label: "Document Library" },
      { href: "/resources", label: "State Limits" },
      { href: "/pricing", label: "Pricing" },
    ];

    return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/">
              <Logo />
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
              {marketingLinks.map(({ href, label }) => (
                <Link key={href} href={href} className={`transition-colors hover:text-foreground/80 ${location === href ? 'text-foreground' : 'text-foreground/60'}`}>
                  {label}
                </Link>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-4">
              {clerkEnabled ? (
                <>
                  <Show when="signed-out">
                    <SignInButton mode="modal">
                      <button className="text-sm font-medium text-foreground/60 hover:text-foreground">Sign In</button>
                    </SignInButton>
                  </Show>
                  <Show when="signed-in">
                    <UserButton appearance={{ elements: { avatarBox: "w-8 h-8" } }} />
                  </Show>
                </>
              ) : null}
              <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Link href="/cases/new">Get Started</Link>
              </Button>
            </div>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 p-0 flex flex-col">
                <div className="h-16 flex items-center px-6 border-b">
                  <Logo />
                </div>
                <nav className="flex-1 py-6 px-4 space-y-1">
                  {marketingLinks.map(({ href, label }) => (
                    <Link
                      key={href}
                      href={href}
                      className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${location === href ? 'bg-muted text-foreground' : 'text-foreground/70 hover:bg-muted/50 hover:text-foreground'}`}
                    >
                      {label}
                    </Link>
                  ))}
                </nav>
                <div className="p-4 border-t flex flex-col gap-2">
                  {clerkEnabled ? (
                    <>
                      <Show when="signed-out">
                        <SignInButton mode="modal">
                          <Button variant="outline" className="w-full">Sign In</Button>
                        </SignInButton>
                      </Show>
                      <Show when="signed-in">
                        <UserButton appearance={{ elements: { avatarBox: "w-8 h-8" } }} />
                      </Show>
                    </>
                  ) : null}
                  <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90" asChild>
                    <Link href="/cases/new">Get Started</Link>
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </header>

        <main className="flex-1">
          {children}
        </main>

        <footer className="bg-primary text-primary-foreground py-12">
          <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src={logoUrl} alt="Landlord Recovery" className="h-7 w-7" />
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

  // ── App Layout (authenticated pages) ───────────────────────────────────────
  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-sidebar text-sidebar-foreground">
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
          <Link href="/dashboard">
            <Logo />
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

        <div className="p-4 border-t border-sidebar-border space-y-2">
          {subscription?.isPro && (
            <button
              onClick={() => openBillingPortal().catch(() => {})}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium text-accent bg-accent/10 hover:bg-accent/20 transition-colors"
            >
              <Zap className="h-3.5 w-3.5" />
              Pro Plan — Manage Billing
            </button>
          )}
          {clerkEnabled ? (
            <>
              <Show when="signed-in">
                <div className="flex items-center gap-3 px-1">
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox: "w-8 h-8",
                        userButtonTrigger: "focus:shadow-none",
                      },
                    }}
                  />
                  <span className="text-sm text-sidebar-foreground/70">Account</span>
                </div>
              </Show>
              <Show when="signed-out">
                <SignInButton mode="modal">
                  <Button variant="ghost" className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50">
                    <User className="h-4 w-4 mr-2" />
                    Sign In
                  </Button>
                </SignInButton>
              </Show>
            </>
          ) : null}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="md:hidden h-16 border-b bg-background flex items-center px-4 justify-between">
          <Link href="/dashboard">
            <Logo size="sm" />
          </Link>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-sidebar text-sidebar-foreground border-sidebar-border p-0 flex flex-col">
              <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
                <Logo />
              </div>
              <div className="flex-1 py-6 px-3 space-y-1">
                {[
                  { href: "/dashboard", icon: <PieChart className="h-4 w-4" />, label: "Overview" },
                  { href: "/cases", icon: <FileText className="h-4 w-4" />, label: "My Cases" },
                  { href: "/documents", icon: <Library className="h-4 w-4" />, label: "Documents" },
                ].map(({ href, icon, label }) => (
                  <Link key={href} href={href} className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${(href === '/cases' ? location.startsWith('/cases') : location === href) ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'}`}>
                    {icon} {label}
                  </Link>
                ))}
                <div className="pt-6 pb-2 px-3">
                  <h4 className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">Resources</h4>
                </div>
                {[
                  { href: "/how-it-works", icon: <Info className="h-4 w-4" />, label: "Guide" },
                  { href: "/resources", icon: <BookOpen className="h-4 w-4" />, label: "State Limits" },
                ].map(({ href, icon, label }) => (
                  <Link key={href} href={href} className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${location === href ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'}`}>
                    {icon} {label}
                  </Link>
                ))}
              </div>
              <div className="p-4 border-t border-sidebar-border space-y-2">
                {subscription?.isPro && (
                  <button
                    onClick={() => openBillingPortal().catch(() => {})}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium text-accent bg-accent/10 hover:bg-accent/20 transition-colors"
                  >
                    <Zap className="h-3.5 w-3.5" />
                    Pro Plan — Manage Billing
                  </button>
                )}
                {clerkEnabled ? (
                  <>
                    <Show when="signed-in">
                      <div className="flex items-center gap-3 px-1">
                        <UserButton appearance={{ elements: { avatarBox: "w-8 h-8" } }} />
                        <span className="text-sm text-sidebar-foreground/70">Account</span>
                      </div>
                    </Show>
                    <Show when="signed-out">
                      <SignInButton mode="modal">
                        <Button variant="ghost" className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50">
                          <User className="h-4 w-4 mr-2" />
                          Sign In
                        </Button>
                      </SignInButton>
                    </Show>
                  </>
                ) : null}
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
