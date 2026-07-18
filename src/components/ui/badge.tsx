import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type BadgeVariant =
  | "accent"
  | "outline"
  | "dark"
  | "soft"
  | "success"
  | "warning"
  | "danger";

const variants: Record<BadgeVariant, string> = {
  accent: "bg-accent text-accent-foreground",
  outline: "border border-border bg-surface text-foreground",
  dark: "bg-primary text-primary-foreground",
  soft: "bg-forest-50 text-forest-700",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ variant = "accent", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium leading-none",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

/** Tiny uppercase mono label — the reference's stat-card captions. */
export function Eyebrow({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground",
        className
      )}
      {...props}
    />
  );
}
