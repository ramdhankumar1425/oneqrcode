import { redirect } from "next/navigation";
import { getAppContext } from "@/lib/app-context";
import { Badge, Eyebrow } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ProfileForm } from "@/components/app/profile-form";

export default async function ProfilePage() {
  const ctx = await getAppContext();
  if (!ctx) redirect("/login");

  return (
    <div>
      <h1 className="text-display text-3xl">Profile</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Your account details.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_260px]">
        <Card>
          <CardContent>
            <ProfileForm initialName={ctx.user.name} email={ctx.user.email} />
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardContent className="flex flex-col gap-3">
            <Eyebrow>Plan</Eyebrow>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-semibold tracking-tight">
                {ctx.plan.name}
              </span>
              <Badge variant={ctx.plan.id === "free" ? "soft" : "accent"}>
                {ctx.plan.id}
              </Badge>
            </div>
            <a
              href="/app/billing"
              className="text-sm font-medium text-forest-600 underline-offset-4 hover:underline"
            >
              Manage billing →
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
