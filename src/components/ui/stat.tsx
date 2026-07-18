import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { ArrowDown, ArrowUp } from "@/components/ui/icons";
import { Eyebrow } from "@/components/ui/badge";

/** Trend pill — lime with an explicit arrow so direction never rides on color alone. */
export function Delta({
  value,
  direction = "up",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  value: string;
  direction?: "up" | "down";
}) {
  const up = direction === "up";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full py-1 pl-1.5 pr-2.5 text-xs font-semibold leading-none tabular-nums",
        up ? "bg-accent text-accent-foreground" : "bg-danger-soft text-danger",
        className
      )}
      {...props}
    >
      <span
        className={cn(
          "flex size-4 items-center justify-center rounded-full",
          up ? "bg-forest-900 text-accent" : "bg-danger text-danger-soft"
        )}
      >
        {up ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
      </span>
      {value}
    </span>
  );
}

export function StatCard({
  label,
  value,
  icon,
  delta,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  label: string;
  value: string;
  icon?: ReactNode;
  delta?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-md border border-border bg-surface p-5 shadow-card",
        className
      )}
      {...props}
    >
      <Eyebrow>
        {icon}
        {label}
      </Eyebrow>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-3xl font-semibold tracking-tight tabular-nums">
          {value}
        </span>
        {delta}
      </div>
    </div>
  );
}
