import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
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
import { DashboardPage } from "@/pages/DashboardPage";
import { NewClaimPage } from "@/pages/NewClaimPage";
import CaseListPage from "@/pages/CaseListPage";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/new-claim" element={<NewClaimPage />} />
        <Route path="/file" element={<FileWizard />} />
        <Route path="/cases" element={<Cases />} />
        <Route path="/case-list" element={<CaseListPage />} />
        <Route path="/guide" element={<Guide />} />
        <Route path="/counties" element={<Counties />} />
        <Route path="/checkout/success" element={<CheckoutSuccess />} />
        <Route path="/checkout/cancel" element={<CheckoutCancel />} />
        <Route path="/disclaimer" element={<Disclaimer />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/refund" element={<RefundPolicy />} />
        <Route path="/what-happens-next" element={<WhatHappensNext />} />
        <Route path="/cases/:id" element={<CaseDashboard />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
