/** What a code's QR encodes: static → the destination directly; dynamic → the
 *  permanent short link that runs through our redirect layer. Client-safe. */
export function encodedValue(opts: {
  type: "dynamic" | "static";
  shortCode: string;
  destinationUrl: string;
  origin?: string;
}): string {
  if (opts.type === "static") return opts.destinationUrl;
  const origin =
    opts.origin ?? (typeof window !== "undefined" ? window.location.origin : "");
  return `${origin}/r/${opts.shortCode}`;
}
