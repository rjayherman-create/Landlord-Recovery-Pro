import { Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Map, Calendar } from "lucide-react";

export default function NotFound() {
  return (
    <AppLayout>
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center py-20">
        <div className="text-8xl font-serif font-black text-primary/10 mb-4 select-none">404</div>
        <h1 className="text-2xl font-serif font-bold text-foreground mb-2">Page not found</h1>
        <p className="text-muted-foreground max-w-sm mb-8 text-sm leading-relaxed">
          The page you're looking for doesn't exist. You may have followed a broken link or mistyped the address.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link href="/">
            <Button className="gap-2">
              <Home className="w-4 h-4" /> Go to Dashboard
            </Button>
          </Link>
          <Link href="/counties">
            <Button variant="outline" className="gap-2">
              <Map className="w-4 h-4" /> County Guide
            </Button>
          </Link>
          <Link href="/calendar">
            <Button variant="outline" className="gap-2">
              <Calendar className="w-4 h-4" /> Filing Deadlines
            </Button>
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
