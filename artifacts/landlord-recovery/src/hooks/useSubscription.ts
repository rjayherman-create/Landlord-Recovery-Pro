import { useQuery } from "@tanstack/react-query";

interface SubscriptionStatus {
  isPro: boolean;
  status: string | null;
  plan: string | null;
  hasCustomerId: boolean;
}

async function fetchSubscriptionStatus(): Promise<SubscriptionStatus> {
  const res = await fetch("/api/landlord/subscription/status");
  if (!res.ok) return { isPro: false, status: null, plan: null, hasCustomerId: false };
  return res.json();
}

export function useSubscription() {
  return useQuery<SubscriptionStatus>({
    queryKey: ["landlord-subscription-status"],
    queryFn: fetchSubscriptionStatus,
    staleTime: 60_000,
    retry: false,
  });
}

export async function startSubscriptionCheckout(email?: string): Promise<void> {
  const res = await fetch("/api/landlord/subscription/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const json = await res.json();
  if (json.url) {
    window.location.href = json.url;
  } else {
    throw new Error(json.error || "Checkout unavailable");
  }
}

export async function startUnlockCheckout(email?: string): Promise<void> {
  const res = await fetch("/api/landlord/payment/unlock", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const json = await res.json();
  if (json.url) {
    window.location.href = json.url;
  } else {
    throw new Error(json.error || "Checkout unavailable");
  }
}

export async function openBillingPortal(): Promise<void> {
  const res = await fetch("/api/landlord/subscription/portal", { method: "POST" });
  const json = await res.json();
  if (json.url) {
    window.location.href = json.url;
  } else {
    throw new Error(json.error || "Billing portal unavailable");
  }
}
