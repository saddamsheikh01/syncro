import type { Metadata } from "next";
import { AdminRegister } from "@/features/admin/auth/AdminRegister";

export const metadata: Metadata = {
  title: "Admin Registration | Syncro",
  description: "Create a Syncro admin account.",
};

export default function AdminRegisterPage() {
  return <AdminRegister />;
}
