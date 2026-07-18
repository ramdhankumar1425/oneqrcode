import type { Metadata } from "next";
import { LegalDoc } from "@/components/legal/legal-doc";
import { renderLegalDoc } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Terms of Service — oneqrcode",
  description: "The terms that govern your use of oneqrcode.",
};

export default async function TermsPage() {
  const html = await renderLegalDoc("terms");
  return <LegalDoc title="Terms of Service" updated="18 July 2026" html={html} />;
}
