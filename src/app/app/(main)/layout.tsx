import { redirect } from "next/navigation";
import { getAppContext } from "@/lib/app-context";
import { Sidebar } from "@/components/app/sidebar";

/** Sidebar chrome + onboarding gate for the main app. */
export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getAppContext();
  if (!ctx) redirect("/login");
  if (!ctx.onboardingCompleted) redirect("/app/onboarding");

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        user={ctx.user}
        planId={ctx.plan.id}
        planName={ctx.plan.name}
      />
      <div className="md:pl-64">
        <main className="mx-auto max-w-5xl px-5 py-8 md:px-8 md:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
