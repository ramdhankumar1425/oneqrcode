"use client";

/**
 * Loads the Razorpay Checkout script and opens the subscription checkout modal.
 * Client-only. The subscription is created server-side first; we just hand its
 * id to Checkout, which collects the payment method and authorizes the mandate.
 */

type RazorpayHandlerResponse = {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  subscription_id: string;
  name: string;
  description?: string;
  prefill?: { name?: string; email?: string; contact?: string };
  notes?: Record<string, string>;
  theme?: { color?: string };
  handler: (response: RazorpayHandlerResponse) => void;
  modal?: { ondismiss?: () => void };
};

type RazorpayInstance = { open: () => void };
type RazorpayConstructor = new (options: RazorpayOptions) => RazorpayInstance;

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

const SDK_URL = "https://checkout.razorpay.com/v1/checkout.js";
let loader: Promise<RazorpayConstructor> | null = null;

function loadRazorpay(): Promise<RazorpayConstructor> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Razorpay Checkout is client-only"));
  }
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  if (loader) return loader;

  loader = new Promise<RazorpayConstructor>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SDK_URL;
    script.async = true;
    script.onload = () => {
      if (window.Razorpay) resolve(window.Razorpay);
      else reject(new Error("Razorpay Checkout loaded but unavailable"));
    };
    script.onerror = () => reject(new Error("Failed to load Razorpay Checkout"));
    document.head.appendChild(script);
  });
  return loader;
}

export type OpenCheckoutArgs = {
  subscriptionId: string;
  prefill?: { name?: string; email?: string; contact?: string };
  onSuccess: (response: RazorpayHandlerResponse) => void;
  onDismiss?: () => void;
};

/** Open the Razorpay subscription checkout modal. */
export async function openSubscriptionCheckout(
  args: OpenCheckoutArgs,
): Promise<void> {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  if (!keyId) throw new Error("Razorpay key id is not configured");

  const Razorpay = await loadRazorpay();
  const rzp = new Razorpay({
    key: keyId,
    subscription_id: args.subscriptionId,
    name: "oneqrcode",
    description: "Pro subscription",
    prefill: args.prefill,
    theme: { color: "#0c1f15" },
    handler: args.onSuccess,
    modal: { ondismiss: args.onDismiss },
  });
  rzp.open();
}
