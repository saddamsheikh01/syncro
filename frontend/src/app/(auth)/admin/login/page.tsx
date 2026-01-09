import type { Metadata } from "next";
import { AdminLogin } from "@/features/admin/auth/AdminLogin";

export const metadata: Metadata = {
  title: "Accesso Admin | Syncro",
  description: "Accedi al backoffice Syncro.",
};

export default function AdminLoginPage() {
  return <AdminLogin />;
}
