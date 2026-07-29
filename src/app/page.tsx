import Link from "next/link";

import { cn } from "@/lib/cn";
import { Navbar } from "@/components/marketing/navbar";
import { Badge, Eyebrow } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Highlight } from "@/components/ui/highlight";
import {
  ArrowUpRight,
  Check,
  Plus,
  Printer,
  QrCode,
  Refresh,
} from "@/components/ui/icons";
import { LogoMark } from "@/components/ui/logo";
import { QrInteractive } from "@/components/marketing/qr-interactive";
import { getCurrentUser } from "@/lib/session";

const useCases = [
  "Business cards",
  "Books",
  "Flyers",
  "Restaurant menus",
  "Signs",
  "Product packaging",
  "Trade show booths",
  "Postcards",
  "Stickers",
  "Table tents",
  "Presentation slides",
  "Conference badges",
  "YouTube videos",
  "Tutorials",
  "Online courses",
  "Video ads",
  "Livestream overlays",
  "End screens",
];

const steps = [
  {
    icon: QrCode,
    title: "Create",
    body: "Point your oneqrcode at any URL. You get a permanent code and a short oqr.to link in seconds.",
  },
  {
    icon: Printer,
    title: "Print",
    body: "Put it on menus, packaging, books, or video — anywhere you can't edit later. The pattern never changes.",
  },
  {
    icon: Refresh,
    title: "Update",
    body: "Swap the destination whenever you want. Every future scan follows the new link, no reprint needed.",
  },
];

const tiers = [
  {
    name: "Free",
    price: "₹0",
    period: "forever",
    blurb: "Try permanence on for size.",
    href: "/signup",
    features: [
      "1 dynamic QR code",
      "Unlimited static codes",
      "1,000 scans / month",
      "Basic scan counts",
      "oqr.to short link",
    ],
    cta: "Start free",
    featured: false,
  },
  {
    name: "Pro",
    price: "₹900",
    period: "per month",
    blurb: "For brands with things in print.",
    href: "/signup",
    features: [
      "Unlimited dynamic QR codes",
      "Unlimited static codes",
      "Unlimited scans",
      "Full analytics dashboard",
      "Custom short slugs",
      "SVG & print-ready exports",
      "Email support",
    ],
    cta: "Go Pro",
    featured: true,
  },
];

const faqs = [
  {
    q: "What makes a oneqrcode permanent?",
    a: "The printed pattern encodes a permanent oqr.to link. Scans pass through our redirect layer, which forwards to whatever destination you've currently set — so the print itself never has to change.",
  },
  {
    q: "Can I change the destination after printing?",
    a: "Any time, as often as you like. Updates go live in seconds and apply to every future scan of the same printed code.",
  },
  {
    q: "What happens if I downgrade or stop paying?",
    a: "Your codes keep redirecting. Paid features and limits pause, but we never break a code that's already in print.",
  },
  {
    q: "How fast is the redirect?",
    a: "One hop through our edge network — typically under 50 ms added on top of your destination's own load time.",
  },
  {
    q: "Can I track scans?",
    a: "Every plan includes scan counts. Pro adds full breakdowns by time, device, and location.",
  },
  {
    q: "Do my codes expire?",
    a: "Never. Permanence is the product.",
  },
];

