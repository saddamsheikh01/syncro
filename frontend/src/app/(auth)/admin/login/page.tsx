import type { Metadata } from "next";
import { AdminLogin } from "@/features/admin/auth/AdminLogin";

export const metadata: Metadata = {
  title: "Admin Login | Syncro",
  description: "Sign in to the Syncro back office.",
};

export default function AdminLoginPage() {
  return <AdminLogin />;
}
