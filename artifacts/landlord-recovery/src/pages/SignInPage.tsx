import { SignIn } from "@clerk/react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const logoUrl = `${import.meta.env.BASE_URL}logo.svg`;

export default function SignInPage() {
  // To update login providers, app branding, or OAuth settings use the Auth
  // pane in the workspace toolbar. More information can be found in the Replit docs.
  return (
    <div className="min-h-screen bg-primary flex flex-col items-center justify-center px-4 py-16">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <img src={logoUrl} alt="Landlord Recovery" className="h-10 w-10" />
          <span className="text-3xl font-serif font-bold text-primary-foreground">Landlord Recovery</span>
        </div>
        <p className="text-primary-foreground/60 text-sm">Sign in to manage your cases</p>
      </div>
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
        fallbackRedirectUrl={`${basePath}/dashboard`}
      />
    </div>
  );
}
