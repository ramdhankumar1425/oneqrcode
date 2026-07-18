import type { Metadata } from "next";
import type { ReactNode } from "react";

import { Avatar, AvatarGroup } from "@/components/ui/avatar";
import { Badge, Eyebrow } from "@/components/ui/badge";
import { BarChart } from "@/components/ui/bar-chart";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Highlight } from "@/components/ui/highlight";
import {
  ArrowUpRight,
  Copy,
  Globe,
  LinkIcon,
  Plus,
  QrCode,
  Scan,
} from "@/components/ui/icons";
import { Field, Hint, Input, Label, Textarea } from "@/components/ui/input";
import { Logo, LogoMark } from "@/components/ui/logo";
import { Select } from "@/components/ui/select";
import { Delta, StatCard } from "@/components/ui/stat";
import { Switch } from "@/components/ui/switch";
import { Tabs } from "@/components/ui/tabs";

export const metadata: Metadata = {
  title: "Design System — oneqrcode",
  description: "Tokens, type, and components for the oneqrcode platform.",
};

/* ---------- local helpers ---------- */

function Section({
  id,
  number,
  title,
  intro,
  children,
}: {
  id: string;
  number: string;
  title: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-border py-16">
      <div className="mb-10 flex flex-col gap-2">
        <Eyebrow>{number}</Eyebrow>
        <h2 className="text-display text-3xl">{title}</h2>
        {intro ? (
          <p className="max-w-xl text-sm text-muted-foreground">{intro}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function Swatch({ name, hex, className }: { name: string; hex: string; className: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div className={`h-16 rounded-sm border border-border ${className}`} />
      <div className="flex flex-col">
        <span className="text-xs font-medium">{name}</span>
        <span className="font-mono text-[10px] uppercase text-muted-foreground">{hex}</span>
      </div>
    </div>
  );
}

function Ramp({ name, steps }: { name: string; steps: { step: string; hex: string; className: string }[] }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium">{name}</span>
      <div className="flex overflow-hidden rounded-sm border border-border">
        {steps.map((s) => (
          <div key={s.step} className={`h-14 flex-1 ${s.className}`} title={`${name}-${s.step} ${s.hex}`} />
        ))}
      </div>
      <div className="flex">
        {steps.map((s) => (
          <span key={s.step} className="flex-1 text-center font-mono text-[10px] text-muted-foreground">
            {s.step}
          </span>
        ))}
      </div>
    </div>
  );
}

function TypeRow({ name, spec, children }: { name: string; spec: string; children: ReactNode }) {
  return (
    <div className="grid items-baseline gap-2 border-b border-border py-5 last:border-b-0 md:grid-cols-[180px_1fr]">
      <div className="flex flex-col">
        <span className="text-xs font-medium">{name}</span>
        <span className="font-mono text-[10px] text-muted-foreground">{spec}</span>
      </div>
      <div className="min-w-0 overflow-hidden">{children}</div>
    </div>
  );
}

const limeRamp = [
  { step: "50", hex: "#F8FCE9", className: "bg-lime-50" },
  { step: "100", hex: "#EFF9CE", className: "bg-lime-100" },
  { step: "200", hex: "#E4F5A9", className: "bg-lime-200" },
  { step: "300", hex: "#D8F17D", className: "bg-lime-300" },
  { step: "400", hex: "#C9ED55", className: "bg-lime-400" },
  { step: "500", hex: "#B4DC38", className: "bg-lime-500" },
  { step: "600", hex: "#8FB424", className: "bg-lime-600" },
];

const forestRamp = [
  { step: "50", hex: "#EFF5F0", className: "bg-forest-50" },
  { step: "100", hex: "#D8E7DC", className: "bg-forest-100" },
  { step: "200", hex: "#B2CFBB", className: "bg-forest-200" },
  { step: "300", hex: "#85B295", className: "bg-forest-300" },
  { step: "400", hex: "#55926C", className: "bg-forest-400" },
  { step: "500", hex: "#357A50", className: "bg-forest-500" },
  { step: "600", hex: "#2A6242", className: "bg-forest-600" },
  { step: "700", hex: "#224E36", className: "bg-forest-700" },
  { step: "800", hex: "#1A3B29", className: "bg-forest-800" },
  { step: "900", hex: "#122A1D", className: "bg-forest-900" },
  { step: "950", hex: "#0C1F15", className: "bg-forest-950" },
];

const scanData = [
  { label: "Mon", value: 412 },
  { label: "Tue", value: 380 },
  { label: "Wed", value: 501 },
  { label: "Thu", value: 458 },
  { label: "Fri", value: 621 },
  { label: "Sat", value: 704 },
  { label: "Sun", value: 552 },
];

const toc = [
  ["color", "Color"],
  ["typography", "Typography"],
  ["buttons", "Buttons"],
  ["indicators", "Indicators"],
  ["forms", "Forms"],
  ["cards", "Cards & stats"],
  ["tabs", "Tabs"],
  ["charts", "Charts"],
  ["surfaces", "Elevation"],
  ["brand", "Brand"],
] as const;

export default function DesignSystemPage() {
  return (
    <main className="flex-1">
      {/* hero — the system in one composition */}
      <header className="bg-lime-300">
        <div className="mx-auto max-w-6xl px-6 pb-16 pt-8">
          <div className="mb-14 flex items-center justify-between gap-4">
            <Logo />
            <Badge variant="dark">design system · v0.1</Badge>
          </div>

          <div className="flex flex-col items-center text-center">
            <h1 className="text-display max-w-3xl text-4xl sm:text-5xl md:text-6xl">
              One code. <Highlight>Endless</Highlight>{" "}
              <Highlight>destinations</Highlight>.
            </h1>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-forest-900/80">
              Print a oneqrcode once and point it anywhere, forever. This page
              is the living spec — every token and component the platform is
              built from.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button variant="outline">
                Get Started <ArrowUpRight size={15} />
              </Button>
              <Button>
                Learn More <ArrowUpRight size={15} />
              </Button>
            </div>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Delta value="347.23%" />
              <AvatarGroup label="12K+">
                <Avatar name="Maya Iyer" tone={0} size="sm" />
                <Avatar name="Jon Osei" tone={2} size="sm" />
                <Avatar name="Ana Reyes" tone={3} size="sm" />
                <Avatar name="Kei Tanaka" tone={4} size="sm" />
              </AvatarGroup>
            </div>
          </div>
        </div>
      </header>

      {/* toc */}
      <nav className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl gap-5 overflow-x-auto px-6 py-3">
          {toc.map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              className="whitespace-nowrap text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {label}
            </a>
          ))}
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-6">
        {/* 01 — color */}
        <Section
          id="color"
          number="01 — tokens"
          title="Color"
          intro="Two brand ramps — lime and forest — plus semantic aliases. Lime is for accents, pills, and washes only: at 1.34:1 against white it never carries text or chart marks. Forest does the heavy lifting."
        >
          <div className="flex flex-col gap-10">
            <div className="grid gap-8 lg:grid-cols-2">
              <Ramp name="lime" steps={limeRamp} />
              <Ramp name="forest" steps={forestRamp} />
            </div>

            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
              <Swatch name="background" hex="#FBFCF7" className="bg-background" />
              <Swatch name="surface" hex="#FFFFFF" className="bg-surface" />
              <Swatch name="muted" hex="#F1F4EA" className="bg-muted" />
              <Swatch name="border" hex="#E4E9DC" className="bg-border" />
              <Swatch name="primary" hex="#122A1D" className="bg-primary" />
              <Swatch name="accent" hex="#C9ED55" className="bg-accent" />
              <Swatch name="accent-soft" hex="#D8F17D" className="bg-accent-soft" />
              <Swatch name="foreground" hex="#0C1F15" className="bg-foreground" />
              <Swatch name="muted-fg" hex="#5C6B5E" className="bg-muted-foreground" />
              <Swatch name="success" hex="#2A7C4F" className="bg-success" />
              <Swatch name="warning" hex="#A06C0B" className="bg-warning" />
              <Swatch name="danger" hex="#BF3B2B" className="bg-danger" />
            </div>
          </div>
        </Section>

        {/* 02 — typography */}
        <Section
          id="typography"
          number="02 — tokens"
          title="Typography"
          intro="Archivo everywhere, worn three ways: bold uppercase display, regular UI text, and mono for data labels. Instrument Serif appears only as a brand accent."
        >
          <div className="rounded-lg border border-border bg-surface px-6 shadow-card">
            <TypeRow name="Display / XL" spec="text-display · 60px">
              <span className="text-display text-6xl">Scan me</span>
            </TypeRow>
            <TypeRow name="Display / L" spec="text-display · 36px">
              <span className="text-display text-4xl">
                Built to <Highlight variant="lime">outlive</Highlight> the print
              </span>
            </TypeRow>
            <TypeRow name="Heading / 1" spec="font-semibold · 24px">
              <span className="text-2xl font-semibold tracking-tight">
                Campaign overview
              </span>
            </TypeRow>
            <TypeRow name="Heading / 2" spec="font-semibold · 18px">
              <span className="text-lg font-semibold tracking-tight">
                Redirect settings
              </span>
            </TypeRow>
            <TypeRow name="Body" spec="font-normal · 14–16px">
              <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">
                A oneqrcode never expires. The pattern on the page stays fixed
                while its destination stays yours to change — swap a menu, a
                campaign, or a whole storefront without reprinting a thing.
              </p>
            </TypeRow>
            <TypeRow name="Eyebrow" spec="font-mono · 11px · caps">
              <Eyebrow>
                <Scan size={12} /> Total scans
              </Eyebrow>
            </TypeRow>
            <TypeRow name="Mono / data" spec="font-mono · tabular">
              <span className="font-mono text-sm tabular-nums">
                oqr.to/x7B2 · 48,214 scans
              </span>
            </TypeRow>
            <TypeRow name="Serif accent" spec="font-serif · italic">
              <span className="font-serif text-3xl italic">
                one code, every destination
              </span>
            </TypeRow>
          </div>
        </Section>

        {/* 03 — buttons */}
        <Section
          id="buttons"
          number="03 — components"
          title="Buttons"
          intro="Always pill-shaped. Primary is forest ink, outline is the hero-band CTA, accent is lime for high-emphasis moments on dark or neutral ground."
        >
          <div className="flex flex-col gap-8">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface p-6 shadow-card">
                <Button>
                  Learn More <ArrowUpRight size={15} />
                </Button>
                <Button variant="outline">
                  Get Started <ArrowUpRight size={15} />
                </Button>
                <Button variant="accent">
                  <Plus size={15} /> New code
                </Button>
                <Button variant="ghost">Cancel</Button>
              </div>
              <div className="flex flex-wrap items-center gap-3 rounded-lg bg-forest-950 p-6">
                <Button variant="accent">
                  Start free <ArrowUpRight size={15} />
                </Button>
                <Button className="border border-white/25 bg-transparent hover:bg-white/10 active:bg-white/10">
                  Watch demo
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg">
                Large <ArrowUpRight size={16} />
              </Button>
              <Button size="md">Medium</Button>
              <Button size="sm">Small</Button>
              <Button disabled>Disabled</Button>
              <Button variant="outline" disabled>
                Disabled
              </Button>
            </div>
          </div>
        </Section>

        {/* 04 — indicators */}
        <Section
          id="indicators"
          number="04 — components"
          title="Badges & indicators"
          intro="Pills carry status and momentum. Trend deltas always pair the number with an arrow — direction never rides on color alone."
        >
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-3">
              <Badge>accent</Badge>
              <Badge variant="outline">outline</Badge>
              <Badge variant="dark">dark</Badge>
              <Badge variant="soft">soft</Badge>
              <Badge variant="success">active</Badge>
              <Badge variant="warning">paused</Badge>
              <Badge variant="danger">expired</Badge>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Delta value="234.45%" />
              <Delta value="12.8%" direction="down" />
              <AvatarGroup label="12K+">
                <Avatar name="Maya Iyer" tone={0} size="sm" />
                <Avatar name="Jon Osei" tone={1} size="sm" />
                <Avatar name="Ana Reyes" tone={2} size="sm" />
                <Avatar name="Kei Tanaka" tone={3} size="sm" />
              </AvatarGroup>
              <div className="flex items-center gap-2">
                <Avatar name="Maya Iyer" tone={0} size="lg" />
                <Avatar name="Jon Osei" tone={2} size="md" />
                <Avatar name="Ana Reyes" tone={4} size="sm" />
              </div>
            </div>
          </div>
        </Section>

        {/* 05 — forms */}
        <Section
          id="forms"
          number="05 — components"
          title="Forms"
          intro="Soft-rounded fields on white, forest focus rings, quiet until touched. Errors switch the ring and hint to danger."
        >
          <div className="grid items-start gap-8 lg:grid-cols-2">
            <div className="flex flex-col gap-5 rounded-lg border border-border bg-surface p-6 shadow-card">
              <Field>
                <Label htmlFor="ds-name">Code name</Label>
                <Input id="ds-name" placeholder="Spring menu — table tents" />
                <Hint>Only you see this. Keep it memorable.</Hint>
              </Field>
              <Field>
                <Label htmlFor="ds-url">Destination URL</Label>
                <Input
                  id="ds-url"
                  defaultValue="not-a-url"
                  aria-invalid
                />
                <Hint error>Enter a valid URL, including https://.</Hint>
              </Field>
              <Field>
                <Label htmlFor="ds-type">Redirect type</Label>
                <Select id="ds-type" defaultValue="dynamic">
                  <option value="dynamic">Dynamic — editable any time</option>
                  <option value="static">Static — fixed destination</option>
                </Select>
              </Field>
              <Field>
                <Label htmlFor="ds-notes">Notes</Label>
                <Textarea id="ds-notes" placeholder="Anything the team should know…" />
              </Field>
              <Field>
                <Label htmlFor="ds-disabled">Disabled</Label>
                <Input id="ds-disabled" disabled placeholder="Locked field" />
              </Field>
              <div className="flex flex-col gap-3 pt-1">
                <label className="flex items-center gap-2.5 text-sm">
                  <Checkbox defaultChecked /> Collect scan analytics
                </label>
                <label className="flex items-center gap-2.5 text-sm">
                  <Checkbox /> Notify me on first scan
                </label>
                <div className="flex items-center gap-2.5 text-sm">
                  <Switch defaultChecked aria-label="Code active" /> Code active
                </div>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Create a code</CardTitle>
                <CardDescription>
                  The composed pattern: card + fields + footer actions.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                <Field>
                  <Label htmlFor="ds-c-url">Destination URL</Label>
                  <Input id="ds-c-url" placeholder="https://your.site/menu" />
                </Field>
                <Field>
                  <Label htmlFor="ds-c-slug">Short link</Label>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-muted-foreground">
                      oqr.to/
                    </span>
                    <Input id="ds-c-slug" placeholder="spring-menu" className="flex-1" />
                  </div>
                </Field>
              </CardContent>
              <CardFooter className="justify-end">
                <Button variant="ghost">Cancel</Button>
                <Button>
                  Create code <ArrowUpRight size={15} />
                </Button>
              </CardFooter>
            </Card>
          </div>
        </Section>

        {/* 06 — cards & stats */}
        <Section
          id="cards"
          number="06 — components"
          title="Cards & stats"
          intro="White surfaces, generous radius, one soft shadow. Stat cards follow the dashboard grammar: mono eyebrow, big tabular number, lime delta."
        >
          <div className="flex flex-col gap-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Total scans"
                icon={<Scan size={12} />}
                value="48,214"
                delta={<Delta value="234.45%" />}
              />
              <StatCard
                label="Active codes"
                icon={<QrCode size={12} />}
                value="128"
                delta={<Delta value="12.4%" />}
              />
              <StatCard
                label="Redirects edited"
                icon={<LinkIcon size={12} />}
                value="1,042"
              />
              <StatCard
                label="Top country"
                icon={<Globe size={12} />}
                value="India"
                delta={<Delta value="3.1%" direction="down" />}
              />
            </div>

            <Card className="max-w-xl">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle>Spring menu — table tents</CardTitle>
                  <Badge variant="success">active</Badge>
                </div>
                <CardDescription>
                  Created 12 Mar 2026 · last edited 2 days ago
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="flex items-center gap-2 rounded-sm bg-muted px-3.5 py-2.5">
                  <span className="flex-1 truncate font-mono text-sm">
                    oqr.to/spring-menu → tynora.in/menus/spring-2026
                  </span>
                  <Copy size={14} className="shrink-0 text-muted-foreground" />
                </div>
              </CardContent>
              <CardFooter>
                <Eyebrow>
                  <Scan size={12} /> 3,639 scans
                </Eyebrow>
                <Delta value="34.4%" className="ml-auto" />
              </CardFooter>
            </Card>
          </div>
        </Section>

        {/* 07 — tabs */}
        <Section
          id="tabs"
          number="07 — components"
          title="Tabs"
          intro="Underline tabs for page sections, pill tabs for tight toggles like date ranges."
        >
          <div className="flex flex-col gap-8">
            <Tabs
              items={[
                { value: "overview", label: "Overview" },
                { value: "analytics", label: "Analytics" },
                { value: "redirects", label: "Redirects" },
                { value: "settings", label: "Settings" },
              ]}
            />
            <Tabs
              variant="pill"
              className="self-start"
              items={[
                { value: "7d", label: "7D" },
                { value: "30d", label: "30D" },
                { value: "90d", label: "90D" },
                { value: "1y", label: "1Y" },
              ]}
              defaultValue="30d"
            />
          </div>
        </Section>

        {/* 08 — charts */}
        <Section
          id="charts"
          number="08 — components"
          title="Charts"
          intro="Marks are forest — never lime — on white, with rounded tops anchored to the baseline, a recessive grid, and values on hover. A single series needs no legend; the title names it."
        >
          <Card className="max-w-2xl">
            <CardContent>
              <BarChart title="Scans — last 7 days" data={scanData} />
            </CardContent>
          </Card>
        </Section>

        {/* 09 — elevation */}
        <Section
          id="surfaces"
          number="09 — tokens"
          title="Elevation & radius"
          intro="Two shadows and a compact radius scale. Fully-round is reserved for buttons, pills, and avatars."
        >
          <div className="grid gap-8 md:grid-cols-2">
            <div className="flex flex-wrap items-end gap-6">
              <div className="flex h-28 w-40 items-end rounded-md bg-surface p-3 shadow-card">
                <Eyebrow>shadow-card</Eyebrow>
              </div>
              <div className="flex h-28 w-40 items-end rounded-md bg-surface p-3 shadow-float">
                <Eyebrow>shadow-float</Eyebrow>
              </div>
            </div>
            <div className="flex flex-wrap items-end gap-4">
              {(
                [
                  ["xs", "rounded-xs"],
                  ["sm", "rounded-sm"],
                  ["md", "rounded-md"],
                  ["lg", "rounded-lg"],
                  ["xl", "rounded-xl"],
                ] as const
              ).map(([name, cls]) => (
                <div key={name} className="flex flex-col items-center gap-2">
                  <div className={`size-20 border border-forest-900 bg-lime-300 ${cls}`} />
                  <span className="font-mono text-[10px] text-muted-foreground">{cls}</span>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* 10 — brand */}
        <Section
          id="brand"
          number="10 — brand"
          title="Logo"
          intro="A forest tile with the serif lime wordmark. It sits on lime, white, or ink without variants."
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex h-40 items-center justify-center rounded-lg bg-lime-300">
              <LogoMark size="lg" />
            </div>
            <div className="flex h-40 items-center justify-center rounded-lg border border-border bg-surface shadow-card">
              <Logo />
            </div>
            <div className="flex h-40 items-center justify-center rounded-lg bg-forest-950">
              <LogoMark size="lg" />
            </div>
          </div>
        </Section>
      </div>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-8">
          <Eyebrow>oneqrcode · design system v0.1</Eyebrow>
          <span className="text-xs text-muted-foreground">
            Tokens live in{" "}
            <code className="font-mono">src/app/globals.css</code> · components
            in <code className="font-mono">src/components/ui</code>
          </span>
        </div>
      </footer>
    </main>
  );
}
