"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Field, Hint, Input, Label } from "@/components/ui/input";

export function ProfileForm({
  initialName,
  email,
}: {
  initialName: string;
  email: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    setSaving(true);
    const { error } = await authClient.updateUser({ name });
    setSaving(false);
    if (error) {
      setErr(error.message ?? "Could not update.");
      return;
    }
    setMsg("Saved");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-md flex-col gap-4">
      <Field>
        <Label htmlFor="name">Name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field>
        <Label htmlFor="email">Email</Label>
        <Input id="email" value={email} disabled />
        <Hint>Email can&apos;t be changed here.</Hint>
      </Field>
      {msg && <Hint className="text-success">{msg}</Hint>}
      {err && <Hint error>{err}</Hint>}
      <div>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}
