import type { Metadata } from "next";
import { AdminRegister } from "@/features/admin/auth/AdminRegister";

export const metadata: Metadata = {
  title: "Registrazione Admin | Syncro",
  description: "Crea un account admin per Syncro.",
};

export default function AdminRegisterPage() {
  return <AdminRegister />;
}
