import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/**
 * Marker-style block behind headline words — white boxes on lime hero,
 * lime boxes on light surfaces, per the reference headline.
 */
export function Highlight({
  variant = "surface",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: "surface" | "lime" | "dark" }) {
  return (
    <span
      className={cn(
        "box-decoration-clone px-2",
        variant === "surface" && "bg-surface",
        variant === "lime" && "bg-accent",
        variant === "dark" && "bg-forest-950 text-accent",
        className
      )}
      {...props}
    />
  );
}
