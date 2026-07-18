"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, Hint, Input, Label } from "@/components/ui/input";
import { Tabs } from "@/components/ui/tabs";
import { ArrowUpRight, Upload, X } from "@/components/ui/icons";
import Link from "next/link";
import { QrRender } from "@/components/app/qr-render";
import { encodedValue } from "@/lib/qr-value";
import { createCode, getDynamicAllowance } from "@/lib/actions/qr";

type SlugState = "idle" | "checking" | "available" | "taken" | "invalid";

export default function NewCodePage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [type, setType] = useState<"dynamic" | "static">("dynamic");
  const [destinationUrl, setDestinationUrl] = useState("");
  const [slug, setSlug] = useState("");
  const [slugState, setSlugState] = useState<SlugState>("idle");
  const [fg, setFg] = useState("#0c1f15");
  const [bg, setBg] = useState("#ffffff");
  const [logo, setLogo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [origin, setOrigin] = useState("");
  const [dynamicReached, setDynamicReached] = useState(false);
  const [planName, setPlanName] = useState("Free");

  useEffect(() => setOrigin(window.location.origin), []);

  useEffect(() => {
    getDynamicAllowance().then((a) => {
      setDynamicReached(a.reached);
      setPlanName(a.planName);
    });
  }, []);

  const dynamicBlocked = dynamicReached && type === "dynamic";

  // debounced slug availability
  const slugTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (type !== "dynamic" || slug === "") {
      setSlugState("idle");
      return;
    }
    setSlugState("checking");
    if (slugTimer.current) clearTimeout(slugTimer.current);
    slugTimer.current = setTimeout(async () => {
      const res = await fetch(`/api/qr/check-slug?code=${encodeURIComponent(slug)}`);
      const data = await res.json().catch(() => ({}));
      if (!data.valid) setSlugState("invalid");
      else setSlugState(data.available ? "available" : "taken");
    }, 400);
    return () => {
      if (slugTimer.current) clearTimeout(slugTimer.current);
    };
  }, [slug, type]);

  const previewValue = encodedValue({
    type,
    shortCode: slug || "preview",
    destinationUrl: destinationUrl || "https://oqr.to",
    origin,
  });

  function onLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogo(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) return setError("Give your code a name.");
    if (!/^https?:\/\//.test(destinationUrl))
      return setError("Enter a valid destination URL (including https://).");
    if (dynamicBlocked)
      return setError(
        "You've reached your plan's dynamic-code limit. Upgrade to Pro or create a static code.",
      );
    if (type === "dynamic" && slug && slugState === "taken")
      return setError("That short code is taken.");

    setSaving(true);
    const result = await createCode({
      title: title.trim(),
      destinationUrl,
      type,
      shortCode: type === "dynamic" && slug ? slug : undefined,
      design: { foregroundColor: fg, backgroundColor: bg, logoUrl: logo },
    });
    setSaving(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push(`/app/codes/${result.id}`);
    router.refresh();
  }

  return (
    <div>
      <h1 className="text-display text-3xl">New QR code</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Dynamic codes are editable forever. Static codes bake the destination in
        and are unlimited on every plan.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_auto]">
        <form onSubmit={onSubmit} className="flex max-w-lg flex-col gap-5">
          <Field>
            <Label htmlFor="title">Name</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Spring menu — table tents"
            />
          </Field>

          <Field>
            <Label>Type</Label>
            <Tabs
              variant="pill"
              className="self-start"
              defaultValue="dynamic"
              onValueChange={(v) => setType(v as "dynamic" | "static")}
              items={[
                { value: "dynamic", label: "Dynamic" },
                { value: "static", label: "Static" },
              ]}
            />
          </Field>

          {dynamicBlocked && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-forest-900 bg-lime-300 p-4">
              <p className="text-sm font-medium text-forest-950">
                Your {planName} plan is at its dynamic-code limit. Upgrade for
                unlimited, or switch to a static code.
              </p>
              <Link
                href="/app/billing"
                className="shrink-0 rounded-full bg-forest-950 px-3.5 py-1.5 text-xs font-semibold text-accent"
              >
                Upgrade to Pro
              </Link>
            </div>
          )}

          <Field>
            <Label htmlFor="destination">Destination URL</Label>
            <Input
              id="destination"
              value={destinationUrl}
              onChange={(e) => setDestinationUrl(e.target.value)}
              placeholder="https://your.site/menu"
            />
          </Field>

          {type === "dynamic" && (
            <Field>
              <Label htmlFor="slug">Custom short code (optional)</Label>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-muted-foreground">
                  /r/
                </span>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase())}
                  placeholder="spring-menu"
                  className="flex-1"
                />
              </div>
              {slugState === "checking" && <Hint>Checking…</Hint>}
              {slugState === "available" && (
                <Hint className="text-success">Available</Hint>
              )}
              {slugState === "taken" && <Hint error>Already taken</Hint>}
              {slugState === "invalid" && (
                <Hint error>3–32 chars: letters, numbers, hyphens</Hint>
              )}
              {slugState === "idle" && (
                <Hint>Leave blank to auto-generate.</Hint>
              )}
            </Field>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Field>
              <Label htmlFor="fg">Foreground</Label>
              <input
                id="fg"
                type="color"
                value={fg}
                onChange={(e) => setFg(e.target.value)}
                className="h-11 w-full cursor-pointer rounded-sm border border-border bg-surface p-1"
              />
            </Field>
            <Field>
              <Label htmlFor="bg">Background</Label>
              <input
                id="bg"
                type="color"
                value={bg}
                onChange={(e) => setBg(e.target.value)}
                className="h-11 w-full cursor-pointer rounded-sm border border-border bg-surface p-1"
              />
            </Field>
          </div>

          <Field>
            <Label>Center logo (optional)</Label>
            {logo ? (
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logo}
                  alt="logo preview"
                  className="size-11 rounded-sm border border-border object-contain"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setLogo(null)}
                >
                  <X size={14} /> Remove
                </Button>
              </div>
            ) : (
              <label className="flex h-11 cursor-pointer items-center gap-2 rounded-sm border border-dashed border-border px-3.5 text-sm text-muted-foreground hover:border-forest-300">
                <Upload size={16} /> Upload image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onLogo}
                />
              </label>
            )}
            <Hint>Stored with the code; not uploaded to external storage.</Hint>
          </Field>

          {error && <Hint error>{error}</Hint>}

          <div className="flex items-center gap-3">
            <Button type="submit" size="lg" disabled={saving || dynamicBlocked}>
              {saving ? "Creating…" : "Create code"} <ArrowUpRight size={16} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="lg"
              href="/app/codes"
            >
              Cancel
            </Button>
          </div>
        </form>

        <Card className="h-fit">
          <CardContent className="flex flex-col items-center gap-4">
            <span className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
              Live preview
            </span>
            <QrRender value={previewValue} fg={fg} bg={bg} logo={logo} size={220} />
            <span className="max-w-[220px] truncate font-mono text-[11px] text-muted-foreground">
              {previewValue}
            </span>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
