import type {
  InputHTMLAttributes,
  LabelHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/cn";

const fieldClasses =
  "w-full rounded-sm border border-border bg-surface px-3.5 text-sm text-foreground " +
  "placeholder:text-muted-foreground/70 transition-[border-color,box-shadow] " +
  "hover:border-forest-300 " +
  "focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-500/25 " +
  "disabled:pointer-events-none disabled:bg-muted disabled:opacity-60 " +
  "aria-invalid:border-danger aria-invalid:focus:ring-danger/20";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldClasses, "h-11", className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(fieldClasses, "min-h-24 py-2.5 leading-relaxed", className)}
      {...props}
    />
  );
}

export function Label({
  className,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("text-sm font-medium text-foreground", className)}
      {...props}
    />
  );
}

export function Hint({
  error,
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement> & { error?: boolean }) {
  return (
    <p
      className={cn(
        "text-xs",
        error ? "text-danger" : "text-muted-foreground",
        className
      )}
      {...props}
    />
  );
}

export function Field({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1.5", className)} {...props} />;
}
