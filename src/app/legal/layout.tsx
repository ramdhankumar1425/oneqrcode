import Link from "next/link";
import { Navbar } from "@/components/marketing/navbar";
import { LogoMark } from "@/components/ui/logo";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-6 py-8">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <LogoMark size="sm" />
            <span className="text-sm font-semibold tracking-tight">
              one<span className="font-serif italic font-normal">qr</span>code
            </span>
          </Link>
          <nav className="flex items-center gap-5 text-sm text-muted-foreground">
            <Link href="/legal/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <Link href="/legal/terms" className="hover:text-foreground">
              Terms
            </Link>
            <Link href="/" className="hover:text-foreground">
              Home
            </Link>
          </nav>
        </div>
      </footer>
    </>
  );
}
