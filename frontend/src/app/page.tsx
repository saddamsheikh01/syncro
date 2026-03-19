import { redirect } from "next/navigation";

/** First screen: expat landing → funnel → registration (not login). */
export default function RootPage() {
  redirect("/expats");
}
