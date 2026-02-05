import type { Metadata } from "next";
import { Login } from "@/features/auth/Login";

export const metadata: Metadata = {
  title: "Sign in | Syncro",
  description: "Sign in to your Syncro account.",
};

export default function LoginPage() {
  return <Login />;
}
