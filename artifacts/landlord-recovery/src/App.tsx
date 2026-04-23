import { useEffect, useRef } from "react";
import { ClerkProvider, useClerk } from "@clerk/react";
import { shadcn } from "@clerk/themes";
import { AppLayout } from "@/components/layout/AppLayout";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ClerkEnabledContext } from "@/context/ClerkEnabled";
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
import SignInPage from "@/pages/SignInPage";
import SignUpPage from "@/pages/SignUpPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
// Only use proxy URL if it's a real domain (not the placeholder)
const _rawProxy = import.meta.env.VITE_CLERK_PROXY_URL;
const clerkProxyUrl = _rawProxy && !_rawProxy.includes("your-domain") ? _rawProxy : undefined;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(222, 47%, 11%)",
    colorForeground: "hsl(222, 47%, 11%)",
    colorMutedForeground: "hsl(215, 16%, 47%)",
    colorDanger: "hsl(0, 84%, 60%)",
    colorBackground: "#ffffff",
    colorInput: "#ffffff",
    colorInputForeground: "hsl(222, 47%, 11%)",
    colorNeutral: "hsl(214, 32%, 91%)",
    colorModalBackdrop: "rgba(14, 28, 49, 0.7)",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full",
    cardBox: "bg-white rounded-2xl w-[440px] max-w-full overflow-hidden shadow-xl",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-foreground font-serif",
    headerSubtitle: "text-muted-foreground",
    socialButtonsBlockButtonText: "text-foreground",
    formFieldLabel: "text-foreground font-medium",
    footerActionLink: "text-primary font-medium",
    footerActionText: "text-muted-foreground",
    dividerText: "text-muted-foreground",
    identityPreviewEditButton: "text-primary",
    formFieldSuccessText: "text-green-600",
    alertText: "text-foreground",
    formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90",
    formFieldInput: "border-border bg-background text-foreground",
    footerAction: "bg-muted/30",
    dividerLine: "bg-border",
    logoBox: "h-12",
    logoImage: "h-full w-auto",
    socialButtonsBlockButton: "border-border",
    alert: "bg-muted/30",
    otpCodeFieldInput: "border-border",
    formFieldRow: "",
    main: "",
  },
};

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />
      <Route>
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
      </Route>
    </Switch>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  if (!clerkPubKey) {
    return (
      <ClerkEnabledContext.Provider value={false}>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Router />
            <Toaster />
          </TooltipProvider>
        </QueryClientProvider>
      </ClerkEnabledContext.Provider>
    );
  }

  return (
    <ClerkEnabledContext.Provider value={true}>
      <ClerkProvider
        publishableKey={clerkPubKey}
        proxyUrl={clerkProxyUrl}
        appearance={clerkAppearance}
        signInUrl={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
        localization={{
          signIn: {
            start: { title: "Welcome back", subtitle: "Sign in to manage your recovery cases" },
          },
          signUp: {
            start: { title: "Create your account", subtitle: "Start recovering what's owed to you" },
          },
        }}
        routerPush={(to) => setLocation(stripBase(to))}
        routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
      >
        <QueryClientProvider client={queryClient}>
          <ClerkQueryClientCacheInvalidator />
          <TooltipProvider>
            <Router />
            <Toaster />
          </TooltipProvider>
        </QueryClientProvider>
      </ClerkProvider>
    </ClerkEnabledContext.Provider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath || "/"}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
