import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { Dashboard } from "@/pages/Dashboard";
import { GrievanceDetail } from "@/pages/GrievanceDetail";
import { CountyGuide } from "@/pages/CountyGuide";
import { HowItWorks } from "@/pages/HowItWorks";
import { FilingCalendar } from "@/pages/FilingCalendar";
import { Pricing } from "@/pages/Pricing";
import { CheckoutSuccess } from "@/pages/CheckoutSuccess";
import { CheckoutCancel } from "@/pages/CheckoutCancel";
import { Terms } from "@/pages/Terms";
import { Disclaimer } from "@/pages/Disclaimer";
import { Privacy } from "@/pages/Privacy";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/counties" component={CountyGuide} />
      <Route path="/how-it-works" component={HowItWorks} />
      <Route path="/calendar" component={FilingCalendar} />
      <Route path="/grievances/:id" component={GrievanceDetail} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/checkout/success" component={CheckoutSuccess} />
      <Route path="/checkout/cancel" component={CheckoutCancel} />
      <Route path="/terms" component={Terms} />
      <Route path="/disclaimer" component={Disclaimer} />
      <Route path="/privacy" component={Privacy} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
