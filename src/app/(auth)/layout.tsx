import Link from "next/link";
import { Highlight } from "@/components/ui/highlight";
import { LogoMark } from "@/components/ui/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-1">
      {/* brand panel */}
      <aside className="hidden w-1/2 flex-col justify-between bg-lime-300 p-12 lg:flex">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <LogoMark size="sm" />
          <span className="text-lg font-semibold tracking-tight">
            one<span className="font-serif italic font-normal">qr</span>code
          </span>
        </Link>
        <div>
          <h2 className="text-display max-w-md text-4xl">
            Move the link. <Highlight>Keep the code.</Highlight>
          </h2>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-forest-900/80">
            Print a oneqrcode once and point it anywhere, forever. Change the
            destination whenever you want — no reprint needed.
          </p>
        </div>
        <span className="font-mono text-xs text-forest-900/60">oqr.to</span>
      </aside>

      {/* form */}
      <section className="flex flex-1 items-center justify-center p-6">
        {children}
      </section>
    </main>
  );
}
