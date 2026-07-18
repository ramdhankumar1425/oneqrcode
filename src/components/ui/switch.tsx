"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

export function Switch({
  checked,
  defaultChecked = false,
  onCheckedChange,
  disabled,
  className,
  "aria-label": ariaLabel,
}: {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}) {
  const [internal, setInternal] = useState(defaultChecked);
  const isOn = checked ?? internal;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isOn}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => {
        setInternal(!isOn);
        onCheckedChange?.(!isOn);
      }}
      className={cn(
        "relative inline-flex h-6.5 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        "disabled:pointer-events-none disabled:opacity-50",
        isOn ? "bg-forest-900" : "bg-border",
        className
      )}
    >
      <span
        className={cn(
          "absolute left-0.5 size-5.5 rounded-full shadow-sm transition-[translate,background-color]",
          isOn ? "translate-x-[18px] bg-accent" : "translate-x-0 bg-surface"
        )}
      />
    </button>
  );
}
