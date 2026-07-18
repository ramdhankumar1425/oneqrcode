import type { Metadata } from "next";
import { LegalDoc } from "@/components/legal/legal-doc";
import { renderLegalDoc } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Privacy Policy — oneqrcode",
  description: "How oneqrcode collects, uses, and protects your data.",
};

export default async function PrivacyPage() {
  const html = await renderLegalDoc("privacy");
  return <LegalDoc title="Privacy Policy" updated="18 July 2026" html={html} />;
}
