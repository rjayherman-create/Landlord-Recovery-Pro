import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/Layout";

// Pages
import { Home } from "@/pages/Home";
import { FileWizard } from "@/pages/FileWizard";
import { Cases } from "@/pages/Cases";
import { Guide } from "@/pages/Guide";
import { Counties } from "@/pages/Counties";
import { CheckoutSuccess } from "@/pages/CheckoutSuccess";
import { CheckoutCancel } from "@/pages/CheckoutCancel";
import { Disclaimer } from "@/pages/Disclaimer";
import { Terms } from "@/pages/Terms";
import { RefundPolicy } from "@/pages/RefundPolicy";
import { WhatHappensNext } from "@/pages/WhatHappensNext";
import { CaseDashboard } from "@/pages/CaseDashboard";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/file" component={FileWizard} />
        <Route path="/cases" component={Cases} />
        <Route path="/guide" component={Guide} />
        <Route path="/counties" component={Counties} />
        <Route path="/checkout/success" component={CheckoutSuccess} />
        <Route path="/checkout/cancel" component={CheckoutCancel} />
        <Route path="/disclaimer" component={Disclaimer} />
        <Route path="/terms" component={Terms} />
        <Route path="/refund" component={RefundPolicy} />
        <Route path="/what-happens-next" component={WhatHappensNext} />
        <Route path="/cases/:id" component={CaseDashboard} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
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
