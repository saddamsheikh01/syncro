import { redirect } from "next/navigation";

/** Insights have been moved into Profile. Redirect to Profile (insights section is on that page). */
export default function InsightsPage() {
  redirect("/profile");
}
