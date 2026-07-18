"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type TabItem = { value: string; label: ReactNode };

export function Tabs({
  items,
  defaultValue,
  variant = "underline",
  onValueChange,
  className,
}: {
  items: TabItem[];
  defaultValue?: string;
  variant?: "underline" | "pill";
  onValueChange?: (value: string) => void;
  className?: string;
}) {
  const [active, setActive] = useState(defaultValue ?? items[0]?.value);

  const select = (value: string) => {
    setActive(value);
    onValueChange?.(value);
  };

  if (variant === "pill") {
    return (
      <div
        role="tablist"
        className={cn(
          "inline-flex items-center gap-1 rounded-full border border-border bg-muted p-1",
          className
        )}
      >
        {items.map((item) => (
          <button
            key={item.value}
            role="tab"
            aria-selected={active === item.value}
            onClick={() => select(item.value)}
            className={cn(
              "cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              active === item.value
                ? "bg-forest-900 text-primary-foreground shadow-card"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div
      role="tablist"
      className={cn(
        "flex items-center gap-6 border-b border-border",
        className
      )}
    >
      {items.map((item) => (
        <button
          key={item.value}
          role="tab"
          aria-selected={active === item.value}
          onClick={() => select(item.value)}
          className={cn(
            "-mb-px cursor-pointer border-b-2 pb-2.5 text-sm font-medium transition-colors",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
            active === item.value
              ? "border-forest-900 text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
