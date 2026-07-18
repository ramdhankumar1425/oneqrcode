import { Eyebrow } from "@/components/ui/badge";

/**
 * Renders a legal document from pre-rendered markdown HTML, styling the raw
 * h2/p/ul/li/a inside so the content matches the design system.
 */
export function LegalDoc({
  title,
  updated,
  html,
}: {
  title: string;
  updated: string;
  html: string;
}) {
  return (
    <div className="mx-auto max-w-3xl px-6 pb-24 pt-32">
      <Eyebrow>Legal</Eyebrow>
      <h1 className="text-display mt-3 text-4xl md:text-5xl">{title}</h1>
      <p className="mt-3 font-mono text-xs uppercase tracking-wide text-muted-foreground">
        Last updated {updated}
      </p>

      <article
        className={
          "mt-10 " +
          "[&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-foreground " +
          "[&_p]:mb-4 [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-muted-foreground " +
          "[&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:text-sm [&_ul]:leading-relaxed [&_ul]:text-muted-foreground " +
          "[&_li]:mb-1.5 " +
          "[&_strong]:font-semibold [&_strong]:text-foreground " +
          "[&_a]:font-medium [&_a]:text-forest-600 [&_a]:underline [&_a]:underline-offset-2"
        }
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
