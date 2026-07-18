import { cn } from "@/lib/cn";

/** Square brand tile — dark forest with serif lime wordmark, per the reference logo block. */
export function LogoMark({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex flex-col items-center justify-center rounded-xs bg-forest-950 leading-none",
        size === "sm" && "h-10 w-10 rounded-[6px]",
        size === "md" && "h-14 w-14",
        size === "lg" && "h-20 w-20 rounded-sm",
        className
      )}
    >
      <span
        className={cn(
          "font-serif italic text-accent",
          size === "sm" && "text-lg",
          size === "md" && "text-2xl",
          size === "lg" && "text-4xl"
        )}
      >
        one
      </span>
      <span
        className={cn(
          "font-mono uppercase text-white/80",
          size === "sm" && "mt-0.5 text-[5px] tracking-[0.28em]",
          size === "md" && "mt-1 text-[7px] tracking-[0.3em]",
          size === "lg" && "mt-1.5 text-[9px] tracking-[0.34em]"
        )}
      >
        qrcode
      </span>
    </span>
  );
}

/** Horizontal lockup for navbars. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark size="sm" />
      <span className="text-lg font-semibold tracking-tight">
        one<span className="font-serif italic font-normal">qr</span>code
      </span>
    </span>
  );
}
