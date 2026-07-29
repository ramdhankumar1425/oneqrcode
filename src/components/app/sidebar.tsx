"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/ui/logo";
import {
  ArrowUpRight,
  ChartBar,
  CreditCard,
  Grid,
  LogOut,
  Menu,
  Plus,
  QrCode,
  User,
  X,
} from "@/components/ui/icons";

const nav = [
  { href: "/app/dashboard", label: "Dashboard", icon: Grid },
  { href: "/app/codes", label: "QR codes", icon: QrCode },
  { href: "/app/analytics", label: "Analytics", icon: ChartBar },
  { href: "/app/billing", label: "Billing", icon: CreditCard },
  { href: "/app/profile", label: "Profile", icon: User },
];

export function Sidebar({
  user,
  planId,
  planName,
}: {
  user: { name: string; email: string };
  planId: string;
  planName: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const content = (
    <div className="flex h-full flex-col gap-1 p-4">
      <Link
        href="/"
        onClick={() => setOpen(false)}
        className="mb-5 inline-flex items-center gap-1 px-1"
      >
        <LogoMark size="sm" />
        <span className="text-lg font-semibold tracking-tight">OneQRCode</span>
      </Link>

      <Button
        variant="accent"
        href="/app/codes/new"
        className="mb-4 w-full"
        onClick={() => setOpen(false)}
      >
        <Plus size={16} /> New code
      </Button>

      <nav className="flex flex-col gap-1">
        {nav.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-forest-950 text-accent"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon size={17} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-3">
        {planId === "free" && (
          <Link
            href="/app/billing"
            onClick={() => setOpen(false)}
            className="group flex items-center justify-between gap-2 rounded-lg border border-forest-900 bg-lime-300 px-3.5 py-3 transition-colors hover:bg-lime-400"
          >
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-forest-950">
                Upgrade to Pro
              </span>
              <span className="text-xs text-forest-900/70">
                Unlimited dynamic codes
              </span>
            </div>
            <ArrowUpRight size={16} className="text-forest-950" />
          </Link>
        )}

        <div className="flex flex-col gap-3 border-t border-border pt-4">
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {user.email}
              </p>
            </div>
            <Badge variant={planId === "free" ? "soft" : "accent"}>
              {planName}
            </Badge>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut size={17} /> Sign out
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* mobile top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-surface px-4 py-3 md:hidden">
        <Link href="/" className="inline-flex items-center gap-2">
          <LogoMark size="sm" />
          <span className="font-semibold tracking-tight">oneqrcode</span>
        </Link>
        <button
          aria-label="Open menu"
          onClick={() => setOpen(true)}
          className="flex size-9 items-center justify-center rounded-full hover:bg-muted"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-border bg-surface md:block">
        {content}
      </aside>

      {/* mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-forest-950/40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 bg-surface shadow-float">
            <button
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full hover:bg-muted"
            >
              <X size={20} />
            </button>
            {content}
          </div>
        </div>
      )}
    </>
  );
}
