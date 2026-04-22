import { XCircle } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function CheckoutCancel() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-md text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
            <XCircle className="h-12 w-12 text-muted-foreground" />
          </div>
        </div>
        <div>
          <h1 className="text-3xl font-serif font-bold mb-2">Payment Cancelled</h1>
          <p className="text-muted-foreground text-lg">
            No charge was made. You can upgrade to Recovery Pro at any time.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button asChild className="bg-primary">
            <Link to="/pricing">Back to Pricing</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/dashboard">Go to Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
