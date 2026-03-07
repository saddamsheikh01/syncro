import { redirect } from "next/navigation";

/** Insights have been moved into Profile. Redirect to Profile insights section. */
export default function InsightsPage() {
  redirect("/profile#insights");
}
