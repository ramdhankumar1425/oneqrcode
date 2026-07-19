"use client";

/**
 * Loads the Cashfree JS v3 SDK (the CDN build is the one that exposes
 * subscriptionsCheckout) and exposes a typed handle to it. Client-only.
 */

type CheckoutResult = { error?: { message: string } } | void;

type CashfreeInstance = {
  subscriptionsCheckout: (opts: {
    subsSessionId: string;
    redirectTarget?: "_self" | "_blank" | "_top";
  }) => Promise<CheckoutResult>;
};

type CashfreeFactory = (opts: {
  mode: "sandbox" | "production";
}) => CashfreeInstance;

declare global {
  interface Window {
    Cashfree?: CashfreeFactory;
  }
}

const SDK_URL = "https://sdk.cashfree.com/js/v3/cashfree.js";
let loader: Promise<CashfreeFactory> | null = null;

export function cashfreeMode(): "sandbox" | "production" {
  return process.env.NEXT_PUBLIC_CASHFREE_MODE === "production"
    ? "production"
    : "sandbox";
}

export function loadCashfree(): Promise<CashfreeFactory> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Cashfree SDK is client-only"));
  }
  if (window.Cashfree) return Promise.resolve(window.Cashfree);
  if (loader) return loader;

  loader = new Promise<CashfreeFactory>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SDK_URL;
    script.async = true;
    script.onload = () => {
      if (window.Cashfree) resolve(window.Cashfree);
      else reject(new Error("Cashfree SDK loaded but unavailable"));
    };
    script.onerror = () => reject(new Error("Failed to load the Cashfree SDK"));
    document.head.appendChild(script);
  });
  return loader;
}

/** Open the hosted subscription authorization checkout for a session id. */
export async function openSubscriptionCheckout(sessionId: string): Promise<void> {
  const Cashfree = await loadCashfree();
  const cashfree = Cashfree({ mode: cashfreeMode() });
  await cashfree.subscriptionsCheckout({
    subsSessionId: sessionId,
    redirectTarget: "_self",
  });
}
