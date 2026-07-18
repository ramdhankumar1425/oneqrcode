/**
 * Onboarding survey options. Kept in code; the answers are stored as plain
 * strings on the user row (heard_from / use_case) and validated against these.
 */

export const HEARD_FROM_OPTIONS = [
  { value: "search", label: "Search engine" },
  { value: "social", label: "Social media" },
  { value: "friend", label: "Friend or colleague" },
  { value: "ad", label: "Advertisement" },
  { value: "blog", label: "Blog or article" },
  { value: "other", label: "Other" },
] as const;

export const USE_CASE_OPTIONS = [
  { value: "restaurant", label: "Restaurant / menus" },
  { value: "retail", label: "Retail / packaging" },
  { value: "marketing", label: "Marketing / campaigns" },
  { value: "events", label: "Events / signage" },
  { value: "creator", label: "Content / video" },
  { value: "personal", label: "Personal use" },
  { value: "other", label: "Other" },
] as const;

export type HeardFrom = (typeof HEARD_FROM_OPTIONS)[number]["value"];
export type UseCase = (typeof USE_CASE_OPTIONS)[number]["value"];

export function isHeardFrom(value: unknown): value is HeardFrom {
  return (
    typeof value === "string" &&
    HEARD_FROM_OPTIONS.some((o) => o.value === value)
  );
}

export function isUseCase(value: unknown): value is UseCase {
  return (
    typeof value === "string" && USE_CASE_OPTIONS.some((o) => o.value === value)
  );
}
