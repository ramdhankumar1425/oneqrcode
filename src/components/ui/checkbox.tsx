import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { Check } from "@/components/ui/icons";

export function Checkbox({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <span className={cn("relative inline-flex size-5 shrink-0", className)}>
      <input
        type="checkbox"
        className={
          "peer size-5 cursor-pointer appearance-none rounded-xs border border-border bg-surface " +
          "transition-colors hover:border-forest-300 checked:border-forest-900 checked:bg-forest-900 " +
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring " +
          "disabled:pointer-events-none disabled:opacity-50"
        }
        {...props}
      />
      <Check
        size={12}
        strokeWidth={3}
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-accent opacity-0 transition-opacity peer-checked:opacity-100"
      />
    </span>
  );
}
