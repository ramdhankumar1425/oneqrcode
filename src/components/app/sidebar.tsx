"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { signOut } from "@/lib/auth-client";
import { Badge } from "@/components/ui/badge";
import { LogoMark } from "@/components/ui/logo";
import {
  ChartBar,
  CreditCard,
  Grid,
  LogOut,
  Menu,
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
  planName,
}: {
  user: { name: string; email: string };
  planName: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleSignOut() {
    await signOut();
    router.push("/");
    router.refresh();
  }

  const content = (
    <div className="flex h-full flex-col gap-1 p-4">
      <Link
        href="/app/dashboard"
        onClick={() => setOpen(false)}
        className="mb-4 inline-flex items-center gap-2.5 px-2"
      >
        <LogoMark size="sm" />
        <span className="text-lg font-semibold tracking-tight">
          one<span className="font-serif italic font-normal">qr</span>code
        </span>
      </Link>

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
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-forest-900 text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon size={17} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-3 border-t border-border pt-4">
        <div className="flex items-center justify-between px-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {user.email}
            </p>
          </div>
          <Badge variant={planName === "Free" ? "soft" : "accent"}>
            {planName}
          </Badge>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LogOut size={17} /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* mobile top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-surface px-4 py-3 md:hidden">
        <Link href="/app/dashboard" className="inline-flex items-center gap-2">
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
