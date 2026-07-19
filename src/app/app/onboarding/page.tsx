"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Hint, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Highlight } from "@/components/ui/highlight";
import { LogoMark } from "@/components/ui/logo";
import { HEARD_FROM_OPTIONS, USE_CASE_OPTIONS } from "@/lib/onboarding";
import { submitOnboarding } from "@/lib/actions/onboarding";

export default function OnboardingPage() {
  const [heardFrom, setHeardFrom] = useState("");
  const [useCase, setUseCase] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!heardFrom || !useCase) {
      setError("Please answer both questions.");
      return;
    }
    setLoading(true);
    const result = await submitOnboarding({ heardFrom, useCase });
    if (!result.ok) {
      setLoading(false);
      setError(result.error);
      return;
    }
    // full navigation — bypasses the client router cache, which may hold the
    // "not onboarded → /app/onboarding" redirect from an earlier prefetch
    window.location.assign("/app/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-lime-300 p-6">
      <div className="w-full max-w-md rounded-lg border border-border bg-surface p-8 shadow-card">
        <LogoMark size="sm" />
        <h1 className="text-display mt-5 text-3xl">
          Welcome to <Highlight variant="lime">oneqrcode</Highlight>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Two quick questions so we can tailor things for you.
        </p>

        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-5">
          <Field>
            <Label htmlFor="heardFrom">How did you hear about us?</Label>
            <Select
              id="heardFrom"
              value={heardFrom}
              onChange={(e) => setHeardFrom(e.target.value)}
            >
              <option value="" disabled>
                Choose one…
              </option>
              {HEARD_FROM_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field>
            <Label htmlFor="useCase">What will you mainly use it for?</Label>
            <Select
              id="useCase"
              value={useCase}
              onChange={(e) => setUseCase(e.target.value)}
            >
              <option value="" disabled>
                Choose one…
              </option>
              {USE_CASE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>

          {error && <Hint error>{error}</Hint>}

          <Button type="submit" size="lg" disabled={loading}>
            {loading ? "Saving…" : "Enter dashboard"}
          </Button>
        </form>
      </div>
    </main>
  );
}
