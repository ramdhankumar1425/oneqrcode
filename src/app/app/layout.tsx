import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";

/** Session gate for everything under /app. */
export default async function AppRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <>{children}</>;
}
