import Image from "next/image";
import { cn } from "@/lib/cn";

const DIM = { sm: 40, md: 56, lg: 80 } as const;

/** Square brand logo (public/logo.png). */
export function LogoMark({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const px = DIM[size];
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden",
        size === "sm" && "h-10 w-10 rounded-[6px]",
        size === "md" && "h-14 w-14 rounded-sm",
        size === "lg" && "h-20 w-20 rounded-md",
        className,
      )}
    >
      {/* logo.png ships with ~15% transparent padding, so object-contain renders
          the mark small and floating. Scale up inside a clipped box so the art
          fills the frame. Remove the scale if you re-export a tightly-cropped file. */}
      <Image
        src="/logo.png"
        alt="oneqrcode"
        width={px}
        height={px}
        className="h-full w-full object-contain object-center"
      />
    </span>
  );
}

/** Horizontal lockup for navbars. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <LogoMark size="sm" />
      <span className="text-lg font-semibold tracking-tight">OneQRCode</span>
    </span>
  );
}
