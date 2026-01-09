import type { Metadata } from "next";
import { Login } from "@/features/auth/Login";

export const metadata: Metadata = {
  title: "Accedi | Syncro",
  description: "Accedi al tuo account Syncro.",
};

export default function LoginPage() {
  return <Login />;
}
