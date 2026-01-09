import type { Metadata } from "next";
import { Register } from "@/features/auth/Register";

export const metadata: Metadata = {
  title: "Registrati | Syncro",
  description: "Crea il tuo account Syncro.",
};

export default function RegisterPage() {
  return <Register />;
}