const footerColumns = [
  {
    title: "Product",
    links: [
      { label: "How it works", href: "/#how-it-works" },
      { label: "Pricing", href: "/#pricing" },
      { label: "FAQ", href: "/#faq" },
      { label: "Design system", href: "/design-system" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Contact", href: "#" },
      { label: "Blog", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/legal/privacy" },
      { label: "Terms", href: "/legal/terms" },
    ],
  },
];

export default async function Home() {
  const user = await getCurrentUser();
  const ctaHref = user ? "/app" : "/signup";

  return (
    <>
      <Navbar />

      <main className="flex-1">
        {/* hero */}
        <section className="bg-lime-300">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-20 pt-36 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
            <div className="flex flex-col items-start gap-6">
              <h1 className="text-display text-5xl md:text-6xl xl:text-7xl">
                Move the link.
                <br />
                <Highlight>Keep the code.</Highlight>
              </h1>
              <p className="max-w-md text-base leading-relaxed text-forest-900/80">
                A oneqrcode is printed once and points wherever you need. Swap
                the destination in seconds — the code on the page, the
                packaging, or the video never has to change.
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <Button variant="outline" size="lg" href={ctaHref}>
                  Get my QR code <ArrowUpRight size={16} />
                </Button>
                <Button size="lg" href="/#how-it-works">
                  How it works <ArrowUpRight size={16} />
                </Button>
              </div>
            </div>

            {/* interactive QR — tiles cluster toward the cursor */}
            <div className="mx-auto aspect-square w-full max-w-[25.2rem] text-forest-950 lg:max-w-[28.8rem]">
              <QrInteractive className="block h-full w-full" />
            </div>
          </div>
        </section>

        {/* use cases */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <Eyebrow>What you can protect</Eyebrow>
          <h2 className="text-display mt-3 max-w-2xl text-4xl md:text-5xl">
            Anything you can&apos;t{" "}
            <Highlight variant="lime">edit later</Highlight>.
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
            If a QR code is committed to something you can&apos;t change —
            paper, video, packaging, print runs — a permanent oneqrcode keeps it
            working.
          </p>
          <ul className="mt-8 flex flex-wrap gap-2.5">
            {useCases.map((useCase) => (
              <li key={useCase}>
                <span className="group relative inline-flex cursor-default items-center overflow-hidden rounded-full border border-border bg-surface px-3.5 py-2 text-sm font-medium">
                  <span
                    aria-hidden
                    className="absolute inset-0 origin-bottom scale-y-0 bg-forest-950 transition-transform duration-300 ease-out group-hover:scale-y-100"
                  />
                  <span className="relative transition-colors duration-300 group-hover:text-white">
                    {useCase}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* how it works */}
        <section id="how-it-works" className="scroll-mt-28 bg-forest-950">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <Eyebrow className="text-accent">How it works</Eyebrow>
            <h2 className="text-display mt-3 max-w-2xl text-4xl text-white md:text-5xl">
              Three steps. Then never again.
            </h2>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {steps.map((step, i) => (
                <div
                  key={step.title}
                  className="group flex flex-col gap-3 rounded-lg border border-white/10 bg-white/5 p-6 transition-[transform,background-color,border-color] duration-300 ease-out hover:-translate-y-1.5 hover:border-accent/40 hover:bg-white/9"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-accent">
                      0{i + 1}
                    </span>
                    <span className="flex size-9 items-center justify-center rounded-full bg-accent text-accent-foreground transition-transform duration-300 ease-out group-hover:-rotate-6 group-hover:scale-110">
                      <step.icon size={16} />
                    </span>
                  </div>
                  <h3 className="text-display text-2xl text-white">
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-white/60">
                    {step.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* pricing */}
        <section id="pricing" className="scroll-mt-28">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <div className="flex flex-col items-center text-center">
              <Eyebrow>Pricing</Eyebrow>
              <h2 className="text-display mt-3 max-w-2xl text-4xl md:text-5xl">
                Pay for permanence. Not per scan.
              </h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
                Start free and upgrade when your print runs grow. Every plan
                keeps your codes alive forever.
              </p>
            </div>

            <div className="mx-auto mt-12 grid max-w-3xl items-start gap-5 sm:grid-cols-2">
              {tiers.map((tier) => (
                <Card
                  key={tier.name}
                  className={cn(
                    "relative transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-2 hover:shadow-float",
                    tier.featured
                      ? "border-forest-900 shadow-float ring-2 ring-forest-900"
                      : "hover:border-forest-300",
                  )}
                >
                  {tier.featured ? (
                    <Badge
                      variant="accent"
                      className="absolute -top-3 left-1/2 -translate-x-1/2 uppercase tracking-wide"
                    >
                      Most popular
                    </Badge>
                  ) : null}
                  <CardHeader className="gap-3 pt-7">
                    <div className="flex flex-col gap-1">
                      <CardTitle className="text-lg">{tier.name}</CardTitle>
                      <CardDescription>{tier.blurb}</CardDescription>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-semibold tracking-tight tabular-nums">
                        {tier.price}
                      </span>
                      <span className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
                        / {tier.period}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-5 pt-2">
                    <ul className="flex flex-col gap-2.5">
                      {tier.features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-center gap-2.5 text-sm font-medium"
                        >
                          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-forest-900 text-accent">
                            <Check size={11} strokeWidth={3} />
                          </span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button
                      variant={tier.featured ? "primary" : "outline"}
                      href={ctaHref}
                    >
                      {tier.cta} <ArrowUpRight size={15} />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* faq */}
        <section id="faq" className="scroll-mt-28 bg-muted/40">
          <div className="mx-auto max-w-3xl px-6 py-20">
            <div className="flex flex-col items-center text-center">
              <Eyebrow>FAQ</Eyebrow>
              <h2 className="text-display mt-3 text-4xl md:text-5xl">
                Questions, answered.
              </h2>
            </div>
            <div className="mt-10">
              {faqs.map((faq) => (
                <details
                  key={faq.q}
                  className="group border-b border-border py-5 first:border-t"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-semibold [&::-webkit-details-marker]:hidden">
                    {faq.q}
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border transition-transform group-open:rotate-45">
                      <Plus size={14} strokeWidth={2.5} />
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {faq.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* cta */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="flex flex-col items-center gap-6 rounded-2xl bg-forest-950 px-8 py-16 text-center">
            <h2 className="text-display max-w-2xl text-4xl text-white md:text-5xl">
              Print it once.{" "}
              <Highlight variant="lime" className="text-forest-950">
                Own it forever.
              </Highlight>
            </h2>
            <p className="max-w-md text-sm text-white/70">
              Free plan available. No card required. Your codes never expire.
            </p>
            <Button variant="accent" size="lg" href={ctaHref}>
              Get my QR code <ArrowUpRight size={16} />
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div className="flex flex-col items-start gap-4">
            <span className="inline-flex items-center gap-1">
              <LogoMark size="sm" />
              <span className="text-lg font-semibold tracking-tight">
                OneQRCode
              </span>
            </span>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              Permanent QR codes with destinations you control. Print once,
              update forever.
            </p>
          </div>
          {footerColumns.map((column) => (
            <div key={column.title} className="flex flex-col gap-3">
              <Eyebrow>{column.title}</Eyebrow>
              {column.links.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
        <div className="border-t border-border">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-6 py-5">
            <span className="text-xs text-muted-foreground">
              © 2026 oneqrcode. Made for print that lasts.
            </span>
            <span className="font-mono text-xs text-muted-foreground">
              oqr.to
            </span>
          </div>
        </div>
      </footer>
    </>
  );
}
