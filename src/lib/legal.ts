import { readFile } from "node:fs/promises";
import path from "node:path";
import { marked } from "marked";

/** Read a markdown doc from public/legal and render it to HTML (server-side). */
export async function renderLegalDoc(slug: "privacy" | "terms"): Promise<string> {
  const file = path.join(process.cwd(), "public", "legal", `${slug}.md`);
  const md = await readFile(file, "utf8");
  return marked.parse(md, { async: false });
}
