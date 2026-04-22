import { AppLayout } from "@/components/layout/AppLayout";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Cases from "@/pages/Cases";
import NewCase from "@/pages/NewCase";
import CaseDetail from "@/pages/CaseDetail";
import HowItWorks from "@/pages/HowItWorks";
import Resources from "@/pages/Resources";
import Pricing from "@/pages/Pricing";
import Documents from "@/pages/Documents";
import ServeTenant from "@/pages/ServeTenant";
import CheckoutSuccess from "@/pages/CheckoutSuccess";
import CheckoutCancel from "@/pages/CheckoutCancel";
import CourtLocator from "@/pages/CourtLocator";

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
    <AppLayout>
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/cases" component={Cases} />
        <Route path="/cases/new" component={NewCase} />
        <Route path="/cases/:id" component={CaseDetail} />
        <Route path="/cases/:id/serve-tenant" component={ServeTenant} />
        <Route path="/court-locator" component={CourtLocator} />
        <Route path="/checkout/success" component={CheckoutSuccess} />
        <Route path="/checkout/cancel" component={CheckoutCancel} />
        <Route path="/how-it-works" component={HowItWorks} />
        <Route path="/resources" component={Resources} />
        <Route path="/pricing" component={Pricing} />
        <Route path="/documents" component={Documents} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base="/landlord-recovery">
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
