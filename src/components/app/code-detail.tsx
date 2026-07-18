"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Eyebrow } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, Hint, Input, Label } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ArrowUpRight, Trash, Upload, X } from "@/components/ui/icons";
import { CopyButton } from "@/components/app/copy-button";
import { QrRender } from "@/components/app/qr-render";
import { encodedValue } from "@/lib/qr-value";

export type CodeDetailData = {
  id: string;
  title: string;
  shortCode: string;
  destinationUrl: string;
  type: "dynamic" | "static";
  isActive: boolean;
  scanCount: number;
  design: {
    foregroundColor: string;
    backgroundColor: string;
    logoUrl: string | null;
  } | null;
  redirects: { destinationUrl: string; createdAt: string }[];
};

export function CodeDetail({ data }: { data: CodeDetailData }) {
  const router = useRouter();
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);

  const [title, setTitle] = useState(data.title);
  const [destinationUrl, setDestinationUrl] = useState(data.destinationUrl);
  const [isActive, setIsActive] = useState(data.isActive);
  const [fg, setFg] = useState(data.design?.foregroundColor ?? "#0c1f15");
  const [bg, setBg] = useState(data.design?.backgroundColor ?? "#ffffff");
  const [logo, setLogo] = useState<string | null>(data.design?.logoUrl ?? null);

  const [savingDetails, setSavingDetails] = useState(false);
  const [savingDesign, setSavingDesign] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const shortUrl = `${origin}/r/${data.shortCode}`;
  const value = encodedValue({
    type: data.type,
    shortCode: data.shortCode,
    destinationUrl,
    origin,
  });

  function flash(setter: (v: string | null) => void, text: string) {
    setter(text);
    setTimeout(() => setter(null), 2500);
  }

  async function saveDetails(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSavingDetails(true);
    const res = await fetch(`/api/qr/${data.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title, destinationUrl }),
    });
    setSavingDetails(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      return setErr(d.error ?? "Could not save.");
    }
    flash(setMsg, "Saved");
    router.refresh();
  }

  async function toggleActive(next: boolean) {
    setIsActive(next);
    await fetch(`/api/qr/${data.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ isActive: next }),
    });
    router.refresh();
  }

  function onLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogo(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function saveDesign() {
    setSavingDesign(true);
    const res = await fetch(`/api/qr/${data.id}/design`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        foregroundColor: fg,
        backgroundColor: bg,
        logoUrl: logo,
      }),
    });
    setSavingDesign(false);
    if (res.ok) flash(setMsg, "Design saved");
    router.refresh();
  }

  async function archive() {
    if (!confirm("Archive this code? Its short link will stop redirecting.")) return;
    await fetch(`/api/qr/${data.id}`, { method: "DELETE" });
    router.push("/app/codes");
    router.refresh();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-display text-3xl">{data.title}</h1>
          <Badge variant={data.type === "static" ? "outline" : "soft"}>
            {data.type}
          </Badge>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground">Active</span>
          <Switch checked={isActive} onCheckedChange={toggleActive} aria-label="Active" />
        </div>
      </div>

      {msg && <p className="mt-2 text-sm text-success">{msg}</p>}

      <div className="mt-8 grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* QR + link */}
        <Card className="h-fit">
          <CardContent className="flex flex-col items-center gap-4">
            <QrRender
              value={value}
              fg={fg}
              bg={bg}
              logo={logo}
              size={220}
              fileName={data.shortCode}
              showDownload
            />
            {data.type === "dynamic" && (
              <div className="flex w-full items-center gap-2 rounded-sm bg-muted px-3 py-2">
                <span className="flex-1 truncate font-mono text-xs">{shortUrl}</span>
                <CopyButton value={shortUrl} />
              </div>
            )}
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Eyebrow>{data.scanCount.toLocaleString("en-US")} scans</Eyebrow>
            </div>
          </CardContent>
        </Card>

        {/* editors */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardContent>
              <form onSubmit={saveDetails} className="flex flex-col gap-4">
                <Field>
                  <Label htmlFor="title">Name</Label>
                  <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
                </Field>
                <Field>
                  <Label htmlFor="dest">Destination URL</Label>
                  <Input
                    id="dest"
                    value={destinationUrl}
                    onChange={(e) => setDestinationUrl(e.target.value)}
                  />
                  <Hint>
                    {data.type === "dynamic"
                      ? "Every future scan follows the new destination — no reprint."
                      : "Static codes encode the destination directly; changing it changes the QR image, so reprint after saving."}
                  </Hint>
                </Field>
                {err && <Hint error>{err}</Hint>}
                <div>
                  <Button type="submit" disabled={savingDetails}>
                    {savingDetails ? "Saving…" : "Save changes"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col gap-4">
              <Eyebrow>Design</Eyebrow>
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
                <Label>Center logo</Label>
                {logo ? (
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={logo}
                      alt="logo"
                      className="size-11 rounded-sm border border-border object-contain"
                    />
                    <Button type="button" size="sm" variant="ghost" onClick={() => setLogo(null)}>
                      <X size={14} /> Remove
                    </Button>
                  </div>
                ) : (
                  <label className="flex h-11 cursor-pointer items-center gap-2 rounded-sm border border-dashed border-border px-3.5 text-sm text-muted-foreground hover:border-forest-300">
                    <Upload size={16} /> Upload image
                    <input type="file" accept="image/*" className="hidden" onChange={onLogo} />
                  </label>
                )}
              </Field>
              <div>
                <Button variant="outline" onClick={saveDesign} disabled={savingDesign}>
                  {savingDesign ? "Saving…" : "Save design"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {data.redirects.length > 0 && (
            <Card>
              <CardContent className="flex flex-col gap-3">
                <Eyebrow>Destination history</Eyebrow>
                <ul className="flex flex-col gap-2">
                  {data.redirects.map((r, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between gap-3 border-b border-border pb-2 text-sm last:border-b-0 last:pb-0"
                    >
                      <span className="truncate font-mono text-xs">{r.destinationUrl}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" href="/app/analytics">
              View analytics <ArrowUpRight size={15} />
            </Button>
            <Button
              variant="ghost"
              onClick={archive}
              className="text-danger hover:bg-danger-soft"
            >
              <Trash size={15} /> Archive
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
