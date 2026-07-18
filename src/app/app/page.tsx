import { redirect } from "next/navigation";

/** /app entrypoint — the layout already guards auth; send users to the dashboard. */
export default function AppIndex() {
  redirect("/app/dashboard");
}
