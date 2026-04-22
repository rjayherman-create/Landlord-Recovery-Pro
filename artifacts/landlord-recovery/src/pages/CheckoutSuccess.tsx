import { CheckCircle2, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function CheckoutSuccess() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-md text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
        </div>
        <div>
          <h1 className="text-3xl font-serif font-bold mb-2">Payment Successful</h1>
          <p className="text-muted-foreground text-lg">
            Welcome to Recovery Pro. You now have full access to AI demand letters,
            premium document exports, and court-specific filing instructions.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button asChild className="bg-primary">
            <Link to="/dashboard">
              Go to Dashboard <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/cases/new">Start a New Case</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
