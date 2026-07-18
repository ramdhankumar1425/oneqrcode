import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

const tones = [
  "bg-lime-200 text-forest-800",
  "bg-forest-100 text-forest-800",
  "bg-forest-900 text-accent",
  "bg-lime-400 text-forest-950",
  "bg-forest-500 text-white",
] as const;

export function Avatar({
  name,
  tone = 0,
  size = "md",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  name: string;
  tone?: number;
  size?: "sm" | "md" | "lg";
}) {
  const initials = name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <span
      title={name}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold",
        size === "sm" && "size-7 text-[10px]",
        size === "md" && "size-9 text-xs",
        size === "lg" && "size-12 text-sm",
        tones[tone % tones.length],
        className
      )}
      {...props}
    >
      {initials}
    </span>
  );
}

export function AvatarGroup({
  children,
  label,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & { label?: ReactNode }) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-border bg-surface p-1 pr-1.5 shadow-card",
        className
      )}
      {...props}
    >
      <div className="flex -space-x-2 [&>*]:ring-2 [&>*]:ring-surface">
        {children}
      </div>
      {label ? (
        <span className="ml-2 rounded-full bg-accent px-2 py-1 text-xs font-semibold leading-none text-accent-foreground">
          {label}
        </span>
      ) : null}
    </div>
  );
}
