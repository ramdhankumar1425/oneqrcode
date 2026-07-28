"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, Menu, X } from "@/components/ui/icons";
import { Logo } from "@/components/ui/logo";

const links = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#faq", label: "FAQ" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setLoggedIn(!!data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) =>
      setLoggedIn(!!session?.user),
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <div className="fixed inset-x-0 top-4 z-50 px-4">
      <div className="mx-auto max-w-5xl rounded-full border border-border bg-surface/85 shadow-card backdrop-blur">
        <div className="flex items-center justify-between gap-4 py-2.5 pl-4 pr-2.5">
          <Link
            href="/"
            aria-label="oneqrcode home"
            onClick={() => setOpen(false)}
          >
            <Logo />
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            {loggedIn ? (
              <Button size="sm" href="/app/dashboard">
                Dashboard <ArrowUpRight size={15} />
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" href="/login">
                  Log in
                </Button>
                <Button size="sm" href="/signup">
                  Sign up
                </Button>
              </>
            )}
          </div>

          <button
            className="flex size-9 cursor-pointer items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted md:hidden"
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <div
          className={cn(
            "flex-col gap-1 border-t border-border px-4 py-3 md:hidden",
            open ? "flex" : "hidden"
          )}
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-2 flex items-center gap-2">
            {loggedIn ? (
              <Button size="sm" href="/app/dashboard" className="flex-1">
                Dashboard <ArrowUpRight size={15} />
              </Button>
            ) : (
              <>
                <Button variant="outline" size="sm" href="/login" className="flex-1">
                  Log in
                </Button>
                <Button size="sm" href="/signup" className="flex-1">
                  Sign up
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
