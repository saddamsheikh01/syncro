import type { Metadata } from "next";
import { Suspense } from "react";
import { Register } from "@/features/auth/Register";

export const metadata: Metadata = {
  title: "Sign up | Syncro",
  description: "Create your Syncro account.",
};

export default function RegisterPage() {
  return (
    <Suspense
      fallback={<div className="min-h-screen bg-[#f7f9ff]" aria-hidden="true" />}
    >
      <Register />
    </Suspense>
  );
}
