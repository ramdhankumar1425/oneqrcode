import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { ChevronDown } from "@/components/ui/icons";

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className={cn("relative", className)}>
      <select
        className={
          "h-11 w-full appearance-none rounded-sm border border-border bg-surface pl-3.5 pr-10 text-sm " +
          "text-foreground transition-[border-color,box-shadow] hover:border-forest-300 " +
          "focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-500/25 " +
          "disabled:pointer-events-none disabled:bg-muted disabled:opacity-60"
        }
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  );
}
